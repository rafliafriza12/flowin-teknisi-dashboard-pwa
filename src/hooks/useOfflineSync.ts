"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getAllActivePendingItems,
  countPendingItems,
  updatePendingItem,
  removePendingItem,
  applyResolvedUrls,
  type PendingUploadItem,
} from "@/libs/offlineQueue";
import { uploadToCloudinary } from "@/libs/cloudinary";
import { graphqlAction } from "@/libs/graphql/actions";
import { SIMPAN_PROGRES, KIRIM_HASIL } from "@/libs/graphql/mutations";
import type { IWorkOrderMutationResponse } from "@/types/workOrder";
import { GraphQLRequestError } from "@/libs/graphql/utils";
import {
  saveConflictResolution,
  deleteConflictResolution,
} from "@/libs/conflictResolutionsStorage";
import { supportsBackgroundSync } from "@/libs/backgroundSync";

const PERIODIC_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface SimpanProgresResponse {
  simpanProgres: IWorkOrderMutationResponse;
}
interface KirimHasilResponse {
  kirimHasil: IWorkOrderMutationResponse;
}

// ─── useOnlineStatus ──────────────────────────────────────────────────────────

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

// ─── useOfflineSync ───────────────────────────────────────────────────────────

/**
 * Progress tracking for sync operations.
 * **Validates: Requirements 2.5, 2.6**
 */
export interface SyncProgress {
  /** Total number of items to sync */
  total: number;
  /** Number of items successfully synced */
  completed: number;
  /** Number of items that failed to sync */
  failed: number;
  /** Current item being synced */
  current?: {
    /** ID of the pending item */
    itemId: string;
    /** Work order ID for the item */
    workOrderId: string;
    /** Current stage of sync process */
    stage: "uploading_images" | "syncing_data";
    /** Progress percentage for image uploads (0-100) */
    progress?: number;
  };
}

/**
 * A pending conflict awaiting user resolution.
 * **Validates: Requirements 12.1**
 */
export interface PendingConflict {
  item: PendingUploadItem;
  serverData: Record<string, unknown>;
}

export type ConflictResolution =
  | { kind: "keep_local" }
  | { kind: "keep_server" }
  | { kind: "merge"; mergedPayload: Record<string, unknown> };

export interface OfflineSyncState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  /** Detailed sync progress information */
  syncProgress?: SyncProgress;
  /** Items that have failed to sync */
  errorItems: PendingUploadItem[];
  /** Conflict awaiting user resolution (if any) */
  pendingConflict?: PendingConflict;
  syncNow: () => Promise<void>;
  refreshCount: () => Promise<void>;
  /** Retry a specific failed item */
  retryItem: (itemId: string) => Promise<void>;
  /** Delete a specific failed item from the queue */
  deleteItem: (itemId: string) => Promise<void>;
  /** Resolve the current pending conflict */
  resolveConflict: (resolution: ConflictResolution) => Promise<void>;
  /** Dismiss the pending conflict modal without resolving */
  dismissConflict: () => void;
}

/**
 * Hook untuk mengelola sinkronisasi offline.
 *
 * - Mendeteksi status koneksi internet
 * - Otomatis menyinkronkan item pending saat kembali online
 * - Menyediakan `pendingCount` dan `syncNow` untuk UI
 * - Melacak progress sinkronisasi dan item yang gagal
 */
/**
 * Detect a sync conflict (HTTP 409). Server is expected to return either
 * `extensions.statusCode === 409`, `extensions.code === "CONFLICT"`, or to
 * embed `serverData` in the error details.
 *
 * **Validates: Requirements 12.1**
 */
function extractConflict(
  error: unknown,
): { serverData: Record<string, unknown> } | null {
  if (!(error instanceof GraphQLRequestError)) return null;

  const isConflict =
    error.statusCode === 409 ||
    error.code === "CONFLICT" ||
    error.code === "WORK_ORDER_CONFLICT";

  if (!isConflict) return null;

  const serverData =
    (error.details?.serverData as Record<string, unknown> | undefined) ??
    (error.details?.currentData as Record<string, unknown> | undefined) ??
    null;

  if (!serverData) return null;

  return { serverData };
}

export function useOfflineSync(): OfflineSyncState {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | undefined>(
    undefined,
  );
  const [errorItems, setErrorItems] = useState<PendingUploadItem[]>([]);
  const [pendingConflict, setPendingConflict] = useState<
    PendingConflict | undefined
  >(undefined);
  const isSyncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try {
      const count = await countPendingItems();
      setPendingCount(count);

      // Also refresh error items list
      const allItems = await getAllActivePendingItems();
      const errors = allItems.filter(
        (item) => item.status === "error" && item.retryCount >= 3,
      );
      setErrorItems(errors);
    } catch {
      // IndexedDB belum tersedia (SSR atau private mode)
    }
  }, []);

  // Refresh hitungan pending saat mount
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // ─── Process queue ──────────────────────────────────────────────────────────

  const processItem = useCallback(
    async (
      item: PendingUploadItem,
      onProgress?: (current: number, total: number, percentage: number) => void,
    ) => {
      // Check if item should be retried based on exponential backoff
      if (item.lastSyncAttempt) {
        const timeSinceLastAttempt = Date.now() - item.lastSyncAttempt;
        const backoffDelays = [0, 5000, 15000]; // immediate, 5s, 15s
        const requiredDelay = backoffDelays[Math.min(item.retryCount, 2)] || 0;

        if (timeSinceLastAttempt < requiredDelay) {
          // Skip this item, not enough time has passed
          return;
        }
      }

      await updatePendingItem(item.id, {
        status: "syncing",
        lastSyncAttempt: Date.now(),
      });

      try {
        // 1. Upload semua gambar yang pending - SEQUENTIALLY (one at a time)
        const resolvedUrls = new Map<string, string>();
        const totalImages = item.pendingImages.length;

        for (let i = 0; i < totalImages; i++) {
          const pendingImage = item.pendingImages[i];

          // Report progress for each image upload
          const result = await uploadToCloudinary(
            pendingImage.file,
            {
              folder: pendingImage.cloudinaryFolder,
              resourceType: "image",
              tags: pendingImage.tags,
            },
            (uploadProgress) => {
              // Calculate overall progress: completed images + current image progress
              const completedImages = i;
              const currentImageProgress = uploadProgress.percentage / 100;
              const overallProgress =
                ((completedImages + currentImageProgress) / totalImages) * 100;

              onProgress?.(i + 1, totalImages, Math.round(overallProgress));
            },
          );

          // Store Cloudinary URL in resolved map
          resolvedUrls.set(pendingImage.fieldKey, result.secure_url);
        }

        // 2. Apply URLs to payload only after all images succeed
        const finalPayload =
          resolvedUrls.size > 0
            ? applyResolvedUrls(item.progresPayload, resolvedUrls)
            : item.progresPayload;

        // 3. Panggil simpanProgres
        const simpanInput = {
          workOrderId: item.workOrderId,
          data: JSON.stringify(finalPayload),
        };

        await graphqlAction<SimpanProgresResponse>(
          SIMPAN_PROGRES,
          { input: simpanInput },
          simpanInput,
        );

        // 4. Jika type kirim_hasil, panggil juga kirimHasil
        if (item.type === "kirim_hasil") {
          const kirimInput = { workOrderId: item.workOrderId };
          await graphqlAction<KirimHasilResponse>(
            KIRIM_HASIL,
            { input: kirimInput },
            kirimInput,
          );
        }

        // 5. Hapus dari queue
        await removePendingItem(item.id);
      } catch (error) {
        const conflict = extractConflict(error);
        const message = error instanceof Error ? error.message : "Sync gagal";
        const newRetryCount = (item.retryCount ?? 0) + 1;

        if (conflict) {
          await updatePendingItem(item.id, {
            status: "error",
            errorMessage: "Konflik data — perlu resolusi pengguna",
            retryCount: newRetryCount,
            lastSyncAttempt: Date.now(),
            conflictData: {
              serverData: conflict.serverData,
              detectedAt: Date.now(),
            },
          });

          await saveConflictResolution({
            itemId: item.id,
            serverData: conflict.serverData,
            detectedAt: Date.now(),
            resolution: "pending",
            resolved: false,
          });

          setPendingConflict({
            item: { ...item, conflictData: { ...conflict, detectedAt: Date.now() } },
            serverData: conflict.serverData,
          });
          throw error;
        }

        await updatePendingItem(item.id, {
          status: "error",
          errorMessage: message,
          retryCount: newRetryCount,
          lastSyncAttempt: Date.now(),
        });
        throw error;
      }
    },
    [],
  );

  const syncNow = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const items = await getAllActivePendingItems();
      if (items.length === 0) {
        setSyncProgress(undefined);
        return;
      }

      // Initialize progress tracking
      setSyncProgress({
        total: items.length,
        completed: 0,
        failed: 0,
      });

      let completed = 0;
      let failed = 0;

      for (const item of items) {
        // Lewati item yang sudah terlalu banyak gagal (max 3x retry)
        if (item.status === "error" && item.retryCount >= 3) {
          failed++;
          setSyncProgress({
            total: items.length,
            completed,
            failed,
          });
          continue;
        }

        try {
          // Update progress with current item
          setSyncProgress({
            total: items.length,
            completed,
            failed,
            current: {
              itemId: item.id,
              workOrderId: item.workOrderId,
              stage:
                item.pendingImages.length > 0
                  ? "uploading_images"
                  : "syncing_data",
            },
          });

          // Track current image index and total count during upload
          await processItem(
            item,
            (currentIndex, totalImages, overallProgress) => {
              // Update progress with image upload details
              setSyncProgress({
                total: items.length,
                completed,
                failed,
                current: {
                  itemId: item.id,
                  workOrderId: item.workOrderId,
                  stage: "uploading_images",
                  progress: overallProgress,
                },
              });
            },
          );

          completed++;
          setSyncProgress({
            total: items.length,
            completed,
            failed,
          });
        } catch {
          failed++;
          setSyncProgress({
            total: items.length,
            completed,
            failed,
          });
          // Lanjut ke item berikutnya meski satu gagal
        }
      }

      // Clear progress after completion
      setSyncProgress(undefined);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
      await refreshCount();
    }
  }, [processItem, refreshCount]);

  // Auto-sync saat kembali online
  useEffect(() => {
    if (isOnline) {
      // Delay sedikit agar koneksi benar-benar stabil
      const timer = setTimeout(() => {
        syncNow();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncNow]);

  // Listen for SW background-sync delegation requests
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "OFFLINE_SYNC_REQUEST") {
        syncNow();
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, [syncNow]);

  // Fallback periodic sync for browsers without Background Sync API.
  // Only runs while the document is visible to avoid wasted requests.
  // **Validates: Requirements 8.4**
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (supportsBackgroundSync()) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (document.visibilityState === "visible" && navigator.onLine) {
          syncNow();
        }
      }, PERIODIC_SYNC_INTERVAL_MS);
    };

    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    if (document.visibilityState === "visible") start();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [syncNow]);

  // ─── Manual item management ─────────────────────────────────────────────────

  /**
   * Retry a specific failed item.
   * Resets retry count and attempts sync immediately.
   * **Validates: Requirements 2.7, 2.8**
   */
  const retryItem = useCallback(
    async (itemId: string) => {
      try {
        // Reset retry count and error state
        await updatePendingItem(itemId, {
          status: "pending",
          errorMessage: undefined,
          retryCount: 0,
          lastSyncAttempt: undefined,
        });

        // Refresh count and trigger sync
        await refreshCount();
        await syncNow();
      } catch (error) {
        console.error("Failed to retry item:", error);
      }
    },
    [refreshCount, syncNow],
  );

  /**
   * Delete a specific failed item from the queue.
   * **Validates: Requirements 2.8**
   */
  const deleteItem = useCallback(
    async (itemId: string) => {
      try {
        await removePendingItem(itemId);
        await deleteConflictResolution(itemId).catch(() => undefined);
        await refreshCount();
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    },
    [refreshCount],
  );

  /**
   * Resolve the current pending conflict.
   * - keep_local: retry sync with the original payload (server should accept on retry / force flag)
   * - keep_server: drop the local pending item, server data wins
   * - merge: replace pending payload with merged data, then retry sync
   *
   * **Validates: Requirements 12.3, 12.4, 12.5**
   */
  const resolveConflict = useCallback(
    async (resolution: ConflictResolution) => {
      const conflict = pendingConflict;
      if (!conflict) return;
      const itemId = conflict.item.id;

      try {
        if (resolution.kind === "keep_server") {
          await removePendingItem(itemId);
          await deleteConflictResolution(itemId).catch(() => undefined);
        } else {
          if (resolution.kind === "merge") {
            await updatePendingItem(itemId, {
              progresPayload: resolution.mergedPayload,
              status: "pending",
              errorMessage: undefined,
              retryCount: 0,
              lastSyncAttempt: undefined,
              conflictData: undefined,
            });
          } else {
            // keep_local
            await updatePendingItem(itemId, {
              status: "pending",
              errorMessage: undefined,
              retryCount: 0,
              lastSyncAttempt: undefined,
              conflictData: undefined,
            });
          }

          await saveConflictResolution({
            itemId,
            serverData: conflict.serverData,
            detectedAt: conflict.item.conflictData?.detectedAt ?? Date.now(),
            resolution: resolution.kind,
            resolved: true,
            resolvedAt: Date.now(),
            mergedPayload:
              resolution.kind === "merge"
                ? resolution.mergedPayload
                : undefined,
          });
        }

        setPendingConflict(undefined);
        await refreshCount();

        if (resolution.kind !== "keep_server") {
          await syncNow();
        }
      } catch (error) {
        console.error("Failed to resolve conflict:", error);
      }
    },
    [pendingConflict, refreshCount, syncNow],
  );

  const dismissConflict = useCallback(() => {
    setPendingConflict(undefined);
  }, []);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncProgress,
    errorItems,
    pendingConflict,
    syncNow,
    refreshCount,
    retryItem,
    deleteItem,
    resolveConflict,
    dismissConflict,
  };
}

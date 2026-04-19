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

export interface OfflineSyncState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  refreshCount: () => Promise<void>;
}

/**
 * Hook untuk mengelola sinkronisasi offline.
 *
 * - Mendeteksi status koneksi internet
 * - Otomatis menyinkronkan item pending saat kembali online
 * - Menyediakan `pendingCount` dan `syncNow` untuk UI
 */
export function useOfflineSync(): OfflineSyncState {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try {
      const count = await countPendingItems();
      setPendingCount(count);
    } catch {
      // IndexedDB belum tersedia (SSR atau private mode)
    }
  }, []);

  // Refresh hitungan pending saat mount
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // ─── Process queue ──────────────────────────────────────────────────────────

  const processItem = useCallback(async (item: PendingUploadItem) => {
    await updatePendingItem(item.id, { status: "syncing" });

    try {
      // 1. Upload semua gambar yang pending
      const resolvedUrls = new Map<string, string>();

      for (const pendingImage of item.pendingImages) {
        const result = await uploadToCloudinary(pendingImage.file, {
          folder: pendingImage.cloudinaryFolder,
          resourceType: "image",
          tags: pendingImage.tags,
        });
        resolvedUrls.set(pendingImage.fieldKey, result.secure_url);
      }

      // 2. Terapkan URL yang sudah resolved ke payload
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
      const message = error instanceof Error ? error.message : "Sync gagal";
      await updatePendingItem(item.id, {
        status: "error",
        errorMessage: message,
        retryCount: (item.retryCount ?? 0) + 1,
      });
      throw error;
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const items = await getAllActivePendingItems();
      if (items.length === 0) return;

      for (const item of items) {
        // Lewati item yang sudah terlalu banyak gagal (max 3x retry)
        if (item.status === "error" && item.retryCount >= 3) continue;
        try {
          await processItem(item);
        } catch {
          // Lanjut ke item berikutnya meski satu gagal
        }
      }
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

  return { isOnline, pendingCount, isSyncing, syncNow, refreshCount };
}

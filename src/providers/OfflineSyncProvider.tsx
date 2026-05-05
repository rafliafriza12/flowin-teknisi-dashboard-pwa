"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useOfflineSync, type OfflineSyncState } from "@/hooks/useOfflineSync";
import { useAnalyticsSync } from "@/hooks/useAnalyticsSync";
import ConflictResolutionModal from "@/components/organisms/ConflictResolutionModal";
import ServiceWorkerUpdateBanner from "@/components/organisms/ServiceWorkerUpdateBanner";
import ServiceWorkerUnregisterWarning from "@/components/organisms/ServiceWorkerUnregisterWarning";
import PendingItemsModal from "@/components/organisms/PendingItemsModal";
import { showToast } from "@/libs/toast";

// ─── Context ──────────────────────────────────────────────────────────────────

const OfflineSyncContext = createContext<OfflineSyncState | null>(null);

export function useOfflineSyncContext(): OfflineSyncState {
  const ctx = useContext(OfflineSyncContext);
  if (!ctx)
    throw new Error("useOfflineSyncContext harus dalam OfflineSyncProvider");
  return ctx;
}

// ─── Banner ───────────────────────────────────────────────────────────────────

/**
 * Offline/sync status banner shown at the bottom of the screen.
 * - Red pill  → offline
 * - Blue pill → online + pending items (no errors)
 * - Amber pill→ online + items with errors (tap to open detail modal)
 * - Spinner  → actively syncing
 *
 * **Validates: Requirements 9.1, 9.2, 9.4, 9.6**
 */
function OfflineBanner({
  state,
  onOpenErrorModal,
}: {
  state: OfflineSyncState;
  onOpenErrorModal: () => void;
}) {
  const {
    isOnline,
    pendingCount,
    isSyncing,
    syncNow,
    syncProgress,
    errorItems,
  } = state;

  const hasErrors = errorItems.length > 0;

  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  // ── Offline pill ──────────────────────────────────────────────────────────
  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-9999 flex items-center gap-2 bg-neutral-800 text-white text-xs font-medium px-4 py-2 rounded-full shadow-xl pointer-events-none select-none whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
        <span>Tidak ada koneksi — data disimpan offline</span>
      </div>
    );
  }

  // ── Syncing pill ──────────────────────────────────────────────────────────
  if (isSyncing) {
    const label = syncProgress?.current
      ? syncProgress.current.stage === "uploading_images"
        ? `Uploading gambar ${syncProgress.completed + 1}/${syncProgress.total}${
            syncProgress.current.progress !== undefined
              ? ` (${syncProgress.current.progress}%)`
              : ""
          }`
        : `Menyinkronkan data ${syncProgress.completed + 1}/${syncProgress.total}`
      : syncProgress
        ? `Menyinkronkan ${syncProgress.completed}/${syncProgress.total} data offline...`
        : `Menyinkronkan ${pendingCount} data offline...`;

    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-9999 flex items-center gap-2 bg-[#1F2375] text-white text-xs font-medium px-4 py-2 rounded-full shadow-xl whitespace-nowrap">
        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
        <span>{label}</span>
      </div>
    );
  }

  // ── Error pill (amber) — tap for detail ───────────────────────────────────
  if (hasErrors) {
    return (
      <button
        type="button"
        onClick={onOpenErrorModal}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-9999 flex items-center gap-2 bg-amber-600 text-white text-xs font-medium px-4 py-2 rounded-full shadow-xl whitespace-nowrap hover:bg-amber-700 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-amber-300 shrink-0" />
        <span>
          {errorItems.length} data gagal disinkronkan — Tap untuk detail
        </span>
      </button>
    );
  }

  // ── Pending pill (blue) ───────────────────────────────────────────────────
  if (pendingCount > 0) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-9999 flex items-center gap-2 bg-[#1F2375] text-white text-xs font-medium px-4 py-2 rounded-full shadow-xl whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-blue-300 shrink-0" />
        <span>{pendingCount} data tersimpan offline</span>
        <button
          type="button"
          onClick={syncNow}
          className="ml-1 underline hover:text-blue-200 transition-colors cursor-pointer"
        >
          Sync
        </button>
      </div>
    );
  }

  return null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function OfflineSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = useOfflineSync();
  useAnalyticsSync();

  const [errorModalOpen, setErrorModalOpen] = useState(false);

  // Auto-close modal when all error items are resolved
  useEffect(() => {
    if (errorModalOpen && state.errorItems.length === 0) {
      setErrorModalOpen(false);
    }
  }, [errorModalOpen, state.errorItems.length]);

  // Show success toast after sync completes (pendingCount drops to 0 while online)
  // **Validates: Requirements 9.5**
  const prevPendingRef = useRef(state.pendingCount);
  const prevSyncingRef = useRef(state.isSyncing);
  useEffect(() => {
    const wasSync = prevSyncingRef.current;
    const nowDone = !state.isSyncing && wasSync;
    const allClear = state.pendingCount === 0 && state.errorItems.length === 0;

    if (nowDone && allClear && state.isOnline) {
      showToast.success("Semua data berhasil disinkronkan");
    }

    prevPendingRef.current = state.pendingCount;
    prevSyncingRef.current = state.isSyncing;
  }, [
    state.isSyncing,
    state.pendingCount,
    state.errorItems.length,
    state.isOnline,
  ]);

  return (
    <OfflineSyncContext.Provider value={state}>
      <OfflineBanner
        state={state}
        onOpenErrorModal={() => setErrorModalOpen(true)}
      />
      <ServiceWorkerUpdateBanner />
      <ServiceWorkerUnregisterWarning />
      {children}
      <ConflictResolutionModal
        isOpen={Boolean(state.pendingConflict)}
        pendingItem={state.pendingConflict?.item ?? null}
        serverData={state.pendingConflict?.serverData ?? null}
        onResolve={state.resolveConflict}
        onClose={state.dismissConflict}
      />
      <PendingItemsModal
        isOpen={errorModalOpen}
        items={state.errorItems}
        onRetry={state.retryItem}
        onDelete={state.deleteItem}
        onClose={() => setErrorModalOpen(false)}
      />
    </OfflineSyncContext.Provider>
  );
}

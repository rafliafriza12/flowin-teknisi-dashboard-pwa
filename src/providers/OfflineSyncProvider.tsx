"use client";

import React, { createContext, useContext } from "react";
import { useOfflineSync, type OfflineSyncState } from "@/hooks/useOfflineSync";

// ─── Context ──────────────────────────────────────────────────────────────────

const OfflineSyncContext = createContext<OfflineSyncState | null>(null);

export function useOfflineSyncContext(): OfflineSyncState {
  const ctx = useContext(OfflineSyncContext);
  if (!ctx)
    throw new Error("useOfflineSyncContext harus dalam OfflineSyncProvider");
  return ctx;
}

// ─── Banner ───────────────────────────────────────────────────────────────────

function OfflineBanner({ state }: { state: OfflineSyncState }) {
  const { isOnline, pendingCount, isSyncing, syncNow } = state;

  if (isOnline && pendingCount === 0) return null;

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-9999 bg-neutral-800 text-white text-xs font-medium px-4 py-2 flex items-center justify-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        <span>Tidak ada koneksi internet — data akan disimpan offline</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-9999 bg-amber-600 text-white text-xs font-medium px-4 py-2 flex items-center justify-center gap-2 shadow-lg">
        {isSyncing ? (
          <>
            <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span>Menyinkronkan {pendingCount} data offline...</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-300" />
            <span>{pendingCount} data tersimpan offline</span>
            <button
              type="button"
              onClick={syncNow}
              className="ml-2 underline hover:text-amber-200 transition-colors"
            >
              Sync sekarang
            </button>
          </>
        )}
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

  return (
    <OfflineSyncContext.Provider value={state}>
      <OfflineBanner state={state} />
      {/* Padding top saat banner muncul */}
      <div
        className="transition-all duration-200"
        style={{
          paddingTop:
            !state.isOnline || state.pendingCount > 0 ? "32px" : "0px",
        }}
      >
        {children}
      </div>
    </OfflineSyncContext.Provider>
  );
}

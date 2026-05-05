/**
 * Service Worker Update Banner
 *
 * Notifies the user when a new app version is installed and waiting. If
 * pending offline items exist, the banner defers the update until the queue
 * is drained — but offers a "Force Update" escape hatch with a warning.
 *
 * **Validates: Requirements 13.1, 13.2, 13.3**
 */

"use client";

import React, { useEffect, useState } from "react";
import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";
import { useOfflineSyncContext } from "@/providers/OfflineSyncProvider";

const ServiceWorkerUpdateBanner: React.FC = () => {
  const { hasUpdate, skipWaiting } = useServiceWorkerUpdate();
  const { pendingCount } = useOfflineSyncContext();
  const [confirmingForce, setConfirmingForce] = useState(false);
  const [autoApplied, setAutoApplied] = useState(false);

  // Auto-apply update once queue is empty
  useEffect(() => {
    if (hasUpdate && pendingCount === 0 && !autoApplied) {
      setAutoApplied(true);
      skipWaiting();
    }
  }, [hasUpdate, pendingCount, autoApplied, skipWaiting]);

  if (!hasUpdate) return null;

  const hasPending = pendingCount > 0;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-9999 flex flex-col gap-2 bg-[#1F2375] text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl max-w-md w-[calc(100%-2rem)]">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0" />
        <span className="font-semibold">Update tersedia</span>
      </div>
      {hasPending ? (
        <>
          <p className="text-white/80">
            {pendingCount} data offline belum tersinkronkan. Update akan
            diterapkan otomatis setelah sinkronisasi selesai.
          </p>
          {confirmingForce ? (
            <div className="flex gap-2">
              <button
                onClick={skipWaiting}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600"
              >
                Ya, paksa update
              </button>
              <button
                onClick={() => setConfirmingForce(false)}
                className="flex-1 py-2 rounded-lg bg-white/20 text-white text-xs font-semibold hover:bg-white/30"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingForce(true)}
              className="self-start text-[11px] underline text-white/80 hover:text-white"
            >
              Paksa update sekarang (data offline mungkin hilang)
            </button>
          )}
        </>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={skipWaiting}
            className="flex-1 py-2 rounded-lg bg-white text-[#1F2375] text-xs font-semibold hover:bg-white/90"
          >
            Muat ulang
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceWorkerUpdateBanner;

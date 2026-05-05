/**
 * PendingItemsModal
 *
 * Modal that lists offline-queued items with errors. Each row shows the
 * work order ID, submission type, error message, and Retry / Delete actions.
 *
 * Closing the modal after all items are resolved is handled by the parent
 * (OfflineSyncProvider) watching `errorItems.length`.
 *
 * **Validates: Requirements 9.7**
 */

"use client";

import React, { useState, useCallback } from "react";
import type { PendingUploadItem } from "@/libs/offlineQueue";

interface PendingItemsModalProps {
  isOpen: boolean;
  items: PendingUploadItem[];
  onRetry: (itemId: string) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  onClose: () => void;
}

interface RowState {
  loading: boolean;
  confirming: boolean; // for delete confirmation
}

const PendingItemsModal: React.FC<PendingItemsModalProps> = ({
  isOpen,
  items,
  onRetry,
  onDelete,
  onClose,
}) => {
  const [rowState, setRowState] = useState<Record<string, RowState>>({});

  const getRow = (id: string): RowState =>
    rowState[id] ?? { loading: false, confirming: false };

  const setRow = useCallback(
    (id: string, patch: Partial<RowState>) =>
      setRowState((prev) => ({
        ...prev,
        [id]: { ...getRow(id), ...patch },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleRetry = useCallback(
    async (id: string) => {
      setRow(id, { loading: true, confirming: false });
      try {
        await onRetry(id);
      } finally {
        setRow(id, { loading: false });
      }
    },
    [onRetry, setRow],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setRow(id, { loading: true, confirming: false });
      try {
        await onDelete(id);
      } finally {
        setRow(id, { loading: false });
        // Clean up row state after deletion
        setRowState((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [onDelete, setRow],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800">
              Data Gagal Disinkronkan
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {items.length} item gagal — pilih retry atau hapus
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
            aria-label="Tutup"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-neutral-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 divide-y divide-neutral-50">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="text-2xl">✅</span>
              <p className="text-sm text-neutral-500">Semua item berhasil</p>
            </div>
          ) : (
            items.map((item) => {
              const row = getRow(item.id);
              const typeLabel =
                item.type === "kirim_hasil" ? "Kirim Hasil" : "Simpan Progres";

              return (
                <div key={item.id} className="px-5 py-4 flex flex-col gap-2">
                  {/* Item info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-neutral-700 truncate">
                          WO: {item.workOrderId}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 shrink-0">
                          {typeLabel}
                        </span>
                      </div>
                      {item.errorMessage && (
                        <p className="text-[11px] text-red-500 mt-0.5 line-clamp-2">
                          {item.errorMessage}
                        </p>
                      )}
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Percobaan: {item.retryCount ?? 0}x
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {row.confirming ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={row.loading}
                        className="flex-1 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        {row.loading ? "Menghapus..." : "Ya, hapus"}
                      </button>
                      <button
                        onClick={() => setRow(item.id, { confirming: false })}
                        className="flex-1 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 text-xs font-semibold hover:bg-neutral-200 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRetry(item.id)}
                        disabled={row.loading}
                        className="flex-1 py-1.5 rounded-lg bg-[#1F2375] text-white text-xs font-semibold hover:bg-[#1a1e65] disabled:opacity-50 transition-colors"
                      >
                        {row.loading ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Mencoba...
                          </span>
                        ) : (
                          "Coba Ulang"
                        )}
                      </button>
                      <button
                        onClick={() => setRow(item.id, { confirming: true })}
                        disabled={row.loading}
                        className="flex-1 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-neutral-100 text-neutral-600 text-xs font-semibold hover:bg-neutral-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingItemsModal;

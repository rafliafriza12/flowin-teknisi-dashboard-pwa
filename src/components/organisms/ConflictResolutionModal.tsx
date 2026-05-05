/**
 * Conflict Resolution Modal
 *
 * Displays side-by-side comparison of local vs server data when a sync
 * conflict is detected. Lets the user keep local, keep server, or merge
 * field-by-field. Auto-resolves to "Keep Local" after 5 minutes.
 *
 * **Validates: Requirements 12.2, 12.3, 12.4, 12.5, 12.6**
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  detectConflicts,
  applyMergeResolution,
  type ConflictInfo,
} from "@/libs/conflictDetection";
import type { PendingUploadItem } from "@/libs/offlineQueue";
import XIcon from "@/components/atoms/icons/XIcon";

const AUTO_RESOLVE_MS = 5 * 60 * 1000; // 5 minutes

export type ConflictResolution =
  | { kind: "keep_local" }
  | { kind: "keep_server" }
  | { kind: "merge"; mergedPayload: Record<string, unknown> };

interface ConflictResolutionModalProps {
  isOpen: boolean;
  pendingItem: PendingUploadItem | null;
  serverData: Record<string, unknown> | null;
  onResolve: (resolution: ConflictResolution) => void;
  onClose: () => void;
}

function formatValue(value: unknown): string {
  if (value === undefined) return "—";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatField(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  pendingItem,
  serverData,
  onResolve,
  onClose,
}) => {
  const [view, setView] = useState<"summary" | "merge">("summary");
  const [selections, setSelections] = useState<
    Record<string, "local" | "server">
  >({});
  const [remainingMs, setRemainingMs] = useState(AUTO_RESOLVE_MS);

  const conflicts: ConflictInfo[] = useMemo(() => {
    if (!pendingItem || !serverData) return [];
    return detectConflicts(pendingItem.progresPayload, serverData);
  }, [pendingItem, serverData]);

  // Initialize selections — auto-merged fields default to merged value side
  useEffect(() => {
    if (!isOpen) return;
    const init: Record<string, "local" | "server"> = {};
    for (const c of conflicts) {
      init[c.field] = "local";
    }
    setSelections(init);
    setView("summary");
    setRemainingMs(AUTO_RESOLVE_MS);
  }, [isOpen, conflicts]);

  // Auto-resolve countdown
  useEffect(() => {
    if (!isOpen) return;

    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = AUTO_RESOLVE_MS - elapsed;
      if (remaining <= 0) {
        clearInterval(interval);
        onResolve({ kind: "keep_local" });
        return;
      }
      setRemainingMs(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onResolve]);

  if (!isOpen || !pendingItem || !serverData) return null;

  const handleKeepLocal = () => onResolve({ kind: "keep_local" });
  const handleKeepServer = () => onResolve({ kind: "keep_server" });

  const handleConfirmMerge = () => {
    const mergedFields = applyMergeResolution(conflicts, selections);
    const mergedPayload = {
      ...pendingItem.progresPayload,
      ...mergedFields,
    };
    onResolve({ kind: "merge", mergedPayload });
  };

  const setSelection = (field: string, side: "local" | "server") => {
    setSelections((prev) => ({ ...prev, [field]: side }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-neutral-03">
              Konflik Data Terdeteksi
            </h2>
            <span className="text-xs text-grey">
              Auto-pilih lokal dalam {formatRemaining(remainingMs)}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="text-grey hover:text-neutral-03"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {conflicts.length === 0 ? (
            <p className="text-sm text-grey">
              Tidak ada perbedaan antara data lokal dan server.
            </p>
          ) : view === "summary" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-neutral-03">
                Data di server berbeda dengan data offline Anda untuk{" "}
                <strong>{conflicts.length}</strong> field. Pilih cara
                penyelesaian:
              </p>
              <ul className="flex flex-col gap-2">
                {conflicts.map((c) => (
                  <li
                    key={c.field}
                    className="rounded-xl border border-neutral-100 p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-neutral-03">
                        {formatField(c.field)}
                      </span>
                      {c.canAutoMerge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Bisa digabung otomatis
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-red-50 border border-red-100 p-2">
                        <span className="text-[10px] font-semibold text-red-600 uppercase">
                          Server
                        </span>
                        <pre className="text-neutral-03 whitespace-pre-wrap break-words mt-1">
                          {formatValue(c.serverValue)}
                        </pre>
                      </div>
                      <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2">
                        <span className="text-[10px] font-semibold text-emerald-600 uppercase">
                          Lokal
                        </span>
                        <pre className="text-neutral-03 whitespace-pre-wrap break-words mt-1">
                          {formatValue(c.localValue)}
                        </pre>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-neutral-03">
                Pilih nilai per field. Pratinjau ditampilkan di bawah.
              </p>
              <ul className="flex flex-col gap-2">
                {conflicts.map((c) => {
                  const choice = selections[c.field] ?? "local";
                  return (
                    <li
                      key={c.field}
                      className="rounded-xl border border-neutral-100 p-3 flex flex-col gap-2"
                    >
                      <span className="text-sm font-semibold text-neutral-03">
                        {formatField(c.field)}
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelection(c.field, "server")}
                          className={`rounded-lg border p-2 text-left transition-colors ${
                            choice === "server"
                              ? "bg-red-100 border-red-300"
                              : "bg-red-50 border-red-100 hover:bg-red-100/60"
                          }`}
                        >
                          <span className="text-[10px] font-semibold text-red-600 uppercase block">
                            Server
                          </span>
                          <pre className="text-neutral-03 whitespace-pre-wrap break-words mt-1">
                            {formatValue(c.serverValue)}
                          </pre>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelection(c.field, "local")}
                          className={`rounded-lg border p-2 text-left transition-colors ${
                            choice === "local"
                              ? "bg-emerald-100 border-emerald-300"
                              : "bg-emerald-50 border-emerald-100 hover:bg-emerald-100/60"
                          }`}
                        >
                          <span className="text-[10px] font-semibold text-emerald-600 uppercase block">
                            Lokal
                          </span>
                          <pre className="text-neutral-03 whitespace-pre-wrap break-words mt-1">
                            {formatValue(c.localValue)}
                          </pre>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 px-5 py-4 border-t border-neutral-100">
          {view === "summary" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={handleKeepLocal}
                className="py-3 rounded-xl bg-[#1F2375] text-white text-sm font-medium hover:bg-[#1F2375]/90"
              >
                Pakai Lokal
              </button>
              <button
                onClick={handleKeepServer}
                className="py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-03 hover:bg-neutral-50"
              >
                Pakai Server
              </button>
              <button
                onClick={() => setView("merge")}
                disabled={conflicts.length === 0}
                className="py-3 rounded-xl border border-[#1F2375] text-sm font-medium text-[#1F2375] hover:bg-[#1F2375]/5 disabled:opacity-50"
              >
                Gabungkan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setView("summary")}
                className="py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-03 hover:bg-neutral-50"
              >
                Kembali
              </button>
              <button
                onClick={handleConfirmMerge}
                className="py-3 rounded-xl bg-[#1F2375] text-white text-sm font-medium hover:bg-[#1F2375]/90"
              >
                Terapkan Gabungan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionModal;

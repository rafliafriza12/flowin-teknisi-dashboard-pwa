"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAjukanTim, useKerjaSendiri } from "@/services/workOrderService";
import { useSearchTeknisi } from "@/services/userService";
import { IWorkOrder, LABEL_STATUS_TIM } from "@/types/workOrder";
import { IUser } from "@/types/user";
import StatusBadge from "@/components/atoms/StatusBadge";
import { showToast, showErrorToast } from "@/libs/toast";

interface TimManagementSectionProps {
  workOrder: IWorkOrder;
}

const WARNA_STATUS_TIM: Record<string, string> = {
  belum_diajukan: "bg-gray-100 text-gray-600",
  diajukan: "bg-blue-100 text-blue-800",
  disetujui: "bg-green-100 text-green-800",
  ditolak: "bg-red-100 text-red-800",
};

const LABEL_DIVISI: Record<string, string> = {
  perencanaan_teknik: "Perencanaan Teknik",
  teknik_cabang: "Teknik Cabang",
  pengawasan_teknik: "Pengawasan Teknik",
};

// ─── Teknisi Search + Autocomplete ───────────────────────────────────────────

interface TeknisiSearchProps {
  selectedIds: string[];
  selfId: string;
  onAdd: (user: IUser) => void;
}

const DEBOUNCE_MS = 300;

const TeknisiSearch: React.FC<TeknisiSearchProps> = ({
  selectedIds,
  selfId,
  onAdd,
}) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce: update debouncedQuery 300 ms after the user stops typing
  const handleChange = useCallback((value: string) => {
    setQuery(value);
    setOpen(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Fetch from backend using debounced value
  const { data, isFetching } = useSearchTeknisi(debouncedQuery);

  const results = (data?.users ?? []).filter(
    (u) => u.isActive && u.id !== selfId && !selectedIds.includes(u.id),
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showDropdown = open && debouncedQuery.trim().length >= 1;

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Cari nama atau NIP teknisi..."
          className="w-full rounded-lg border border-grey-stroke px-3 py-2 pr-8 text-sm text-neutral-03 placeholder:text-grey focus:outline-none focus:ring-2 focus:ring-moss-stone/30 focus:border-moss-stone"
        />
        {/* Loading spinner */}
        {isFetching && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-moss-stone border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-xl border border-grey-stroke bg-white shadow-lg max-h-52 overflow-y-auto"
        >
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onAdd(user);
                setQuery("");
                setDebouncedQuery("");
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-moss-stone/5 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-moss-stone/10 shrink-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-moss-stone">
                  {user.namaLengkap.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-03 truncate">
                  {user.namaLengkap}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-grey">{user.nip}</span>
                  <span className="text-grey">·</span>
                  <span className="text-xs text-grey">
                    {LABEL_DIVISI[user.divisi] ?? user.divisi}
                  </span>
                </div>
              </div>
              {user.pekerjaanSekarang && (
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                  Sedang bertugas
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {showDropdown && !isFetching && results.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-xl border border-grey-stroke bg-white shadow-lg"
        >
          <p className="px-3 py-3 text-sm text-grey text-center">
            Tidak ada teknisi ditemukan
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TimManagementSection: React.FC<TimManagementSectionProps> = ({
  workOrder,
}) => {
  const [showTimForm, setShowTimForm] = useState(false);
  const [selectedAnggota, setSelectedAnggota] = useState<IUser[]>([]);

  const ajukanTimMutation = useAjukanTim();
  const kerjaSendiriMutation = useKerjaSendiri();

  const isLoading =
    ajukanTimMutation.isPending || kerjaSendiriMutation.isPending;

  const canManageTim =
    workOrder.statusRespon === "diterima" &&
    workOrder.status === "menunggu_tim";

  const selfId = workOrder.teknisiPenanggungJawab.id;

  const handleAddAnggota = (user: IUser) => {
    setSelectedAnggota((prev) => [...prev, user]);
  };

  const handleRemoveAnggota = (userId: string) => {
    setSelectedAnggota((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleKerjaSendiri = async () => {
    try {
      const result = await kerjaSendiriMutation.mutateAsync({
        input: { workOrderId: workOrder.id },
      });
      showToast.success(result.kerjaSendiri.message);
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleAjukanTim = async () => {
    if (selectedAnggota.length === 0) {
      showToast.warning("Pilih minimal satu anggota tim");
      return;
    }

    try {
      const result = await ajukanTimMutation.mutateAsync({
        input: {
          workOrderId: workOrder.id,
          anggotaTim: selectedAnggota.map((u) => u.id),
        },
      });
      showToast.success(result.ajukanTim.message);
      setShowTimForm(false);
      setSelectedAnggota([]);
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-grey-stroke p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-03">Tim Kerja</h3>
        <StatusBadge
          label={LABEL_STATUS_TIM[workOrder.statusTim]}
          colorClass={
            WARNA_STATUS_TIM[workOrder.statusTim] || "bg-gray-100 text-gray-600"
          }
        />
      </div>

      {/* Anggota tim yang sudah ada */}
      {workOrder.tim.length > 0 && (
        <div className="mb-3 space-y-2">
          {workOrder.tim.map((anggota) => (
            <div
              key={anggota.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
            >
              <div className="w-8 h-8 rounded-full bg-moss-stone/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-moss-stone">
                  {anggota.namaLengkap.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-03">
                  {anggota.namaLengkap}
                </p>
                <p className="text-xs text-grey">{anggota.nip}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Catatan tim dari admin */}
      {workOrder.catatanTim && (
        <div className="mb-3 p-2.5 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-800">
            <span className="font-medium">Catatan Admin:</span>{" "}
            {workOrder.catatanTim}
          </p>
        </div>
      )}

      {/* Aksi — hanya jika bisa manage tim */}
      {canManageTim && (
        <>
          {!showTimForm ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowTimForm(true)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-moss-stone text-white text-sm font-medium hover:bg-moss-stone/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajukan Tim
              </button>
              <button
                type="button"
                onClick={handleKerjaSendiri}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg border border-moss-stone text-moss-stone text-sm font-medium hover:bg-moss-stone/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {kerjaSendiriMutation.isPending
                  ? "Memproses..."
                  : "Kerja Sendiri"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-03 mb-1.5 block">
                  Cari & Tambah Anggota Tim
                </label>
                <TeknisiSearch
                  selectedIds={selectedAnggota.map((u) => u.id)}
                  selfId={selfId}
                  onAdd={handleAddAnggota}
                />
              </div>

              {/* Chip anggota yang dipilih */}
              {selectedAnggota.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-grey">
                    {selectedAnggota.length} anggota dipilih:
                  </p>
                  <div className="space-y-1.5">
                    {selectedAnggota.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-moss-stone/5 border border-moss-stone/20"
                      >
                        <div className="w-7 h-7 rounded-full bg-moss-stone/15 shrink-0 flex items-center justify-center">
                          <span className="text-[11px] font-semibold text-moss-stone">
                            {user.namaLengkap.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-03 truncate">
                            {user.namaLengkap}
                          </p>
                          <p className="text-xs text-grey">
                            {user.nip} ·{" "}
                            {LABEL_DIVISI[user.divisi] ?? user.divisi}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAnggota(user.id)}
                          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-grey hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-3.5 h-3.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18 18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAjukanTim}
                  disabled={isLoading || selectedAnggota.length === 0}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-moss-stone text-white text-sm font-medium hover:bg-moss-stone/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ajukanTimMutation.isPending
                    ? "Memproses..."
                    : "Kirim Pengajuan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTimForm(false);
                    setSelectedAnggota([]);
                  }}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-lg border border-grey-stroke text-neutral-03 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Status menunggu review */}
      {workOrder.statusTim === "diajukan" && (
        <p className="text-xs text-blue-600 mt-2">
          Tim sedang menunggu persetujuan admin.
        </p>
      )}

      {workOrder.statusTim === "ditolak" && canManageTim && (
        <p className="text-xs text-red-600 mt-2">
          Tim ditolak oleh admin. Silakan ajukan ulang atau kerja sendiri.
        </p>
      )}
    </div>
  );
};

export default TimManagementSection;

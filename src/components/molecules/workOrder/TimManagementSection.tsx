"use client";

import React, { useState } from "react";
import { useAjukanTim, useKerjaSendiri } from "@/services/workOrderService";
import {
  IWorkOrder,
  LABEL_STATUS_TIM,
  WARNA_STATUS_PEKERJAAN,
} from "@/types/workOrder";
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

const TimManagementSection: React.FC<TimManagementSectionProps> = ({
  workOrder,
}) => {
  const [showTimForm, setShowTimForm] = useState(false);
  const [anggotaTimIds, setAnggotaTimIds] = useState("");

  const ajukanTimMutation = useAjukanTim();
  const kerjaSendiriMutation = useKerjaSendiri();

  const isLoading =
    ajukanTimMutation.isPending || kerjaSendiriMutation.isPending;

  // Hanya tampil jika statusRespon === "diterima" dan status === "menunggu_tim"
  const canManageTim =
    workOrder.statusRespon === "diterima" &&
    workOrder.status === "menunggu_tim";

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
    const ids = anggotaTimIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      showToast.warning("Masukkan minimal satu ID anggota tim");
      return;
    }

    try {
      const result = await ajukanTimMutation.mutateAsync({
        input: {
          workOrderId: workOrder.id,
          anggotaTim: ids,
        },
      });
      showToast.success(result.ajukanTim.message);
      setShowTimForm(false);
      setAnggotaTimIds("");
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
                <label className="text-xs font-medium text-neutral-03 mb-1 block">
                  ID Anggota Tim (pisahkan dengan koma)
                </label>
                <textarea
                  value={anggotaTimIds}
                  onChange={(e) => setAnggotaTimIds(e.target.value)}
                  placeholder="userId1, userId2, userId3"
                  rows={2}
                  className="w-full rounded-lg border border-grey-stroke px-3 py-2 text-sm text-neutral-03 placeholder:text-grey focus:outline-none focus:ring-2 focus:ring-moss-stone/30 focus:border-moss-stone resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAjukanTim}
                  disabled={isLoading}
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
                    setAnggotaTimIds("");
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
          ⏳ Tim sedang menunggu persetujuan admin.
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

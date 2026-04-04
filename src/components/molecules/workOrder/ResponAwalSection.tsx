"use client";

import React, { useState } from "react";
import {
  useTerimaPekerjaan,
  useAjukanPenolakan,
} from "@/services/workOrderService";
import { IWorkOrder } from "@/types/workOrder";
import { showToast, showErrorToast } from "@/libs/toast";

interface ResponAwalSectionProps {
  workOrder: IWorkOrder;
}

const ResponAwalSection: React.FC<ResponAwalSectionProps> = ({ workOrder }) => {
  const [showPenolakanForm, setShowPenolakanForm] = useState(false);
  const [alasanPenolakan, setAlasanPenolakan] = useState("");

  const terimaMutation = useTerimaPekerjaan();
  const penolakanMutation = useAjukanPenolakan();

  const isLoading = terimaMutation.isPending || penolakanMutation.isPending;

  // Hanya tampilkan jika statusRespon === "belum_direspon" atau "penolakan_ditolak"
  const shouldShow =
    workOrder.statusRespon === "belum_direspon" ||
    workOrder.statusRespon === "penolakan_ditolak";

  if (!shouldShow) return null;

  const handleTerima = async () => {
    try {
      const result = await terimaMutation.mutateAsync({
        input: { workOrderId: workOrder.id },
      });
      showToast.success(result.terimaPekerjaan.message);
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleAjukanPenolakan = async () => {
    if (!alasanPenolakan.trim()) {
      showToast.warning("Alasan penolakan harus diisi");
      return;
    }

    try {
      const result = await penolakanMutation.mutateAsync({
        input: {
          workOrderId: workOrder.id,
          alasan: alasanPenolakan.trim(),
        },
      });
      showToast.success(result.ajukanPenolakan.message);
      setShowPenolakanForm(false);
      setAlasanPenolakan("");
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-grey-stroke p-4">
      <h3 className="text-sm font-semibold text-neutral-03 mb-3">
        Respon Awal
      </h3>

      {workOrder.statusRespon === "penolakan_ditolak" && (
        <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs font-medium text-red-800">
            Penolakan Anda ditolak oleh admin.
          </p>
          {workOrder.catatanReviewPenolakan && (
            <p className="text-xs text-red-700 mt-1">
              Catatan: {workOrder.catatanReviewPenolakan}
            </p>
          )}
          <p className="text-xs text-red-600 mt-1">
            Silakan terima pekerjaan ini.
          </p>
        </div>
      )}

      <p className="text-xs text-grey mb-4">
        Anda perlu merespon pekerjaan ini sebelum dapat melanjutkan.
      </p>

      {!showPenolakanForm ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleTerima}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {terimaMutation.isPending ? "Memproses..." : "Terima Pekerjaan"}
          </button>
          {workOrder.statusRespon === "belum_direspon" && (
            <button
              type="button"
              onClick={() => setShowPenolakanForm(true)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ajukan Penolakan
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={alasanPenolakan}
            onChange={(e) => setAlasanPenolakan(e.target.value)}
            placeholder="Jelaskan alasan penolakan..."
            rows={3}
            className="w-full rounded-lg border border-grey-stroke px-3 py-2 text-sm text-neutral-03 placeholder:text-grey focus:outline-none focus:ring-2 focus:ring-moss-stone/30 focus:border-moss-stone resize-none"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAjukanPenolakan}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {penolakanMutation.isPending ? "Memproses..." : "Kirim Penolakan"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPenolakanForm(false);
                setAlasanPenolakan("");
              }}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-lg border border-grey-stroke text-neutral-03 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponAwalSection;

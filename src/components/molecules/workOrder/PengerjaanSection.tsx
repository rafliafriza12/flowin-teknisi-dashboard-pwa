"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useSimpanProgres, useKirimHasil } from "@/services/workOrderService";
import { IWorkOrder } from "@/types/workOrder";
import {
  uploadToCloudinary,
  validateImageFile,
  UploadOptions,
} from "@/libs/cloudinary";
import CircularProgress from "@/components/atoms/CircularProgress";
import { showToast, showErrorToast } from "@/libs/toast";

interface PengerjaanSectionProps {
  workOrder: IWorkOrder;
}

interface FotoItem {
  url: string;
  keterangan: string;
}

/**
 * Parse progres data (JSON string) jadi objek progres.
 */
function parseProgresData(workOrder: IWorkOrder): {
  catatan: string;
  fotos: FotoItem[];
} {
  // Cek apakah ada data di field referensi (tergantung jenis pekerjaan)
  // Untuk sekarang kita gunakan pattern simple: data tersimpan di field idXxx sebagai JSON
  return { catatan: "", fotos: [] };
}

const PengerjaanSection: React.FC<PengerjaanSectionProps> = ({ workOrder }) => {
  const [catatan, setCatatan] = useState("");
  const [fotos, setFotos] = useState<FotoItem[]>([]);
  const [keteranganFoto, setKeteranganFoto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const simpanProgresMutation = useSimpanProgres();
  const kirimHasilMutation = useKirimHasil();

  const isLoading =
    simpanProgresMutation.isPending || kirimHasilMutation.isPending;

  // Hanya bisa mengerjakan jika sudah ditugaskan / sedang_dikerjakan / revisi
  const canWork = ["ditugaskan", "sedang_dikerjakan", "revisi"].includes(
    workOrder.status,
  );

  // Bisa kirim hanya jika sedang_dikerjakan
  const canSubmit = workOrder.status === "sedang_dikerjakan";

  if (!canWork && workOrder.status !== "dikirim") return null;

  const handleCancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast.info("Upload dibatalkan");
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 5);
    if (!validation.valid) {
      showErrorToast(new Error(validation.error));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setUploading(true);
      setUploadProgress(0);

      const uploadOptions: UploadOptions = {
        folder: "flowin-teknisi/bukti-pekerjaan",
        resourceType: "image",
        tags: ["work-order", workOrder.jenisPekerjaan, workOrder.id],
      };

      const result = await uploadToCloudinary(
        file,
        uploadOptions,
        (p) => setUploadProgress(p),
        abortController.signal,
      );

      setFotos((prev) => [
        ...prev,
        {
          url: result.secure_url,
          keterangan: keteranganFoto || "Foto bukti pekerjaan",
        },
      ]);
      setKeteranganFoto("");
      showToast.success("Foto berhasil diunggah");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showErrorToast(error);
    } finally {
      abortControllerRef.current = null;
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSimpanProgres = async () => {
    const progresData = JSON.stringify({
      catatan,
      fotos,
      updatedAt: new Date().toISOString(),
    });

    try {
      const result = await simpanProgresMutation.mutateAsync({
        input: {
          workOrderId: workOrder.id,
          data: progresData,
        },
      });
      showToast.success(result.simpanProgres.message);
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleKirimHasil = async () => {
    if (fotos.length === 0) {
      showToast.warning("Upload minimal satu foto bukti pekerjaan");
      return;
    }

    // Simpan progres dulu sebelum kirim
    const progresData = JSON.stringify({
      catatan,
      fotos,
      updatedAt: new Date().toISOString(),
    });

    try {
      await simpanProgresMutation.mutateAsync({
        input: {
          workOrderId: workOrder.id,
          data: progresData,
        },
      });

      const result = await kirimHasilMutation.mutateAsync({
        input: { workOrderId: workOrder.id },
      });
      showToast.success(result.kirimHasil.message);
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-grey-stroke p-4">
      <h3 className="text-sm font-semibold text-neutral-03 mb-3">Pengerjaan</h3>

      {/* Status dikirim — read-only */}
      {workOrder.status === "dikirim" && (
        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
          <p className="text-xs font-medium text-purple-800">
            ✅ Hasil pekerjaan sudah dikirim dan menunggu review admin.
          </p>
        </div>
      )}

      {/* Revisi info */}
      {workOrder.status === "revisi" && workOrder.catatanReview && (
        <div className="mb-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
          <p className="text-xs font-medium text-orange-800">
            Catatan Revisi dari Admin:
          </p>
          <p className="text-xs text-orange-700 mt-1">
            {workOrder.catatanReview}
          </p>
        </div>
      )}

      {canWork && (
        <>
          {/* Catatan */}
          <div className="mb-4">
            <label className="text-xs font-medium text-neutral-03 mb-1 block">
              Catatan Pekerjaan
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan catatan pekerjaan..."
              rows={3}
              className="w-full rounded-lg border border-grey-stroke px-3 py-2 text-sm text-neutral-03 placeholder:text-grey focus:outline-none focus:ring-2 focus:ring-moss-stone/30 focus:border-moss-stone resize-none"
            />
          </div>

          {/* Upload Foto */}
          <div className="mb-4">
            <label className="text-xs font-medium text-neutral-03 mb-2 block">
              Bukti Foto Pekerjaan
            </label>

            {/* Preview fotos */}
            {fotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {fotos.map((foto, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden border border-grey-stroke group"
                  >
                    <Image
                      src={foto.url}
                      alt={foto.keterangan}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <button
                      type="button"
                      onClick={() => handleRemoveFoto(index)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {foto.keterangan && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                        <p className="text-[10px] text-white truncate">
                          {foto.keterangan}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Keterangan foto */}
            <input
              type="text"
              value={keteranganFoto}
              onChange={(e) => setKeteranganFoto(e.target.value)}
              placeholder="Keterangan foto (opsional)"
              className="w-full rounded-lg border border-grey-stroke px-3 py-2 text-sm text-neutral-03 placeholder:text-grey focus:outline-none focus:ring-2 focus:ring-moss-stone/30 focus:border-moss-stone mb-2"
            />

            {/* Hidden input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />

            {uploading ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-grey-stroke bg-gray-50">
                <CircularProgress
                  progress={uploadProgress}
                  size={40}
                  strokeWidth={3}
                />
                <div className="flex-1">
                  <p className="text-xs font-medium text-neutral-03">
                    Mengunggah...
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="px-3 py-1 rounded-md border border-grey-stroke text-xs text-neutral-03 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3 rounded-lg border-2 border-dashed border-grey-stroke hover:border-moss-stone hover:bg-moss-stone/5 transition-colors text-sm text-grey"
              >
                📷 Tambah Foto Bukti
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSimpanProgres}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-moss-stone text-moss-stone text-sm font-medium hover:bg-moss-stone/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {simpanProgresMutation.isPending
                ? "Menyimpan..."
                : "Simpan Draft"}
            </button>
            {canSubmit && (
              <button
                type="button"
                onClick={handleKirimHasil}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-moss-stone text-white text-sm font-medium hover:bg-moss-stone/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {kirimHasilMutation.isPending ? "Mengirim..." : "Kirim Hasil"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PengerjaanSection;

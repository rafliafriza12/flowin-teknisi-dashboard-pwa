"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  createContext,
  useContext,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  useSimpanProgres,
  useKirimHasil,
  useProgresWorkOrder,
} from "@/services/workOrderService";
import { IWorkOrder, IProgresData, JenisPekerjaan } from "@/types/workOrder";
import {
  uploadToCloudinary,
  validateImageFile,
  UploadOptions,
} from "@/libs/cloudinary";
import CircularProgress from "@/components/atoms/CircularProgress";
import { showToast, showErrorToast } from "@/libs/toast";
import {
  addPendingItem,
  type PendingImageRef,
  type PendingItemType,
} from "@/libs/offlineQueue";
import { useOfflineSyncContext } from "@/providers/OfflineSyncProvider";

// Leaflet hanya jalan di browser — load dinamis
const KoordinatPicker = dynamic(
  () => import("@/components/atoms/KoordinatPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 rounded-xl bg-gray-100 border border-grey-stroke flex items-center justify-center">
        <p className="text-xs text-grey">Memuat peta...</p>
      </div>
    ),
  },
);

interface PengerjaanSectionProps {
  workOrder: IWorkOrder;
}

// ─── Per-jenis data shapes (sesuai model backend) ─────────────────────────────

interface SurveiData {
  koordinat: { longitude: string; latitude: string };
  urlJaringan: string;
  diameterPipa: string;
  urlPosisiBak: string;
  posisiMeteran: string;
  jumlahPenghuni: string;
  standar: boolean | null;
  catatan: string;
}

interface RabData {
  totalBiaya: string;
  urlRab: string;
  catatan: string;
}

interface PemasanganData {
  seriMeteran: string;
  fotoRumah: string;
  fotoMeteran: string;
  fotoMeteranDanRumah: string;
  catatan: string;
}

interface PengawasanData {
  urlGambar: string[];
  catatan: string;
}

// ─── Pending Files Context (offline upload queue per-form) ───────────────────

interface PendingFileEntry {
  file: File;
  previewUrl: string;
  cloudinaryFolder: string;
  tags: string[];
}

interface PendingFilesContextValue {
  addPendingFile: (fieldKey: string, entry: PendingFileEntry) => void;
  removePendingFile: (fieldKey: string) => void;
  getPendingPreviewUrl: (fieldKey: string) => string | null;
}

const PendingFilesContext = createContext<PendingFilesContextValue | null>(
  null,
);

function usePendingFiles() {
  const ctx = useContext(PendingFilesContext);
  if (!ctx) throw new Error("usePendingFiles harus dalam PengerjaanSection");
  return ctx;
}

// ─── Shared Upload Hook ───────────────────────────────────────────────────────

function useImageUpload(folder: string) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    showToast.info("Upload dibatalkan");
  }, []);

  const uploadFile = useCallback(
    async (file: File, tags: string[] = []): Promise<string | null> => {
      const validation = validateImageFile(file, 5);
      if (!validation.valid) {
        showErrorToast(new Error(validation.error));
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
        return null;
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      try {
        setUploading(true);
        setUploadProgress(0);
        const uploadOptions: UploadOptions = {
          folder,
          resourceType: "image",
          tags,
        };
        const result = await uploadToCloudinary(
          file,
          uploadOptions,
          (p) => setUploadProgress(p),
          abortController.signal,
        );
        return result.secure_url;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return null;
        showErrorToast(error);
        return null;
      } finally {
        abortControllerRef.current = null;
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
      }
    },
    [folder],
  );

  return {
    uploading,
    uploadProgress,
    fileInputRef,
    cameraInputRef,
    cancelUpload,
    uploadFile,
  };
}

// ─── Reusable UploadButton (single foto) ─────────────────────────────────────

interface UploadButtonProps {
  label: string;
  uploading: boolean;
  uploadProgress: number;
  onCancel: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentUrl?: string;
  onRemove?: () => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({
  label,
  uploading,
  uploadProgress,
  onCancel,
  onFileChange,
  currentUrl,
  onRemove,
}) => {
  return (
    <div>
      {currentUrl ? (
        <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden border border-grey-stroke group">
          <Image src={currentUrl} alt={label} fill className="object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
      ) : uploading ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-grey-stroke bg-gray-50">
          <CircularProgress
            progress={uploadProgress}
            size={36}
            strokeWidth={3}
          />
          <p className="text-xs text-neutral-03 flex-1">
            Mengunggah {label}...
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="px-2 py-1 rounded border border-grey-stroke text-xs text-neutral-03 hover:bg-gray-100"
          >
            Batal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {/* Input langsung di dalam label — paling reliable di semua browser/PWA */}
          <label className="flex items-center justify-center gap-1.5 w-full p-2.5 rounded-lg border-2 border-dashed border-grey-stroke hover:border-moss-stone hover:bg-moss-stone/5 transition-colors text-xs text-grey cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              capture="environment"
              onChange={onFileChange}
              className="sr-only"
            />
            Kamera
          </label>
          <label className="flex items-center justify-center gap-1.5 w-full p-2.5 rounded-lg border-2 border-dashed border-grey-stroke hover:border-moss-stone hover:bg-moss-stone/5 transition-colors text-xs text-grey cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={onFileChange}
              className="sr-only"
            />
            Galeri
          </label>
        </div>
      )}
    </div>
  );
};

// ─── Shared style constants ───────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-grey-stroke px-3 py-2 text-sm text-neutral-03 placeholder:text-grey focus:outline-none focus:ring-2 focus:ring-moss-stone/30 focus:border-moss-stone";

const textareaClass =
  "w-full rounded-lg border border-grey-stroke px-3 py-2 text-sm text-neutral-03 placeholder:text-grey focus:outline-none focus:ring-2 focus:ring-moss-stone/30 focus:border-moss-stone resize-none";

// ─── Offline-aware upload helper ──────────────────────────────────────────────

/**
 * Tangani upload gambar dengan deteksi offline.
 * Jika offline: simpan file sebagai pending, kembalikan blob URL untuk preview.
 * Jika online: upload ke Cloudinary, kembalikan URL.
 */
async function handleFileOfflineAware(
  file: File,
  fieldKey: string,
  folder: string,
  tags: string[],
  uploadFn: (file: File, tags: string[]) => Promise<string | null>,
  pendingFilesCtx: PendingFilesContextValue,
): Promise<string | null> {
  if (!navigator.onLine) {
    const previewUrl = URL.createObjectURL(file);
    pendingFilesCtx.addPendingFile(fieldKey, {
      file,
      previewUrl,
      cloudinaryFolder: folder,
      tags,
    });
    showToast.info("📴 Offline: foto disimpan, akan diupload saat online");
    return previewUrl;
  }
  return uploadFn(file, tags);
}

// ─── Form Survei ──────────────────────────────────────────────────────────────
// Fields: koordinat, urlJaringan, diameterPipa, urlPosisiBak,
//         posisiMeteran, jumlahPenghuni, standar, catatan

const FormSurvei: React.FC<{
  data: SurveiData;
  onChange: (data: SurveiData) => void;
  workOrderId: string;
}> = ({ data, onChange, workOrderId }) => {
  const set = <K extends keyof SurveiData>(key: K, value: SurveiData[K]) =>
    onChange({ ...data, [key]: value });

  const pendingCtx = usePendingFiles();
  const jaringanUpload = useImageUpload("flowin-teknisi/survei");
  const bakUpload = useImageUpload("flowin-teknisi/survei");
  const meteranUpload = useImageUpload("flowin-teknisi/survei");

  const handleJaringanChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleFileOfflineAware(
      file,
      "urlJaringan",
      "flowin-teknisi/survei",
      ["work-order", "survei", workOrderId],
      (f, t) => jaringanUpload.uploadFile(f, t),
      pendingCtx,
    );
    if (url) set("urlJaringan", url);
  };

  const handleBakChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleFileOfflineAware(
      file,
      "urlPosisiBak",
      "flowin-teknisi/survei",
      ["work-order", "survei", workOrderId],
      (f, t) => bakUpload.uploadFile(f, t),
      pendingCtx,
    );
    if (url) set("urlPosisiBak", url);
  };

  const handleMeteranChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleFileOfflineAware(
      file,
      "posisiMeteran",
      "flowin-teknisi/survei",
      ["work-order", "survei", workOrderId],
      (f, t) => meteranUpload.uploadFile(f, t),
      pendingCtx,
    );
    if (url) set("posisiMeteran", url);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Koordinat
        </label>
        <KoordinatPicker
          value={data.koordinat}
          onChange={(coords) => set("koordinat", coords)}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Foto Jaringan
        </label>
        <UploadButton
          label="Upload Foto Jaringan"
          uploading={jaringanUpload.uploading}
          uploadProgress={jaringanUpload.uploadProgress}
          onCancel={jaringanUpload.cancelUpload}
          onFileChange={handleJaringanChange}
          currentUrl={data.urlJaringan}
          onRemove={() => set("urlJaringan", "")}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Diameter Pipa
        </label>
        <input
          type="number"
          min={0}
          step="any"
          placeholder="Contoh: 25"
          value={data.diameterPipa}
          onChange={(e) => set("diameterPipa", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Foto Posisi Bak
        </label>
        <UploadButton
          label="Upload Foto Posisi Bak"
          uploading={bakUpload.uploading}
          uploadProgress={bakUpload.uploadProgress}
          onCancel={bakUpload.cancelUpload}
          onFileChange={handleBakChange}
          currentUrl={data.urlPosisiBak}
          onRemove={() => set("urlPosisiBak", "")}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Foto Posisi Meteran
        </label>
        <UploadButton
          label="Upload Foto Posisi Meteran"
          uploading={meteranUpload.uploading}
          uploadProgress={meteranUpload.uploadProgress}
          onCancel={meteranUpload.cancelUpload}
          onFileChange={handleMeteranChange}
          currentUrl={data.posisiMeteran}
          onRemove={() => set("posisiMeteran", "")}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Jumlah Penghuni
        </label>
        <input
          type="number"
          min={1}
          step={1}
          placeholder="Contoh: 4"
          value={data.jumlahPenghuni}
          onChange={(e) => set("jumlahPenghuni", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Standar Pemasangan
        </label>
        <div className="flex gap-4">
          {(
            [
              { label: "Standar", value: true },
              { label: "Tidak Standar", value: false },
            ] as const
          ).map(({ label, value }) => (
            <label
              key={label}
              className="flex items-center gap-1.5 text-xs text-neutral-03 cursor-pointer"
            >
              <input
                type="radio"
                name="standar"
                checked={data.standar === value}
                onChange={() => set("standar", value)}
                className="accent-moss-stone"
              />
              {label}
            </label>
          ))}
          <label className="flex items-center gap-1.5 text-xs text-grey cursor-pointer">
            <input
              type="radio"
              name="standar"
              checked={data.standar === null}
              onChange={() => set("standar", null)}
              className="accent-moss-stone"
            />
            Belum ditentukan
          </label>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Catatan
        </label>
        <textarea
          rows={3}
          placeholder="Catatan survei..."
          value={data.catatan}
          onChange={(e) => set("catatan", e.target.value)}
          className={textareaClass}
        />
      </div>
    </div>
  );
};

// ─── Form RAB ─────────────────────────────────────────────────────────────────
// Fields: totalBiaya, urlRab (upload gambar), catatan

const FormRab: React.FC<{
  data: RabData;
  onChange: (data: RabData) => void;
  workOrderId: string;
}> = ({ data, onChange, workOrderId }) => {
  const set = <K extends keyof RabData>(key: K, value: RabData[K]) =>
    onChange({ ...data, [key]: value });

  const pendingCtx = usePendingFiles();
  const {
    uploading,
    uploadProgress,
    fileInputRef,
    cameraInputRef,
    cancelUpload,
    uploadFile,
  } = useImageUpload("flowin-teknisi/rab");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await handleFileOfflineAware(
      file,
      "urlRab",
      "flowin-teknisi/rab",
      ["work-order", "rab", workOrderId],
      (f, t) => uploadFile(f, t),
      pendingCtx,
    );
    if (url) set("urlRab", url);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Total Biaya (Rp)
        </label>
        <input
          type="number"
          min={0}
          step="any"
          placeholder="Contoh: 1500000"
          value={data.totalBiaya}
          onChange={(e) => set("totalBiaya", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Dokumen RAB (Upload Gambar)
        </label>
        <UploadButton
          label="Upload Dokumen RAB"
          uploading={uploading}
          uploadProgress={uploadProgress}
          onCancel={cancelUpload}
          onFileChange={handleFileChange}
          currentUrl={data.urlRab}
          onRemove={() => set("urlRab", "")}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Catatan
        </label>
        <textarea
          rows={3}
          placeholder="Catatan RAB..."
          value={data.catatan}
          onChange={(e) => set("catatan", e.target.value)}
          className={textareaClass}
        />
      </div>
    </div>
  );
};

// ─── Form Pemasangan ──────────────────────────────────────────────────────────
// Fields: seriMeteran, fotoRumah, fotoMeteran, fotoMeteranDanRumah, catatan

const FormPemasangan: React.FC<{
  data: PemasanganData;
  onChange: (data: PemasanganData) => void;
  workOrderId: string;
}> = ({ data, onChange, workOrderId }) => {
  const set = <K extends keyof PemasanganData>(
    key: K,
    value: PemasanganData[K],
  ) => onChange({ ...data, [key]: value });

  const pendingCtx = usePendingFiles();
  const rumahUpload = useImageUpload("flowin-teknisi/pemasangan");
  const meteranUpload = useImageUpload("flowin-teknisi/pemasangan");
  const meteranRumahUpload = useImageUpload("flowin-teknisi/pemasangan");

  const makeFileHandler =
    (
      field: "fotoRumah" | "fotoMeteran" | "fotoMeteranDanRumah",
      uploader: ReturnType<typeof useImageUpload>,
    ) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await handleFileOfflineAware(
        file,
        field,
        "flowin-teknisi/pemasangan",
        ["work-order", "pemasangan", workOrderId],
        (f, t) => uploader.uploadFile(f, t),
        pendingCtx,
      );
      if (url) set(field, url);
    };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Seri Meteran
        </label>
        <input
          type="text"
          placeholder="Nomor seri meteran"
          value={data.seriMeteran}
          onChange={(e) => set("seriMeteran", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Foto Rumah
        </label>
        <UploadButton
          label="Upload Foto Rumah"
          uploading={rumahUpload.uploading}
          uploadProgress={rumahUpload.uploadProgress}
          onCancel={rumahUpload.cancelUpload}
          onFileChange={makeFileHandler("fotoRumah", rumahUpload)}
          currentUrl={data.fotoRumah}
          onRemove={() => set("fotoRumah", "")}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Foto Meteran
        </label>
        <UploadButton
          label="Upload Foto Meteran"
          uploading={meteranUpload.uploading}
          uploadProgress={meteranUpload.uploadProgress}
          onCancel={meteranUpload.cancelUpload}
          onFileChange={makeFileHandler("fotoMeteran", meteranUpload)}
          currentUrl={data.fotoMeteran}
          onRemove={() => set("fotoMeteran", "")}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Foto Meteran &amp; Rumah
        </label>
        <UploadButton
          label="Upload Foto Meteran & Rumah"
          uploading={meteranRumahUpload.uploading}
          uploadProgress={meteranRumahUpload.uploadProgress}
          onCancel={meteranRumahUpload.cancelUpload}
          onFileChange={makeFileHandler(
            "fotoMeteranDanRumah",
            meteranRumahUpload,
          )}
          currentUrl={data.fotoMeteranDanRumah}
          onRemove={() => set("fotoMeteranDanRumah", "")}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Catatan
        </label>
        <textarea
          rows={3}
          placeholder="Catatan pemasangan..."
          value={data.catatan}
          onChange={(e) => set("catatan", e.target.value)}
          className={textareaClass}
        />
      </div>
    </div>
  );
};

// ─── Form Pengawasan & Penyelesaian Laporan ───────────────────────────────────
// Fields: urlGambar[] (multiple upload), catatan
// Dipakai untuk: pengawasan_pemasangan, pengawasan_setelah_pemasangan, penyelesaian_laporan

const FormPengawasan: React.FC<{
  data: PengawasanData;
  onChange: (data: PengawasanData) => void;
  workOrderId: string;
  jenisPekerjaan: JenisPekerjaan;
}> = ({ data, onChange, workOrderId, jenisPekerjaan }) => {
  const pendingCtx = usePendingFiles();
  const {
    uploading,
    uploadProgress,
    fileInputRef,
    cameraInputRef,
    cancelUpload,
    uploadFile,
  } = useImageUpload(`flowin-teknisi/${jenisPekerjaan}`);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const nextIndex = data.urlGambar.length;
    const fieldKey = `urlGambar_${nextIndex}`;
    const url = await handleFileOfflineAware(
      file,
      fieldKey,
      `flowin-teknisi/${jenisPekerjaan}`,
      ["work-order", jenisPekerjaan, workOrderId],
      (f, t) => uploadFile(f, t),
      pendingCtx,
    );
    if (url) onChange({ ...data, urlGambar: [...data.urlGambar, url] });
  };

  const removeGambar = (index: number) => {
    const url = data.urlGambar[index];
    // Jika ini blob URL (offline pending), revoke dan hapus dari pending context
    if (url?.startsWith("blob:")) {
      pendingCtx.removePendingFile(`urlGambar_${index}`);
      URL.revokeObjectURL(url);
    }
    onChange({
      ...data,
      urlGambar: data.urlGambar.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-3">
      {data.urlGambar.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.urlGambar.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-grey-stroke group"
            >
              <Image
                src={url}
                alt={`Gambar ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              <button
                type="button"
                onClick={() => removeGambar(index)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1">
                <p className="text-[10px] text-white">{index + 1}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {uploading ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-grey-stroke bg-gray-50">
          <CircularProgress
            progress={uploadProgress}
            size={36}
            strokeWidth={3}
          />
          <p className="text-xs text-neutral-03 flex-1">Mengunggah gambar...</p>
          <button
            type="button"
            onClick={cancelUpload}
            className="px-2 py-1 rounded border border-grey-stroke text-xs text-neutral-03 hover:bg-gray-100"
          >
            Batal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {/* Input langsung di dalam label — reliable di iOS Safari & Android */}
          <label className="flex items-center justify-center gap-1.5 w-full p-3 rounded-lg border-2 border-dashed border-grey-stroke hover:border-moss-stone hover:bg-moss-stone/5 transition-colors text-sm text-grey cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              capture="environment"
              onChange={handleFileChange}
              className="sr-only"
            />
            Kamera
          </label>
          <label className="flex items-center justify-center gap-1.5 w-full p-3 rounded-lg border-2 border-dashed border-grey-stroke hover:border-moss-stone hover:bg-moss-stone/5 transition-colors text-sm text-grey cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleFileChange}
              className="sr-only"
            />
            🖼️ Galeri ({data.urlGambar.length} foto)
          </label>
        </div>
      )}
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Catatan
        </label>
        <textarea
          rows={3}
          placeholder="Catatan pengawasan..."
          value={data.catatan}
          onChange={(e) => onChange({ ...data, catatan: e.target.value })}
          className={textareaClass}
        />
      </div>
    </div>
  );
};

// ─── Read-only field helper ───────────────────────────────────────────────────

const ROField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <p className="text-[10px] font-medium text-grey uppercase tracking-wider mb-1">
      {label}
    </p>
    {children}
  </div>
);

const ROText: React.FC<{
  value?: string | number | null;
  fallback?: string;
}> = ({ value, fallback = "—" }) => (
  <p className="text-sm text-neutral-03">
    {value !== null && value !== undefined && value !== "" ? value : fallback}
  </p>
);

const ROImage: React.FC<{ url?: string | null; alt: string }> = ({
  url,
  alt,
}) => {
  if (!url) return <p className="text-sm text-grey italic">Tidak ada foto</p>;
  return (
    <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden border border-grey-stroke">
      <Image src={url} alt={alt} fill className="object-cover" />
    </div>
  );
};

// ─── Per-jenis read-only views ────────────────────────────────────────────────

const ReadOnlySurvei: React.FC<{ p: IProgresData }> = ({ p }) => (
  <div className="space-y-3">
    <ROField label="Koordinat">
      {p.koordinat ? (
        <p className="text-sm text-neutral-03">
          {p.koordinat.latitude}, {p.koordinat.longitude}
        </p>
      ) : (
        <ROText value={null} />
      )}
    </ROField>
    <ROField label="Foto Jaringan">
      <ROImage url={p.urlJaringan} alt="Foto Jaringan" />
    </ROField>
    <ROField label="Diameter Pipa">
      <ROText value={p.diameterPipa != null ? `${p.diameterPipa} mm` : null} />
    </ROField>
    <ROField label="Foto Posisi Bak">
      <ROImage url={p.urlPosisiBak} alt="Foto Posisi Bak" />
    </ROField>
    <ROField label="Foto Posisi Meteran">
      <ROImage url={p.posisiMeteran} alt="Foto Posisi Meteran" />
    </ROField>
    <ROField label="Jumlah Penghuni">
      <ROText
        value={p.jumlahPenghuni != null ? `${p.jumlahPenghuni} orang` : null}
      />
    </ROField>
    <ROField label="Standar Pemasangan">
      <ROText
        value={
          p.standar === true
            ? "Standar"
            : p.standar === false
              ? "Tidak Standar"
              : null
        }
      />
    </ROField>
    <ROField label="Catatan">
      <ROText value={p.catatan} />
    </ROField>
  </div>
);

const ReadOnlyRab: React.FC<{ p: IProgresData }> = ({ p }) => (
  <div className="space-y-3">
    <ROField label="Total Biaya">
      <ROText
        value={
          p.totalBiaya != null
            ? `Rp ${p.totalBiaya.toLocaleString("id-ID")}`
            : null
        }
      />
    </ROField>
    <ROField label="Dokumen RAB">
      <ROImage url={p.urlRab} alt="Dokumen RAB" />
    </ROField>
    <ROField label="Catatan">
      <ROText value={p.catatan} />
    </ROField>
  </div>
);

const ReadOnlyPemasangan: React.FC<{ p: IProgresData }> = ({ p }) => (
  <div className="space-y-3">
    <ROField label="Seri Meteran">
      <ROText value={p.seriMeteran} />
    </ROField>
    <ROField label="Foto Rumah">
      <ROImage url={p.fotoRumah} alt="Foto Rumah" />
    </ROField>
    <ROField label="Foto Meteran">
      <ROImage url={p.fotoMeteran} alt="Foto Meteran" />
    </ROField>
    <ROField label="Foto Meteran &amp; Rumah">
      <ROImage url={p.fotoMeteranDanRumah} alt="Foto Meteran dan Rumah" />
    </ROField>
    <ROField label="Catatan">
      <ROText value={p.catatan} />
    </ROField>
  </div>
);

const ReadOnlyPengawasan: React.FC<{ p: IProgresData }> = ({ p }) => (
  <div className="space-y-3">
    <ROField label="Foto Bukti">
      {p.urlGambar && p.urlGambar.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {p.urlGambar.map((url: string, i: number) => (
            <div
              key={i}
              className="relative aspect-square rounded-lg overflow-hidden border border-grey-stroke"
            >
              <Image
                src={url}
                alt={`Foto ${i + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1">
                <p className="text-[10px] text-white">{i + 1}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-grey italic">Tidak ada foto</p>
      )}
    </ROField>
    <ROField label="Catatan">
      <ROText value={p.catatan} />
    </ROField>
  </div>
);

// ─── Read-only wrapper (dikirim / selesai) ────────────────────────────────────

const ReadOnlyProgresView: React.FC<{
  workOrder: IWorkOrder;
  progres: IProgresData;
}> = ({ workOrder, progres }) => {
  const isDikirim = workOrder.status === "dikirim";
  const isSelesai = workOrder.status === "selesai";

  return (
    <div className="bg-white rounded-xl border border-grey-stroke p-4">
      <h3 className="text-sm font-semibold text-neutral-03 mb-3">Pengerjaan</h3>

      {/* Status banner */}
      {isDikirim && (
        <div className="mb-4 p-3 rounded-lg bg-purple-50 border border-purple-200">
          <p className="text-xs font-medium text-purple-800">
            Hasil pekerjaan sudah dikirim — menunggu review admin.
          </p>
        </div>
      )}
      {isSelesai && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-xs font-medium text-green-800">
            Pekerjaan telah disetujui dan selesai.
          </p>
        </div>
      )}

      {/* Data read-only */}
      {progres.jenisPekerjaan === "survei" && <ReadOnlySurvei p={progres} />}
      {progres.jenisPekerjaan === "rab" && <ReadOnlyRab p={progres} />}
      {progres.jenisPekerjaan === "pemasangan" && (
        <ReadOnlyPemasangan p={progres} />
      )}
      {(progres.jenisPekerjaan === "pengawasan_pemasangan" ||
        progres.jenisPekerjaan === "pengawasan_setelah_pemasangan" ||
        progres.jenisPekerjaan === "penyelesaian_laporan") && (
        <ReadOnlyPengawasan p={progres} />
      )}
    </div>
  );
};

// ─── Payload builder — mapping form → JSON string sesuai model backend ────────

function buildPayload(
  jenisPekerjaan: JenisPekerjaan,
  survei: SurveiData,
  rab: RabData,
  pemasangan: PemasanganData,
  pengawasan: PengawasanData,
): Record<string, unknown> {
  const nullable = (v: string) => v.trim() || null;
  const numOrNull = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };
  const intOrNull = (v: string) => {
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  };

  switch (jenisPekerjaan) {
    case "survei": {
      const hasKoordinat =
        survei.koordinat.longitude.trim() && survei.koordinat.latitude.trim();
      return {
        koordinat: hasKoordinat
          ? {
              longitude: parseFloat(survei.koordinat.longitude),
              latitude: parseFloat(survei.koordinat.latitude),
            }
          : null,
        urlJaringan: nullable(survei.urlJaringan),
        diameterPipa: numOrNull(survei.diameterPipa),
        urlPosisiBak: nullable(survei.urlPosisiBak),
        posisiMeteran: nullable(survei.posisiMeteran),
        jumlahPenghuni: intOrNull(survei.jumlahPenghuni),
        standar: survei.standar,
        catatan: nullable(survei.catatan),
      };
    }
    case "rab":
      return {
        totalBiaya: numOrNull(rab.totalBiaya),
        urlRab: nullable(rab.urlRab),
        catatan: nullable(rab.catatan),
      };
    case "pemasangan":
      return {
        seriMeteran: nullable(pemasangan.seriMeteran),
        fotoRumah: nullable(pemasangan.fotoRumah),
        fotoMeteran: nullable(pemasangan.fotoMeteran),
        fotoMeteranDanRumah: nullable(pemasangan.fotoMeteranDanRumah),
        catatan: nullable(pemasangan.catatan),
      };
    case "pengawasan_pemasangan":
    case "pengawasan_setelah_pemasangan":
    case "penyelesaian_laporan":
      return {
        urlGambar:
          pengawasan.urlGambar.length > 0 ? pengawasan.urlGambar : null,
        catatan: nullable(pengawasan.catatan),
      };
    default:
      return {};
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PengerjaanSection: React.FC<PengerjaanSectionProps> = ({ workOrder }) => {
  // ─── Offline pending files ─────────────────────────────────────────────────
  const { isOnline, refreshCount } = useOfflineSyncContext();
  const [pendingFilesMap, setPendingFilesMap] = useState<
    Map<string, PendingFileEntry>
  >(new Map());

  const pendingFilesCtxValue: PendingFilesContextValue = {
    addPendingFile: useCallback((fieldKey: string, entry: PendingFileEntry) => {
      setPendingFilesMap((prev) => new Map(prev).set(fieldKey, entry));
    }, []),
    removePendingFile: useCallback((fieldKey: string) => {
      setPendingFilesMap((prev) => {
        const next = new Map(prev);
        const entry = next.get(fieldKey);
        if (entry?.previewUrl?.startsWith("blob:"))
          URL.revokeObjectURL(entry.previewUrl);
        next.delete(fieldKey);
        return next;
      });
    }, []),
    getPendingPreviewUrl: useCallback(
      (fieldKey: string) => {
        return pendingFilesMap.get(fieldKey)?.previewUrl ?? null;
      },
      [pendingFilesMap],
    ),
  };

  // ─── Form state ────────────────────────────────────────────────────────────
  const [surveiData, setSurveiData] = useState<SurveiData>({
    koordinat: { longitude: "", latitude: "" },
    urlJaringan: "",
    diameterPipa: "",
    urlPosisiBak: "",
    posisiMeteran: "",
    jumlahPenghuni: "",
    standar: null,
    catatan: "",
  });

  const [rabData, setRabData] = useState<RabData>({
    totalBiaya: "",
    urlRab: "",
    catatan: "",
  });

  const [pemasanganData, setPemasanganData] = useState<PemasanganData>({
    seriMeteran: "",
    fotoRumah: "",
    fotoMeteran: "",
    fotoMeteranDanRumah: "",
    catatan: "",
  });

  const [pengawasanData, setPengawasanData] = useState<PengawasanData>({
    urlGambar: [],
    catatan: "",
  });

  // ─── Pre-fill dari data progres tersimpan ─────────────────────────────────
  const { data: progresResult, isLoading: progresLoading } =
    useProgresWorkOrder(workOrder.id);

  useEffect(() => {
    const progres = progresResult?.progresWorkOrder;
    if (!progres) return;

    if (progres.jenisPekerjaan === "survei") {
      setSurveiData({
        koordinat: {
          longitude: progres.koordinat?.longitude?.toString() ?? "",
          latitude: progres.koordinat?.latitude?.toString() ?? "",
        },
        urlJaringan: progres.urlJaringan ?? "",
        diameterPipa: progres.diameterPipa?.toString() ?? "",
        urlPosisiBak: progres.urlPosisiBak ?? "",
        posisiMeteran: progres.posisiMeteran ?? "",
        jumlahPenghuni: progres.jumlahPenghuni?.toString() ?? "",
        standar: progres.standar ?? null,
        catatan: progres.catatan ?? "",
      });
    } else if (progres.jenisPekerjaan === "rab") {
      setRabData({
        totalBiaya: progres.totalBiaya?.toString() ?? "",
        urlRab: progres.urlRab ?? "",
        catatan: progres.catatan ?? "",
      });
    } else if (progres.jenisPekerjaan === "pemasangan") {
      setPemasanganData({
        seriMeteran: progres.seriMeteran ?? "",
        fotoRumah: progres.fotoRumah ?? "",
        fotoMeteran: progres.fotoMeteran ?? "",
        fotoMeteranDanRumah: progres.fotoMeteranDanRumah ?? "",
        catatan: progres.catatan ?? "",
      });
    } else {
      setPengawasanData({
        urlGambar: progres.urlGambar ?? [],
        catatan: progres.catatan ?? "",
      });
    }
  }, [progresResult]);

  // ─────────────────────────────────────────────────────────────────────────

  const simpanProgresMutation = useSimpanProgres();
  const kirimHasilMutation = useKirimHasil();
  const isLoading =
    simpanProgresMutation.isPending || kirimHasilMutation.isPending;

  const canWork = ["ditugaskan", "sedang_dikerjakan", "revisi"].includes(
    workOrder.status,
  );
  const canSubmit = ["sedang_dikerjakan", "revisi"].includes(workOrder.status);
  const isReadOnly =
    workOrder.status === "dikirim" || workOrder.status === "selesai";

  if (!canWork && !isReadOnly) return null;

  if (progresLoading) {
    return (
      <div className="bg-white rounded-xl border border-grey-stroke p-4">
        <h3 className="text-sm font-semibold text-neutral-03 mb-3">
          Pengerjaan
        </h3>
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-moss-stone border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-neutral-03">
            Memuat data pengerjaan...
          </span>
        </div>
      </div>
    );
  }

  // Tampilkan read-only view ketika sudah dikirim atau selesai
  if (isReadOnly) {
    const progres = progresResult?.progresWorkOrder;
    if (!progres) {
      return (
        <div className="bg-white rounded-xl border border-grey-stroke p-4">
          <h3 className="text-sm font-semibold text-neutral-03 mb-3">
            Pengerjaan
          </h3>
          <div
            className={`p-3 rounded-lg ${workOrder.status === "selesai" ? "bg-green-50 border border-green-200" : "bg-purple-50 border border-purple-200"}`}
          >
            <p
              className={`text-xs font-medium ${workOrder.status === "selesai" ? "text-green-800" : "text-purple-800"}`}
            >
              {workOrder.status === "selesai"
                ? " Pekerjaan telah disetujui dan selesai."
                : " Hasil pekerjaan sudah dikirim — menunggu review admin."}
            </p>
          </div>
          <p className="text-xs text-grey mt-3">
            Data pengerjaan tidak tersedia.
          </p>
        </div>
      );
    }
    return <ReadOnlyProgresView workOrder={workOrder} progres={progres} />;
  }

  const getPayload = () =>
    buildPayload(
      workOrder.jenisPekerjaan,
      surveiData,
      rabData,
      pemasanganData,
      pengawasanData,
    );

  // ─── Helper: queue ke offline IndexedDB ─────────────────────────────────────
  const queueOffline = async (type: PendingItemType) => {
    const payload = getPayload();

    // Untuk field yang masih blob URL (offline pending), ganti ke null
    // supaya payload bisa di-serialize dan nanti diisi URL real saat sync
    const cleanPayload = JSON.parse(
      JSON.stringify(payload, (_, v) =>
        typeof v === "string" && v.startsWith("blob:") ? null : v,
      ),
    ) as Record<string, unknown>;

    // Kumpulkan semua pending image refs
    const pendingImages: PendingImageRef[] = Array.from(
      pendingFilesMap.entries(),
    ).map(([fieldKey, entry]) => ({
      fieldKey,
      file: entry.file,
      cloudinaryFolder: entry.cloudinaryFolder,
      tags: entry.tags,
    }));

    await addPendingItem({
      workOrderId: workOrder.id,
      jenisPekerjaan: workOrder.jenisPekerjaan,
      progresPayload: cleanPayload,
      pendingImages,
      type,
    });

    // Reset pending files
    pendingFilesMap.forEach((entry) => {
      if (entry.previewUrl?.startsWith("blob:"))
        URL.revokeObjectURL(entry.previewUrl);
    });
    setPendingFilesMap(new Map());
    await refreshCount();
  };

  const handleSimpanProgres = async () => {
    // Offline atau ada pending files? → queue ke IndexedDB
    if (!isOnline || pendingFilesMap.size > 0) {
      try {
        await queueOffline("simpan_progres");
        showToast.info(
          "📴 Data disimpan offline. Akan diupload saat ada koneksi.",
        );
      } catch (err) {
        showErrorToast(err);
      }
      return;
    }
    try {
      const result = await simpanProgresMutation.mutateAsync({
        input: {
          workOrderId: workOrder.id,
          data: JSON.stringify(getPayload()),
        },
      });
      showToast.success(result.simpanProgres.message);
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleKirimHasil = async () => {
    const jenis = workOrder.jenisPekerjaan;
    if (
      (jenis === "pengawasan_pemasangan" ||
        jenis === "pengawasan_setelah_pemasangan" ||
        jenis === "penyelesaian_laporan") &&
      pengawasanData.urlGambar.length === 0
    ) {
      showToast.warning("Upload minimal satu foto bukti pekerjaan");
      return;
    }
    // Offline atau ada pending files? → queue dengan type kirim_hasil
    if (!isOnline || pendingFilesMap.size > 0) {
      try {
        await queueOffline("kirim_hasil");
        showToast.info(
          "📴 Data & pengiriman hasil disimpan offline. Akan diproses saat ada koneksi.",
        );
      } catch (err) {
        showErrorToast(err);
      }
      return;
    }
    try {
      await simpanProgresMutation.mutateAsync({
        input: {
          workOrderId: workOrder.id,
          data: JSON.stringify(getPayload()),
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
    <PendingFilesContext.Provider value={pendingFilesCtxValue}>
      <div className="bg-white rounded-xl border border-grey-stroke p-4">
        <h3 className="text-sm font-semibold text-neutral-03 mb-3">
          Pengerjaan
        </h3>

        {/* Offline pending banner */}
        {pendingFilesMap.size > 0 && (
          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
            <span className="text-amber-600 text-sm">📴</span>
            <p className="text-xs text-amber-800 font-medium">
              {pendingFilesMap.size} foto tersimpan offline — klik &quot;Simpan
              Draft&quot; untuk mengantri upload
            </p>
          </div>
        )}

        {canWork && (
          <>
            {/* Revisi info */}
            {workOrder.status === "revisi" && workOrder.catatanReview && (
              <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <p className="text-xs font-medium text-orange-800">
                  Catatan Revisi dari Admin:
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  {workOrder.catatanReview}
                </p>
              </div>
            )}

            {/* Form dinamis sesuai jenis pekerjaan */}
            <div className="mb-4">
              {workOrder.jenisPekerjaan === "survei" && (
                <FormSurvei
                  data={surveiData}
                  onChange={setSurveiData}
                  workOrderId={workOrder.id}
                />
              )}
              {workOrder.jenisPekerjaan === "rab" && (
                <FormRab
                  data={rabData}
                  onChange={setRabData}
                  workOrderId={workOrder.id}
                />
              )}
              {workOrder.jenisPekerjaan === "pemasangan" && (
                <FormPemasangan
                  data={pemasanganData}
                  onChange={setPemasanganData}
                  workOrderId={workOrder.id}
                />
              )}
              {(workOrder.jenisPekerjaan === "pengawasan_pemasangan" ||
                workOrder.jenisPekerjaan === "pengawasan_setelah_pemasangan" ||
                workOrder.jenisPekerjaan === "penyelesaian_laporan") && (
                <FormPengawasan
                  data={pengawasanData}
                  onChange={setPengawasanData}
                  workOrderId={workOrder.id}
                  jenisPekerjaan={workOrder.jenisPekerjaan}
                />
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
                  : !isOnline
                    ? "Simpan Offline"
                    : "Simpan Draft"}
              </button>
              {canSubmit && (
                <button
                  type="button"
                  onClick={handleKirimHasil}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-moss-stone text-white text-sm font-medium hover:bg-moss-stone/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {kirimHasilMutation.isPending
                    ? "Mengirim..."
                    : !isOnline
                      ? "Antri Kirim (Offline)"
                      : "Kirim Hasil"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </PendingFilesContext.Provider>
  );
};

export default PengerjaanSection;

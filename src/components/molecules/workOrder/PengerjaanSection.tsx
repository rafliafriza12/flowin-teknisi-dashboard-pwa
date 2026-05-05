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

// Map rute teknisi (Leaflet, hanya browser)
const MapRuteTeknisi = dynamic(
  () => import("@/components/molecules/workOrder/MapRuteTeknisi"),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-xl bg-gray-100 border border-grey-stroke flex items-center justify-center"
        style={{ height: "280px" }}
      >
        <p className="text-xs text-grey">Memuat peta rute...</p>
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

interface MaintenanceData {
  kondisiSebelumDaya: "menyala" | "mati" | "";
  kondisiSebelumKoneksi: "terkoneksi" | "tidak_terkoneksi" | "";
  fotoSebelum: string[];
  kondisiSetelahDaya: "menyala" | "mati" | "";
  kondisiSetelahKoneksi: "terkoneksi" | "tidak_terkoneksi" | "";
  fotoSetelah: string[];
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

// ─── Image Preview Context ─────────────────────────────────────────────────

const PreviewContext = createContext<(url: string) => void>(() => {});

function usePreview() {
  return useContext(PreviewContext);
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
          (progress) => setUploadProgress(progress.percentage),
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
  const openPreview = usePreview();
  return (
    <div>
      {currentUrl ? (
        <div
          className="relative w-full aspect-4/3 rounded-lg overflow-hidden border border-grey-stroke group cursor-pointer"
          onClick={() => openPreview(currentUrl)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && openPreview(currentUrl)}
          aria-label="Lihat foto"
        >
          <Image src={currentUrl} alt={label} fill className="object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors pointer-events-none" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            x
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
              accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
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

// ─── PDF → Image converter ────────────────────────────────────────────────────

async function convertPdfToImage(file: File): Promise<File> {
  const pdfjsLib = await import("pdfjs-dist");
  // pdfjs-dist v4 — worker via CDN agar MIME type & CORS selalu benar
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
    .promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx2d = canvas.getContext("2d");
  if (!ctx2d) throw new Error("Tidak dapat membuat canvas context");
  await page.render({ canvasContext: ctx2d, viewport }).promise;
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Gagal mengkonversi PDF ke gambar"));
          return;
        }
        resolve(
          new File([blob], file.name.replace(/\.pdf$/i, ".jpg"), {
            type: "image/jpeg",
          }),
        );
      },
      "image/jpeg",
      0.92,
    );
  });
}

// Konversi semua halaman PDF ke array File JPEG (satu File per halaman)
async function convertPdfToImages(file: File): Promise<File[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
    .promise;
  console.log("[convertPdfToImages] numPages =", pdf.numPages);
  const baseName = file.name.replace(/\.pdf$/i, "");
  const result: File[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) throw new Error("Tidak dapat membuat canvas context");
    await page.render({ canvasContext: ctx2d, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) {
            reject(new Error(`Gagal mengkonversi halaman ${pageNum}`));
            return;
          }
          resolve(b);
        },
        "image/jpeg",
        0.92,
      );
    });
    const fileName =
      pdf.numPages === 1 ? `${baseName}.jpg` : `${baseName}_p${pageNum}.jpg`;
    const imgFile = new File([blob], fileName, { type: "image/jpeg" });
    console.log(
      `[convertPdfToImages] page ${pageNum}: ${imgFile.name}, size=${imgFile.size}`,
    );
    result.push(imgFile);
  }
  console.log("[convertPdfToImages] total files:", result.length);
  return result;
}

/**
 * Tangani upload gambar dengan deteksi offline.
 * Jika file adalah PDF, konversi ke gambar terlebih dahulu.
 * Jika offline: simpan file sebagai pending, kembalikan blob URL untuk preview.
 * Jika online: upload ke Cloudinary, kembalikan URL.
 */
async function handleFileOfflineAware(
  rawFile: File,
  fieldKey: string,
  folder: string,
  tags: string[],
  uploadFn: (file: File, tags: string[]) => Promise<string | null>,
  pendingFilesCtx: PendingFilesContextValue,
): Promise<string | null> {
  let file = rawFile;
  if (rawFile.type === "application/pdf") {
    if (!navigator.onLine) {
      showToast.warning(
        "Konversi PDF tidak tersedia saat offline. Gunakan foto langsung.",
      );
      return null;
    }
    try {
      file = await convertPdfToImage(rawFile);
    } catch (err) {
      console.error("[PDF Conversion Error]", err);
      showErrorToast(
        err instanceof Error
          ? err
          : new Error("Gagal mengkonversi PDF ke gambar"),
      );
      return null;
    }
  }
  if (!navigator.onLine) {
    const previewUrl = URL.createObjectURL(file);
    pendingFilesCtx.addPendingFile(fieldKey, {
      file,
      previewUrl,
      cloudinaryFolder: folder,
      tags,
    });
    showToast.info("Offline: foto disimpan, akan diupload saat online");
    return previewUrl;
  }
  return uploadFn(file, tags);
}

// ─── Image Preview Modal ──────────────────────────────────────────────────────

const ImagePreviewModal: React.FC<{
  url: string | null;
  onClose: () => void;
}> = ({ url, onClose }) => {
  useEffect(() => {
    if (!url) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] overflow-auto rounded-lg bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-black/80"
        >
          x
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Preview"
          className="max-w-full max-h-[85vh] object-contain block"
        />
      </div>
    </div>
  );
};

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
  const openPreview = usePreview();
  const {
    uploading,
    uploadProgress,
    fileInputRef,
    cameraInputRef,
    cancelUpload,
    uploadFile,
  } = useImageUpload(`flowin-teknisi/${jenisPekerjaan}`);

  const [processing, setProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    // PDF: konversi semua halaman, upload satu per satu
    if (file.type === "application/pdf") {
      if (!navigator.onLine) {
        showToast.warning(
          "Konversi PDF tidak tersedia saat offline. Gunakan foto langsung.",
        );
        return;
      }
      setProcessing(true);
      try {
        const imageFiles = await convertPdfToImages(file);
        console.log(
          "[handleFileChange] imageFiles.length =",
          imageFiles.length,
        );
        const baseIdx = data.urlGambar.length;
        const newUrls: string[] = [];
        for (let i = 0; i < imageFiles.length; i++) {
          console.log(
            "[handleFileChange] uploading page",
            i + 1,
            "of",
            imageFiles.length,
          );
          const url = await handleFileOfflineAware(
            imageFiles[i],
            `urlGambar_${baseIdx + i}`,
            `flowin-teknisi/${jenisPekerjaan}`,
            ["work-order", jenisPekerjaan, workOrderId],
            (f, t) => uploadFile(f, t),
            pendingCtx,
          );
          console.log("[handleFileChange] page", i + 1, "url =", url);
          if (url) newUrls.push(url);
        }
        console.log("[handleFileChange] final newUrls =", newUrls);
        if (newUrls.length > 0)
          onChange({ ...data, urlGambar: [...data.urlGambar, ...newUrls] });
      } catch (err) {
        console.error("[PDF Conversion Error]", err);
        showErrorToast(
          err instanceof Error ? err : new Error("Gagal mengkonversi PDF"),
        );
      } finally {
        setProcessing(false);
      }
      return;
    }

    // Gambar biasa
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
              className="relative aspect-square rounded-lg overflow-hidden border border-grey-stroke group cursor-pointer"
              onClick={() => openPreview(url)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openPreview(url)}
              aria-label={`Lihat foto ${index + 1}`}
            >
              <Image
                src={url}
                alt={`Gambar ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeGambar(index);
                }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                x
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 pointer-events-none">
                <p className="text-[10px] text-white">{index + 1}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {processing ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-grey-stroke bg-gray-50">
          <div className="w-5 h-5 border-2 border-moss-stone border-t-transparent rounded-full animate-spin shrink-0" />
          <p className="text-xs text-neutral-03 flex-1">Mengkonversi PDF...</p>
        </div>
      ) : uploading ? (
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
              accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
            Galeri ({data.urlGambar.length} foto)
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

// ─── Form Maintenance (Pemeliharaan Smart Water Meter) ───────────────────────
// Fields: kondisi sebelum (daya, koneksi, foto[]), kondisi setelah (idem), catatan
// Plus peta rute teknisi ke lokasi pekerjaan (jika koordinatLokasi tersedia)

const FormMaintenance: React.FC<{
  data: MaintenanceData;
  onChange: (data: MaintenanceData) => void;
  workOrderId: string;
  koordinatLokasi?: { longitude: number; latitude: number } | null;
}> = ({ data, onChange, workOrderId, koordinatLokasi }) => {
  const pendingCtx = usePendingFiles();
  const openPreview = usePreview();
  const sebelumUpload = useImageUpload("flowin-teknisi/maintenance");
  const setelahUpload = useImageUpload("flowin-teknisi/maintenance");

  const set = <K extends keyof MaintenanceData>(
    key: K,
    value: MaintenanceData[K],
  ) => onChange({ ...data, [key]: value });

  const [processing, setProcessing] = useState(false);

  // ─── Helper: upload multi-page PDF untuk satu array foto ─────────────────
  const uploadPdfPages = async (
    file: File,
    currentUrls: string[],
    fieldKeyPrefix: string,
    folder: string,
    tags: string[],
    uploadFn: (f: File, t: string[]) => Promise<string | null>,
  ): Promise<string[]> => {
    const imageFiles = await convertPdfToImages(file);
    const baseIdx = currentUrls.length;
    const newUrls: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const url = await handleFileOfflineAware(
        imageFiles[i],
        `${fieldKeyPrefix}_${baseIdx + i}`,
        folder,
        tags,
        uploadFn,
        pendingCtx,
      );
      if (url) newUrls.push(url);
    }
    return newUrls;
  };

  // ─── Handler foto sebelum ────────────────────────────────────────────────
  const handleFotoSebelumChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.type === "application/pdf") {
      if (!navigator.onLine) {
        showToast.warning(
          "Konversi PDF tidak tersedia saat offline. Gunakan foto langsung.",
        );
        return;
      }
      setProcessing(true);
      try {
        const newUrls = await uploadPdfPages(
          file,
          data.fotoSebelum,
          "fotoSebelum",
          "flowin-teknisi/maintenance",
          ["work-order", "maintenance", workOrderId, "sebelum"],
          (f, t) => sebelumUpload.uploadFile(f, t),
        );
        if (newUrls.length > 0)
          set("fotoSebelum", [...data.fotoSebelum, ...newUrls]);
      } catch (err) {
        console.error("[PDF Conversion Error]", err);
        showErrorToast(
          err instanceof Error ? err : new Error("Gagal mengkonversi PDF"),
        );
      } finally {
        setProcessing(false);
      }
      return;
    }

    const nextIdx = data.fotoSebelum.length;
    const url = await handleFileOfflineAware(
      file,
      `fotoSebelum_${nextIdx}`,
      "flowin-teknisi/maintenance",
      ["work-order", "maintenance", workOrderId, "sebelum"],
      (f, t) => sebelumUpload.uploadFile(f, t),
      pendingCtx,
    );
    if (url) set("fotoSebelum", [...data.fotoSebelum, url]);
  };

  const removeFotoSebelum = (index: number) => {
    const url = data.fotoSebelum[index];
    if (url?.startsWith("blob:")) {
      pendingCtx.removePendingFile(`fotoSebelum_${index}`);
      URL.revokeObjectURL(url);
    }
    set(
      "fotoSebelum",
      data.fotoSebelum.filter((_, i) => i !== index),
    );
  };

  // ─── Handler foto setelah ────────────────────────────────────────────────
  const handleFotoSetelahChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.type === "application/pdf") {
      if (!navigator.onLine) {
        showToast.warning(
          "Konversi PDF tidak tersedia saat offline. Gunakan foto langsung.",
        );
        return;
      }
      setProcessing(true);
      try {
        const newUrls = await uploadPdfPages(
          file,
          data.fotoSetelah,
          "fotoSetelah",
          "flowin-teknisi/maintenance",
          ["work-order", "maintenance", workOrderId, "setelah"],
          (f, t) => setelahUpload.uploadFile(f, t),
        );
        if (newUrls.length > 0)
          set("fotoSetelah", [...data.fotoSetelah, ...newUrls]);
      } catch (err) {
        console.error("[PDF Conversion Error]", err);
        showErrorToast(
          err instanceof Error ? err : new Error("Gagal mengkonversi PDF"),
        );
      } finally {
        setProcessing(false);
      }
      return;
    }

    const nextIdx = data.fotoSetelah.length;
    const url = await handleFileOfflineAware(
      file,
      `fotoSetelah_${nextIdx}`,
      "flowin-teknisi/maintenance",
      ["work-order", "maintenance", workOrderId, "setelah"],
      (f, t) => setelahUpload.uploadFile(f, t),
      pendingCtx,
    );
    if (url) set("fotoSetelah", [...data.fotoSetelah, url]);
  };

  const removeFotoSetelah = (index: number) => {
    const url = data.fotoSetelah[index];
    if (url?.startsWith("blob:")) {
      pendingCtx.removePendingFile(`fotoSetelah_${index}`);
      URL.revokeObjectURL(url);
    }
    set(
      "fotoSetelah",
      data.fotoSetelah.filter((_, i) => i !== index),
    );
  };

  const radioClass =
    "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors";
  const radioActiveClass =
    "border-moss-stone bg-moss-stone/10 text-moss-stone font-medium";
  const radioInactiveClass =
    "border-grey-stroke text-grey hover:border-moss-stone/50";

  return (
    <div className="space-y-5">
      {/* ─── Peta Rute ─────────────────────────────────────────────────── */}
      {koordinatLokasi && (
        <div>
          <p className="text-xs font-semibold text-neutral-03 mb-2">
            Rute ke Lokasi Pekerjaan
          </p>
          <MapRuteTeknisi koordinatTujuan={koordinatLokasi} />
        </div>
      )}

      {/* ─── Kondisi Sebelum ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-neutral-03 uppercase tracking-wide border-b border-grey-stroke pb-1">
          Kondisi Sebelum Pemeliharaan
        </p>

        {/* Daya */}
        <div>
          <label className="text-xs font-medium text-neutral-03 mb-2 block">
            Status Daya
          </label>
          <div className="flex gap-2">
            {(["menyala", "mati"] as const).map((val) => (
              <label
                key={val}
                className={`${radioClass} flex-1 justify-center ${data.kondisiSebelumDaya === val ? radioActiveClass : radioInactiveClass}`}
              >
                <input
                  type="radio"
                  name="kondisiSebelumDaya"
                  value={val}
                  checked={data.kondisiSebelumDaya === val}
                  onChange={() => set("kondisiSebelumDaya", val)}
                  className="sr-only"
                />
                {val === "menyala" ? "Menyala" : "Mati"}
              </label>
            ))}
          </div>
        </div>

        {/* Koneksi */}
        <div>
          <label className="text-xs font-medium text-neutral-03 mb-2 block">
            Status Koneksi
          </label>
          <div className="flex gap-2">
            {(["terkoneksi", "tidak_terkoneksi"] as const).map((val) => (
              <label
                key={val}
                className={`${radioClass} flex-1 justify-center ${data.kondisiSebelumKoneksi === val ? radioActiveClass : radioInactiveClass}`}
              >
                <input
                  type="radio"
                  name="kondisiSebelumKoneksi"
                  value={val}
                  checked={data.kondisiSebelumKoneksi === val}
                  onChange={() => set("kondisiSebelumKoneksi", val)}
                  className="sr-only"
                />
                {val === "terkoneksi" ? "Terkoneksi" : "Tidak Terkoneksi"}
              </label>
            ))}
          </div>
        </div>

        {/* Foto Sebelum */}
        <div>
          <label className="text-xs font-medium text-neutral-03 mb-2 block">
            Foto Kondisi Sebelum
          </label>
          {data.fotoSebelum.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {data.fotoSebelum.map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden border border-grey-stroke group cursor-pointer"
                  onClick={() => openPreview(url)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && openPreview(url)}
                  aria-label={`Lihat foto sebelum ${i + 1}`}
                >
                  <Image
                    src={url}
                    alt={`Sebelum ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFotoSebelum(i);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    x
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 pointer-events-none">
                    <p className="text-[10px] text-white">{i + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {processing ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-grey-stroke bg-gray-50">
              <div className="w-5 h-5 border-2 border-moss-stone border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-xs text-neutral-03 flex-1">
                Mengkonversi PDF...
              </p>
            </div>
          ) : sebelumUpload.uploading ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-grey-stroke bg-gray-50">
              <CircularProgress
                progress={sebelumUpload.uploadProgress}
                size={36}
                strokeWidth={3}
              />
              <p className="text-xs text-neutral-03 flex-1">
                Mengunggah foto sebelum...
              </p>
              <button
                type="button"
                onClick={sebelumUpload.cancelUpload}
                className="px-2 py-1 rounded border border-grey-stroke text-xs text-neutral-03 hover:bg-gray-100"
              >
                Batal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-center gap-1.5 w-full p-2.5 rounded-lg border-2 border-dashed border-grey-stroke hover:border-moss-stone hover:bg-moss-stone/5 transition-colors text-xs text-grey cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  capture="environment"
                  onChange={handleFotoSebelumChange}
                  className="sr-only"
                />
                Kamera
              </label>
              <label className="flex items-center justify-center gap-1.5 w-full p-2.5 rounded-lg border-2 border-dashed border-grey-stroke hover:border-moss-stone hover:bg-moss-stone/5 transition-colors text-xs text-grey cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                  onChange={handleFotoSebelumChange}
                  className="sr-only"
                />
                Galeri ({data.fotoSebelum.length})
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ─── Kondisi Setelah ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-neutral-03 uppercase tracking-wide border-b border-grey-stroke pb-1">
          Kondisi Setelah Pemeliharaan
        </p>

        {/* Daya */}
        <div>
          <label className="text-xs font-medium text-neutral-03 mb-2 block">
            Status Daya
          </label>
          <div className="flex gap-2">
            {(["menyala", "mati"] as const).map((val) => (
              <label
                key={val}
                className={`${radioClass} flex-1 justify-center ${data.kondisiSetelahDaya === val ? radioActiveClass : radioInactiveClass}`}
              >
                <input
                  type="radio"
                  name="kondisiSetelahDaya"
                  value={val}
                  checked={data.kondisiSetelahDaya === val}
                  onChange={() => set("kondisiSetelahDaya", val)}
                  className="sr-only"
                />
                {val === "menyala" ? "Menyala" : "Mati"}
              </label>
            ))}
          </div>
        </div>

        {/* Koneksi */}
        <div>
          <label className="text-xs font-medium text-neutral-03 mb-2 block">
            Status Koneksi
          </label>
          <div className="flex gap-2">
            {(["terkoneksi", "tidak_terkoneksi"] as const).map((val) => (
              <label
                key={val}
                className={`${radioClass} flex-1 justify-center ${data.kondisiSetelahKoneksi === val ? radioActiveClass : radioInactiveClass}`}
              >
                <input
                  type="radio"
                  name="kondisiSetelahKoneksi"
                  value={val}
                  checked={data.kondisiSetelahKoneksi === val}
                  onChange={() => set("kondisiSetelahKoneksi", val)}
                  className="sr-only"
                />
                {val === "terkoneksi" ? "Terkoneksi" : "Tidak Terkoneksi"}
              </label>
            ))}
          </div>
        </div>

        {/* Foto Setelah */}
        <div>
          <label className="text-xs font-medium text-neutral-03 mb-2 block">
            Foto Kondisi Setelah
          </label>
          {data.fotoSetelah.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {data.fotoSetelah.map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden border border-grey-stroke group cursor-pointer"
                  onClick={() => openPreview(url)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && openPreview(url)}
                  aria-label={`Lihat foto setelah ${i + 1}`}
                >
                  <Image
                    src={url}
                    alt={`Setelah ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFotoSetelah(i);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    x
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 pointer-events-none">
                    <p className="text-[10px] text-white">{i + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {processing ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-grey-stroke bg-gray-50">
              <div className="w-5 h-5 border-2 border-moss-stone border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-xs text-neutral-03 flex-1">
                Mengkonversi PDF...
              </p>
            </div>
          ) : setelahUpload.uploading ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-grey-stroke bg-gray-50">
              <CircularProgress
                progress={setelahUpload.uploadProgress}
                size={36}
                strokeWidth={3}
              />
              <p className="text-xs text-neutral-03 flex-1">
                Mengunggah foto setelah...
              </p>
              <button
                type="button"
                onClick={setelahUpload.cancelUpload}
                className="px-2 py-1 rounded border border-grey-stroke text-xs text-neutral-03 hover:bg-gray-100"
              >
                Batal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-center gap-1.5 w-full p-2.5 rounded-lg border-2 border-dashed border-grey-stroke hover:border-moss-stone hover:bg-moss-stone/5 transition-colors text-xs text-grey cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  capture="environment"
                  onChange={handleFotoSetelahChange}
                  className="sr-only"
                />
                Kamera
              </label>
              <label className="flex items-center justify-center gap-1.5 w-full p-2.5 rounded-lg border-2 border-dashed border-grey-stroke hover:border-moss-stone hover:bg-moss-stone/5 transition-colors text-xs text-grey cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                  onChange={handleFotoSetelahChange}
                  className="sr-only"
                />
                Galeri ({data.fotoSetelah.length})
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ─── Catatan ─────────────────────────────────────────────────────── */}
      <div>
        <label className="text-xs font-medium text-neutral-03 mb-1 block">
          Catatan
        </label>
        <textarea
          rows={3}
          placeholder="Catatan pemeliharaan..."
          value={data.catatan}
          onChange={(e) => set("catatan", e.target.value)}
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
  const openPreview = usePreview();
  if (!url) return <p className="text-sm text-grey italic">Tidak ada foto</p>;
  return (
    <div
      className="relative w-full aspect-4/3 rounded-lg overflow-hidden border border-grey-stroke cursor-pointer group"
      onClick={() => openPreview(url)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && openPreview(url)}
      aria-label="Lihat foto"
    >
      <Image src={url} alt={alt} fill className="object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />
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

const ReadOnlyPengawasan: React.FC<{ p: IProgresData }> = ({ p }) => {
  const openPreview = usePreview();
  return (
    <div className="space-y-3">
      <ROField label="Foto Bukti">
        {p.urlGambar && p.urlGambar.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {p.urlGambar.map((url: string, i: number) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg overflow-hidden border border-grey-stroke cursor-pointer group"
                onClick={() => openPreview(url)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && openPreview(url)}
                aria-label={`Lihat foto ${i + 1}`}
              >
                <Image
                  src={url}
                  alt={`Foto ${i + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 pointer-events-none">
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
};

const ReadOnlyMaintenance: React.FC<{ p: IProgresData }> = ({ p }) => {
  const openPreview = usePreview();
  const labelDaya = (v?: string | null) =>
    v === "menyala" ? "Menyala" : v === "mati" ? " Mati" : "—";
  const labelKoneksi = (v?: string | null) =>
    v === "terkoneksi"
      ? " Terkoneksi"
      : v === "tidak_terkoneksi"
        ? " Tidak Terkoneksi"
        : "—";

  const FotoGrid: React.FC<{ urls?: string[] | null; label: string }> = ({
    urls,
    label,
  }) => {
    if (!urls || urls.length === 0)
      return <p className="text-sm text-grey italic">Tidak ada foto</p>;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {urls.map((url, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-lg overflow-hidden border border-grey-stroke cursor-pointer group"
            onClick={() => openPreview(url)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && openPreview(url)}
            aria-label={`Lihat foto ${i + 1}`}
          >
            <Image
              src={url}
              alt={`${label} ${i + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 pointer-events-none">
              <p className="text-[10px] text-white">{i + 1}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-neutral-03 uppercase tracking-wide border-b border-grey-stroke pb-1">
          Kondisi Sebelum
        </p>
        <ROField label="Daya">
          <ROText value={labelDaya(p.kondisiSebelumDaya)} />
        </ROField>
        <ROField label="Koneksi">
          <ROText value={labelKoneksi(p.kondisiSebelumKoneksi)} />
        </ROField>
        <ROField label="Foto">
          <FotoGrid urls={p.fotoSebelum} label="Sebelum" />
        </ROField>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-neutral-03 uppercase tracking-wide border-b border-grey-stroke pb-1">
          Kondisi Setelah
        </p>
        <ROField label="Daya">
          <ROText value={labelDaya(p.kondisiSetelahDaya)} />
        </ROField>
        <ROField label="Koneksi">
          <ROText value={labelKoneksi(p.kondisiSetelahKoneksi)} />
        </ROField>
        <ROField label="Foto">
          <FotoGrid urls={p.fotoSetelah} label="Setelah" />
        </ROField>
      </div>
      <ROField label="Catatan">
        <ROText value={p.catatan} />
      </ROField>
    </div>
  );
};

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
      {progres.jenisPekerjaan === "maintenance" && (
        <ReadOnlyMaintenance p={progres} />
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
  maintenance: MaintenanceData,
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
    case "maintenance":
      return {
        kondisiSebelumDaya: maintenance.kondisiSebelumDaya || null,
        kondisiSebelumKoneksi: maintenance.kondisiSebelumKoneksi || null,
        fotoSebelum:
          maintenance.fotoSebelum.length > 0 ? maintenance.fotoSebelum : null,
        kondisiSetelahDaya: maintenance.kondisiSetelahDaya || null,
        kondisiSetelahKoneksi: maintenance.kondisiSetelahKoneksi || null,
        fotoSetelah:
          maintenance.fotoSetelah.length > 0 ? maintenance.fotoSetelah : null,
        catatan: nullable(maintenance.catatan),
      };
    default:
      return {};
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PengerjaanSection: React.FC<PengerjaanSectionProps> = ({ workOrder }) => {
  // ─── Image preview state ───────────────────────────────────────────────────
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const openPreview = useCallback((url: string) => setPreviewUrl(url), []);
  const closePreview = useCallback(() => setPreviewUrl(null), []);

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

  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData>({
    kondisiSebelumDaya: "",
    kondisiSebelumKoneksi: "",
    fotoSebelum: [],
    kondisiSetelahDaya: "",
    kondisiSetelahKoneksi: "",
    fotoSetelah: [],
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
    } else if (progres.jenisPekerjaan === "maintenance") {
      setMaintenanceData({
        kondisiSebelumDaya:
          (progres.kondisiSebelumDaya as "menyala" | "mati" | "") ?? "",
        kondisiSebelumKoneksi:
          (progres.kondisiSebelumKoneksi as
            | "terkoneksi"
            | "tidak_terkoneksi"
            | "") ?? "",
        fotoSebelum: progres.fotoSebelum ?? [],
        kondisiSetelahDaya:
          (progres.kondisiSetelahDaya as "menyala" | "mati" | "") ?? "",
        kondisiSetelahKoneksi:
          (progres.kondisiSetelahKoneksi as
            | "terkoneksi"
            | "tidak_terkoneksi"
            | "") ?? "",
        fotoSetelah: progres.fotoSetelah ?? [],
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
        <PreviewContext.Provider value={openPreview}>
          <ImagePreviewModal url={previewUrl} onClose={closePreview} />
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
                  ? "Pekerjaan telah disetujui dan selesai."
                  : "Hasil pekerjaan sudah dikirim — menunggu review admin."}
              </p>
            </div>
            <p className="text-xs text-grey mt-3">
              Data pengerjaan tidak tersedia.
            </p>
          </div>
        </PreviewContext.Provider>
      );
    }
    return (
      <PreviewContext.Provider value={openPreview}>
        <ImagePreviewModal url={previewUrl} onClose={closePreview} />
        <ReadOnlyProgresView workOrder={workOrder} progres={progres} />
      </PreviewContext.Provider>
    );
  }

  const getPayload = () =>
    buildPayload(
      workOrder.jenisPekerjaan,
      surveiData,
      rabData,
      pemasanganData,
      pengawasanData,
      maintenanceData,
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
          "Data disimpan offline. Akan diupload saat ada koneksi.",
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
    if (jenis === "maintenance" && maintenanceData.fotoSebelum.length === 0) {
      showToast.warning(
        "Upload minimal satu foto kondisi sebelum pemeliharaan",
      );
      return;
    }
    // Offline atau ada pending files? → queue dengan type kirim_hasil
    if (!isOnline || pendingFilesMap.size > 0) {
      try {
        await queueOffline("kirim_hasil");
        showToast.info(
          "Data & pengiriman hasil disimpan offline. Akan diproses saat ada koneksi.",
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
      <PreviewContext.Provider value={openPreview}>
        <ImagePreviewModal url={previewUrl} onClose={closePreview} />
        <div className="bg-white rounded-xl border border-grey-stroke p-4">
          <h3 className="text-sm font-semibold text-neutral-03 mb-3">
            Pengerjaan
          </h3>

          {/* Offline pending banner */}
          {pendingFilesMap.size > 0 && (
            <div className="mb-3 flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800 font-medium">
                {pendingFilesMap.size} foto tersimpan offline — klik
                &quot;Simpan Draft&quot; untuk mengantri upload
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
                  workOrder.jenisPekerjaan ===
                    "pengawasan_setelah_pemasangan" ||
                  workOrder.jenisPekerjaan === "penyelesaian_laporan") && (
                  <FormPengawasan
                    data={pengawasanData}
                    onChange={setPengawasanData}
                    workOrderId={workOrder.id}
                    jenisPekerjaan={workOrder.jenisPekerjaan}
                  />
                )}
                {workOrder.jenisPekerjaan === "maintenance" && (
                  <FormMaintenance
                    data={maintenanceData}
                    onChange={setMaintenanceData}
                    workOrderId={workOrder.id}
                    koordinatLokasi={workOrder.koordinatLokasi}
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
      </PreviewContext.Provider>
    </PendingFilesContext.Provider>
  );
};

export default PengerjaanSection;

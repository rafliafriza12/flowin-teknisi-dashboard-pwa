/**
 * Offline Queue — IndexedDB storage untuk pending uploads & mutations.
 *
 * Saat teknisi offline:
 * 1. File foto disimpan sebagai Blob di IndexedDB
 * 2. Form data disimpan bersama referensi ke file tersebut
 * 3. Saat kembali online, queue diproses: upload foto → panggil mutasi
 */

import { compressImage } from "./imageCompression";
import { openDB, STORE_UPLOADS } from "./indexedDBMigration";
import { registerOfflineSync } from "./backgroundSync";

const MAX_QUEUE_SIZE = 100;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PendingImageRef {
  /** Key unik untuk field ini, e.g. "urlJaringan", "fotoRumah", "urlGambar_0" */
  fieldKey: string;
  /** File/Blob yang akan diupload ke Cloudinary saat online */
  file: File;
  /** Folder Cloudinary target */
  cloudinaryFolder: string;
  /** Tags untuk Cloudinary */
  tags: string[];
}

export type PendingItemType = "simpan_progres" | "kirim_hasil";
export type PendingItemStatus = "pending" | "syncing" | "done" | "error";

export interface PendingUploadItem {
  id: string;
  createdAt: number;
  workOrderId: string;
  jenisPekerjaan: string;
  /**
   * Payload progres (sudah di-build via buildPayload).
   * Field yang gambarnya pending akan bernilai null — akan diisi URL setelah upload.
   * Field dengan key di pendingImages akan diganti dengan URL Cloudinary.
   */
  progresPayload: Record<string, unknown>;
  /**
   * Daftar gambar yang perlu diupload sebelum memanggil mutasi.
   * Setelah upload, URL diterapkan ke progresPayload berdasarkan fieldKey.
   */
  pendingImages: PendingImageRef[];
  type: PendingItemType;
  status: PendingItemStatus;
  errorMessage?: string;
  retryCount: number;
  /**
   * Data konflik yang terdeteksi saat sinkronisasi (HTTP 409).
   * Berisi data dari server dan timestamp deteksi untuk resolusi konflik.
   * @see Requirements 2.7, 12.1
   */
  conflictData?: {
    /** Data dari server yang konflik dengan data lokal */
    serverData: Record<string, unknown>;
    /** Timestamp saat konflik terdeteksi */
    detectedAt: number;
  };
  /**
   * Timestamp percobaan sinkronisasi terakhir.
   * Digunakan untuk tracking retry attempts dan exponential backoff.
   * @see Requirements 2.7, 12.1
   */
  lastSyncAttempt?: number;
}

// ─── DB Init ──────────────────────────────────────────────────────────────────

// DB initialization is now handled by indexedDBMigration.ts
// This ensures consistent database versioning across all modules

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Tambah item baru ke queue
 *
 * Compresses images > 2MB before storing to IndexedDB to save storage space.
 * **Validates: Requirements 3.6**
 */
export async function addPendingItem(
  item: Omit<PendingUploadItem, "id" | "createdAt" | "retryCount" | "status">,
): Promise<string> {
  // Check queue size limit before adding
  const currentCount = await countPendingItems();
  if (currentCount >= MAX_QUEUE_SIZE) {
    throw new Error(
      `Queue penuh (${MAX_QUEUE_SIZE} item). Harap sinkronkan data offline terlebih dahulu.`,
    );
  }

  // Compress images > 2MB before storing
  const compressedImages: PendingImageRef[] = await Promise.all(
    item.pendingImages.map(async (imageRef) => {
      const compressedFile = await compressImage(imageRef.file, 2);
      return {
        ...imageRef,
        file: compressedFile,
      };
    }),
  );

  const db = await openDB();
  const id = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const record: PendingUploadItem = {
    ...item,
    pendingImages: compressedImages,
    id,
    createdAt: Date.now(),
    status: "pending",
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_UPLOADS, "readwrite");
    const store = tx.objectStore(STORE_UPLOADS);
    const req = store.add(record);
    req.onsuccess = () => {
      // Best-effort: register background sync so the SW retries when online.
      registerOfflineSync().catch(() => undefined);
      resolve(id);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Ambil semua item dengan status tertentu */
export async function getPendingItems(
  status: PendingItemStatus = "pending",
): Promise<PendingUploadItem[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_UPLOADS, "readonly");
    const store = tx.objectStore(STORE_UPLOADS);
    const index = store.index("status");
    const req = index.getAll(status);
    req.onsuccess = () => resolve(req.result as PendingUploadItem[]);
    req.onerror = () => reject(req.error);
  });
}

/** Ambil semua item yang belum selesai (pending + error yang masih bisa retry) */
export async function getAllActivePendingItems(): Promise<PendingUploadItem[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_UPLOADS, "readonly");
    const store = tx.objectStore(STORE_UPLOADS);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result as PendingUploadItem[];
      resolve(
        all.filter(
          (item) => item.status === "pending" || item.status === "error",
        ),
      );
    };
    req.onerror = () => reject(req.error);
  });
}

/** Update status dan field lain pada item */
export async function updatePendingItem(
  id: string,
  updates: Partial<
    Pick<
      PendingUploadItem,
      | "status"
      | "errorMessage"
      | "retryCount"
      | "progresPayload"
      | "conflictData"
      | "lastSyncAttempt"
    >
  >,
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_UPLOADS, "readwrite");
    const store = tx.objectStore(STORE_UPLOADS);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result as PendingUploadItem;
      if (!record) return reject(new Error("Item tidak ditemukan"));
      const updated = { ...record, ...updates };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/** Hapus item dari queue (setelah berhasil sync) */
export async function removePendingItem(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_UPLOADS, "readwrite");
    const store = tx.objectStore(STORE_UPLOADS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Hitung total item yang masih pending */
export async function countPendingItems(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_UPLOADS, "readonly");
    const store = tx.objectStore(STORE_UPLOADS);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result as PendingUploadItem[];
      resolve(
        all.filter(
          (item) => item.status === "pending" || item.status === "error",
        ).length,
      );
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── Payload Resolver ─────────────────────────────────────────────────────────

/**
 * Terapkan URL yang sudah diupload ke progresPayload.
 *
 * Mendukung dua pola fieldKey:
 *
 * 1. **Flat field** — `"urlJaringan"`, `"fotoRumah"`, `"urlRab"`, dst.
 *    → `payload.urlJaringan = url`
 *
 * 2. **Array field** — `"<namaField>_<idx>"`, mis.:
 *    - `"urlGambar_0"`, `"urlGambar_1"` → `payload.urlGambar[0]`, `[1]`
 *    - `"fotoSebelum_0"`, `"fotoSebelum_1"` → `payload.fotoSebelum[0]`, `[1]`
 *    - `"fotoSetelah_0"` → `payload.fotoSetelah[0]`
 *
 * Pola ini harus konsisten dengan cara `pendingFilesMap` mengassign fieldKey
 * di `PengerjaanSection.tsx` (mis. `urlGambar_${nextIndex}`,
 * `fotoSebelum_${nextIdx}`, `fotoSetelah_${nextIdx}`).
 */
export function applyResolvedUrls(
  payload: Record<string, unknown>,
  resolvedUrls: Map<string, string>,
): Record<string, unknown> {
  const result = structuredClone(payload) as Record<string, unknown>;

  for (const [fieldKey, url] of resolvedUrls) {
    // Deteksi pola "<namaField>_<angka>" — untuk semua array field.
    const arrayMatch = fieldKey.match(/^(.+)_(\d+)$/);
    if (arrayMatch) {
      const arrayFieldName = arrayMatch[1]; // mis. "urlGambar", "fotoSebelum", "fotoSetelah"
      const idx = parseInt(arrayMatch[2], 10);
      if (!Array.isArray(result[arrayFieldName])) {
        result[arrayFieldName] = [];
      }
      (result[arrayFieldName] as string[])[idx] = url;
    } else {
      // Flat field: langsung assign ke top-level key
      result[fieldKey] = url;
    }
  }

  return result;
}

/**
 * Offline Queue — IndexedDB storage untuk pending uploads & mutations.
 *
 * Saat teknisi offline:
 * 1. File foto disimpan sebagai Blob di IndexedDB
 * 2. Form data disimpan bersama referensi ke file tersebut
 * 3. Saat kembali online, queue diproses: upload foto → panggil mutasi
 */

const DB_NAME = "flowin-teknisi-offline";
const DB_VERSION = 1;
const STORE_UPLOADS = "pendingUploads";

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
}

// ─── DB Init ──────────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB tidak tersedia di server"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_UPLOADS)) {
        const store = db.createObjectStore(STORE_UPLOADS, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("workOrderId", "workOrderId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/** Tambah item baru ke queue */
export async function addPendingItem(
  item: Omit<PendingUploadItem, "id" | "createdAt" | "retryCount" | "status">,
): Promise<string> {
  const db = await getDB();
  const id = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const record: PendingUploadItem = {
    ...item,
    id,
    createdAt: Date.now(),
    status: "pending",
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_UPLOADS, "readwrite");
    const store = tx.objectStore(STORE_UPLOADS);
    const req = store.add(record);
    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error);
  });
}

/** Ambil semua item dengan status tertentu */
export async function getPendingItems(
  status: PendingItemStatus = "pending",
): Promise<PendingUploadItem[]> {
  const db = await getDB();

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
  const db = await getDB();

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
      "status" | "errorMessage" | "retryCount" | "progresPayload"
    >
  >,
): Promise<void> {
  const db = await getDB();

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
  const db = await getDB();

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
  const db = await getDB();

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
 * Contoh:
 * - fieldKey "urlJaringan" → payload.urlJaringan = url
 * - fieldKey "urlGambar_0" → (payload.urlGambar as string[])[0] = url
 */
export function applyResolvedUrls(
  payload: Record<string, unknown>,
  resolvedUrls: Map<string, string>,
): Record<string, unknown> {
  const result = structuredClone(payload) as Record<string, unknown>;

  for (const [fieldKey, url] of resolvedUrls) {
    if (fieldKey.startsWith("urlGambar_")) {
      const idx = parseInt(fieldKey.replace("urlGambar_", ""), 10);
      if (!Array.isArray(result.urlGambar)) {
        result.urlGambar = [];
      }
      (result.urlGambar as string[])[idx] = url;
    } else {
      result[fieldKey] = url;
    }
  }

  return result;
}

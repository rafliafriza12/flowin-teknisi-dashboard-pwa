/**
 * Conflict Resolutions Storage
 *
 * Persists per-item conflict state and user resolution choices in IndexedDB.
 * Records survive reloads so an interrupted resolution can be resumed.
 *
 * **Validates: Requirements 12.1, 12.6**
 */

import { openDB, STORE_CONFLICT_RESOLUTIONS } from "./indexedDBMigration";

export type ConflictResolutionChoice =
  | "keep_local"
  | "keep_server"
  | "merge"
  | "pending";

export interface ConflictResolutionRecord {
  /** Pending item id this resolution belongs to */
  itemId: string;
  /** Server data captured at the time of conflict */
  serverData: Record<string, unknown>;
  /** Timestamp when conflict was detected (ms since epoch) */
  detectedAt: number;
  /** User's resolution choice; "pending" until resolved */
  resolution: ConflictResolutionChoice;
  /** Timestamp when resolution was applied (if any) */
  resolvedAt?: number;
  /** Whether the resolution has been applied */
  resolved: boolean;
  /** Merged payload when resolution === "merge" */
  mergedPayload?: Record<string, unknown>;
}

export async function saveConflictResolution(
  record: ConflictResolutionRecord,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONFLICT_RESOLUTIONS, "readwrite");
    const store = tx.objectStore(STORE_CONFLICT_RESOLUTIONS);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(
        new Error(
          `Failed to save conflict resolution: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

export async function getConflictResolution(
  itemId: string,
): Promise<ConflictResolutionRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONFLICT_RESOLUTIONS, "readonly");
    const store = tx.objectStore(STORE_CONFLICT_RESOLUTIONS);
    const req = store.get(itemId);
    req.onsuccess = () =>
      resolve((req.result as ConflictResolutionRecord) ?? null);
    req.onerror = () =>
      reject(
        new Error(
          `Failed to get conflict resolution: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

export async function getUnresolvedConflicts(): Promise<
  ConflictResolutionRecord[]
> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONFLICT_RESOLUTIONS, "readonly");
    const store = tx.objectStore(STORE_CONFLICT_RESOLUTIONS);
    const index = store.index("resolved");
    const req = index.getAll(IDBKeyRange.only(false));
    req.onsuccess = () =>
      resolve(req.result as ConflictResolutionRecord[]);
    req.onerror = () =>
      reject(
        new Error(
          `Failed to get unresolved conflicts: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

export async function deleteConflictResolution(itemId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONFLICT_RESOLUTIONS, "readwrite");
    const store = tx.objectStore(STORE_CONFLICT_RESOLUTIONS);
    const req = store.delete(itemId);
    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(
        new Error(
          `Failed to delete conflict resolution: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

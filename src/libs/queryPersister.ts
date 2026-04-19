/**
 * queryPersister.ts
 *
 * Menyimpan TanStack Query cache ke IndexedDB menggunakan idb-keyval.
 * Data tetap tersedia saat offline bahkan setelah page refresh.
 */

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";

const IDB_KEY = "flowin-teknisi-query-cache";

/**
 * Async storage adapter yang menggunakan idb-keyval (IndexedDB).
 */
const idbStorage = {
  getItem: (key: string) => get<string>(key).then((v) => v ?? null),
  setItem: (key: string, value: string) => set(key, value),
  removeItem: (key: string) => del(key),
};

export const queryPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: IDB_KEY,
  // Throttle serialisasi agar tidak terlalu sering menulis ke IndexedDB
  throttleTime: 2000,
});

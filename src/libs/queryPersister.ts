/**
 * queryPersister.ts
 *
 * Persister kustom untuk TanStack Query:
 * - Selalu MENULIS ke IndexedDB (agar data selalu siap dipakai saat offline)
 * - Selalu MEMBACA dari IndexedDB saat startup (hydrate cache)
 *
 * Catatan offline-first (AUDIT_OFFLINE_FIRST.md S1): restore TIDAK lagi
 * dikondisikan pada `navigator.onLine`. Menahan restore saat online membuat
 * skenario "online → tiba-tiba offline" kehilangan data (cache tak pernah ter-
 * hydrate). Saat online, `networkMode: "offlineFirst"` + `staleTime` di
 * QueryProvider tetap memicu refetch background, jadi data segar tetap terjaga.
 */

import { get, set, del } from "idb-keyval";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";

const IDB_KEY = "flowin-teknisi-query-cache";

export const queryPersister: Persister = {
  /** Selalu simpan ke IndexedDB agar siap dipakai saat offline */
  persistClient: async (client: PersistedClient) => {
    await set(IDB_KEY, JSON.stringify(client));
  },

  /** Selalu restore dari IndexedDB saat startup agar cache siap untuk offline */
  restoreClient: async (): Promise<PersistedClient | undefined> => {
    const data = await get<string>(IDB_KEY);
    return data ? (JSON.parse(data) as PersistedClient) : undefined;
  },

  removeClient: async () => {
    await del(IDB_KEY);
  },
};

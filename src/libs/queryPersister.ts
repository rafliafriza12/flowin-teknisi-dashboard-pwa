/**
 * queryPersister.ts
 *
 * Persister kustom untuk TanStack Query:
 * - Selalu MENULIS ke IndexedDB (agar data selalu fresh saat offline)
 * - Hanya MEMBACA dari IndexedDB ketika offline (agar online selalu fresh dari server)
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

  /** Hanya restore dari IndexedDB ketika sedang offline */
  restoreClient: async (): Promise<PersistedClient | undefined> => {
    // Saat online → tidak restore cache lama, biarkan query fetch fresh dari server
    if (typeof navigator !== "undefined" && navigator.onLine) {
      return undefined;
    }
    // Saat offline → gunakan cache IndexedDB
    const data = await get<string>(IDB_KEY);
    return data ? (JSON.parse(data) as PersistedClient) : undefined;
  },

  removeClient: async () => {
    await del(IDB_KEY);
  },
};

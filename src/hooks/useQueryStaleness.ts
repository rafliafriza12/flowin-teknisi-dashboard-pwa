"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";

/**
 * Interface untuk informasi staleness query
 */
export interface QueryStalenessInfo {
  /** Timestamp terakhir data di-fetch (null jika belum pernah fetch) */
  lastFetchedAt: number | null;
  /** Apakah data sudah stale (lebih dari 1 jam) */
  isStale: boolean;
  /** Kategori staleness data */
  staleness: "fresh" | "recent" | "stale" | "very_stale";
  /** Pesan yang menjelaskan staleness dalam bahasa Indonesia */
  message: string;
}

/**
 * Hook untuk melacak staleness data query.
 * 
 * Menghitung usia data berdasarkan `dataUpdatedAt` dari query state
 * dan mengembalikan informasi staleness dengan pesan dalam bahasa Indonesia.
 * 
 * Kategori staleness:
 * - fresh: < 1 menit
 * - recent: 1 menit - 1 jam
 * - stale: 1 jam - 6 jam
 * - very_stale: > 6 jam
 * 
 * @param queryKey - Query key untuk melacak staleness
 * @returns Informasi staleness query
 * 
 * @example
 * ```tsx
 * const staleness = useQueryStaleness(['workOrder', id]);
 * 
 * if (!isOnline && staleness.staleness === 'very_stale') {
 *   return <Warning>{staleness.message}</Warning>;
 * }
 * ```
 */
export function useQueryStaleness(queryKey: QueryKey): QueryStalenessInfo {
  const queryClient = useQueryClient();
  const query = queryClient.getQueryState(queryKey);

  // Jika query belum pernah di-fetch atau tidak ada data
  if (!query?.dataUpdatedAt) {
    return {
      lastFetchedAt: null,
      isStale: false,
      staleness: "fresh",
      message: "Memuat data...",
    };
  }

  // Hitung usia data dalam milidetik
  const age = Date.now() - query.dataUpdatedAt;
  const minutes = Math.floor(age / 60000);
  const hours = Math.floor(minutes / 60);

  let staleness: QueryStalenessInfo["staleness"];
  let message: string;

  // Kategorikan staleness berdasarkan usia
  if (age < 60000) {
    // < 1 menit
    staleness = "fresh";
    message = "Baru saja diperbarui";
  } else if (age < 3600000) {
    // 1 menit - 1 jam
    staleness = "recent";
    message = `Diperbarui ${minutes} menit yang lalu`;
  } else if (age < 21600000) {
    // 1 jam - 6 jam
    staleness = "stale";
    message = `Diperbarui ${hours} jam yang lalu`;
  } else {
    // > 6 jam
    staleness = "very_stale";
    message = "Data sudah outdated - Refresh saat online";
  }

  return {
    lastFetchedAt: query.dataUpdatedAt,
    isStale: age > 3600000, // Stale jika lebih dari 1 jam
    staleness,
    message,
  };
}

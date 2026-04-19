"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { queryPersister } from "@/libs/queryPersister";

// Durasi cache yang dipersist di IndexedDB: 24 jam
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24;

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 menit — data dianggap fresh
            gcTime: CACHE_MAX_AGE, // Simpan di memory cache selama 24 jam
            refetchOnWindowFocus: false,
            // Saat offline, gunakan data stale dari cache tanpa retry
            networkMode: "offlineFirst",
          },
        },
      }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: CACHE_MAX_AGE,
        // Hanya persist query yang memiliki tag "persist" di queryKey
        // atau semua query (default: semua di-persist)
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            // Jangan simpan query yang sedang error atau loading pertama kali
            query.state.status === "success",
        },
      }}
    >
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
}

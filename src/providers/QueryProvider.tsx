"use client";

import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { queryPersister } from "@/libs/queryPersister";
import { clearAuthCookies } from "@/libs/graphql";
import { clearClientSession } from "@/libs/authSession";

// Durasi cache yang dipersist di IndexedDB: 24 jam
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24;

/**
 * Deteksi error autentikasi (token expired/invalid → 401 / UNAUTHENTICATED).
 *
 * `graphqlAction` melempar `Error` biasa dengan property `code`/`statusCode`/
 * `isAuthError` di-assign manual (lihat src/libs/graphql/actions.ts), jadi kita
 * duck-type ketimbang `instanceof`.
 */
function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as {
    isAuthError?: boolean;
    code?: string;
    statusCode?: number;
  };
  return (
    e.isAuthError === true ||
    e.code === "UNAUTHENTICATED" ||
    e.statusCode === 401
  );
}

// Flag re-entrancy modul-level: banyak query bisa gagal 401 bersamaan, tapi
// redirect cukup sekali.
let redirecting = false;

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    /**
     * Handler error auth global untuk SEMUA query & mutation.
     *
     * Saat token bermasalah/habis dan auto-refresh server sudah gagal,
     * `graphqlAction` melempar auth error. Sebelumnya error ini hanya membuat
     * query masuk state `error` tanpa ada yang mengarahkan user ke /login.
     * Handler ini membersihkan sesi lalu redirect — konsisten dengan pola
     * logout di src/services/authService.ts.
     *
     * Penting (offline-first): HANYA redirect saat ONLINE. Saat offline, query
     * memang gagal namun data dari cache tetap dipakai — jangan tendang user
     * ke /login. (AUDIT_OFFLINE_FIRST.md)
     */
    const handleAuthError = (error: unknown) => {
      if (typeof window === "undefined") return;
      if (!navigator.onLine) return; // offline → biarkan cache yang melayani
      if (!isAuthError(error)) return;
      if (redirecting) return;

      // Sudah di halaman publik → jangan loop redirect.
      const path = window.location.pathname;
      if (path.startsWith("/login") || path.startsWith("/access-denied")) {
        return;
      }

      redirecting = true;
      void (async () => {
        try {
          await clearAuthCookies();
        } catch {
          // best-effort
        }
        try {
          // Hapus flowin_session client-readable agar useAuthGuard langsung
          // melihat "tidak ada sesi" — tidak perlu tunggu Set-Cookie dari server.
          clearClientSession();
        } catch {
          // best-effort
        }
        try {
          client.clear();
          await queryPersister.removeClient();
        } catch {
          // best-effort
        }
        window.location.href = "/login";
      })();
    };

    const client = new QueryClient({
      queryCache: new QueryCache({ onError: handleAuthError }),
      mutationCache: new MutationCache({ onError: handleAuthError }),
      defaultOptions: {
        queries: {
          // staleTime: 0 → data SELALU dianggap stale.
          // TanStack Query akan background-refetch setiap kali query di-mount
          // atau window mendapat fokus kembali, SAMBIL tetap menampilkan data
          // dari cache secara instan (no loading flash).
          // Pola "stale-while-revalidate" — ideal untuk offline-first.
          staleTime: 0,
          gcTime: CACHE_MAX_AGE, // Simpan di memory & IndexedDB selama 24 jam
          refetchOnWindowFocus: true, // Refresh saat user kembali ke tab
          refetchOnReconnect: true, // Refresh saat koneksi pulih
          // Saat offline, gunakan data stale dari cache tanpa retry
          networkMode: "offlineFirst",
        },
      },
    });

    return client;
  });

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

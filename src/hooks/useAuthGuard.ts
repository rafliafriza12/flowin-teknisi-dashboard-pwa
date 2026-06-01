/**
 * useAuthGuard
 *
 * Guard autentikasi berbasis **client** yang berfungsi penuh saat offline.
 *
 * Membaca sinyal sesi dari cookie `flowin_session` (lihat src/libs/authSession.ts)
 * alih-alih bergantung pada middleware / Server Component yang membutuhkan
 * koneksi ke server. Ini adalah inti perbaikan offline-first: app shell halaman
 * privat kini bisa dirender & dijaga tanpa jaringan.
 *
 * Otorisasi definitif tetap di backend — guard ini hanya menentukan apa yang
 * tampil di UI dan ke mana mengarahkan saat tidak ada sesi.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientSession, ALLOWED_ROLE } from "@/libs/authSession";

export type AuthGuardStatus = "checking" | "authorized" | "unauthorized";

export interface AuthGuardState {
  status: AuthGuardStatus;
  role: string | null;
}

export function useAuthGuard(): AuthGuardState {
  const router = useRouter();
  const [state, setState] = useState<AuthGuardState>({
    status: "checking",
    role: null,
  });

  useEffect(() => {
    const session = getClientSession();

    // Tidak ada sesi → arahkan ke login (jalan offline, tanpa request server).
    if (!session) {
      setState({ status: "unauthorized", role: null });
      router.replace("/login");
      return;
    }

    // Ada sesi tapi role tidak diizinkan → halaman akses ditolak.
    if (session.role !== ALLOWED_ROLE) {
      setState({ status: "unauthorized", role: session.role });
      router.replace(`/access-denied?role=${encodeURIComponent(session.role)}`);
      return;
    }

    setState({ status: "authorized", role: session.role });
  }, [router]);

  return state;
}

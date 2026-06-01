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

import { useEffect, useCallback, useState } from "react";
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

  const checkSession = useCallback(() => {
    const session = getClientSession();

    // Tidak ada sesi / kedaluwarsa → arahkan ke login.
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

  useEffect(() => {
    // Cek pertama kali mount
    checkSession();

    // Re-cek saat tab menjadi aktif kembali (mis. device 1 dibuka setelah
    // device 2 login & backend me-rotate refresh token). Dengan ini, bahkan
    // sebelum query sempat jalan, guard sudah mendeteksi sesi tidak valid
    // (karena clearClientSession() sudah dipanggil oleh QueryProvider) dan
    // langsung redirect ke /login — tidak ada layar kosong.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") checkSession();
    };
    const handleFocus = () => checkSession();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkSession]);

  return state;
}

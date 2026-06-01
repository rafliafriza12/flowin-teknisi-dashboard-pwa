"use client";

import MainLayout from "@/components/templates/layouts/MainLayout";
import { useAuthGuard } from "@/hooks/useAuthGuard";

/**
 * Layout halaman privat — kini **client component** agar app shell bisa
 * dirender & dijaga saat offline (lihat AUDIT_OFFLINE_FIRST.md B1/B3).
 *
 * Auth gate dijalankan di client via useAuthGuard (membaca cookie sesi
 * client-readable). Tidak ada lagi redirect server-side yang membuat halaman
 * privat tak bisa diakses offline. Otorisasi sebenarnya tetap dijaga backend.
 */
const PrivateLayout = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAuthGuard();

  // Saat tidak ada sesi / role salah, guard sudah me-replace rute.
  // Tampilkan placeholder kosong agar konten privat tak sempat ter-render.
  if (status === "unauthorized") {
    return null;
  }

  // status "checking" maupun "authorized" → render shell.
  // Shell + chunk JS sudah di-precache SW, sehingga tampil walau offline.
  return <MainLayout>{children}</MainLayout>;
};

export default PrivateLayout;

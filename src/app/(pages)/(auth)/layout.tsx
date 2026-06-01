"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasValidSession } from "@/libs/authSession";

/**
 * Layout halaman auth (login, forgot/reset password) — client component.
 *
 * Dulu melakukan jwtVerify + redirect("/") di server, yang membuat halaman ini
 * bergantung pada koneksi server dan berisiko redirect-loop saat offline.
 * Kini pengecekan "sudah login?" dilakukan di client via cookie sesi: jika ada
 * sesi valid, arahkan ke dashboard. Aman offline.
 */
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    if (hasValidSession()) {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="w-screen h-svh flex justify-center items-center bg-white-mineral font-parkinsans">
      {children}
    </div>
  );
};

export default AuthLayout;

"use client";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#1F2375] flex flex-col items-center justify-center px-6 overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1F2375]">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-white text-xl font-bold tracking-tight">
            Flowin
          </span>
        </div>

        {/* 404 Illustration */}
        <div className="relative flex items-center justify-center">
          <span className="text-[130px] sm:text-[160px] font-black text-white/10 leading-none select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <svg
                className="w-9 h-9 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-white">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm text-white/60 leading-relaxed">
            Halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
            Kembali ke dashboard untuk melanjutkan pekerjaan.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col w-full gap-3">
          <Link
            href="/"
            className="w-full py-3.5 rounded-2xl bg-white text-[#1F2375] text-sm font-semibold text-center hover:bg-white/90 transition-colors"
          >
            Kembali ke Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full py-3.5 rounded-2xl border border-white/20 text-white text-sm font-medium text-center hover:bg-white/10 transition-colors"
          >
            Halaman Sebelumnya
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-white/30">
          © {new Date().getFullYear()} Flowin. All rights reserved.
        </p>
      </div>
    </main>
  );
}

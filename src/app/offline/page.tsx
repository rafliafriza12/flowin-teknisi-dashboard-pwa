/**
 * Halaman fallback yang ditampilkan Service Worker ketika:
 * - Pengguna sedang offline
 * - Halaman yang diminta belum tersimpan di cache SW
 */

import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-grey-lightest gap-6 px-4 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3l18 18M8.111 8.111A5.978 5.978 0 006 12c0 3.314 2.686 6 6 6a5.978 5.978 0 003.889-1.432M16.5 9.5A6 6 0 0010.5 6c-.69 0-1.353.117-1.969.333M12 3v1m0 16v1m9-9h-1M4 12H3"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-neutral-800">
          Tidak ada koneksi internet
        </h1>
        <p className="text-sm text-neutral-500 max-w-xs">
          Halaman ini belum tersimpan di cache. Kunjungi halaman yang sudah
          pernah dibuka, atau tunggu koneksi kembali.
        </p>
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="text-sm font-medium text-primary underline hover:opacity-80 transition-opacity"
      >
        Kembali ke halaman utama
      </Link>
    </div>
  );
}

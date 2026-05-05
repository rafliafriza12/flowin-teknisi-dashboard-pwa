/**
 * ServiceWorkerUnregisterWarning
 *
 * Modal warning shown when the Service Worker is detected as unregistered
 * (e.g. user cleared site data or manually unregistered via DevTools).
 * Explains the consequences and offers a "Re-register" action (page reload).
 *
 * **Validates: Requirements 13.7**
 */

"use client";

import React from "react";
import { useServiceWorkerUnregister } from "@/hooks/useServiceWorkerUnregister";

const ServiceWorkerUnregisterWarning: React.FC = () => {
  const { isUnregistered, reRegister, dismiss } = useServiceWorkerUnregister();

  if (!isUnregistered) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-amber-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-800">
              Fitur Offline Tidak Aktif
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Service worker terdeteksi tidak terdaftar
            </p>
          </div>
        </div>

        {/* Body */}
        <p className="text-xs text-neutral-600 leading-relaxed">
          Service worker aplikasi telah dihapus, kemungkinan akibat{" "}
          <strong>penghapusan data situs</strong> atau aksi dari DevTools. Tanpa
          service worker:
        </p>
        <ul className="text-xs text-neutral-600 list-disc list-inside space-y-1">
          <li>Aplikasi tidak dapat digunakan saat offline</li>
          <li>Data formulir tidak tersimpan secara lokal</li>
          <li>Push notification tidak akan diterima</li>
        </ul>
        <p className="text-xs text-neutral-600">
          Muat ulang halaman untuk mengaktifkan kembali service worker.
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <button
            onClick={reRegister}
            className="flex-1 py-2.5 rounded-xl bg-[#1F2375] text-white text-xs font-semibold hover:bg-[#1a1e65] transition-colors"
          >
            Muat Ulang Sekarang
          </button>
          <button
            onClick={dismiss}
            className="flex-1 py-2.5 rounded-xl bg-neutral-100 text-neutral-600 text-xs font-semibold hover:bg-neutral-200 transition-colors"
          >
            Abaikan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceWorkerUnregisterWarning;

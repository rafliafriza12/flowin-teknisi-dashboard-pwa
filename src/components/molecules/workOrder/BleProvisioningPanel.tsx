"use client";

/**
 * BleProvisioningPanel
 *
 * Panel untuk provisioning water meter IoT via Bluetooth.
 * Ditampilkan di FormPemasangan setelah field Seri Meteran terisi.
 *
 * Alur:
 *   1. Tekan "Hubungkan BLE" → connect ke ESP32
 *   2. Setelah terhubung, tekan "Kirim Data ke IoT" → kirim USER_ID & METER_NUM
 *   3. Setelah done, blokir diangkat → tombol simpan/kirim aktif
 */

import React from "react";
import { useBleProvisioning, type BleStatus } from "@/hooks/useBleProvisioning";

interface BleProvisioningPanelProps {
  /** ID pelanggan — dikirim sebagai USER_ID ke IoT */
  pelangganId: string;
  /** Nilai seri meteran dari form — dikirim sebagai METER_NUM ke IoT */
  seriMeteran: string;
  /** Dipanggil saat provisioning selesai (isProvisioned berubah) */
  onProvisionedChange: (provisioned: boolean) => void;
}

const STATUS_COLOR: Record<BleStatus, string> = {
  idle: "bg-grey-light border-grey-stroke text-grey",
  connecting: "bg-blue-50 border-blue-200 text-blue-700",
  connected: "bg-green-50 border-green-200 text-green-700",
  sending_user_id: "bg-blue-50 border-blue-200 text-blue-700",
  sending_meter: "bg-blue-50 border-blue-200 text-blue-700",
  done: "bg-green-50 border-green-300 text-green-800",
  error: "bg-red-50 border-red-200 text-red-700",
};

const STATUS_ICON: Record<BleStatus, string> = {
  idle: "📡",
  connecting: "⏳",
  connected: "🔗",
  sending_user_id: "📤",
  sending_meter: "📤",
  done: "✅",
  error: "❌",
};

const BleProvisioningPanel: React.FC<BleProvisioningPanelProps> = ({
  pelangganId,
  seriMeteran,
  onProvisionedChange,
}) => {
  const ble = useBleProvisioning();

  // Notify parent kapanpun isProvisioned berubah
  const prevProvisionedRef = React.useRef(false);
  React.useEffect(() => {
    if (ble.isProvisioned !== prevProvisionedRef.current) {
      prevProvisionedRef.current = ble.isProvisioned;
      onProvisionedChange(ble.isProvisioned);
    }
  }, [ble.isProvisioned, onProvisionedChange]);

  // Bug 1 Fix: Jika seriMeteran berubah SETELAH provisioning selesai,
  // reset status agar user harus kirim ulang data yang benar ke IoT.
  // Ini mencegah inkonsistensi antara data di server vs data di IoT device.
  const prevSeriMeteranRef = React.useRef(seriMeteran);
  React.useEffect(() => {
    if (ble.isProvisioned && seriMeteran !== prevSeriMeteranRef.current) {
      ble.reset();
      onProvisionedChange(false);
    }
    prevSeriMeteranRef.current = seriMeteran;
  }, [seriMeteran, ble, onProvisionedChange]);

  const isBusy =
    ble.status === "connecting" ||
    ble.status === "sending_user_id" ||
    ble.status === "sending_meter";

  const canSend = ble.status === "connected" && seriMeteran.trim().length > 0;

  // Bug 2: Jangan izinkan connect jika pelangganId kosong —
  // akan gagal di step "Kirim Data" dan memberikan UX yang membingungkan
  const canConnect = pelangganId.trim().length > 0;

  if (!ble.isSupported) {
    return (
      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
        ⚠️ Browser ini tidak mendukung Web Bluetooth. Gunakan Chrome atau Edge
        di Android/Desktop untuk fitur provisioning IoT.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-grey-stroke bg-grey-lightest p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-base">📡</span>
        <div>
          <p className="text-xs font-semibold text-neutral-03">
            Provisioning IoT Water Meter
          </p>
          <p className="text-[11px] text-grey leading-tight">
            Hubungkan dan kirim data ke perangkat Flowin IoT sebelum menyimpan
          </p>
        </div>
      </div>

      {/* Data yang akan dikirim */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="bg-white rounded border border-grey-stroke p-2">
          <span className="text-grey block">User ID Pelanggan</span>
          <span className="font-mono font-medium text-neutral-03 break-all">
            {pelangganId || (
              <span className="text-error italic">Tidak ada</span>
            )}
          </span>
        </div>
        <div className="bg-white rounded border border-grey-stroke p-2">
          <span className="text-grey block">Nomor Meteran</span>
          <span className="font-mono font-medium text-neutral-03 break-all">
            {seriMeteran.trim() || (
              <span className="text-error italic">Belum diisi</span>
            )}
          </span>
        </div>
      </div>

      {/* Status box */}
      <div
        className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${STATUS_COLOR[ble.status]}`}
      >
        <span className="shrink-0">{STATUS_ICON[ble.status]}</span>
        <span>{ble.statusMessage}</span>
      </div>

      {/* Tombol aksi */}
      <div className="flex gap-2">
        {/* Step 1: Connect */}
        {ble.status !== "done" && (
          <button
            type="button"
            disabled={isBusy || ble.status === "connected" || !canConnect}
            onClick={ble.connect}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-white border-moss-stone text-moss-stone hover:bg-moss-stone/5"
          >
            {ble.status === "connecting"
              ? "Menghubungkan..."
              : ble.status === "connected"
                ? "✓ Terhubung"
                : "1. Hubungkan BLE"}
          </button>
        )}

        {/* Step 2: Send data — hanya muncul setelah connect, dan seriMeteran terisi */}
        {(ble.status === "connected" ||
          ble.status === "sending_user_id" ||
          ble.status === "sending_meter") && (
          <button
            type="button"
            disabled={!canSend || isBusy}
            onClick={() => ble.sendData(pelangganId, seriMeteran)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              bg-moss-stone text-white hover:bg-moss-stone/90"
          >
            {ble.status === "sending_user_id"
              ? "Mengirim User ID..."
              : ble.status === "sending_meter"
                ? "Mengirim Nomor Meteran..."
                : !seriMeteran.trim()
                  ? "Isi nomor meteran dulu"
                  : "2. Kirim Data ke IoT"}
          </button>
        )}

        {/* Done state */}
        {ble.status === "done" && (
          <div className="flex-1 py-2 px-3 rounded-lg text-xs font-medium text-center bg-green-100 text-green-800 border border-green-300">
            ✅ Provisioning Selesai
          </div>
        )}

        {/* Reset / retry saat error */}
        {ble.status === "error" && (
          <button
            type="button"
            onClick={ble.reset}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-white border border-grey-stroke text-grey hover:bg-grey-light transition-colors"
          >
            Coba Lagi
          </button>
        )}
      </div>

      {/* Peringatan jika seriMeteran kosong saat sudah connected */}
      {ble.status === "connected" && !seriMeteran.trim() && (
        <p className="text-[11px] text-warning">
          ⚠️ Isi field &quot;Seri Meteran&quot; terlebih dahulu sebelum mengirim
          data ke IoT.
        </p>
      )}

      {/* Peringatan jika pelangganId tidak tersedia */}
      {!canConnect && ble.status === "idle" && (
        <p className="text-[11px] text-error">
          ⚠️ ID Pelanggan tidak tersedia pada work order ini. Hubungi admin
          untuk memastikan data pelanggan sudah terhubung.
        </p>
      )}
    </div>
  );
};

export default BleProvisioningPanel;

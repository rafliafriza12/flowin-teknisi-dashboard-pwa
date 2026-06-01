"use client";

/**
 * useBleProvisioning
 *
 * Hook untuk provisioning IoT water meter via Web Bluetooth API.
 * Alur wajib berurutan:
 *   1. connect()  — scan & hubungkan ke perangkat Flowin_IoT_Device
 *   2. sendData() — kirim USER_ID:<pelangganId> lalu METER_NUM:<seriMeteran>
 *
 * Bekerja offline maupun online — Web Bluetooth tidak butuh internet.
 *
 * UUID harus sama persis dengan firmware ESP32.
 */

import { useState, useCallback, useRef, useEffect } from "react";

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

export type BleStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "sending_user_id"
  | "sending_meter"
  | "done"
  | "error";

export interface UseBleProvisioningReturn {
  /** Status proses provisioning saat ini */
  status: BleStatus;
  /** Pesan status / error untuk ditampilkan ke user */
  statusMessage: string;
  /** true jika USER_ID dan METER_NUM sudah berhasil dikirim ke IoT */
  isProvisioned: boolean;
  /** Apakah Web Bluetooth tersedia di browser ini */
  isSupported: boolean;
  /** Langkah 1: scan & connect ke BLE device */
  connect: () => Promise<void>;
  /** Langkah 2: kirim USER_ID lalu METER_NUM secara berurutan */
  sendData: (pelangganId: string, seriMeteran: string) => Promise<void>;
  /** Reset ke state awal (untuk retry) */
  reset: () => void;
}

export function useBleProvisioning(): UseBleProvisioningReturn {
  const [status, setStatus] = useState<BleStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("Belum terhubung");
  const [isProvisioned, setIsProvisioned] = useState(false);

  const characteristicRef = useRef<{
    writeValue: (v: BufferSource) => Promise<void>;
  } | null>(null);
  // Simpan referensi GATT server agar bisa disconnect saat unmount
  const gattServerRef = useRef<{
    disconnect: () => void;
    connected: boolean;
  } | null>(null);

  const isSupported =
    typeof navigator !== "undefined" && "bluetooth" in navigator;

  const updateStatus = useCallback((s: BleStatus, msg: string) => {
    setStatus(s);
    setStatusMessage(msg);
  }, []);

  // Disconnect GATT saat komponen unmount agar tidak leak koneksi BLE
  useEffect(() => {
    return () => {
      if (gattServerRef.current?.connected) {
        try {
          gattServerRef.current.disconnect();
        } catch {
          // best-effort
        }
      }
    };
  }, []);

  const connect = useCallback(async () => {
    if (!isSupported) {
      updateStatus("error", "Web Bluetooth tidak didukung di browser ini");
      return;
    }

    updateStatus("connecting", "Mencari perangkat Flowin IoT...");

    try {
      const device = await (
        navigator as unknown as {
          bluetooth: {
            requestDevice: (opts: unknown) => Promise<{
              gatt: {
                connect: () => Promise<{
                  disconnect: () => void;
                  connected: boolean;
                  getPrimaryService: (uuid: string) => Promise<{
                    getCharacteristic: (uuid: string) => Promise<{
                      writeValue: (v: BufferSource) => Promise<void>;
                    }>;
                  }>;
                }>;
              };
            }>;
          };
        }
      ).bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
      });

      updateStatus("connecting", "Menghubungkan ke perangkat...");
      const server = await device.gatt.connect();
      gattServerRef.current = server;

      updateStatus("connecting", "Membuka BLE Service...");
      const service = await server.getPrimaryService(SERVICE_UUID);

      updateStatus("connecting", "Mendapatkan jalur karakteristik...");
      const characteristic =
        await service.getCharacteristic(CHARACTERISTIC_UUID);

      characteristicRef.current = characteristic;
      updateStatus("connected", "Terhubung ke Flowin IoT Device ✓");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      updateStatus("error", `Gagal terhubung: ${msg}`);
    }
  }, [isSupported, updateStatus]);

  const sendData = useCallback(
    async (pelangganId: string, seriMeteran: string) => {
      const char = characteristicRef.current;
      if (!char) {
        updateStatus("error", "Belum terhubung ke perangkat BLE");
        return;
      }
      if (!pelangganId.trim()) {
        updateStatus("error", "ID Pelanggan tidak boleh kosong");
        return;
      }
      if (!seriMeteran.trim()) {
        updateStatus("error", "Nomor seri meteran belum diisi");
        return;
      }

      const encoder = new TextEncoder();

      try {
        // --- Kirim USER_ID ---
        updateStatus("sending_user_id", "Mengirim User ID ke IoT...");
        const userPayload = encoder.encode(`USER_ID:${pelangganId.trim()}`);
        await char.writeValue(userPayload);

        // --- Kirim METER_NUM ---
        updateStatus("sending_meter", "Mengirim Nomor Meteran ke IoT...");
        const meterPayload = encoder.encode(`METER_NUM:${seriMeteran.trim()}`);
        await char.writeValue(meterPayload);

        setIsProvisioned(true);
        updateStatus(
          "done",
          "Provisioning selesai ✓ — USER_ID & METER_NUM berhasil dikirim",
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        updateStatus("error", `Gagal mengirim data: ${msg}`);
      }
    },
    [updateStatus],
  );

  const reset = useCallback(() => {
    if (gattServerRef.current?.connected) {
      try {
        gattServerRef.current.disconnect();
      } catch {
        /* best-effort */
      }
    }
    gattServerRef.current = null;
    characteristicRef.current = null;
    setIsProvisioned(false);
    updateStatus("idle", "Belum terhubung");
  }, [updateStatus]);

  return {
    status,
    statusMessage,
    isProvisioned,
    isSupported,
    connect,
    sendData,
    reset,
  };
}

"use client";

import dynamic from "next/dynamic";
import React from "react";
import { useLaporan } from "@/services/workOrderService";
import type { JenisLaporan, StatusLaporan } from "@/types/workOrder";
import { formatDate } from "@/libs/utils";
import StatusBadge from "@/components/atoms/StatusBadge";

// Leaflet hanya jalan di browser — load secara dinamis
const LaporanMap = dynamic(() => import("@/components/atoms/LaporanMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] rounded-xl bg-gray-100 border border-grey-stroke flex items-center justify-center">
      <p className="text-xs text-grey">Memuat peta...</p>
    </div>
  ),
});

// ─── Label & warna ────────────────────────────────────────────────────────────

const LABEL_JENIS_LAPORAN: Record<JenisLaporan, string> = {
  AirTidakMengalir: "Air Tidak Mengalir",
  AirKeruh: "Air Keruh",
  KebocoranPipa: "Kebocoran Pipa",
  MeteranBermasalah: "Meteran Bermasalah",
  KendalaLainnya: "Kendala Lainnya",
};

const LABEL_STATUS_LAPORAN: Record<StatusLaporan, string> = {
  Diajukan: "Diajukan",
  ProsesPerbaikan: "Proses Perbaikan",
  Selesai: "Selesai",
};

const WARNA_STATUS_LAPORAN: Record<StatusLaporan, string> = {
  Diajukan: "bg-yellow-100 text-yellow-800",
  ProsesPerbaikan: "bg-blue-100 text-blue-800",
  Selesai: "bg-green-100 text-green-800",
};

// ─── Sub-component ────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-medium text-grey uppercase tracking-wider">
        {label}
      </p>
      {typeof value === "string" ? (
        <p className="text-xs text-neutral-03 wrap-break-word">{value}</p>
      ) : (
        value
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface LaporanSectionProps {
  idLaporan: string;
}

export default function LaporanSection({ idLaporan }: LaporanSectionProps) {
  const { data, isLoading, isError } = useLaporan(idLaporan);
  const laporan = data?.laporan;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-grey-stroke p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 border-2 border-moss-stone border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-grey">Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  if (isError || !laporan) {
    return (
      <div className="bg-white rounded-xl border border-grey-stroke p-4">
        <p className="text-xs text-red-500">
          {isError ? "Gagal memuat laporan" : "Laporan tidak ditemukan"}
        </p>
      </div>
    );
  }

  const pengguna = laporan.pengguna;

  return (
    <div className="bg-white rounded-xl border border-grey-stroke p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-03">
            Detail Laporan
          </h3>
          <p className="text-xs text-grey mt-0.5">{laporan.NamaLaporan}</p>
        </div>
        <StatusBadge
          label={LABEL_STATUS_LAPORAN[laporan.Status]}
          colorClass={WARNA_STATUS_LAPORAN[laporan.Status]}
        />
      </div>

      {/* Info laporan */}
      <div className="grid grid-cols-2 gap-3">
        <Row
          label="Jenis Laporan"
          value={
            LABEL_JENIS_LAPORAN[laporan.JenisLaporan] ?? laporan.JenisLaporan
          }
        />
        <Row label="Alamat" value={laporan.Alamat} />
        <Row label="Masalah" value={laporan.Masalah} />
        {laporan.Catatan && <Row label="Catatan" value={laporan.Catatan} />}
        <Row label="Dilaporkan" value={formatDate(laporan.createdAt)} />
        <Row label="Diperbarui" value={formatDate(laporan.updatedAt)} />
      </div>

      {/* Foto-foto laporan */}
      {laporan.imageUrl.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-grey uppercase tracking-wider mb-2">
            Foto Laporan
          </p>
          <div className="flex gap-2 flex-wrap">
            {laporan.imageUrl.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Foto laporan ${i + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-grey-stroke hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-grey-stroke" />

      {/* Data pengguna pelapor */}
      <div>
        <p className="text-[10px] font-medium text-grey uppercase tracking-wider mb-2">
          Pelapor
        </p>
        {pengguna ? (
          <div className="grid grid-cols-2 gap-3">
            <Row label="Nama" value={pengguna.namaLengkap ?? "—"} />
            <Row label="Email" value={pengguna.email ?? "—"} />
            <Row label="No. HP" value={pengguna.noHp ?? "—"} />
            {pengguna.alamat && <Row label="Alamat" value={pengguna.alamat} />}
          </div>
        ) : (
          <p className="text-xs text-grey">Data pengguna tidak tersedia</p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-grey-stroke" />

      {/* Peta koordinat */}
      <div>
        <p className="text-[10px] font-medium text-grey uppercase tracking-wider mb-2">
          Lokasi Laporan
        </p>
        {laporan.Kordinat ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-4 text-xs text-grey">
              <span>
                <span className="font-medium text-neutral-03">Lat:</span>{" "}
                {laporan.Kordinat.latitude}
              </span>
              <span>
                <span className="font-medium text-neutral-03">Lng:</span>{" "}
                {laporan.Kordinat.longitude}
              </span>
            </div>
            <LaporanMap koordinat={laporan.Kordinat} alamat={laporan.Alamat} />
          </div>
        ) : (
          <p className="text-xs text-grey">Koordinat lokasi tidak tersedia</p>
        )}
      </div>
    </div>
  );
}

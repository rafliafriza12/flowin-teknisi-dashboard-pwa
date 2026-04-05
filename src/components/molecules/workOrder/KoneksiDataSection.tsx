"use client";

import React, { useState } from "react";
import Image from "next/image";
import StatusBadge from "@/components/atoms/StatusBadge";
import type { IKoneksiData, StatusPengajuan } from "@/types/workOrder";
import { formatDate } from "@/libs/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LABEL_STATUS_PENGAJUAN: Record<StatusPengajuan, string> = {
  PENDING: "Menunggu Verifikasi",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

const WARNA_STATUS_PENGAJUAN: Record<StatusPengajuan, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-medium text-grey uppercase tracking-wider">
        {label}
      </p>
      {typeof value === "string" ? (
        <p className="text-xs text-neutral-03 font-medium">{value || "—"}</p>
      ) : (
        value
      )}
    </div>
  );
}

function DocLink({ label, url }: { label: string; url: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-moss-stone underline underline-offset-2 hover:opacity-80 transition-opacity text-left"
      >
        {open ? "Tutup" : `Lihat ${label}`}
      </button>
      {open && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-grey-stroke bg-gray-50">
          <Image
            src={url}
            alt={label}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface KoneksiDataSectionProps {
  koneksiData: IKoneksiData;
}

const KoneksiDataSection: React.FC<KoneksiDataSectionProps> = ({
  koneksiData,
}) => {
  return (
    <div className="bg-white rounded-xl border border-grey-stroke overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-grey-stroke bg-gray-50/50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-03">
            Data Sambungan Baru
          </h3>
        </div>
        <StatusBadge
          label={LABEL_STATUS_PENGAJUAN[koneksiData.statusPengajuan]}
          colorClass={WARNA_STATUS_PENGAJUAN[koneksiData.statusPengajuan]}
        />
      </div>

      <div className="p-4 space-y-4">
        {/* Alasan penolakan — tampil jika REJECTED */}
        {koneksiData.statusPengajuan === "REJECTED" &&
          koneksiData.alasanPenolakan && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-700 font-medium mb-0.5">
                Alasan Penolakan
              </p>
              <p className="text-xs text-red-600">
                {koneksiData.alasanPenolakan}
              </p>
            </div>
          )}

        {/* ─── Data Pelanggan ──────────────────────────────── */}
        {koneksiData.pelanggan ? (
          <div>
            <p className="text-xs font-semibold text-neutral-03 mb-2 pb-1 border-b border-grey-stroke">
              Data Pelanggan
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <DataRow
                  label="Nama Lengkap"
                  value={koneksiData.pelanggan.namaLengkap}
                />
              </div>
              <DataRow label="Email" value={koneksiData.pelanggan.email} />
              <DataRow label="No. HP" value={koneksiData.pelanggan.noHp} />
              {koneksiData.pelanggan.alamat && (
                <div className="col-span-2">
                  <DataRow
                    label="Alamat Pelanggan"
                    value={koneksiData.pelanggan.alamat}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-gray-50 border border-grey-stroke">
            <p className="text-xs text-grey italic">
              Data pelanggan tidak tersedia
            </p>
          </div>
        )}

        {/* ─── Identitas ──────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-neutral-03 mb-2 pb-1 border-b border-grey-stroke">
            Identitas
          </p>
          <div className="grid grid-cols-2 gap-3">
            <DataRow label="NIK" value={koneksiData.nik} />
            <DataRow label="No. KK" value={koneksiData.noKK} />
            <DataRow label="No. IMB" value={koneksiData.imb} />
            <DataRow
              label="Luas Bangunan"
              value={`${koneksiData.luasBangunan} m²`}
            />
          </div>
        </div>

        {/* ─── Lokasi Pekerjaan ────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-neutral-03 mb-2 pb-1 border-b border-grey-stroke">
            Lokasi
          </p>
          <div className="grid grid-cols-1 gap-2">
            <DataRow label="Alamat" value={koneksiData.alamat} />
            <div className="grid grid-cols-2 gap-3">
              <DataRow label="Kelurahan" value={koneksiData.kelurahan} />
              <DataRow label="Kecamatan" value={koneksiData.kecamatan} />
            </div>
          </div>
        </div>

        {/* ─── Dokumen ────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-neutral-03 mb-2 pb-1 border-b border-grey-stroke">
            Dokumen
          </p>
          <div className="space-y-2">
            <DocLink label="KTP / NIK" url={koneksiData.nikUrl} />
            <DocLink label="Kartu Keluarga" url={koneksiData.kkUrl} />
            <DocLink label="IMB" url={koneksiData.imbUrl} />
          </div>
        </div>

        {/* ─── Timestamps ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-grey-stroke">
          <DataRow
            label="Tanggal Pengajuan"
            value={formatDate(koneksiData.createdAt)}
          />
          {koneksiData.tanggalVerifikasi && (
            <DataRow
              label="Tanggal Verifikasi"
              value={formatDate(koneksiData.tanggalVerifikasi)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default KoneksiDataSection;

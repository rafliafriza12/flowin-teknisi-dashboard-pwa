"use client";

import React from "react";
import Link from "next/link";
import { useMe } from "@/services/authService";
import { useWorkOrder, useWorkflowChain } from "@/services/workOrderService";
import StatusBadge from "@/components/atoms/StatusBadge";
import {
  WorkflowChainTimeline,
  ResponAwalSection,
  TimManagementSection,
  PengerjaanSection,
  RiwayatSection,
  KoneksiDataSection,
  LaporanSection,
} from "@/components/molecules/workOrder";
import {
  LABEL_JENIS_PEKERJAAN,
  LABEL_STATUS_PEKERJAAN,
  LABEL_STATUS_RESPON,
  WARNA_STATUS_PEKERJAAN,
  WARNA_STATUS_RESPON,
} from "@/types/workOrder";
import { formatDate } from "@/libs/utils";
import SimplePaperNoteIcon from "@/components/atoms/icons/SimplePaperNote";
import WorkOrderIcon from "@/components/atoms/icons/WorkOrderIcon";

// ─── Empty State ──────────────────────────────────────────────────────────────

const TugasKosong: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20 px-6">
    <div className="w-20 h-20 rounded-full bg-earn-craft-light flex items-center justify-center mb-5">
      <SimplePaperNoteIcon className="w-9 h-9 text-moss-stone" />
    </div>
    <h2 className="text-lg font-bold text-neutral-03 mb-2">
      Tidak Ada Tugas Aktif
    </h2>
    <p className="text-sm text-grey text-center max-w-xs mb-6">
      Kamu belum memiliki pekerjaan yang sedang aktif. Tugas akan muncul di sini
      setelah kamu menerima pekerjaan yang di-assign oleh admin.
    </p>
    <Link
      href="/pekerjaan"
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-moss-stone text-white text-sm font-medium hover:bg-moss-stone/90 transition-colors"
    >
      <WorkOrderIcon className="w-4 h-4" />
      Lihat Semua Pekerjaan
    </Link>
  </div>
);

// ─── Loading State ────────────────────────────────────────────────────────────

const TugasLoading: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-8 h-8 border-2 border-moss-stone border-t-transparent rounded-full animate-spin" />
    <p className="text-sm text-grey">Memuat tugas sekarang...</p>
  </div>
);

// ─── Detail Tugas (sama persis dengan PekerjaanDetailTemplate) ────────────────

const TugasDetail: React.FC<{ id: string }> = ({ id }) => {
  const { data, isLoading, isError, error } = useWorkOrder(id);
  const workOrder = data?.workOrder;

  const { data: chainData, isLoading: chainLoading } = useWorkflowChain(
    workOrder?.idKoneksiData ?? "",
  );

  if (isLoading) return <TugasLoading />;

  if (isError || !workOrder) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-sm text-red-600 font-medium">
            {isError
              ? "Gagal memuat data pekerjaan"
              : "Pekerjaan tidak ditemukan"}
          </p>
          <p className="text-xs text-grey mt-1">
            {error?.message || "Silakan coba lagi atau hubungi admin"}
          </p>
          <Link
            href="/pekerjaan"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-moss-stone text-white text-sm font-medium hover:bg-moss-stone/90 transition-colors"
          >
            Lihat Semua Pekerjaan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-earn-craft-light flex items-center justify-center">
          <SimplePaperNoteIcon className="w-4 h-4 text-moss-stone" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-neutral-03 leading-tight">
            Tugas Sekarang
          </h1>
          <p className="text-xs text-grey">
            Pekerjaan yang sedang aktif dikerjakan
          </p>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-grey-stroke p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-neutral-03">
              {LABEL_JENIS_PEKERJAAN[workOrder.jenisPekerjaan]}
            </h2>
            {workOrder.koneksiData ? (
              <p className="text-sm text-grey mt-0.5">
                📍 {workOrder.koneksiData.alamat},{" "}
                {workOrder.koneksiData.kelurahan},{" "}
                {workOrder.koneksiData.kecamatan}
              </p>
            ) : workOrder.jenisPekerjaan === "penyelesaian_laporan" ? (
              <p className="text-sm text-grey mt-0.5">
                📋 Penyelesaian laporan pelanggan
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge
              label={LABEL_STATUS_PEKERJAAN[workOrder.status]}
              colorClass={WARNA_STATUS_PEKERJAAN[workOrder.status]}
            />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoItem
            label="Status Respon"
            value={
              <StatusBadge
                label={LABEL_STATUS_RESPON[workOrder.statusRespon]}
                colorClass={WARNA_STATUS_RESPON[workOrder.statusRespon]}
              />
            }
          />
          <InfoItem
            label="Penanggung Jawab"
            value={workOrder.teknisiPenanggungJawab.namaLengkap}
          />
          <InfoItem label="Dibuat" value={formatDate(workOrder.createdAt)} />
          <InfoItem
            label="Diperbarui"
            value={formatDate(workOrder.updatedAt)}
          />
          {workOrder.workOrderSebelumnya && (
            <InfoItem
              label="WO Sebelumnya"
              value={
                <Link
                  href={`/pekerjaan/${workOrder.workOrderSebelumnya.id}`}
                  className="text-moss-stone underline text-xs"
                >
                  {LABEL_JENIS_PEKERJAAN[
                    workOrder.workOrderSebelumnya.jenisPekerjaan
                  ] || workOrder.workOrderSebelumnya.id.slice(-8)}
                </Link>
              }
            />
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main — 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <ResponAwalSection workOrder={workOrder} />
          <TimManagementSection workOrder={workOrder} />
          <PengerjaanSection workOrder={workOrder} />
          <RiwayatSection workOrder={workOrder} />
        </div>

        {/* Sidebar — 1 col */}
        <div className="flex flex-col gap-4">
          {workOrder.jenisPekerjaan === "penyelesaian_laporan" &&
            workOrder.idLaporan && (
              <LaporanSection idLaporan={workOrder.idLaporan} />
            )}
          {workOrder.koneksiData && (
            <KoneksiDataSection koneksiData={workOrder.koneksiData} />
          )}
          {!chainLoading && chainData?.workflowChain && (
            <WorkflowChainTimeline
              chain={chainData.workflowChain.filter(
                (item) => item.jenisPekerjaan !== "penyelesaian_laporan",
              )}
            />
          )}
          {workOrder.alasanPenolakan && (
            <div className="bg-white rounded-xl border border-grey-stroke p-4">
              <h3 className="text-sm font-semibold text-neutral-03 mb-2">
                Alasan Penolakan
              </h3>
              <p className="text-xs text-grey">{workOrder.alasanPenolakan}</p>
              {workOrder.catatanReviewPenolakan && (
                <div className="mt-2 p-2 rounded-lg bg-gray-50">
                  <p className="text-xs text-grey">
                    <span className="font-medium">Review:</span>{" "}
                    {workOrder.catatanReviewPenolakan}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-grey uppercase tracking-wider mb-0.5">
        {label}
      </p>
      {typeof value === "string" ? (
        <p className="text-xs text-neutral-03">{value}</p>
      ) : (
        value
      )}
    </div>
  );
}

// ─── Main Template ────────────────────────────────────────────────────────────

const TugasSekarangTemplate: React.FC = () => {
  const { data: meData, isLoading: meLoading } = useMe();
  const pekerjaanSekarangId = meData?.me?.pekerjaanSekarang;

  if (meLoading) return <TugasLoading />;

  if (!pekerjaanSekarangId) return <TugasKosong />;

  return <TugasDetail id={pekerjaanSekarangId} />;
};

export default TugasSekarangTemplate;

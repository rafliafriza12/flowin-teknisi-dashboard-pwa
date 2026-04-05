"use client";

import React from "react";
import Link from "next/link";
import { useWorkOrder, useWorkflowChain } from "@/services/workOrderService";
import StatusBadge from "@/components/atoms/StatusBadge";
import {
  WorkflowChainTimeline,
  ResponAwalSection,
  TimManagementSection,
  PengerjaanSection,
  RiwayatSection,
  KoneksiDataSection,
} from "@/components/molecules/workOrder";
import {
  LABEL_JENIS_PEKERJAAN,
  LABEL_STATUS_PEKERJAAN,
  LABEL_STATUS_RESPON,
  WARNA_STATUS_PEKERJAAN,
  WARNA_STATUS_RESPON,
} from "@/types/workOrder";
import { formatDate } from "@/libs/utils";

interface PekerjaanDetailTemplateProps {
  id: string;
}

const PekerjaanDetailTemplate: React.FC<PekerjaanDetailTemplateProps> = ({
  id,
}) => {
  const { data, isLoading, isError, error } = useWorkOrder(id);
  const workOrder = data?.workOrder;

  const { data: chainData, isLoading: chainLoading } = useWorkflowChain(
    workOrder?.idKoneksiData || "",
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-moss-stone border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-grey">Memuat detail pekerjaan...</p>
        </div>
      </div>
    );
  }

  if (isError || !workOrder) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-sm text-red-600 font-medium">
            {isError ? "Gagal memuat data" : "Pekerjaan tidak ditemukan"}
          </p>
          <p className="text-xs text-grey mt-1">
            {error?.message || "Work order tidak ditemukan"}
          </p>
          <Link
            href="/pekerjaan"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-moss-stone text-white text-sm font-medium hover:bg-moss-stone/90 transition-colors"
          >
            ← Kembali ke Daftar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/pekerjaan"
          className="text-grey hover:text-moss-stone transition-colors"
        >
          Pekerjaan
        </Link>
        <span className="text-grey">/</span>
        <span className="text-neutral-03 font-medium">
          {LABEL_JENIS_PEKERJAAN[workOrder.jenisPekerjaan]}
        </span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-grey-stroke p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-bold text-neutral-03">
              {LABEL_JENIS_PEKERJAAN[workOrder.jenisPekerjaan]}
            </h1>
            {workOrder.koneksiData ? (
              <p className="text-sm text-grey mt-0.5">
                📍 {workOrder.koneksiData.alamat},{" "}
                {workOrder.koneksiData.kelurahan},{" "}
                {workOrder.koneksiData.kecamatan}
              </p>
            ) : null}
          </div>
          <StatusBadge
            label={LABEL_STATUS_PEKERJAAN[workOrder.status]}
            colorClass={WARNA_STATUS_PEKERJAAN[workOrder.status]}
          />
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

      {/* Two-column layout for larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content — 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Respon Awal — only shows if needed */}
          <ResponAwalSection workOrder={workOrder} />

          {/* Tim Management */}
          <TimManagementSection workOrder={workOrder} />

          {/* Pengerjaan */}
          <PengerjaanSection workOrder={workOrder} />

          {/* Riwayat */}
          <RiwayatSection workOrder={workOrder} />
        </div>

        {/* Sidebar — 1 col */}
        <div className="flex flex-col gap-4">
          {/* Koneksi Data */}
          {workOrder.koneksiData && (
            <KoneksiDataSection koneksiData={workOrder.koneksiData} />
          )}

          {/* Workflow Chain */}
          {!chainLoading && chainData?.workflowChain && (
            <WorkflowChainTimeline chain={chainData.workflowChain} />
          )}

          {/* Alasan Penolakan (jika ada) */}
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

// ─── Helper Component ─────────────────────────────────────────────────────────

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

export default PekerjaanDetailTemplate;

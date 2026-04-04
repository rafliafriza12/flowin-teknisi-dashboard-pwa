"use client";

import React, { useState } from "react";
import { useWorkOrdersSaya } from "@/services/workOrderService";
import { WorkOrderCard } from "@/components/molecules/workOrder";
import type { StatusPekerjaan, JenisPekerjaan } from "@/types/workOrder";
import {
  LABEL_STATUS_PEKERJAAN,
  LABEL_JENIS_PEKERJAAN,
} from "@/types/workOrder";

const FILTER_STATUS: (StatusPekerjaan | "semua")[] = [
  "semua",
  "menunggu_respon",
  "menunggu_tim",
  "tim_diajukan",
  "ditugaskan",
  "sedang_dikerjakan",
  "dikirim",
  "revisi",
  "selesai",
  "dibatalkan",
];

const PekerjaanListTemplate: React.FC = () => {
  const [activeStatus, setActiveStatus] = useState<StatusPekerjaan | "semua">(
    "semua",
  );
  const [activeJenis, setActiveJenis] = useState<JenisPekerjaan | "semua">(
    "semua",
  );
  const [page, setPage] = useState(1);

  const filters: Record<string, unknown> = { page, limit: 20 };
  if (activeStatus !== "semua") filters.status = activeStatus;
  if (activeJenis !== "semua") filters.jenisPekerjaan = activeJenis;

  const { data, isLoading, isError, error } = useWorkOrdersSaya(
    filters as Parameters<typeof useWorkOrdersSaya>[0],
  );

  const workOrders = data?.workOrdersSaya?.data || [];
  const pagination = data?.workOrdersSaya?.pagination;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-03">Pekerjaan Saya</h1>
        <p className="text-sm text-grey mt-1">
          Daftar semua pekerjaan yang ditugaskan kepada Anda
        </p>
      </div>

      {/* Filter: Jenis Pekerjaan */}
      <div>
        <label className="text-xs font-medium text-grey mb-1.5 block">
          Jenis Pekerjaan
        </label>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveJenis("semua");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeJenis === "semua"
                ? "bg-moss-stone text-white"
                : "bg-gray-100 text-neutral-03 hover:bg-gray-200"
            }`}
          >
            Semua
          </button>
          {(Object.keys(LABEL_JENIS_PEKERJAAN) as JenisPekerjaan[]).map(
            (jenis) => (
              <button
                key={jenis}
                type="button"
                onClick={() => {
                  setActiveJenis(jenis);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeJenis === jenis
                    ? "bg-moss-stone text-white"
                    : "bg-gray-100 text-neutral-03 hover:bg-gray-200"
                }`}
              >
                {LABEL_JENIS_PEKERJAAN[jenis]}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Filter: Status */}
      <div>
        <label className="text-xs font-medium text-grey mb-1.5 block">
          Status
        </label>
        <div className="flex gap-2 flex-wrap">
          {FILTER_STATUS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setActiveStatus(status);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeStatus === status
                  ? "bg-moss-stone text-white"
                  : "bg-gray-100 text-neutral-03 hover:bg-gray-200"
              }`}
            >
              {status === "semua" ? "Semua" : LABEL_STATUS_PEKERJAAN[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-moss-stone border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-grey">Memuat pekerjaan...</p>
          </div>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-sm text-red-600 font-medium">
              Gagal memuat data
            </p>
            <p className="text-xs text-grey mt-1">
              {error?.message || "Terjadi kesalahan"}
            </p>
          </div>
        </div>
      ) : workOrders.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-sm font-medium text-neutral-03">
              Belum ada pekerjaan
            </p>
            <p className="text-xs text-grey mt-1">
              Pekerjaan yang ditugaskan akan muncul di sini
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {workOrders.map((wo) => (
              <WorkOrderCard key={wo.id} workOrder={wo} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-grey-stroke text-sm text-neutral-03 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ← Sebelumnya
              </button>
              <span className="text-sm text-grey">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-grey-stroke text-sm text-neutral-03 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Selanjutnya →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PekerjaanListTemplate;

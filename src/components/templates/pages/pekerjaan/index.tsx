"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWorkOrdersSaya } from "@/services/workOrderService";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TablePagination,
} from "@/components/molecules/table";
import StatusBadge from "@/components/atoms/StatusBadge";
import type { StatusPekerjaan, JenisPekerjaan } from "@/types/workOrder";
import {
  LABEL_STATUS_PEKERJAAN,
  LABEL_JENIS_PEKERJAAN,
  WARNA_STATUS_PEKERJAAN,
  WARNA_STATUS_RESPON,
  LABEL_STATUS_RESPON,
} from "@/types/workOrder";
import { formatDate } from "@/libs/utils";

const SELECT_CLASS =
  "px-3 py-2 text-sm border border-grey-stroke rounded-lg bg-white text-neutral-02 focus:outline-none focus:ring-1 focus:ring-moss-stone appearance-none pr-8 bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem]";

const PekerjaanListTemplate: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<StatusPekerjaan | "">("");
  const [filterJenis, setFilterJenis] = useState<JenisPekerjaan | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filters: Record<string, unknown> = { page, limit };
  if (filterStatus) filters.status = filterStatus;
  if (filterJenis) filters.jenisPekerjaan = filterJenis;

  const { data, isLoading, isError, error } = useWorkOrdersSaya(
    filters as Parameters<typeof useWorkOrdersSaya>[0],
  );

  const workOrders = data?.workOrdersSaya?.data || [];
  const pagination = data?.workOrdersSaya?.pagination;

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-03">Pekerjaan Saya</h1>
        <p className="text-sm text-grey mt-1">
          Daftar semua pekerjaan yang ditugaskan kepada Anda
        </p>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Filter Jenis Pekerjaan */}
        <div className="relative">
          <select
            value={filterJenis}
            onChange={(e) => {
              setFilterJenis(e.target.value as JenisPekerjaan | "");
              handleFilterChange();
            }}
            className={SELECT_CLASS}
          >
            <option value="">Semua Jenis</option>
            {(Object.keys(LABEL_JENIS_PEKERJAAN) as JenisPekerjaan[]).map(
              (jenis) => (
                <option key={jenis} value={jenis}>
                  {LABEL_JENIS_PEKERJAAN[jenis]}
                </option>
              ),
            )}
          </select>
          <ChevronDown />
        </div>

        {/* Filter Status */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as StatusPekerjaan | "");
              handleFilterChange();
            }}
            className={SELECT_CLASS}
          >
            <option value="">Semua Status</option>
            {(Object.keys(LABEL_STATUS_PEKERJAAN) as StatusPekerjaan[]).map(
              (status) => (
                <option key={status} value={status}>
                  {LABEL_STATUS_PEKERJAAN[status]}
                </option>
              ),
            )}
          </select>
          <ChevronDown />
        </div>

        {/* Reset */}
        {(filterStatus || filterJenis) && (
          <button
            type="button"
            onClick={() => {
              setFilterStatus("");
              setFilterJenis("");
              setPage(1);
            }}
            className="px-3 py-2 text-sm text-grey hover:text-neutral-02 border border-grey-stroke rounded-lg hover:bg-grey-lightest transition-colors"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Jenis Pekerjaan</TableHead>
            <TableHead>ID Koneksi Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Status Respon</TableHead>
            <TableHead>Penanggung Jawab</TableHead>
            <TableHead>Tim</TableHead>
            <TableHead>Tanggal Dibuat</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <tr>
              <td colSpan={9} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-7 h-7 border-2 border-moss-stone border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-grey">Memuat data...</p>
                </div>
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td colSpan={9} className="px-4 py-16 text-center">
                <p className="text-sm text-red-500">
                  {error?.message || "Gagal memuat data"}
                </p>
              </td>
            </tr>
          ) : workOrders.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-16 text-center">
                <p className="text-sm font-medium text-neutral-03">
                  Belum ada pekerjaan
                </p>
                <p className="text-xs text-grey mt-1">
                  Pekerjaan yang ditugaskan akan muncul di sini
                </p>
              </td>
            </tr>
          ) : (
            workOrders.map((wo, index) => {
              const rowNo = (page - 1) * limit + index + 1;
              const needsAction =
                wo.statusRespon === "belum_direspon" ||
                wo.statusRespon === "penolakan_ditolak";

              return (
                <TableRow key={wo.id}>
                  {/* No */}
                  <TableCell className="text-grey font-medium w-12">
                    {rowNo}
                  </TableCell>

                  {/* Jenis Pekerjaan */}
                  <TableCell>
                    <span className="font-medium text-neutral-02">
                      {LABEL_JENIS_PEKERJAAN[wo.jenisPekerjaan]}
                    </span>
                  </TableCell>

                  {/* ID Koneksi Data */}
                  <TableCell>
                    <span className="font-mono text-xs text-grey">
                      {wo.idKoneksiData}
                    </span>
                  </TableCell>

                  {/* Status Pekerjaan */}
                  <TableCell>
                    <StatusBadge
                      label={LABEL_STATUS_PEKERJAAN[wo.status]}
                      colorClass={WARNA_STATUS_PEKERJAAN[wo.status]}
                    />
                  </TableCell>

                  {/* Status Respon */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge
                        label={LABEL_STATUS_RESPON[wo.statusRespon]}
                        colorClass={WARNA_STATUS_RESPON[wo.statusRespon]}
                      />
                      {needsAction && (
                        <span
                          className="text-yellow-500 text-xs"
                          title="Perlu respon Anda"
                        >
                          ⚠️
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Penanggung Jawab */}
                  <TableCell>
                    <div>
                      <p className="text-neutral-02 font-medium text-xs">
                        {wo.teknisiPenanggungJawab.namaLengkap}
                      </p>
                      <p className="text-grey text-[11px]">
                        {wo.teknisiPenanggungJawab.nip}
                      </p>
                    </div>
                  </TableCell>

                  {/* Tim */}
                  <TableCell>
                    {wo.tim.length === 0 ? (
                      <span className="text-xs text-grey">—</span>
                    ) : (
                      <span className="text-xs text-neutral-02">
                        {wo.tim.length} anggota
                      </span>
                    )}
                  </TableCell>

                  {/* Tanggal Dibuat */}
                  <TableCell>
                    <span className="text-xs text-neutral-02">
                      {formatDate(wo.createdAt)}
                    </span>
                  </TableCell>

                  {/* Aksi */}
                  <TableCell>
                    <Link
                      href={`/pekerjaan/${wo.id}`}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-moss-stone text-moss-stone hover:bg-moss-stone hover:text-white transition-colors whitespace-nowrap"
                    >
                      Lihat Detail
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {!isLoading && !isError && pagination && (
        <TablePagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          itemsPerPage={limit}
          onItemsPerPageChange={(val) => {
            setLimit(val);
            setPage(1);
          }}
        />
      )}
    </div>
  );
};

// ─── Chevron Icon ─────────────────────────────────────────────────────────────

function ChevronDown() {
  return (
    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
      <svg
        className="w-4 h-4 text-grey"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 6L8 10L12 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default PekerjaanListTemplate;

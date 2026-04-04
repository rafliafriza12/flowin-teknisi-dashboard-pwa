"use client";

import Link from "next/link";
import StatusBadge from "@/components/atoms/StatusBadge";
import {
  IWorkOrder,
  LABEL_JENIS_PEKERJAAN,
  LABEL_STATUS_PEKERJAAN,
  LABEL_STATUS_RESPON,
  WARNA_STATUS_PEKERJAAN,
  WARNA_STATUS_RESPON,
} from "@/types/workOrder";
import { formatDate } from "@/libs/utils";

interface WorkOrderCardProps {
  workOrder: IWorkOrder;
}

const WorkOrderCard: React.FC<WorkOrderCardProps> = ({ workOrder }) => {
  const needsRespon = workOrder.statusRespon === "belum_direspon";
  const penolakanDitolak = workOrder.statusRespon === "penolakan_ditolak";

  return (
    <Link href={`/pekerjaan/${workOrder.id}`}>
      <div className="bg-white rounded-xl border border-grey-stroke p-4 hover:shadow-md transition-shadow cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-03 truncate">
              {LABEL_JENIS_PEKERJAAN[workOrder.jenisPekerjaan]}
            </p>
            <p className="text-xs text-grey mt-0.5">
              ID Koneksi: {workOrder.idKoneksiData}
            </p>
          </div>
          <StatusBadge
            label={LABEL_STATUS_PEKERJAAN[workOrder.status]}
            colorClass={WARNA_STATUS_PEKERJAAN[workOrder.status]}
          />
        </div>

        {/* Respon badge — highlight jika perlu respon */}
        {(needsRespon || penolakanDitolak) && (
          <div className="mb-3 p-2.5 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 text-sm">⚠️</span>
              <p className="text-xs font-medium text-yellow-800">
                {needsRespon
                  ? "Pekerjaan ini membutuhkan respon Anda"
                  : "Penolakan ditolak — silakan terima pekerjaan ini"}
              </p>
            </div>
          </div>
        )}

        {/* Status Respon */}
        {workOrder.statusRespon !== "diterima" && (
          <div className="mb-3">
            <StatusBadge
              label={LABEL_STATUS_RESPON[workOrder.statusRespon]}
              colorClass={WARNA_STATUS_RESPON[workOrder.statusRespon]}
            />
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-grey">
          <span>
            Tim:{" "}
            {workOrder.tim.length > 0
              ? `${workOrder.tim.length} anggota`
              : "Belum ada"}
          </span>
          <span>{formatDate(workOrder.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
};

export default WorkOrderCard;

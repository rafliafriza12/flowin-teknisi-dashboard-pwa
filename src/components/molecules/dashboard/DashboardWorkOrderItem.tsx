import React from "react";
import Link from "next/link";
import StatusBadge from "@/components/atoms/StatusBadge";
import {
  JenisPekerjaan,
  StatusPekerjaan,
  LABEL_JENIS_PEKERJAAN,
  LABEL_STATUS_PEKERJAAN,
  WARNA_STATUS_PEKERJAAN,
} from "@/types/workOrder";
import { formatDate } from "@/libs/utils";
import WorkOrderIcon from "@/components/atoms/icons/WorkOrderIcon";

export interface DashboardWorkOrderData {
  id: string;
  jenisPekerjaan: JenisPekerjaan;
  status: StatusPekerjaan;
  createdAt: string;
  koneksiData?: { alamat?: string | null; kelurahan?: string | null } | null;
}

interface DashboardWorkOrderItemProps {
  workOrder: DashboardWorkOrderData;
}

const DashboardWorkOrderItem: React.FC<DashboardWorkOrderItemProps> = ({
  workOrder,
}) => {
  const alamat =
    workOrder.koneksiData?.alamat ??
    workOrder.koneksiData?.kelurahan ??
    "Laporan pelanggan";

  return (
    <Link
      href={`/pekerjaan/${workOrder.id}`}
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-grey-lightest transition-colors group"
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-moss-stone/10 flex items-center justify-center shrink-0 border border-grey-stroke">
        <WorkOrderIcon className="w-4 h-4 text-moss-stone" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-neutral-03 truncate group-hover:text-moss-stone transition-colors">
          {LABEL_JENIS_PEKERJAAN[workOrder.jenisPekerjaan]}
        </p>
        <p className="text-[11px] text-grey truncate mt-0.5">{alamat}</p>
        <p className="text-[10px] text-grey/70 mt-0.5">
          {formatDate(workOrder.createdAt)}
        </p>
      </div>

      {/* Status badge */}
      <div className="shrink-0">
        <StatusBadge
          label={LABEL_STATUS_PEKERJAAN[workOrder.status]}
          colorClass={WARNA_STATUS_PEKERJAAN[workOrder.status]}
          className="text-[10px]"
        />
      </div>
    </Link>
  );
};

export default DashboardWorkOrderItem;

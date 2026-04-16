"use client";

import React from "react";
import Link from "next/link";
import DashboardWorkOrderItem, {
  DashboardWorkOrderData,
} from "@/components/molecules/dashboard/DashboardWorkOrderItem";

interface Props {
  title: string;
  workOrders: DashboardWorkOrderData[];
  isLoading: boolean;
  href?: string;
}

const SkeletonItem = () => (
  <div className="flex gap-3 items-center animate-pulse">
    <div className="w-9 h-9 rounded-xl bg-grey/20 shrink-0" />
    <div className="flex-1 flex flex-col gap-1.5">
      <div className="h-3 bg-grey/20 rounded w-3/4" />
      <div className="h-2.5 bg-grey/10 rounded w-1/2" />
    </div>
  </div>
);

const DashboardListSection: React.FC<Props> = ({
  title,
  workOrders,
  isLoading,
  href,
}) => {
  return (
    <div className="bg-neutral-01 rounded-2xl p-4 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-02">{title}</p>
        {href && (
          <Link
            href={href}
            className="text-xs text-moss-stone hover:underline font-medium"
          >
            Lihat semua
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonItem key={i} />)
        ) : workOrders.length === 0 ? (
          <p className="text-xs text-grey text-center py-4">
            Tidak ada pekerjaan
          </p>
        ) : (
          workOrders
            .slice(0, 5)
            .map((wo) => <DashboardWorkOrderItem key={wo.id} workOrder={wo} />)
        )}
      </div>
    </div>
  );
};

export default DashboardListSection;

"use client";

import React, { useMemo } from "react";
import DistribusiJenisChart, {
  DistribusiDataPoint,
} from "@/components/molecules/dashboard/DistribusiJenisChart";
import { DistribusiJenisItem } from "@/services/workOrderService";
import { JenisPekerjaan, LABEL_JENIS_PEKERJAAN } from "@/types/workOrder";

const COLORS: Record<string, string> = {
  survei: "#1F2375",
  pemasangan: "#3B41A3",
  rab: "#4E9AF1",
  pengawasan_pemasangan: "#C5C7F0",
  pengawasan_setelah_pemasangan: "#8B90DC",
  penyelesaian_laporan: "#F5A623",
};

interface Props {
  distribusiJenis: DistribusiJenisItem[];
  isLoading: boolean;
}

const DashboardDistribusiSection: React.FC<Props> = ({
  distribusiJenis,
  isLoading,
}) => {
  const data = useMemo((): DistribusiDataPoint[] => {
    return distribusiJenis
      .filter((item) => item.total > 0)
      .map((item) => ({
        name: LABEL_JENIS_PEKERJAAN[item.jenis as JenisPekerjaan] ?? item.jenis,
        value: item.total,
        color: COLORS[item.jenis] ?? "#ccc",
      }));
  }, [distribusiJenis]);

  return (
    <div className="bg-neutral-01 rounded-2xl p-4 flex flex-col gap-4 w-full h-full">
      <p className="text-sm font-semibold text-neutral-02">
        Distribusi Jenis Pekerjaan
      </p>
      {isLoading ? (
        <div className="h-48 bg-grey/10 animate-pulse rounded-xl" />
      ) : data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-grey">
          Belum ada data
        </div>
      ) : (
        <DistribusiJenisChart data={data} />
      )}
    </div>
  );
};

export default DashboardDistribusiSection;

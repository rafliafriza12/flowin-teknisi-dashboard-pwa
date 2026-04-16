"use client";

import React, { useState } from "react";
import GrafikPekerjaanChart from "@/components/molecules/dashboard/GrafikPekerjaanChart";
import { GrafikDataPoint } from "@/services/workOrderService";

type FilterType = "mingguan" | "bulanan" | "tahunan";

interface Props {
  grafikMingguan: GrafikDataPoint[];
  grafikBulanan: GrafikDataPoint[];
  grafikTahunan: GrafikDataPoint[];
  isLoading: boolean;
}

const DashboardGrafikSection: React.FC<Props> = ({
  grafikMingguan,
  grafikBulanan,
  grafikTahunan,
  isLoading,
}) => {
  const [filter, setFilter] = useState<FilterType>("bulanan");

  const chartData =
    filter === "mingguan"
      ? grafikMingguan
      : filter === "tahunan"
        ? grafikTahunan
        : grafikBulanan;

  return (
    <div className="bg-neutral-01 rounded-2xl p-4 flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-02">
          Grafik Pekerjaan
        </p>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          className="text-xs border border-grey-stroke rounded-lg px-2.5 py-1.5 bg-neutral-01 text-neutral-02 focus:outline-none focus:ring-1 focus:ring-moss-stone cursor-pointer"
        >
          <option value="mingguan">Mingguan</option>
          <option value="bulanan">Bulanan</option>
          <option value="tahunan">Tahunan</option>
        </select>
      </div>
      {isLoading ? (
        <div className="h-48 bg-grey/10 animate-pulse rounded-xl" />
      ) : (
        <GrafikPekerjaanChart data={chartData} />
      )}
    </div>
  );
};

export default DashboardGrafikSection;

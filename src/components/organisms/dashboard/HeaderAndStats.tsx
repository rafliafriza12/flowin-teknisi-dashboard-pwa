"use client";

import React from "react";
import { Heading3 } from "@/components/atoms/Typography";
import { StatCard } from "@/components/molecules/dashboard/StatCard";
import { useMe } from "@/services/authService";
import { DashboardStatType } from "@/constant/dashboard/stat";
import { useDashboardStats } from "@/services/workOrderService";
import WorkOrderIcon from "@/components/atoms/icons/WorkOrderIcon";
import CalendarIcon from "@/components/atoms/icons/CalendarIcon";
import SuccessIcon from "@/components/atoms/icons/SuccessIcon";
import WarningIcon from "@/components/atoms/icons/WarningIcon";

const StatSkeleton = () => (
  <div className="bg-neutral-01 flex flex-col gap-6 p-4 rounded-2xl animate-pulse">
    <div className="flex w-full gap-2 items-center">
      <div className="rounded-md bg-moss-stone/30 p-1.5 w-7 h-7" />
      <div className="h-3 bg-grey/30 rounded w-32" />
    </div>
    <div className="h-7 bg-grey/30 rounded w-24" />
    <div className="flex gap-1.5">
      <div className="h-3 bg-grey/20 rounded w-10" />
      <div className="h-3 bg-grey/20 rounded w-28" />
    </div>
  </div>
);

const HeaderAndStats: React.FC = () => {
  const { data: meData } = useMe();
  const { data: statsData, isLoading } = useDashboardStats();
  const user = meData?.me;
  const stats_raw = statsData?.dashboardStats;

  const totalAll =
    (stats_raw?.totalSelesai ?? 0) + (stats_raw?.totalBelumSelesai ?? 0);

  const pctSelesai =
    totalAll > 0
      ? Math.round(((stats_raw?.totalSelesai ?? 0) / totalAll) * 100)
      : 0;
  const pctBelum =
    totalAll > 0
      ? Math.round(((stats_raw?.totalBelumSelesai ?? 0) / totalAll) * 100)
      : 0;

  const stats: DashboardStatType[] = [
    {
      icon: <WorkOrderIcon className="w-6 h-6 text-neutral-01" />,
      title: "Total Pekerjaan (Hari ini)",
      value: stats_raw?.totalHariIni ?? 0,
      indicator: "up",
      progress: "",
      description: "total pekerjaan ditugaskan",
    },
    {
      icon: <CalendarIcon className="w-6 h-6 text-neutral-01" />,
      title: "Total Pekerjaan (Bulan ini)",
      value: (stats_raw?.totalBulanIni ?? 0).toLocaleString("id-ID"),
      indicator: "up",
      progress: "",
      description: "total pekerjaan bulan ini",
    },
    {
      icon: <SuccessIcon className="w-6 h-6 text-neutral-01" />,
      title: "Pekerjaan Selesai",
      value: stats_raw?.totalSelesai ?? 0,
      indicator: "up",
      progress: `${pctSelesai}%`,
      description: "dari total pekerjaan",
    },
    {
      icon: <WarningIcon className="w-6 h-6 text-neutral-01" />,
      title: "Pekerjaan Belum Selesai",
      value: stats_raw?.totalBelumSelesai ?? 0,
      indicator: "down",
      progress: `${pctBelum}%`,
      description: "dari total pekerjaan",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Heading3>Dashboard</Heading3>
        <p className="text-sm text-grey font-normal">
          Selamat datang kembali, {user?.namaLengkap ?? "Teknisi"}
        </p>
      </div>
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : stats.map((stat, index) => <StatCard key={index} {...stat} />)}
      </div>
    </div>
  );
};

export default HeaderAndStats;

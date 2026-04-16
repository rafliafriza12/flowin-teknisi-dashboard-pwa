"use client";

import React from "react";
import HeaderAndStats from "@/components/organisms/dashboard/HeaderAndStats";
import DashboardGrafikSection from "@/components/organisms/dashboard/DashboardGrafikSection";
import DashboardDistribusiSection from "@/components/organisms/dashboard/DashboardDistribusiSection";
import DashboardListSection from "@/components/organisms/dashboard/DashboardListSection";
import { useDashboardStats } from "@/services/workOrderService";

const DashboardPageTemplate = () => {
  const { data: statsData, isLoading } = useDashboardStats();
  const stats = statsData?.dashboardStats;

  return (
    <div className="w-full flex flex-col gap-4">
      <HeaderAndStats />

      <DashboardGrafikSection
        grafikMingguan={stats?.grafikMingguan ?? []}
        grafikBulanan={stats?.grafikBulanan ?? []}
        grafikTahunan={stats?.grafikTahunan ?? []}
        isLoading={isLoading}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardListSection
          title="Pekerjaan Hari Ini"
          workOrders={stats?.pekerjaanHariIni ?? []}
          isLoading={isLoading}
          href="/pekerjaan"
        />
        <DashboardListSection
          title="Pekerjaan Terakhir"
          workOrders={stats?.pekerjaanTerakhir ?? []}
          isLoading={isLoading}
          href="/pekerjaan"
        />
        <DashboardDistribusiSection
          distribusiJenis={stats?.distribusiJenis ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default DashboardPageTemplate;

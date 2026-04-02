"use client";

import { Heading3 } from "@/components/atoms/Typography";
import { StatCard } from "@/components/molecules/dashboard/StatCard";
import { useAnalyticsStats } from "@/services/analyticsService";
import ClosedBookIcon from "@/components/atoms/icons/ClosedBookIcon";
import OpenedBookIcon from "@/components/atoms/icons/OpenedBookIcon";
import ThreeUserGroupIcon from "@/components/atoms/icons/ThreeUserGroupIcon";
import TwoUserGroupIcon from "@/components/atoms/icons/TwoUserGroupIcon";

import { DashboardStatType } from "@/constant/dashboard/stat";

// Skeleton pulse for loading state
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

const HeaderAndStats = () => {
  const { data: gaStats, isLoading: gaLoading } = useAnalyticsStats();

  const isLoading = gaLoading;

  const formatChange = (change: number) =>
    `${Math.abs(change).toFixed(1)}%`;



  const stats: DashboardStatType[] = [
    {
      icon: <TwoUserGroupIcon className="w-4 h-4 text-neutral-01" />,
      title: "Total Visitors (Today)",
      value: (gaStats?.visitorsToday ?? 0).toLocaleString(),
      indicator: (gaStats?.visitorsTodayChange ?? 0) >= 0 ? "up" : "down",
      progress: formatChange(gaStats?.visitorsTodayChange ?? 0),
      description: "compared to yesterday",
    },
    {
      icon: <ThreeUserGroupIcon className="w-4 h-4 text-neutral-01" />,
      title: "Total Visitors (This Month)",
      value: (gaStats?.visitorsThisMonth ?? 0).toLocaleString(),
      indicator: (gaStats?.visitorsThisMonthChange ?? 0) >= 0 ? "up" : "down",
      progress: formatChange(gaStats?.visitorsThisMonthChange ?? 0),
      description: "compared to last month",
    },
    {
      icon: <OpenedBookIcon className="w-4 h-4 text-neutral-01" />,
      title: "Published Content",
      value: "—",
      indicator: "up",
      progress: "—",
      description: "total in CMS",
    },
    {
      icon: <ClosedBookIcon className="w-4 h-4 text-neutral-01" />,
      title: "Total Article Views",
      value: (gaStats?.visitorsThisMonth ?? 0).toLocaleString(),
      indicator: (gaStats?.visitorsThisMonthChange ?? 0) >= 0 ? "up" : "down",
      progress: formatChange(gaStats?.visitorsThisMonthChange ?? 0),
      description: "page views this month",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Heading3>Dashboard</Heading3>
        <p className="text-xs text-grey font-normal">
          Summary of key metrics and statistics
        </p>
      </div>
      <div className="w-full grid grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
      </div>
    </div>
  );
};

export default HeaderAndStats;

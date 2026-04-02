"use client";

import ChevronLeftIcon from "@/components/atoms/icons/ChevronLeftIcon";
import { Heading5 } from "@/components/atoms/Typography";
import { useMonthlyTraffic } from "@/services/analyticsService";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PERIOD_OPTIONS: { label: string; months: number }[] = [
  { label: "3 Months", months: 3 },
  { label: "6 Months", months: 6 },
  { label: "12 Months", months: 12 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
        <p className="text-xs text-grey mb-1">{payload[0].payload.Month}</p>
        <p className="text-xs font-medium">
          <span className="text-moss-stone">
            {payload[0].value?.toLocaleString()}
          </span>{" "}
          <span className="text-neutral-02">Visitors</span>
        </p>
      </div>
    );
  }
  return null;
};

// Loading skeleton
const ChartSkeleton = () => (
  <div className="w-full h-full flex flex-col gap-3 animate-pulse">
    <div className="flex justify-between">
      <div className="h-5 w-48 bg-grey/20 rounded" />
      <div className="h-8 w-28 bg-grey/20 rounded-lg" />
    </div>
    <div className="flex-1 bg-grey/10 rounded-lg" />
  </div>
);

export const AreaChartVisitors = () => {
  const [periodIndex, setPeriodIndex] = useState(1); // default 6 months
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { months, label } = PERIOD_OPTIONS[periodIndex];
  const { data, isLoading } = useMonthlyTraffic(months);

  const chartData = (data ?? []).map((d) => ({
    Month: d.month,
    Visitors: d.visitors,
  }));

  if (isLoading) return <ChartSkeleton />;

  return (
    <>
      <div className="w-full flex justify-between items-start">
        <Heading5>Traffic & Engagement Overview</Heading5>
        <div className="relative">
          <button
            className="rounded-lg border border-grey-stroke p-2 flex gap-2 items-center text-xs font-normal min-w-[110px] justify-between"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            {label}
            <ChevronLeftIcon className="-rotate-90 w-4 h-4" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white border border-grey-stroke rounded-lg shadow-md z-20 overflow-hidden">
              {PERIOD_OPTIONS.map((opt, i) => (
                <button
                  key={i}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-moss-stone/10 transition-colors ${
                    i === periodIndex
                      ? "text-moss-stone font-medium"
                      : "text-neutral-02"
                  }`}
                  onClick={() => {
                    setPeriodIndex(i);
                    setDropdownOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E5E7EB"
          />
          <XAxis
            dataKey="Month"
            className="text-xs"
            axisLine={false}
            tickLine={false}
            dy={10}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            className="text-xs"
            axisLine={false}
            tickLine={false}
            dx={-16}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
            }
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-moss-stone)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-moss-stone)"
                stopOpacity={0.0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="Visitors"
            stroke="var(--color-moss-stone)"
            fill="url(#colorVisitors)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
};

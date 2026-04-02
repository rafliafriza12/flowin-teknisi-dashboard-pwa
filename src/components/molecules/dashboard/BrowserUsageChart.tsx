"use client";

import { useBrowserUsage } from "@/services/analyticsService";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// Brand-aligned colour palette for up to 6 browsers
const BROWSER_COLORS: Record<string, string> = {
  Chrome: "#A0AC67",
  Safari: "#225442",
  Edge: "#CAD4BA",
  Firefox: "#5A7A5E",
  Opera: "#3E6B52",
  Others: "#0F1714",
};

const getFallbackColor = (index: number) => {
  const fallbacks = ["#A0AC67", "#225442", "#CAD4BA", "#5A7A5E", "#3E6B52", "#0F1714"];
  return fallbacks[index % fallbacks.length];
};

const ChartSkeleton = () => (
  <div className="w-full flex gap-1 items-center animate-pulse">
    <div className="w-2/3 h-48 bg-grey/10 rounded-full" />
    <div className="flex flex-col gap-4 flex-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-grey/20" />
          <div className="h-3 w-16 bg-grey/20 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2.5">
        <p className="text-xs font-medium text-neutral-02">{payload[0].name}</p>
        <p className="text-xs text-moss-stone font-semibold">
          {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

export default function BrowserUsageChart() {
  const { data: browserData, isLoading } = useBrowserUsage();

  if (isLoading) return <ChartSkeleton />;

  const chartData = (browserData ?? []).map((item, index) => ({
    name: item.browser,
    value: item.percentage,
    sessions: item.sessions,
    color: BROWSER_COLORS[item.browser] ?? getFallbackColor(index),
  }));

  return (
    <div className="w-full flex gap-1 items-center">
      <div className="w-2/3 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="90%"
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-3">
        {chartData.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <div className="flex flex-col">
              <span className="text-xs text-neutral-02 font-medium leading-tight">
                {entry.name}
              </span>
              <span className="text-[10px] text-grey leading-tight">
                {entry.value}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

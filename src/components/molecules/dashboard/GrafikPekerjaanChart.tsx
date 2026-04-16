"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface ChartDataPoint {
  label: string;
  total: number;
  selesai: number;
}

interface GrafikPekerjaanChartProps {
  data: ChartDataPoint[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-grey-stroke rounded-xl shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-neutral-03 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-grey">
          {p.name === "total" ? "Total" : "Selesai"}:{" "}
          <span className="font-medium text-neutral-03">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const GrafikPekerjaanChart: React.FC<GrafikPekerjaanChartProps> = ({
  data,
}) => {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1F2375" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#1F2375" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradSelesai" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4E9AF1" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#4E9AF1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f0f0f0"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#707070" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#707070" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          name="total"
          stroke="#1F2375"
          strokeWidth={2}
          fill="url(#gradTotal)"
          dot={false}
          activeDot={{ r: 5, fill: "#1F2375" }}
        />
        <Area
          type="monotone"
          dataKey="selesai"
          name="selesai"
          stroke="#4E9AF1"
          strokeWidth={2}
          fill="url(#gradSelesai)"
          dot={false}
          activeDot={{ r: 5, fill: "#4E9AF1" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default GrafikPekerjaanChart;

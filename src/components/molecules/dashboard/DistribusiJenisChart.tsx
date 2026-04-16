"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface DistribusiDataPoint {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface DistribusiJenisChartProps {
  data: DistribusiDataPoint[];
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-grey-stroke rounded-xl shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-neutral-03">{payload[0].name}</p>
      <p className="text-grey">
        Jumlah:{" "}
        <span className="font-medium text-neutral-03">{payload[0].value}</span>
      </p>
    </div>
  );
};

const renderLegend = (props: {
  payload?: { value: string; color: string }[];
}) => {
  const { payload } = props;
  return (
    <ul className="flex flex-col gap-1.5 pl-2">
      {payload?.map((entry, index) => (
        <li key={index} className="flex items-center gap-2 text-xs text-grey">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
};

const DistribusiJenisChart: React.FC<DistribusiJenisChartProps> = ({
  data,
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-xs text-grey italic">Belum ada data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend di bawah chart */}
      <ul className="flex flex-col gap-1.5 w-full">
        {data.map((entry, index) => (
          <li key={index} className="flex items-center gap-2 text-xs text-grey">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="flex-1">{entry.name}</span>
            <span className="font-medium text-neutral-03">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DistribusiJenisChart;

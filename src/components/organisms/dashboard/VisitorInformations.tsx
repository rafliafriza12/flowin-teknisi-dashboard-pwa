"use client";

import { AreaChartVisitors } from "@/components/molecules/dashboard/AreaChartVisitors";
import { VisitorLocation } from "@/components/molecules/dashboard/VisitorLocation";

const VisitorInformations = () => {
  return (
    <div className="w-full flex gap-4">
      <div className="w-[60%] h-[350px] rounded-lg bg-neutral-01 flex flex-col gap-4 p-4">
        <AreaChartVisitors />
      </div>
      <div className="w-[40%] h-[350px] rounded-lg bg-neutral-01 flex flex-col gap-4 p-4">
        <VisitorLocation />
      </div>
    </div>
  );
};

export default VisitorInformations;

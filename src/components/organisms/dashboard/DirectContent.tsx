"use client";

import BrowserUsageChart from "@/components/molecules/dashboard/BrowserUsageChart";
import { DirectContentCard } from "@/components/molecules/dashboard/DirectContentCard";

const DirectContent = () => {
  return (
    <div className="w-full grid grid-cols-3 gap-4">
      {/* Browser Usage — GA4 real data */}
      <DirectContentCard name="Browser Usage" url="#" variant="download">
        <BrowserUsageChart />
      </DirectContentCard>
    </div>
  );
};

export default DirectContent;

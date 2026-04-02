import ClosedBookIcon from "@/components/atoms/icons/ClosedBookIcon";
import OpenedBookIcon from "@/components/atoms/icons/OpenedBookIcon";
import ThreeUserGroupIcon from "@/components/atoms/icons/ThreeUserGroupIcon";
import TwoUserGroupIcon from "@/components/atoms/icons/TwoUserGroupIcon";

export interface DashboardStatType {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  indicator: 'up' | 'down';
  progress: string;
  description: string;
}

export const stats: DashboardStatType[] = [
    {
        icon: <TwoUserGroupIcon className="w-4 h-4 text-neutral-01" />,
        title: "Total Visitors (Today)",
        value: 128,
        indicator: "up",
        progress: "12.5%",
        description: "compared to yesterday",
    },
    {
        icon: <ThreeUserGroupIcon className="w-4 h-4 text-neutral-01" />,
        title: "Total Visitors (This Month)",
        value: "2,654",
        indicator: "up",
        progress: "15.5%",
        description: "compared to last month",
    },
    {
        icon: <OpenedBookIcon className="w-4 h-4 text-neutral-01" />,
        title: "Published Articles",
        value: 54,
        indicator: "down",
        progress: "8.5%",
        description: "compared to last month",
    },
    {
        icon: <ClosedBookIcon className="w-4 h-4 text-neutral-01" />,
        title: "Total Article Views",
        value: "1,254",
        indicator: "down",
        progress: "8.5%",
        description: "compared to last month",
    },
]
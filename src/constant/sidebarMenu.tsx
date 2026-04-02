import DashboardIcon from "@/components/atoms/icons/DashboardIcon";

import { IconProps } from "@/types/iconProps";

export type SidebarMenuItem = {
  name: string;
  url: string;
  icon: React.FC<IconProps>;
  subMenu: Array<{ name: string; url: string }>;
};

export const sidebarMenu: SidebarMenuItem[] = [
  {
    name: "Dashboard",
    url: "/",
    icon: DashboardIcon,
    subMenu: [],
  },
];


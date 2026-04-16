import DashboardIcon from "@/components/atoms/icons/DashboardIcon";
import WorkOrderIcon from "@/components/atoms/icons/WorkOrderIcon";
import SimplePaperNoteIcon from "@/components/atoms/icons/SimplePaperNote";
import ProfileIcon from "@/components/atoms/icons/ProfileIcon";
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
  {
    name: "Tugas Sekarang",
    url: "/tugas-sekarang",
    icon: SimplePaperNoteIcon,
    subMenu: [],
  },
  {
    name: "Pekerjaan",
    url: "/pekerjaan",
    icon: WorkOrderIcon,
    subMenu: [],
  },
  {
    name: "Profil",
    url: "/profile",
    icon: ProfileIcon,
    subMenu: [],
  },
];

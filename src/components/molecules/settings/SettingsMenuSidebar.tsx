"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePermissions } from "@/providers/PermissionProvider";
import { useMemo, useEffect } from "react";
import { IRolePermissions } from "@/services/roleService";

interface MenuItem {
  id: string;
  label: string;
  permission: keyof IRolePermissions;
}

const allMenuItems: MenuItem[] = [
  { id: "general", label: "General", permission: "generalSettings" },
  { id: "categories", label: "Categories", permission: "categoryManagement" },
  { id: "roles", label: "Roles", permission: "roleManagement" },
  { id: "notifications", label: "Notifications", permission: "notificationSettings" },
  { id: "integrations", label: "Integrations", permission: "integrationSettings" },
];

const SettingsMenuSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "";
  const { hasPermission, isLoading } = usePermissions();

  // Filter menu items based on user permissions
  const menuItems = useMemo(() => {
    return allMenuItems.filter(item => hasPermission(item.permission));
  }, [hasPermission]);

  // Redirect to first available tab if current tab is not accessible
  useEffect(() => {
    if (isLoading || menuItems.length === 0) return;
    
    const currentTabAccessible = menuItems.some(item => item.id === activeTab);
    if (!currentTabAccessible && menuItems.length > 0) {
      router.replace(`${pathname}?tab=${menuItems[0].id}`);
    }
  }, [activeTab, menuItems, isLoading, pathname, router]);

  const handleMenuClick = (tabId: string) => {
    router.push(`${pathname}?tab=${tabId}`);
  };

  if (isLoading) {
    return (
      <div className="w-full lg:w-[220px]">
        <div className="bg-neutral-01 rounded-[20px] p-4 shrink-0">
          <h3 className="text-base font-medium mb-4">Settings Menu</h3>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-moss-stone"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-[220px]">
      <div className="bg-neutral-01 rounded-[20px] p-4 shrink-0">
        <h3 className="text-base font-medium mb-4">Settings Menu</h3>
        <ul className="flex flex-col gap-3">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleMenuClick(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs transition-colors border border-grey-stroke ${
                  activeTab === item.id
                    ? "bg-charcoal-green-lighter text-neutral-01 font-medium"
                    : "text-neutral-02 hover:bg-moss-stone/10"
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SettingsMenuSidebar;

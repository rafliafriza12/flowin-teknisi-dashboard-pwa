"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

interface MenuItem {
  id: string;
  label: string;
}

const allMenuItems: MenuItem[] = [
  { id: "general", label: "General" },
  { id: "categories", label: "Categories" },
  { id: "notifications", label: "Notifications" },
];

const SettingsMenuSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "";

  const menuItems = useMemo(() => allMenuItems, []);

  // Redirect ke tab pertama jika tab sekarang tidak ada
  useEffect(() => {
    if (menuItems.length === 0) return;
    const currentTabAccessible = menuItems.some(
      (item) => item.id === activeTab,
    );
    if (!currentTabAccessible) {
      router.replace(`${pathname}?tab=${menuItems[0].id}`);
    }
  }, [activeTab, menuItems, pathname, router]);

  const handleMenuClick = (tabId: string) => {
    router.push(`${pathname}?tab=${tabId}`);
  };

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

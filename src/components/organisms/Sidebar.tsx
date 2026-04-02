"use client";

import Image from "next/image";
import SearchIcon from "../atoms/icons/SearchIcon";
import { sidebarMenu } from "@/constant/sidebarMenu";
import { useSidebar } from "@/providers/SidebarProvider";
import ChevronLeftIcon from "../atoms/icons/ChevronLeftIcon";
import { isActiveMenu } from "@/libs/utils";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ThreeUserGroupIcon from "../atoms/icons/ThreeUserGroupIcon";
import GearIcon from "../atoms/icons/GearIcon";
import LogoutIcon from "../atoms/icons/LogoutIcon";
import { useLogout } from "@/services";
import { showErrorToast, showToast } from "@/libs/toast";
import { useMe } from "@/services";
import { usePermissions } from "@/providers/PermissionProvider";

export const Sidebar = () => {
  const { data: user } = useMe();
  const { isOpen } = useSidebar();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const logout = useLogout();
  const { isTechnician, isLoading: isLoadingPermissions } = usePermissions();

  // Teknisi punya akses ke semua menu konten
  const filteredSidebarMenu = useMemo(() => {
    if (isTechnician) return sidebarMenu;
    return sidebarMenu.filter((item) => item.name === "Dashboard");
  }, [isTechnician]);

  const handleLogout = () => {
    logout.mutateAsync(
      {},
      {
        onSuccess: () => {
          showToast.success("Logout success");
        },
        onError: (error) => {
          showErrorToast(error);
        },
      },
    );
  };

  useEffect(() => {
    const menusToOpen: string[] = [];
    filteredSidebarMenu.forEach((menu) => {
      if (menu.subMenu.length > 0) {
        const hasActiveSubMenu = menu.subMenu.some((sub) =>
          isActiveMenu(sub.url, pathname),
        );
        if (hasActiveSubMenu || isActiveMenu(menu.url, pathname)) {
          menusToOpen.push(menu.name);
        }
      }
    });
    setOpenMenus(menusToOpen);
  }, [pathname, filteredSidebarMenu]);

  const toggleMenu = (menuName: string) => {
    setOpenMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((name) => name !== menuName)
        : [...prev, menuName],
    );
  };

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-sidebar-width bg-neutral-01 text-neutral-02 border-r border-grey-stroke z-40 pt-topbar-height transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="w-full h-full flex flex-col gap-5">
        <Link
          href="/profile"
          className={`px-5 cursor-pointer duration-200 ${
            isActiveMenu("/profile", pathname)
              ? "bg-charcoal-green-lighter text-neutral-01"
              : "hover:bg-moss-stone/10 text-neutral-02"
          }`}
        >
          <div className="w-full flex items-center gap-4 py-5 border-b border-grey-stroke">
            <div className="w-[3.2rem] h-[3.2rem] relative">
              <Image
                src={user?.me?.profilePictureUrl || "/img/userPlaceholder.png"}
                alt={user?.me?.fullname || "User"}
                fill
                className="object-cover object-top rounded-sm w-full h-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-medium text-sm">{user?.me?.fullname}</p>
              <p
                className={`${
                  isActiveMenu("/profile", pathname)
                    ? "text-grey-light"
                    : "text-grey"
                } font-normal text-xs`}
              >
                {user?.me?.email}
              </p>
            </div>
            <ChevronLeftIcon className="w-4 h-4 rotate-180 ml-auto" />
          </div>
        </Link>
        <div className="flex flex-col gap-5 w-full flex-1 overflow-hidden">
          <p className="text-moss-stone font-medium text-xs shrink-0 px-5">
            MENU
          </p>
          <div className="flex-1 overflow-y-auto thinnest-scrollbar px-5">
            <ul className="flex flex-col gap-2">
              {filteredSidebarMenu.map((item, index) => {
                const isActive = isActiveMenu(item.url, pathname);
                const isMenuOpen = openMenus.includes(item.name);
                const hasSubMenu = item.subMenu.length > 0;
                const IconComponent = item.icon;

                return (
                  <li key={index} className="text-xs w-full">
                    {hasSubMenu ? (
                      <button
                        className={`flex items-center w-full gap-3 py-2.5 p-3 rounded-lg ${
                          !isActive && "hover:bg-moss-stone/10"
                        } duration-200`}
                        onClick={() => toggleMenu(item.name)}
                      >
                        <IconComponent
                          className="w-5 h-5"
                          variant={isActive ? "filled" : "outline"}
                        />
                        <span>{item.name}</span>
                        <ChevronLeftIcon
                          className={`ml-auto transition-transform duration-200 text-neutal-02 ${
                            isMenuOpen ? "rotate-90" : "-rotate-90"
                          }`}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.url}
                        className={`flex items-center w-full gap-3 py-2.5 p-3 rounded-lg ${
                          !isActive && "hover:bg-moss-stone/10"
                        } duration-200 ${
                          isActive
                            ? "text-neutral-01 bg-charcoal-green-lighter font-medium"
                            : "text-neutral-02"
                        }`}
                      >
                        <IconComponent
                          className={`w-5 h-5 ${
                            isActive ? "text-neutral-01" : "text-neutral-02"
                          }`}
                          variant={isActive ? "filled" : "outline"}
                        />
                        <span>{item.name}</span>
                      </Link>
                    )}
                    <div
                      className={`overflow-hidden transition-all duration-400 ease-in-out ${
                        hasSubMenu && isMenuOpen
                          ? "max-h-[500px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      {hasSubMenu && (
                        <ul className="mt-2 ml-4 pl-4 border-l border-grey-stroke">
                          {item.subMenu.map((sub, subIndex) => {
                            const isSubActive = isActiveMenu(sub.url, pathname);
                            return (
                              <li key={subIndex}>
                                <Link
                                  href={sub.url}
                                  className={`block py-2.5 p-3 rounded-lg ${
                                    !isSubActive && "hover:bg-moss-stone/10"
                                  } duration-200 ${
                                    isSubActive
                                      ? "text-neutral-01 font-medium bg-charcoal-green-lighter"
                                      : "text-grey"
                                  }`}
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="w-full px-5">
          <div className="w-full h-px bg-grey-stroke"></div>
        </div>
        <div className="flex flex-col gap-5 pb-5">
          <p className="text-moss-stone font-medium text-xs shrink-0 px-5">
            OTHERS
          </p>
          <div className="px-5 flex flex-col gap-1.5">
            {/* Users - hanya tampil jika bukan Teknisi biasa (misal Admin dari sistem lain) */}

            <button
              onClick={handleLogout}
              className={`flex w-full gap-3 py-2.5 p-3 rounded-lg hover:bg-error/10 duration-200 text-xs items-center text-error`}
            >
              <LogoutIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

import { SearchBar } from "../molecules/searchBar/SearchBar";
import BumiLogo from "../atoms/BumiLogo";
import ChevronLeftIcon from "../atoms/icons/ChevronLeftIcon";
import MenuIcon from "../atoms/icons/MenuIcon";
import { useSidebar } from "@/providers/SidebarProvider";
import ChevronSquareIcon from "../atoms/icons/ChevronSquareIcon";
import NotificationIcon from "../atoms/icons/NotificationIcon";
import GlobeIcon from "../atoms/icons/GlobeIcon";
import CalendarIcon from "../atoms/icons/CalendarIcon";
import { Heading2, Heading3, Heading5 } from "../atoms/Typography";

const Topbar = () => {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="w-full flex h-20 fixed inset-0 bg-neutral-01 border-b border-grey-stroke z-50">
      {/* Left section — logo + toggle */}
      <div
        className={`border-r border-grey-stroke flex p-3 lg:p-5 items-center transition-[width] duration-300 ${
          isOpen
            ? "w-auto lg:w-sidebar-width justify-between"
            : "w-auto lg:w-[4.2rem] justify-end"
        }`}
      >
        {/* Logo hanya tampil di lg+ ketika sidebar open */}
        <div
          className={`transition-opacity duration-300 ${isOpen ? "hidden lg:flex" : "hidden"}`}
        >
          <BumiLogo />
        </div>
        <button onClick={toggle} aria-label="Toggle sidebar">
          <ChevronSquareIcon
            className={`w-7 h-7 lg:w-8 lg:h-8 text-neutral-02 transition-transform duration-300 ease-in-out ${
              !isOpen && "rotate-180"
            }`}
          />
        </button>
      </div>

      {/* Right section */}
      <div className="px-4 lg:px-5 flex flex-1 h-full items-center gap-4 justify-between lg:justify-end overflow-hidden">
        {/* Logo di mobile (ditampilkan di tengah topbar karena sidebar tidak tampil logo) */}
        <div className="flex lg:hidden">
          <BumiLogo className="w-20 h-auto" />
        </div>
        <div className="flex gap-2">
          <button className="flex gap-2 items-center rounded-lg border border-grey-stroke p-2 font-medium">
            <CalendarIcon className="text-neutral-02" />
            <span className="hidden sm:inline text-xs">
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="sm:hidden text-xs">
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;

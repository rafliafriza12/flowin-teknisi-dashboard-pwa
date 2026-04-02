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

const Topbar = () => {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="w-full flex h-20 fixed inset-0 bg-neutral-01 border-b border-grey-stroke z-50">
      <div
        className={`border-r border-grey-stroke flex p-5 items-center transition-[width] duration-300 ${
          isOpen ? "w-sidebar-width justify-between" : "w-[4.2rem] justify-end"
        }`}
      >
        <div
          className={`transition-opacity duration-300 ${
            isOpen ? "flex" : "hidden"
          }`}
        >
          <BumiLogo />
        </div>
        <button onClick={toggle} aria-label="Toggle sidebar">
          <ChevronSquareIcon
            className={`w-8 h-8 text-neutral-02 transition-transform duration-300 ease-in-out ${
              !isOpen && "rotate-180"
            }`}
          />
        </button>
      </div>
      <div className="px-5 flex flex-1 h-full items-center gap-4 justify-between">
        <SearchBar />
        <div className="flex gap-2">
          <button className="flex gap-2 items-center rounded-lg border border-grey-stroke p-2 font-medium">
            <CalendarIcon className="text-neutral-02" />
            <span className="text-xs">
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;

"use client";

import React from "react";
import { useSidebar } from "@/providers/SidebarProvider";

const ContentLayout = ({ children }: { children: React.ReactNode }) => {
  const { isOpen } = useSidebar();

  return (
    <div
      className={`pt-topbar-height w-full transition-all duration-300 ease-in-out ${
        isOpen ? "lg:pl-sidebar-width" : "lg:pl-0"
      }`}
    >
      <div className="w-full h-full p-4">{children}</div>
    </div>
  );
};

export default ContentLayout;

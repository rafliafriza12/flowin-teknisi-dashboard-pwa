import { Sidebar } from "@/components/organisms/Sidebar";
import React from "react";
import ContentLayout from "./ContentLayout";
import Topbar from "@/components/organisms/Topbar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-screen min-h-screen flex relative">
      <Topbar />
      <Sidebar />
      <ContentLayout>{children}</ContentLayout>
    </div>
  );
};

export default MainLayout;

import MainLayout from "@/components/templates/layouts/MainLayout";
import PermissionProvider from "@/providers/PermissionProvider";
import { SidebarProvider } from "@/providers/SidebarProvider";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const PrivateLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!token && !refreshToken) {
    redirect("/login");
  }

  return (
    <PermissionProvider>
      <SidebarProvider>
        <MainLayout>{children}</MainLayout>
      </SidebarProvider>
    </PermissionProvider>
  );
};

export default PrivateLayout;

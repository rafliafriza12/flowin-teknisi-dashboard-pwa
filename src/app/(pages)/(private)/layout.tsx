import MainLayout from "@/components/templates/layouts/MainLayout";
import PermissionProvider from "@/providers/PermissionProvider";
import { SidebarProvider } from "@/providers/SidebarProvider";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

type RoleName = "Admin" | "Technician" | "User";

interface JwtPayload {
  userId: string;
  email: string;
  role: RoleName;
  type: "access" | "refresh";
}

const PrivateLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  // Tidak punya token → login
  if (!token && !refreshToken) {
    redirect("/login");
  }

  // Punya access token → verify signature + cek role
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const jwtPayload = payload as unknown as JwtPayload;

      if (jwtPayload.role !== "Technician") {
        redirect(`/access-denied?role=${jwtPayload.role}`);
      }
    } catch {
      // Token expired / invalid — tapi masih punya refresh token?
      // Biarkan lewat, client-side (useMe / graphqlAction) akan auto refresh
      if (!refreshToken) {
        redirect("/login");
      }
    }
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

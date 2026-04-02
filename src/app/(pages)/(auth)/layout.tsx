import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  // Jika sudah ada token, langsung redirect ke dashboard ("/")
  if (token || refreshToken) {
    redirect("/");
  }

  return (
    <div className="w-screen h-svh flex justify-center items-center bg-white-mineral font-parkinsans">
      {children}
    </div>
  );
};

export default AuthLayout;

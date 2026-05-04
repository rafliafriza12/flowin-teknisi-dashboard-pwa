import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // Hanya redirect ke dashboard jika access_token VALID (signature + belum expired)
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
      await jwtVerify(token, secret);
      // Token valid → user sudah login, redirect ke dashboard
      redirect("/");
    } catch {
      // Token expired / invalid → biarkan tampil halaman login
    }
  }

  return (
    <div className="w-screen h-svh flex justify-center items-center bg-white-mineral font-parkinsans">
      {children}
    </div>
  );
};

export default AuthLayout;

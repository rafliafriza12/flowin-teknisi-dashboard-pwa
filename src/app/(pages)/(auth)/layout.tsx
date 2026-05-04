import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  // Jika access_token valid → sudah login, redirect ke dashboard
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
      await jwtVerify(accessToken, secret);
      redirect("/");
    } catch {
      // access_token expired/invalid — lanjut ke cek refresh_token di bawah
    }
  }

  // access_token tidak ada / expired, tapi refresh_token masih ada →
  // sesi masih valid (7 hari); redirect ke dashboard, PrivateLayout &
  // graphqlAction akan otomatis mint access_token baru.
  // Tanpa ini: user yang membuka app setelah >15 menit tetap diperlihatkan
  // halaman login meski sessionnya belum habis.
  if (refreshToken) {
    redirect("/");
  }

  return (
    <div className="w-screen h-svh flex justify-center items-center bg-white-mineral font-parkinsans">
      {children}
    </div>
  );
};

export default AuthLayout;

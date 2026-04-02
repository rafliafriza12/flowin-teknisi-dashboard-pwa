import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

type RoleName = "Admin" | "Technician" | "User";

interface JwtPayload {
  userId: string;
  email: string;
  role: RoleName;
  type: "access" | "refresh";
}

/**
 * Verify JWT signature + decode payload menggunakan secret.
 * Sekaligus cek expired — jwtVerify otomatis throw jika token expired.
 * Return payload jika valid, null jika tidak.
 */
async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

// Halaman yang bisa diakses tanpa login
const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/access-denied",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // ─── Public pages (login, forgot-password, etc.) ──────────────────────
  if (isPublicPath) {
    if (pathname.startsWith("/access-denied")) {
      return NextResponse.next();
    }

    // Hanya redirect ke dashboard jika access_token VALID
    if (accessToken) {
      const payload = await verifyToken(accessToken);
      if (payload) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Token expired / tidak ada → biarkan tampil halaman login
    return NextResponse.next();
  }

  // ─── Private pages ────────────────────────────────────────────────────

  // Tidak punya token sama sekali → redirect ke login
  if (!accessToken && !refreshToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Punya access token → verify signature + cek role
  if (accessToken) {
    const payload = await verifyToken(accessToken);

    if (!payload) {
      // Token expired / invalid — tapi masih punya refresh token?
      // Biarkan lewat, client-side akan auto refresh
      if (refreshToken) {
        return NextResponse.next();
      }
      // Tidak punya refresh token juga → hapus cookies, redirect login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    // Hanya Technician yang diizinkan
    if (payload.role !== "Technician") {
      const deniedUrl = new URL("/access-denied", request.url);
      deniedUrl.searchParams.set("role", payload.role);
      return NextResponse.redirect(deniedUrl);
    }

    // ✅ Signature valid + Technician → lanjut
    return NextResponse.next();
  }

  // Punya refresh token tapi tidak punya access token →
  // biarkan lewat, nanti client-side akan refresh token via GraphQL
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|img/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

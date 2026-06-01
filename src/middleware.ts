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
  "/offline",
];

// File statis PWA yang TIDAK boleh di-intercept middleware
const PWA_STATIC = [
  "/manifest.json",
  "/sw.js",
  "/swe-worker",
  "/workbox-",
  "/icon-",
  "/favicon",
  "/_next/",
  "/img/",
];

/**
 * Middleware ini adalah optimasi/hardening **online** saja.
 *
 * Sejak perbaikan offline-first (AUDIT_OFFLINE_FIRST.md), guard autentikasi
 * yang DEFINITIF untuk UI ada di client (src/hooks/useAuthGuard.ts) sehingga
 * app shell tetap bisa dirender offline. Saat offline, request navigasi
 * di-serve Service Worker dari cache dan tidak pernah mencapai middleware ini —
 * jadi middleware tidak boleh (dan tidak akan) menghalangi akses offline.
 * Logika di bawah sengaja permisif: cukup ada refresh_token untuk lolos,
 * client yang akan refresh/redirect bila perlu.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass middleware untuk aset statis PWA
  if (PWA_STATIC.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

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

    // Punya access token valid → redirect ke dashboard
    if (accessToken) {
      const payload = await verifyToken(accessToken);
      if (payload) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // access_token expired/tidak ada TAPI masih punya refresh_token →
    // user masih dianggap login, arahkan ke dashboard (client akan auto-refresh token)
    if (refreshToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Tidak punya token sama sekali → tampilkan halaman login
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

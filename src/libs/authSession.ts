/**
 * authSession.ts
 *
 * Pembaca sinyal sesi client-readable (cookie `flowin_session`).
 *
 * Cookie ini ditulis server saat login/refresh (lihat src/libs/graphql/actions.ts)
 * sebagai cookie **non-httpOnly** berisi `{ role, exp }`. Tujuannya HANYA agar
 * guard di client (useAuthGuard) bisa memutuskan menampilkan / memblokir app
 * shell **saat offline**, ketika middleware & server action tidak terjangkau.
 *
 * Ini BUKAN kredensial. Otorisasi sebenarnya tetap dijaga backend lewat token
 * httpOnly yang tidak dapat dibaca JavaScript.
 */

import Cookies from "js-cookie";

export const SESSION_HINT_COOKIE = "flowin_session";

/** Role yang diizinkan mengakses app teknisi. Selaras dengan middleware.ts. */
export const ALLOWED_ROLE = "Technician";

export interface ClientSession {
  role: string;
  /** Epoch ms kapan sinyal sesi dianggap kedaluwarsa. */
  exp: number;
}

/**
 * Baca & parse cookie sesi. Mengembalikan null bila tidak ada, rusak, atau
 * sudah kedaluwarsa. Aman dipanggil saat SSR (mengembalikan null).
 */
export function getClientSession(): ClientSession | null {
  if (typeof document === "undefined") return null;

  const raw = Cookies.get(SESSION_HINT_COOKIE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ClientSession>;
    if (typeof parsed.role !== "string" || typeof parsed.exp !== "number") {
      return null;
    }
    if (Date.now() >= parsed.exp) return null;
    return { role: parsed.role, exp: parsed.exp };
  } catch {
    return null;
  }
}

/** True bila ada sinyal sesi yang belum kedaluwarsa. */
export function hasValidSession(): boolean {
  return getClientSession() !== null;
}

/** True bila sesi ada dan role-nya diizinkan (Technician). */
export function isTechnician(): boolean {
  return getClientSession()?.role === ALLOWED_ROLE;
}

/**
 * Hapus cookie sinyal sesi client-readable secara client-side (js-cookie).
 *
 * Dipanggil saat handler 401 global mendeteksi sesi tidak valid — agar
 * `useAuthGuard` langsung melihat "tidak ada sesi" pada pengecekan berikutnya,
 * tanpa harus menunggu respons Set-Cookie dari server.
 *
 * Aman dipanggil saat SSR (no-op).
 */
export function clearClientSession(): void {
  if (typeof document === "undefined") return;
  Cookies.remove(SESSION_HINT_COOKIE, { path: "/" });
}

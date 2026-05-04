import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // cacheOnFrontEndNav: true dipertahankan agar halaman yang dikunjungi ter-cache
  cacheOnFrontEndNav: true,
  // aggressiveFrontEndNavCaching DIMATIKAN — jika aktif, SW ikut meng-cache
  // response redirect (/login) sebagai HTML navigasi, lalu menyajikannya saat
  // offline sehingga app selalu landing di login meski sudah punya refresh_token.
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false,
  // Dev: SW dimatikan agar tidak bentrok dengan Next.js HMR
  // Untuk test PWA di localhost → jalankan: pnpm build && pnpm start
  disable: process.env.NODE_ENV === "development",
  // Fallback halaman saat navigasi offline & cache JS/CSS belum ada
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    // Jangan cache request API/GraphQL & HMR
    exclude: [/\/api\//, /\/_next\/webpack-hmr/],
    runtimeCaching: [
      // ── Next.js App Router RSC requests ──────────────────────────────────
      // App Router menggunakan URL yang SAMA dengan halaman tapi menambah
      // query param `_rsc=<id>` dan header "RSC: 1".
      // Jika di-cache bersama HTML-nya (URL sama), Workbox akan mengembalikan
      // HTML saat App Router berharap mendapat RSC JSON → navigasi antar
      // halaman pecah / blank.  Solusi: NetworkOnly, biarkan App Router
      // menangani state-nya sendiri (dia punya cache internal sendiri).
      {
        urlPattern: ({ url }: { url: URL }) => url.searchParams.has("_rsc"),
        handler: "NetworkOnly" as const,
      },
      // ── _next/data (Pages Router RSC – jaga kompatibilitas) ───────────────
      {
        urlPattern: /\/_next\/data\/.*/,
        handler: "NetworkFirst" as const,
        options: {
          cacheName: "flowin-rsc-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60,
          },
          networkTimeoutSeconds: 5,
        },
      },
      // ── Halaman navigasi HTML (bukan RSC) ─────────────────────────────────
      // Hanya cache full-page navigation (Accept: text/html), bukan fetch API
      // atau RSC.  NetworkFirst: coba jaringan dulu, fallback ke cache jika
      // offline (setelah 5 detik timeout).
      {
        urlPattern: ({ request }: { request: Request }) =>
          request.mode === "navigate",
        handler: "NetworkFirst" as const,
        options: {
          cacheName: "flowin-teknisi-cache",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 24 * 60 * 60, // 1 hari
          },
          networkTimeoutSeconds: 5,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Alias canvas → false: pdfjs-dist di browser tidak butuh paket canvas Node.js
  webpack: (config) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (config.resolve as any).alias = {
      ...(config.resolve as any).alias,
      canvas: false,
    };
    return config;
  },

  // Expose env variables ke Edge Runtime (middleware)
  env: {
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "infest.hmifusk.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.licdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "rafliafriza.gutechdeveloper.site",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default withPWA(nextConfig);

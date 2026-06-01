import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  // start_url ("/") = app shell client-rendered tanpa data → aman di-precache
  // sebagai entri statis, sehingga peluncuran offline menampilkan shell, bukan
  // halaman /offline. (AUDIT_OFFLINE_FIRST.md B2)
  cacheStartUrl: true,
  dynamicStartUrl: false,
  // Dev: SW dimatikan agar tidak bentrok dengan Next.js HMR
  // Untuk test PWA di localhost → jalankan: pnpm build && pnpm start
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    // Jangan cache request API/GraphQL & HMR
    exclude: [/\/api\//, /\/_next\/webpack-hmr/],
    // Jangan auto-skipWaiting: biarkan ServiceWorkerUpdateBanner + handler
    // SKIP_WAITING di sw-custom.js yang mengontrol kapan SW baru aktif.
    // (AUDIT_OFFLINE_FIRST.md W1/M5)
    skipWaiting: false,
    // ── Navigation fallback: DIHAPUS ────────────────────────────────────────
    // navigateFallback: "/" yang lama menyebabkan Workbox mendaftarkan
    // NavigationRoute PERTAMA di sw.js. Route ini menang untuk SEMUA navigate
    // request (termasuk /pekerjaan, /profile, dll) bahkan saat ONLINE → browser
    // selalu mendapat HTML shell "/" dan merender konten dashboard.
    // Tanpa navigateFallback, route NetworkFirst di runtimeCaching di bawah
    // menangani navigasi secara benar:
    //   - Online  → fetch dari server, cache hasilnya
    //   - Offline → serve dari cache (jika pernah dikunjungi), atau error graceful
    // (AUDIT_OFFLINE_FIRST.md B2/B3)
    // Import custom push notification handlers
    importScripts: ["/sw-custom.js"],
    runtimeCaching: [
      // ── Static assets: CacheFirst 30 hari ──────────────────────────────────
      // JS/CSS chunks berubah hanya saat build (content hash di nama file)
      {
        urlPattern: /\/_next\/static\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "flowin-static-cache",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
          },
        },
      },
      // ── Gambar & aset publik: CacheFirst 30 hari ──────────────────────────
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "flowin-image-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
          },
        },
      },
      // ── RSC payload (App Router): StaleWhileRevalidate 24 jam ─────────────
      // Respons langsung dari cache, refresh di background
      {
        urlPattern: /\/_next\/data\/.*/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "flowin-rsc-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 1 hari
          },
        },
      },
      // ── Gambar Cloudinary: CacheFirst 30 hari (terpisah dari page-cache) ──
      // Foto hasil upload work order. Dipisah agar tidak memakan slot
      // page-cache & punya TTL sendiri. (AUDIT_OFFLINE_FIRST.md C2)
      {
        urlPattern: ({ url }: { url: URL }) =>
          url.hostname.endsWith("cloudinary.com"),
        handler: "CacheFirst",
        options: {
          cacheName: "flowin-cloudinary-cache",
          expiration: {
            maxEntries: 150,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // ── Navigasi halaman (same-origin): NetworkFirst 5 s timeout ─────────
      // HANYA request navigasi dokumen ke origin sendiri — tidak lagi
      // menangkap semua https (yang dulu meng-evict halaman app & menelan
      // aset cross-origin). (AUDIT_OFFLINE_FIRST.md C2)
      {
        urlPattern: ({ request, url }: { request: Request; url: URL }) =>
          request.mode === "navigate" && url.origin === self.location.origin,
        handler: "NetworkFirst",
        options: {
          cacheName: "flowin-page-cache",
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

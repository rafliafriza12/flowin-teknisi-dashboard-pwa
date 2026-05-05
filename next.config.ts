import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
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
      // ── Halaman HTML: NetworkFirst 5 s timeout, 1 hari cache ─────────────
      // (api/ & webpack-hmr sudah di-exclude di atas)
      {
        urlPattern: /^https?.*/,
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

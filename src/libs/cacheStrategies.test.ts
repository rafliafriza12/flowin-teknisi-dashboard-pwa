/**
 * Cache Strategy Configuration Tests (Task 31.4)
 *
 * Validates Workbox runtimeCaching rules from next.config.ts:
 * - Requirements 10.1: NetworkFirst for dynamic pages
 * - Requirements 10.2: CacheFirst for static assets
 * - Requirements 10.3: StaleWhileRevalidate for RSC payload
 * - Requirements 10.4: NetworkOnly for auth/API endpoints (via exclude list)
 * - Requirements 10.5: Image caching
 * - Requirements 10.6: Cache exclusion rules for /api/ routes
 * - Requirements 10.7: Cache size limits (maxEntries, maxAgeSeconds)
 *
 * NOTE: Service Worker APIs cannot run in Vitest (no real browser).
 * These tests validate the *configuration intent* by testing the RegExp
 * patterns that control which handler each URL receives.
 */

import { describe, it, expect } from "vitest";

// ─── Mirrors next.config.ts runtimeCaching ──────────────────────────────────
// Keep in sync with next.config.ts workboxOptions.runtimeCaching

const EXCLUDE_PATTERNS = [/\/api\//, /\/_next\/webpack-hmr/];

type Handler =
  | "CacheFirst"
  | "StaleWhileRevalidate"
  | "NetworkFirst"
  | "NetworkOnly";

interface CacheRule {
  urlPattern: RegExp;
  handler: Handler;
  options?: {
    cacheName: string;
    expiration?: { maxEntries: number; maxAgeSeconds: number };
    networkTimeoutSeconds?: number;
  };
}

const RUNTIME_CACHE: CacheRule[] = [
  {
    urlPattern: /\/_next\/static\/.*/,
    handler: "CacheFirst",
    options: {
      cacheName: "flowin-static-cache",
      expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
    },
  },
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    handler: "CacheFirst",
    options: {
      cacheName: "flowin-image-cache",
      expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
    },
  },
  {
    urlPattern: /\/_next\/data\/.*/,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "flowin-rsc-cache",
      expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
    },
  },
  {
    urlPattern: /^https?.*/,
    handler: "NetworkFirst",
    options: {
      cacheName: "flowin-page-cache",
      expiration: { maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 },
      networkTimeoutSeconds: 5,
    },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isExcluded(url: string): boolean {
  return EXCLUDE_PATTERNS.some((pat) => pat.test(url));
}

function handlerFor(url: string): Handler | null {
  if (isExcluded(url)) return "NetworkOnly";
  for (const rule of RUNTIME_CACHE) {
    if (rule.urlPattern.test(url)) return rule.handler;
  }
  return null;
}

function ruleFor(url: string): CacheRule | null {
  if (isExcluded(url)) return null;
  return RUNTIME_CACHE.find((r) => r.urlPattern.test(url)) ?? null;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Cache Strategy Configuration (Req 10.1 – 10.7)", () => {
  // ── Requirement 10.4 & 10.6 – Auth / API exclusion ────────────────────────

  describe("API & auth routes → NetworkOnly (excluded)", () => {
    it("excludes /api/graphql", () => {
      expect(handlerFor("/api/graphql")).toBe("NetworkOnly");
    });

    it("excludes /api/auth/login", () => {
      expect(handlerFor("/api/auth/login")).toBe("NetworkOnly");
    });

    it("excludes /api/auth/refresh", () => {
      expect(handlerFor("/api/auth/refresh")).toBe("NetworkOnly");
    });

    it("excludes any /api/ path", () => {
      expect(handlerFor("/api/anything/else")).toBe("NetworkOnly");
    });

    it("excludes Next.js HMR endpoint", () => {
      expect(handlerFor("/_next/webpack-hmr")).toBe("NetworkOnly");
    });
  });

  // ── Requirement 10.2 – Static assets (CacheFirst) ─────────────────────────

  describe("Static assets → CacheFirst (Req 10.2)", () => {
    it("matches /_next/static JS chunk", () => {
      expect(handlerFor("/_next/static/chunks/main-abc123.js")).toBe(
        "CacheFirst",
      );
    });

    it("matches /_next/static CSS", () => {
      expect(handlerFor("/_next/static/css/app.css")).toBe("CacheFirst");
    });

    it("matches /_next/static font", () => {
      expect(handlerFor("/_next/static/media/font.woff2")).toBe("CacheFirst");
    });

    it("uses cache name flowin-static-cache", () => {
      const rule = ruleFor("/_next/static/chunks/main.js");
      expect(rule?.options?.cacheName).toBe("flowin-static-cache");
    });

    it("has 30-day TTL for static assets", () => {
      const rule = ruleFor("/_next/static/chunks/main.js");
      expect(rule?.options?.expiration?.maxAgeSeconds).toBe(30 * 24 * 60 * 60);
    });

    it("has maxEntries 200 for static cache", () => {
      const rule = ruleFor("/_next/static/chunks/main.js");
      expect(rule?.options?.expiration?.maxEntries).toBe(200);
    });
  });

  // ── Requirement 10.5 – Image caching (CacheFirst) ─────────────────────────

  describe("Images → CacheFirst (Req 10.5)", () => {
    it("matches .png files", () => {
      expect(handlerFor("https://example.com/photo.png")).toBe("CacheFirst");
    });

    it("matches .jpg files", () => {
      expect(handlerFor("https://example.com/photo.jpg")).toBe("CacheFirst");
    });

    it("matches .jpeg files", () => {
      expect(handlerFor("https://example.com/photo.jpeg")).toBe("CacheFirst");
    });

    it("matches .svg files", () => {
      expect(handlerFor("/img/logo.svg")).toBe("CacheFirst");
    });

    it("matches .webp files", () => {
      expect(handlerFor("https://cdn.example.com/thumb.webp")).toBe(
        "CacheFirst",
      );
    });

    it("matches .ico files", () => {
      expect(handlerFor("/favicon.ico")).toBe("CacheFirst");
    });

    it("uses cache name flowin-image-cache", () => {
      const rule = ruleFor("/img/cover.png");
      expect(rule?.options?.cacheName).toBe("flowin-image-cache");
    });

    it("has 30-day TTL for image cache", () => {
      const rule = ruleFor("/img/cover.png");
      expect(rule?.options?.expiration?.maxAgeSeconds).toBe(30 * 24 * 60 * 60);
    });

    it("has maxEntries 100 for image cache", () => {
      const rule = ruleFor("/img/cover.png");
      expect(rule?.options?.expiration?.maxEntries).toBe(100);
    });
  });

  // ── Requirement 10.3 – RSC payload (StaleWhileRevalidate) ─────────────────

  describe("RSC payload → StaleWhileRevalidate (Req 10.3)", () => {
    it("matches /_next/data/ RSC path", () => {
      expect(handlerFor("/_next/data/build123/page.json")).toBe(
        "StaleWhileRevalidate",
      );
    });

    it("matches /_next/data/ with nested path", () => {
      expect(handlerFor("/_next/data/build/workOrder/[id].json")).toBe(
        "StaleWhileRevalidate",
      );
    });

    it("uses cache name flowin-rsc-cache", () => {
      const rule = ruleFor("/_next/data/build/index.json");
      expect(rule?.options?.cacheName).toBe("flowin-rsc-cache");
    });

    it("has 24-hour TTL for RSC cache", () => {
      const rule = ruleFor("/_next/data/build/index.json");
      expect(rule?.options?.expiration?.maxAgeSeconds).toBe(24 * 60 * 60);
    });

    it("has maxEntries 50 for RSC cache", () => {
      const rule = ruleFor("/_next/data/build/index.json");
      expect(rule?.options?.expiration?.maxEntries).toBe(50);
    });
  });

  // ── Requirement 10.1 – HTML pages (NetworkFirst) ──────────────────────────

  describe("HTML pages → NetworkFirst (Req 10.1)", () => {
    it("matches http app pages", () => {
      expect(handlerFor("http://localhost:3000/dashboard")).toBe(
        "NetworkFirst",
      );
    });

    it("matches https app pages", () => {
      expect(handlerFor("https://app.example.com/work-order")).toBe(
        "NetworkFirst",
      );
    });

    it("has 5-second network timeout", () => {
      const rule = ruleFor("https://app.example.com/dashboard");
      expect(rule?.options?.networkTimeoutSeconds).toBe(5);
    });

    it("has 24-hour TTL for page cache", () => {
      const rule = ruleFor("https://app.example.com/dashboard");
      expect(rule?.options?.expiration?.maxAgeSeconds).toBe(24 * 60 * 60);
    });

    it("has maxEntries 200 for page cache", () => {
      const rule = ruleFor("https://app.example.com/dashboard");
      expect(rule?.options?.expiration?.maxEntries).toBe(200);
    });

    it("uses cache name flowin-page-cache", () => {
      const rule = ruleFor("https://app.example.com/dashboard");
      expect(rule?.options?.cacheName).toBe("flowin-page-cache");
    });
  });

  // ── Requirement 10.7 – Cache size limits ──────────────────────────────────

  describe("Cache size limits (Req 10.7)", () => {
    it("all rules have maxEntries configured (LRU eviction)", () => {
      for (const rule of RUNTIME_CACHE) {
        expect(
          rule.options?.expiration?.maxEntries,
          `rule ${rule.options?.cacheName} missing maxEntries`,
        ).toBeGreaterThan(0);
      }
    });

    it("all rules have maxAgeSeconds configured (TTL cleanup)", () => {
      for (const rule of RUNTIME_CACHE) {
        expect(
          rule.options?.expiration?.maxAgeSeconds,
          `rule ${rule.options?.cacheName} missing maxAgeSeconds`,
        ).toBeGreaterThan(0);
      }
    });

    it("static+image cache maxEntries are conservative (prevents bloat)", () => {
      const staticRule = ruleFor("/_next/static/chunk.js");
      const imageRule = ruleFor("/photo.png");
      expect(staticRule?.options?.expiration?.maxEntries).toBeLessThanOrEqual(
        200,
      );
      expect(imageRule?.options?.expiration?.maxEntries).toBeLessThanOrEqual(
        100,
      );
    });

    it("total configured cache entries do not exceed 550", () => {
      const total = RUNTIME_CACHE.reduce(
        (sum, r) => sum + (r.options?.expiration?.maxEntries ?? 0),
        0,
      );
      // 200 + 100 + 50 + 200 = 550
      expect(total).toBeLessThanOrEqual(550);
    });
  });

  // ── Rule ordering (first-match wins) ──────────────────────────────────────

  describe("Rule ordering — first match wins", () => {
    it("/_next/static/ hits CacheFirst before NetworkFirst catch-all", () => {
      const handler = handlerFor(
        "https://app.example.com/_next/static/chunk.js",
      );
      expect(handler).toBe("CacheFirst");
    });

    it("/_next/data/ hits StaleWhileRevalidate before NetworkFirst catch-all", () => {
      const handler = handlerFor(
        "https://app.example.com/_next/data/build/index.json",
      );
      expect(handler).toBe("StaleWhileRevalidate");
    });

    it("/api/ routes are excluded before any rule matches", () => {
      const handler = handlerFor("https://app.example.com/api/graphql");
      expect(handler).toBe("NetworkOnly");
    });
  });
});

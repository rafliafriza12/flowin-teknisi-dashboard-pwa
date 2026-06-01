# Audit Offline-First PWA — Flowin Teknisi Dashboard

**Tanggal audit:** 2026-06-01
**Ruang lingkup:** Offline-first behavior, service worker / caching, penyimpanan data (IndexedDB + TanStack Query persist), offline queue & sync.
**Gejala utama yang dilaporkan:** _PWA tidak bisa diakses saat offline._

---

## TL;DR — Penyebab utama

PWA **tidak bisa diakses offline** karena **gating autentikasi dijalankan di sisi server (middleware + Server Component layout) yang me-`redirect` ke `/login` / `/`**. Saat offline, request navigasi ke halaman privat (`/`, `/tugas-sekarang`, `/pekerjaan`, dst.) ditangani oleh strategi `NetworkFirst`. Network gagal → Service Worker mengambil HTML dari cache **bila ada**. Tapi:

1. Halaman privat **tidak pernah ter-precache** (hanya JS chunk-nya yang di-precache, bukan dokumen HTML-nya). HTML hanya masuk cache `flowin-page-cache` *setelah* pernah dibuka online.
2. Bahkan saat HTML privat tersimpan di cache, isinya adalah hasil render dari server yang **sudah melewati auth gate**. Tapi `start_url` (`/`) memakai route khusus `start-url` (`NetworkFirst`) yang fallback ke halaman `/offline`, bukan ke dashboard.
3. Logika redirect (`middleware.ts` + `(private)/layout.tsx` + `graphqlAction` → `redirect("/login")`) berjalan di server. Offline = server tak terjangkau, sehingga navigasi pertama ke app shell yang belum tercache langsung jatuh ke fallback `/offline`.

Singkatnya: **arsitektur auth-nya server-first, padahal app-nya ingin offline-first.** Keduanya bertabrakan. Ini masalah arsitektural, bukan sekadar salah config Workbox.

> Severity legend: 🔴 Blocker (penyebab tidak bisa offline) · 🟠 Major · 🟡 Minor / hardening

---

## STATUS PERBAIKAN (update 2026-06-01)

Sudah diimplementasikan (build & 186 test lulus):

| Item | Status | Ringkasan perbaikan |
|------|--------|----------------------|
| **B1** | ✅ Fixed | Auth gate dipindah ke client. Cookie sinyal `flowin_session` (non-httpOnly, `{role,exp}`) ditulis di `setAuthCookies`/`refreshTokenAction`, dibaca `src/libs/authSession.ts` + `src/hooks/useAuthGuard.ts`. `(private)/layout.tsx` kini client shell. |
| **B2** | ✅ Fixed | `cacheStartUrl:true`, `dynamicStartUrl:false` + `navigateFallback:"/"`. Peluncuran/navigasi offline mengembalikan shell `/` (di-precache), bukan `/offline`. |
| **B3** | ✅ Fixed | `/`, `/pekerjaan`, `/profile`, `/tugas-sekarang` kini prerender **Static**; chunk privat sudah di-precache; navigasi tak-tercache fallback ke shell `/`. |
| **C1/C2** | ✅ Fixed | Aturan `/^https?.*/` diganti predikat navigasi same-origin; aturan Cloudinary terpisah (`flowin-cloudinary-cache`). |
| **S1** | ✅ Fixed | `queryPersister.restoreClient` selalu restore (cek `navigator.onLine` dihapus). |
| **W1/M5** | ✅ Fixed | `skipWaiting:false`; auto-skip dihapus dari `sw.js`, kini hanya via handler `SKIP_WAITING`. |
| **W2** | ✅ Fixed | Artefak SW (`sw.js`, `workbox-*`, `swe-worker-*`, `fallback-*`) masuk `.gitignore` & di-untrack. |
| **S3/S4, W3, M-lain** | ⏳ Belum | Hardening (kuota/cleanup IndexedDB, deteksi unregister, dll.) — opsional, belum dikerjakan. |

Verifikasi manual yang masih disarankan: lihat bagian "Verifikasi" di rencana — uji `pnpm build && pnpm start`, login, lalu DevTools → Network: Offline + reload/navigasi.

---

## 🔴 BLOCKER

### B1. Auth gate berjalan server-side → redirect saat offline

**File:**
- `src/middleware.ts` (baris 49–134)
- `src/app/(pages)/(private)/layout.tsx` (Server Component, baris 16–46)
- `src/libs/graphql/actions.ts` (baris 209–211, `redirect("/login")`)

**Masalah:**
- `middleware.ts` & `(private)/layout.tsx` mem-verifikasi cookie JWT di server lalu `redirect()`. Saat device offline, navigasi PWA ke route privat memerlukan respons server yang tidak akan pernah datang. SW men-`NetworkFirst` → timeout 5s → fallback. Jika app shell belum tercache, user melihat `/offline`.
- `(private)/layout.tsx` adalah **async Server Component** yang membaca `cookies()` dan memanggil `jwtVerify`. Output HTML-nya bergantung pada server. Tidak ada versi yang bisa dirender murni di client dari cache.

**Dampak:** Inti dari "tidak bisa diakses offline". Selama app shell privat dirender & dijaga di server, offline-first praktis mustahil untuk halaman privat.

**Rekomendasi (pilih salah satu arah, butuh keputusan):**
1. **App shell client-side (paling sesuai offline-first):** Ubah halaman privat menjadi client-rendered shell. Pindahkan auth gate ke client (`PermissionProvider` / hook yang membaca status dari TanStack Query cache + cookie non-httpOnly atau token di IndexedDB). Middleware tetap boleh untuk SSR online, tapi **jangan jadi satu-satunya gerbang**; saat offline shell harus tetap tampil dari cache.
2. **Precache + biarkan client redirect:** Pastikan app shell route privat (atau satu route shell, mis. `/`) selalu di-precache sebagai HTML statis tanpa data, dan auth-redirect dipindah ke client. Server hanya mengirim shell kosong; data & guard dikerjakan client.
3. Minimal: jadikan `/` (start_url) sebagai halaman shell yang **tidak** memerlukan auth server-side dan bisa dirender dari cache, lalu lakukan pengecekan login di client.

> Catatan: cookie `access_token`/`refresh_token` saat ini `httpOnly` (`actions.ts` baris 95–108) sehingga **client tidak bisa membacanya** untuk guard offline. Jika auth gate dipindah ke client, perlu sinyal login yang dapat dibaca client (flag non-httpOnly `is_logged_in`, atau menyimpan status di IndexedDB).

---

### B2. `start_url` (`/`) fallback ke `/offline`, bukan ke app shell

**File:** `public/sw.js` (route `start-url` → `NetworkFirst` dengan `handlerDidError` → `self.fallback`), `next.config.ts` baris 13–15 (`fallbacks.document = "/offline"`).

**Masalah:** Saat PWA diluncurkan dari home screen dalam keadaan offline, ia membuka `start_url` `/`. Route `start-url` memakai `NetworkFirst`; network gagal → `handlerDidError` → `self.fallback(request)` → halaman `/offline`. Jadi membuka app offline = layar "Tidak ada koneksi", bukan dashboard.

**Dampak:** Bahkan jika B1 diperbaiki, peluncuran offline tetap mendarat di `/offline` kecuali `/` punya app shell yang tercache & strategi cache yang mengutamakan cache untuk navigasi.

**Rekomendasi:** Sediakan app-shell yang di-precache untuk `/` (atau route `/app`), dan untuk navigasi gunakan strategi yang mengembalikan shell dari cache lebih dulu ketika offline (mis. precached shell + `NavigationRoute`), alih-alih langsung fallback `/offline`.

---

### B3. Halaman privat tidak masuk daftar precache

**File:** `public/sw.js` (`precacheAndRoute([...])`).

**Masalah:** Daftar precache hanya berisi **JS chunk** untuk halaman privat (mis. `app/(pages)/(private)/.../page-*.js`) dan aset, **bukan dokumen HTML** route privat. HTML hanya tersimpan di `flowin-page-cache` (runtime, `NetworkFirst`) **setelah** halaman dibuka saat online. Jadi:
- Instalasi baru lalu langsung offline → tidak ada HTML privat sama sekali.
- First-visit offline ke halaman yang belum pernah dibuka → fallback `/offline`.

**Dampak:** Offline hanya "kebetulan bekerja" untuk halaman yang pernah dibuka online dalam 24 jam terakhir (lihat C1). Tidak deterministik.

**Rekomendasi:** Adopsi pola **single app-shell** yang di-precache, render konten privat sepenuhnya di client dari shell tersebut. Hindari ketergantungan pada per-route HTML cache untuk offline.

---

## 🟠 MAJOR — Caching & Storage

### C1. Page cache (`NetworkFirst`) kedaluwarsa 24 jam

**File:** `next.config.ts` baris 61–74 (`flowin-page-cache`, `maxAgeSeconds: 86400`).

**Masalah:** HTML halaman hanya bertahan 1 hari di cache. Teknisi lapangan yang offline > 24 jam kehilangan app shell yang sebelumnya tercache. `maxEntries: 200` juga bisa meng-evict halaman penting.

**Rekomendasi:** Untuk app-shell, gunakan precache (tak kedaluwarsa sampai rebuild) atau perpanjang TTL signifikan. Pisahkan cache shell dari cache halaman umum.

---

### C2. Aturan `runtimeCaching` `/^https?.*/` terlalu lebar & menabrak cross-origin

**File:** `next.config.ts` baris 63–74.

**Masalah:** Pattern `^https?.*` menangkap **semua** GET termasuk request lintas-origin (Cloudinary, tile peta Leaflet, GraphQL via GET kalau ada, gambar pihak ketiga). Konsekuensi:
- Respons opaque cross-origin ikut termakan slot `maxEntries: 200` → meng-evict halaman app sendiri.
- Tile peta & aset eksternal tercache dengan TTL halaman (24 jam) di cache yang salah.

**Rekomendasi:** Batasi route halaman ke same-origin navigasi saja (mis. cek `request.mode === "navigate"` dan `url.origin === self.origin`). Buat aturan terpisah & eksplisit untuk Cloudinary/tile peta bila memang ingin dicache.

---

### C3. `exclude` API hanya cocok untuk path `/api/`, GraphQL eksternal tetap kena `NetworkFirst`

**File:** `next.config.ts` baris 19 (`exclude: [/\/api\//, ...]`), `src/libs/graphql/utils.ts` (`GRAPHQL_ENDPOINT`).

**Masalah:** GraphQL dipanggil dari **Server Action** (`actions.ts`, `"use server"`) ke `GRAPHQL_ENDPOINT` eksternal — request server→server, jadi memang tak lewat SW. Tapi `exclude` di Workbox hanya tentang precache manifest, **bukan** runtime caching. Aturan runtime `/^https?.*/` tetap berpotensi mencache POST? (tidak, hanya GET) — namun perlu dipastikan tidak ada query data yang ter-cache stale. Lebih penting: karena fetch GraphQL terjadi di server action, **saat offline TanStack Query `queryFn` (yang memanggil server action) akan gagal total** karena server action butuh roundtrip ke server Next.js.

**Dampak (penting):** `useGraphQLQuery` → `graphqlAction` (server action). Server Action **selalu** butuh request ke server Next.js (RSC action endpoint). **Saat offline, semua query gagal**, bahkan walau datanya ada di TanStack persist cache — kecuali persist cache di-restore lebih dulu (lihat S1). Ini membuat data offline bergantung sepenuhnya pada mekanisme restore persist + `networkMode: offlineFirst`.

**Rekomendasi:** Pastikan jalur baca data offline benar-benar mengandalkan TanStack persisted cache (S1), bukan memanggil server action. Pertimbangkan memanggil GraphQL langsung dari client (fetch ke endpoint) untuk query baca agar SW bisa mengintersепsi & meng-cache, sehingga offline fetch punya jalur cache HTTP juga.

---

### S1. Persist cache hanya di-restore saat offline → race & data hilang saat transisi

**File:** `src/libs/queryPersister.ts` (baris 24–32), `src/providers/QueryProvider.tsx`.

**Masalah:**
- `restoreClient` mengembalikan `undefined` saat `navigator.onLine === true`. Artinya saat online, cache lama tidak di-hydrate sama sekali. Begitu koneksi putus **di tengah sesi**, TanStack tidak otomatis me-restore (restore hanya terjadi sekali saat `PersistQueryClientProvider` mount). Jadi yang menyelamatkan hanya in-memory cache (`gcTime` 24 jam) — selama tab tidak di-reload.
- Jika user **membuka app saat offline dari cold start**, `navigator.onLine` false → restore jalan → bagus. Tapi karena B1/B2 app shell tidak tampil, ini tak sempat terpakai.
- `navigator.onLine` notoriously unreliable (true walau tak ada internet nyata). Restore bisa ter-skip padahal efektif offline.

**Rekomendasi:** Selalu `restoreClient` (tanpa cek `onLine`). TanStack `staleTime`/`networkMode: offlineFirst` sudah memastikan saat online data tetap di-refetch di background. Menahan restore tidak diperlukan dan justru merusak skenario "online lalu tiba-tiba offline".

---

### S2. Seluruh query cache di-serialize sebagai satu JSON string besar

**File:** `src/libs/queryPersister.ts` (`set(IDB_KEY, JSON.stringify(client))`).

**Masalah:** Satu key IndexedDB menampung seluruh dehydrated client sebagai string. Untuk dataset besar (daftar pekerjaan + detail + gambar URL), penulisan ulang penuh setiap kali ada perubahan query = mahal & berisiko (write throttling default TanStack 1s). Tidak ada pembatasan ukuran → bisa membengkak.

**Rekomendasi:** Gunakan `experimental_createPersister` (per-query persister) bila memungkinkan, atau batasi query mana yang di-dehydrate (`shouldDehydrateQuery` saat ini hanya filter `status==="success"`, belum membatasi per-key). Tetapkan budget ukuran.

---

### S3. Blob foto di IndexedDB tanpa kuota / cleanup orphan

**File:** `src/libs/offlineQueue.ts` (store `pendingUploads`, `MAX_QUEUE_SIZE = 100`), `src/libs/indexedDBMigration.ts`.

**Masalah:**
- Foto disimpan sebagai `File`/Blob di dalam record queue. Batas hanya jumlah item (100), bukan total byte. 100 item × beberapa foto besar bisa menembus kuota origin → write gagal diam-diam.
- Item `status: "done"` tidak pernah dihapus eksplisit selain `removePendingItem` saat sukses; item `error` dengan `retryCount >= 3` **menumpuk selamanya** (tidak ada purge), memakan storage dan terus dihitung sebagai error (`getAllActivePendingItems` menyertakan `error`).
- Tidak ada penanganan `QuotaExceededError`.

**Rekomendasi:** Tambah cleanup untuk item `done` & `error` lama, batasi total byte, tangani `QuotaExceededError` dengan pesan ke user, dan pertimbangkan `navigator.storage.persist()` agar storage tidak di-evict browser.

---

### S4. Versi DB di-hardcode & komentar tidak sinkron

**File:** `src/libs/indexedDBMigration.ts` (baris 11 `DB_VERSION = 3`, komentar baris 7 & 35 masih menyebut "v1 → v2 / version 2 schema").

**Masalah:** Minor, tapi membingungkan maintainer. Migrasi memakai `oldVersion < n` (benar), namun dokumentasi tertinggal. `onblocked` hanya `console.warn` — upgrade bisa menggantung jika ada tab lain terbuka, dan caller tidak diberi tahu.

**Rekomendasi:** Sinkronkan komentar; tangani `onblocked` dengan UX (minta tutup tab lain) dan reject/timeout agar `openDB()` tidak menggantung.

---

## 🟠 MAJOR — Service Worker & Lifecycle

### W1. `skipWaiting()` + `clientsClaim()` agresif tanpa koordinasi

**File:** `public/sw.js` (`self.skipWaiting()`, `e.clientsClaim()`), `src/hooks/useServiceWorkerUpdate.ts`.

**Masalah:** SW langsung `skipWaiting` & `clientsClaim`. Padahal ada `ServiceWorkerUpdateBanner` + `useServiceWorkerUpdate` yang seharusnya memberi user pilihan update. `skipWaiting` otomatis membuat banner update praktis tak berguna dan bisa menukar controller di tengah sesi (asset/HTML versi campur). next-pwa meng-inject ini karena tidak di-set `skipWaiting: false`.

**Rekomendasi:** Set agar update **menunggu** (`skipWaiting: false` di opsi next-pwa) dan biarkan banner yang memicu `SKIP_WAITING` lewat `postMessage` (hook `useServiceWorkerUpdate` sudah disiapkan untuk pola ini). Selaraskan keduanya.

---

### W2. Stale `sw.js` di `public/` (artefak build ikut ter-track?)

**File:** `public/sw.js`, `public/workbox-*.js`, `public/fallback-*.js`, `public/swe-worker-*.js` (di-generate 2026-05-13), sementara `src/middleware.ts` 2026-05-04.

**Masalah:** `public/sw.js` adalah artefak build next-pwa namun **tidak** ada di `.gitignore` (yang di-ignore hanya `/.next/`, `/build`). Artinya SW lama bisa ter-commit dan ter-deploy menimpa hasil build baru, atau menyebabkan precache manifest yang tidak sinkron dengan bundel aktual → offline memuat chunk yang sudah tidak ada (404 dari cache miss).

**Rekomendasi:** Tambahkan ke `.gitignore`:
```
/public/sw.js
/public/sw.js.map
/public/workbox-*.js
/public/swe-worker-*.js
/public/fallback-*.js
```
Regenerasi saat build. Pastikan deploy memakai hasil `next build`, bukan file yang ter-commit.

---

### W3. `useServiceWorkerUnregister` mendeteksi via `localStorage` flag → false positive

**File:** `src/hooks/useServiceWorkerUnregister.ts`.

**Masalah:** Mendeteksi "SW hilang" dengan membandingkan flag `localStorage` vs `getRegistration()`. Tapi `localStorage` & SW registration punya siklus hidup berbeda (clear cache bisa menghapus salah satu). Saat first install, ada window di mana SW belum meng-control page (`controller === null`) padahal normal → potensi warning palsu. Juga `reRegister` hanya `reload` — tidak benar-benar mendaftar SW bila penyebabnya bukan sekadar belum-control.

**Rekomendasi:** Andalkan event lifecycle SW (`navigator.serviceWorker.ready`, `controllerchange`) ketimbang flag localStorage; bedakan "belum control (first load)" vs "benar-benar ter-unregister".

---

### W4. `reloadOnOnline: false`

**File:** `next.config.ts` baris 8.

**Masalah:** Bukan bug, tapi kombinasikan dengan S1: saat kembali online, halaman tidak reload & persist cache tidak otomatis di-invalidate. TanStack akan refetch karena stale, jadi umumnya OK — pastikan saja UX transisi online→offline→online konsisten.

**Rekomendasi:** Verifikasi manual skenario transisi; tidak wajib diubah.

---

## 🟡 MINOR / Konsistensi

### M1. Manifest `start_url` & scope vs offline shell
`public/manifest.json`: `start_url: "/"`, `scope: "/"`. Konsisten, tapi `/` saat ini bukan shell offline (lihat B2). `theme_color` manifest (`#ffffff`) berbeda dari `viewport.themeColor` di layout (`#1f2375`) — kosmetik, sebaiknya disamakan.

### M2. Background Sync handler di `sw-custom.js` — OK, dengan catatan
**Sudah diverifikasi.** `public/sw-custom.js` memang punya handler `sync` (baris 452–479) yang mem-`postMessage` `OFFLINE_SYNC_REQUEST` ke client, ditangani `useOfflineSync` (baris 424–435). Arsitektur delegasi (SW → client melakukan upload Cloudinary + signed mutation) benar, karena upload signed tak bisa dijalankan SW langsung. Catatan:
- **Sync bergantung pada ada client terbuka.** Jika tidak ada window terbuka (`clients.length === 0`), item dibiarkan di queue dan dihitung `failed` (baris 444–445). Jadi "true background sync" (sinkron walau app tertutup) tidak terjadi — selalu butuh app dibuka. Untuk teknisi lapangan yang menutup app, sync baru jalan saat app dibuka lagi (lewat auto-sync `useOfflineSync` baris 412–421). Acceptable, tapi dokumentasikan ekspektasinya.
- **`setTimeout` untuk retry backoff (baris 468) tidak andal di SW.** SW bisa diterminasi browser kapan saja setelah `waitUntil` selesai; `setTimeout` panjang (1m/5m/15m) hampir pasti tak tereksekusi. Gunakan Periodic Background Sync atau biarkan SyncManager browser yang menjadwalkan ulang, jangan `setTimeout`.
- **`self.__offlineSyncAttempts` adalah in-memory** → hilang saat SW restart, sehingga cap retry tidak benar-benar bekerja lintas siklus.

### M5. `SKIP_WAITING` di-handle dua kali + `skipWaiting()` tetap otomatis
`sw-custom.js` baris 375–379 menangani pesan `SKIP_WAITING` (pola yang benar untuk update terkontrol), **tetapi** `sw.js` yang di-generate tetap memanggil `self.skipWaiting()` tanpa syarat di awal (lihat W1). Akibatnya handler manual itu mubazir — SW selalu skip-waiting sendiri. Selesaikan bersamaan dengan W1.

### M3. Retry/backoff & error item menumpuk
`useOfflineSync` menandai item `error` permanen setelah `retryCount >= 3` tetapi tidak menyediakan auto-purge; bergantung penuh pada user lewat `PendingItemsModal`. Lihat S3.

### M4. `networkTimeoutSeconds: 5` pada page cache
Saat offline (bukan slow), `navigator.onLine` biasanya langsung false, namun jika browser keliru menganggap online, user menunggu 5 detik penuh sebelum fallback. Untuk navigasi shell, pertimbangkan CacheFirst/StaleWhileRevalidate atas precached shell agar instan.

---

## Urutan perbaikan yang disarankan

1. **B1 + B2 + B3 (arsitektur app-shell + auth client-side).** Ini yang membuat "tidak bisa offline". Tanpa ini, sisanya kosmetik.
2. **S1** (selalu restore persist cache) + **C3** (jalur baca data offline tidak lewat server action).
3. **W2** (gitignore artefak SW) + **W1** (koordinasi update SW).
4. **C1/C2** (perbaiki cakupan & TTL cache halaman vs shell vs aset eksternal).
5. **S3/S4** (kuota & cleanup IndexedDB), **W3**, lalu minor.

## Yang masih perlu diverifikasi (di luar cakupan baca audit ini)
- Apakah ada `PermissionProvider`/client guard yang sudah membaca status login tanpa server (untuk B1 opsi 1). `cookies` `httpOnly` membuat client tak bisa baca token — perlu sinyal login client-readable.
- Pengujian manual: build produksi (`pnpm build && pnpm start`), buka online sekali (login), lalu DevTools → Application → Service Workers + Network: Offline, reload halaman privat — amati apakah jatuh ke `/offline`. Lalu tutup & buka ulang PWA dari home screen saat offline.

## Sudah diverifikasi pada audit ini
- `public/sw-custom.js`: handler `push`, `notificationclick`, `notificationclose`, `activate`, `message` (SKIP_WAITING), dan `sync` — semua ada & wajar (lihat M2/M5).
- Data dibaca via `useGraphQLQuery` → TanStack Query (client), bukan RSC server fetch. Tapi `queryFn`-nya memanggil **Server Action** `graphqlAction` yang tetap butuh roundtrip server (lihat C3).

export interface SearchableItem {
  /** Display label */
  label: string;
  /** Navigation URL */
  url: string;
  /** Parent breadcrumb context (e.g. "Pages", "Settings") */
  category?: string;
  /** Keywords for fuzzy matching (hidden from UI) */
  keywords: string[];
}

/**
 * Static list of every navigable destination inside the CMS.
 * Semua item visible untuk Teknisi yang sudah login.
 */
export const searchableItems: SearchableItem[] = [
  // ── Dashboard ──────────────────────────────────────────
  {
    label: "Dashboard",
    url: "/",
    keywords: ["dashboard", "home", "overview", "beranda"],
  },

  // ── Profile ────────────────────────────────────────────
  {
    label: "Profile",
    url: "/profile",
    keywords: ["profile", "profil", "akun", "account", "my profile"],
  },
];

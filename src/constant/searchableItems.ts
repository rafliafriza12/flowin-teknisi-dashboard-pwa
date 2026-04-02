import { IRolePermissions } from "@/services/roleService";

export interface SearchableItem {
  /** Display label */
  label: string;
  /** Navigation URL */
  url: string;
  /** Parent breadcrumb context (e.g. "Pages", "Settings") */
  category?: string;
  /** Keywords for fuzzy matching (hidden from UI) */
  keywords: string[];
  /**
   * Permission key required to see this item.
   * - specific key → that specific permission
   * - `undefined` → visible to everyone (e.g. Dashboard, Profile)
   */
  permission?: keyof IRolePermissions;
}

/**
 * Static list of every navigable destination inside the CMS.
 *
 * The order matters: earlier items rank higher when scores are equal.
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

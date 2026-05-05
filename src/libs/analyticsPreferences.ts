/**
 * Analytics Preferences
 *
 * Lightweight opt-in/opt-out preference for notification analytics tracking.
 * Stored in localStorage so it can be read synchronously from the foreground app.
 *
 * Service Worker analytics logging cannot read localStorage; the foreground
 * app should periodically reconcile preference and skip the sync hook when
 * disabled.
 *
 * **Validates: Requirements 14.7**
 */

const STORAGE_KEY = "flowin-teknisi:analytics-enabled";

/**
 * Returns true when analytics tracking is enabled. Defaults to enabled.
 */
export function isAnalyticsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === null) return true;
    return value === "true";
  } catch {
    return true;
  }
}

/**
 * Persists analytics opt-in/opt-out preference.
 */
export function setAnalyticsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  } catch (error) {
    console.error("Failed to persist analytics preference:", error);
  }
}

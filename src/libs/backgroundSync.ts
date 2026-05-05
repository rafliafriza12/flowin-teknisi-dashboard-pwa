/**
 * Background Sync Helpers
 *
 * Wraps the (still-experimental) Background Sync API behind feature detection
 * so the rest of the app does not need to think about browser support.
 *
 * **Validates: Requirements 8.1**
 */

export const SYNC_TAG = "offline-sync";

/**
 * Returns true if the Background Sync API is usable in this environment.
 */
export function supportsBackgroundSync(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (typeof window === "undefined") return false;
  return "SyncManager" in window;
}

/**
 * Registers a one-shot sync event so the SW will retry uploads when the
 * device next has connectivity. Safe to call repeatedly.
 *
 * Returns true on success, false if the API is unavailable or registration
 * failed (caller should fall back to periodic sync).
 *
 * **Validates: Requirements 8.1**
 */
export async function registerOfflineSync(
  tag: string = SYNC_TAG,
): Promise<boolean> {
  if (!supportsBackgroundSync()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    // Sync API is not in standard TS lib; cast through unknown
    const sync = (
      registration as unknown as {
        sync?: { register: (tag: string) => Promise<void> };
      }
    ).sync;
    if (!sync) return false;
    await sync.register(tag);
    return true;
  } catch (error) {
    console.error("Failed to register background sync:", error);
    return false;
  }
}

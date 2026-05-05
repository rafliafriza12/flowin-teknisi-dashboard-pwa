/**
 * Push Subscription Storage Operations
 *
 * Manages push subscription data in IndexedDB for web push notifications.
 * Stores subscription endpoints, keys, and permission state per user.
 *
 * **Validates: Requirements 11.1, 11.2, 11.3, 11.7**
 */

import { openDB, STORE_PUSH_SUBSCRIPTION } from "./indexedDBMigration";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushSubscriptionRecord {
  /** User ID (primary key) */
  userId: string;
  /** Push subscription endpoint URL */
  endpoint: string;
  /** Push subscription keys for encryption */
  keys: {
    /** P256DH public key */
    p256dh: string;
    /** Auth secret */
    auth: string;
  };
  /** Timestamp when subscription was created */
  createdAt: number;
  /** Timestamp when subscription was last updated */
  lastUpdated: number;
  /** Current notification permission state */
  permissionState: NotificationPermission;
  /** Timestamp when permission was last asked */
  permissionAskedAt?: number;
  /** Number of times permission was denied */
  permissionDeniedCount: number;
}

// ─── CRUD Operations ──────────────────────────────────────────────────────────

/**
 * Saves or updates a push subscription for a user.
 * If a subscription already exists for the user, it will be updated.
 *
 * @param data - Push subscription data
 * @returns Promise<void>
 *
 * **Validates: Requirements 11.1, 11.2**
 */
export async function savePushSubscription(
  data: PushSubscriptionRecord,
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PUSH_SUBSCRIPTION, "readwrite");
    const store = tx.objectStore(STORE_PUSH_SUBSCRIPTION);

    // Use put to insert or update
    const req = store.put(data);

    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(
        new Error(
          `Failed to save push subscription: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Gets the push subscription for a specific user.
 *
 * @param userId - User ID
 * @returns Promise<PushSubscriptionRecord | null> - Subscription data or null if not found
 *
 * **Validates: Requirements 11.1, 11.2**
 */
export async function getPushSubscription(
  userId: string,
): Promise<PushSubscriptionRecord | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PUSH_SUBSCRIPTION, "readonly");
    const store = tx.objectStore(STORE_PUSH_SUBSCRIPTION);
    const req = store.get(userId);

    req.onsuccess = () => {
      const result = req.result as PushSubscriptionRecord | undefined;
      resolve(result || null);
    };

    req.onerror = () =>
      reject(
        new Error(
          `Failed to get push subscription: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Updates the permission state for a user's subscription.
 *
 * @param userId - User ID
 * @param state - New permission state
 * @returns Promise<void>
 * @throws Error if subscription not found
 *
 * **Validates: Requirements 11.3**
 */
export async function updatePermissionState(
  userId: string,
  state: NotificationPermission,
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PUSH_SUBSCRIPTION, "readwrite");
    const store = tx.objectStore(STORE_PUSH_SUBSCRIPTION);
    const getReq = store.get(userId);

    getReq.onsuccess = () => {
      const record = getReq.result as PushSubscriptionRecord | undefined;

      if (!record) {
        reject(new Error(`Push subscription not found for user: ${userId}`));
        return;
      }

      const updated: PushSubscriptionRecord = {
        ...record,
        permissionState: state,
        lastUpdated: Date.now(),
        // Update permission asked timestamp if state changed
        permissionAskedAt:
          state !== record.permissionState
            ? Date.now()
            : record.permissionAskedAt,
        // Increment denied count if permission was denied
        permissionDeniedCount:
          state === "denied"
            ? record.permissionDeniedCount + 1
            : record.permissionDeniedCount,
      };

      const putReq = store.put(updated);

      putReq.onsuccess = () => resolve();
      putReq.onerror = () =>
        reject(
          new Error(
            `Failed to update permission state: ${putReq.error?.message || "Unknown error"}`,
          ),
        );
    };

    getReq.onerror = () =>
      reject(
        new Error(
          `Failed to get subscription: ${getReq.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Clears the push subscription for a user.
 * Used when user disables notifications or logs out.
 *
 * @param userId - User ID
 * @returns Promise<void>
 *
 * **Validates: Requirements 11.7**
 */
export async function clearPushSubscription(userId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PUSH_SUBSCRIPTION, "readwrite");
    const store = tx.objectStore(STORE_PUSH_SUBSCRIPTION);
    const req = store.delete(userId);

    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(
        new Error(
          `Failed to clear push subscription: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Gets all push subscriptions (for admin/debugging purposes).
 *
 * @returns Promise<PushSubscriptionRecord[]> - Array of all subscriptions
 */
export async function getAllPushSubscriptions(): Promise<
  PushSubscriptionRecord[]
> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PUSH_SUBSCRIPTION, "readonly");
    const store = tx.objectStore(STORE_PUSH_SUBSCRIPTION);
    const req = store.getAll();

    req.onsuccess = () => {
      resolve(req.result as PushSubscriptionRecord[]);
    };

    req.onerror = () =>
      reject(
        new Error(
          `Failed to get all subscriptions: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Checks if permission should be asked again based on denial history.
 * Returns false if permission was denied recently (within 7 days).
 *
 * @param userId - User ID
 * @returns Promise<boolean> - True if permission can be asked again
 *
 * **Validates: Requirements 11.3**
 */
export async function canAskPermission(userId: string): Promise<boolean> {
  const subscription = await getPushSubscription(userId);

  if (!subscription) {
    // No subscription record, can ask
    return true;
  }

  if (subscription.permissionState === "granted") {
    // Already granted, no need to ask
    return false;
  }

  if (subscription.permissionState === "denied") {
    // Check if 7 days have passed since last denial
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    if (
      subscription.permissionAskedAt &&
      subscription.permissionAskedAt > sevenDaysAgo
    ) {
      // Denied within last 7 days, don't ask again
      return false;
    }
  }

  return true;
}

/**
 * Updates the subscription endpoint and keys.
 * Used when subscription is renewed or changed.
 *
 * @param userId - User ID
 * @param endpoint - New endpoint URL
 * @param keys - New subscription keys
 * @returns Promise<void>
 * @throws Error if subscription not found
 */
export async function updateSubscriptionEndpoint(
  userId: string,
  endpoint: string,
  keys: { p256dh: string; auth: string },
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PUSH_SUBSCRIPTION, "readwrite");
    const store = tx.objectStore(STORE_PUSH_SUBSCRIPTION);
    const getReq = store.get(userId);

    getReq.onsuccess = () => {
      const record = getReq.result as PushSubscriptionRecord | undefined;

      if (!record) {
        reject(new Error(`Push subscription not found for user: ${userId}`));
        return;
      }

      const updated: PushSubscriptionRecord = {
        ...record,
        endpoint,
        keys,
        lastUpdated: Date.now(),
      };

      const putReq = store.put(updated);

      putReq.onsuccess = () => resolve();
      putReq.onerror = () =>
        reject(
          new Error(
            `Failed to update subscription endpoint: ${putReq.error?.message || "Unknown error"}`,
          ),
        );
    };

    getReq.onerror = () =>
      reject(
        new Error(
          `Failed to get subscription: ${getReq.error?.message || "Unknown error"}`,
        ),
      );
  });
}

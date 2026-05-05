/**
 * Push Subscription Manager
 *
 * Manages push notification subscriptions using the Web Push API.
 * Handles permission requests, subscription creation, server sync, and expiration checks.
 *
 * **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.8, 11.2, 11.3, 11.4**
 */

import {
  savePushSubscription,
  getPushSubscription,
  updatePermissionState,
  clearPushSubscription,
  canAskPermission,
  type PushSubscriptionRecord,
} from "./pushSubscriptionStorage";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface SubscriptionSyncResult {
  success: boolean;
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** 7 days in milliseconds */
const PERMISSION_DENIAL_COOLDOWN = 7 * 24 * 60 * 60 * 1000;

// ─── Push Subscription Manager Class ──────────────────────────────────────────

/**
 * Manages push notification subscriptions for the PWA.
 * Handles permission flow, subscription lifecycle, and server synchronization.
 */
export class PushSubscriptionManager {
  private userId: string;
  private vapidPublicKey: string;

  /**
   * Creates a new PushSubscriptionManager instance.
   *
   * @param userId - User ID for storing subscription
   * @param vapidPublicKey - VAPID public key for Push API (base64 URL-safe)
   */
  constructor(userId: string, vapidPublicKey: string) {
    this.userId = userId;
    this.vapidPublicKey = vapidPublicKey;
  }

  /**
   * Requests notification permission from the user.
   * Checks if permission can be asked based on denial history.
   *
   * @returns Promise<NotificationPermission> - The permission state
   * @throws Error if permission cannot be asked (denied within 7 days)
   *
   * **Validates: Requirements 4.5, 11.2, 11.4**
   */
  async requestPermission(): Promise<NotificationPermission> {
    // Check if we can ask for permission
    const canAsk = await canAskPermission(this.userId);

    if (!canAsk) {
      throw new Error(
        "Cannot ask for permission - denied within the last 7 days",
      );
    }

    // Check if Notification API is supported
    if (!("Notification" in window)) {
      throw new Error("Notification API not supported");
    }

    // Request permission
    const permission = await Notification.requestPermission();

    // Update permission state in IndexedDB
    await this.updatePermissionStateInDB(permission);

    return permission;
  }

  /**
   * Creates a push subscription using the Push API with VAPID keys.
   * Stores the subscription in IndexedDB and syncs to server.
   *
   * @returns Promise<PushSubscription> - The created subscription
   * @throws Error if Service Worker not available or subscription fails
   *
   * **Validates: Requirements 4.2, 4.3, 4.4**
   */
  async subscribe(): Promise<PushSubscription> {
    // Check if Service Worker is available
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker) {
      throw new Error("Service Worker not supported");
    }

    // Check if Push API is supported
    if (!("PushManager" in window)) {
      throw new Error("Push API not supported");
    }

    // Get Service Worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check current permission
    if (Notification.permission !== "granted") {
      throw new Error("Notification permission not granted");
    }

    // Convert VAPID public key from base64 to Uint8Array
    const applicationServerKey: ArrayBuffer = this.urlBase64ToUint8Array(
      this.vapidPublicKey,
    ).buffer as ArrayBuffer;

    // Create push subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Extract subscription data
    const subscriptionData = this.extractSubscriptionData(subscription);

    // Save to IndexedDB
    await this.saveSubscriptionToIndexedDB(subscriptionData);

    // Sync to server (with retry on failure)
    try {
      await this.syncSubscriptionToServer(subscriptionData);
    } catch (error) {
      console.error("Failed to sync subscription to server:", error);
      // Subscription is saved in IndexedDB for retry later
      // Don't throw error - subscription is still valid locally
    }

    return subscription;
  }

  /**
   * Unsubscribes from push notifications.
   * Removes subscription from Service Worker, IndexedDB, and server.
   *
   * @returns Promise<void>
   * @throws Error if unsubscribe fails
   *
   * **Validates: Requirements 4.7**
   */
  async unsubscribe(): Promise<void> {
    // Check if Service Worker is available
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker) {
      throw new Error("Service Worker not supported");
    }

    // Get Service Worker registration
    const registration = await navigator.serviceWorker.ready;

    // Get current subscription
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from Push API
      await subscription.unsubscribe();

      // Extract endpoint for server unregister
      const endpoint = subscription.endpoint;

      // Remove from server
      try {
        await this.unregisterSubscriptionFromServer(endpoint);
      } catch (error) {
        console.error("Failed to unregister from server:", error);
        // Continue with local cleanup even if server fails
      }
    }

    // Clear from IndexedDB
    await clearPushSubscription(this.userId);
  }

  /**
   * Gets the current push subscription.
   *
   * @returns Promise<PushSubscription | null> - Current subscription or null
   *
   * **Validates: Requirements 4.2**
   */
  async getSubscription(): Promise<PushSubscription | null> {
    // Check if Service Worker is available
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker) {
      return null;
    }

    // Get Service Worker registration
    const registration = await navigator.serviceWorker.ready;

    // Get current subscription
    return await registration.pushManager.getSubscription();
  }

  /**
   * Checks if the current subscription is valid and updates if expired.
   * Creates a new subscription if the current one is invalid or expired.
   *
   * @returns Promise<boolean> - True if subscription is valid or was renewed
   *
   * **Validates: Requirements 4.8**
   */
  async checkAndUpdateSubscription(): Promise<boolean> {
    try {
      // Get current subscription
      const subscription = await this.getSubscription();

      if (!subscription) {
        // No subscription exists
        return false;
      }

      // Check if subscription is expired (expirationTime is optional)
      const expirationTime = subscription.expirationTime;

      if (expirationTime && expirationTime < Date.now()) {
        console.log("Subscription expired, creating new one");

        // Unsubscribe old subscription
        await subscription.unsubscribe();

        // Create new subscription
        await this.subscribe();

        return true;
      }

      // Subscription is valid
      return true;
    } catch (error) {
      console.error("Failed to check subscription:", error);
      return false;
    }
  }

  /**
   * Syncs push subscription to the backend server via GraphQL mutation.
   * Stores in IndexedDB for retry if network fails.
   *
   * @param subscriptionData - Subscription data to sync
   * @returns Promise<SubscriptionSyncResult> - Sync result
   *
   * **Validates: Requirements 4.3, 4.4**
   */
  async syncSubscriptionToServer(
    subscriptionData: PushSubscriptionData,
  ): Promise<SubscriptionSyncResult> {
    try {
      // Import GraphQL action dynamically to avoid circular dependencies
      const { graphqlAction } = await import("./graphql/actions");
      const { REGISTER_PUSH_SUBSCRIPTION } =
        await import("./graphql/mutations");

      // Call GraphQL mutation
      const result = await graphqlAction<{
        registerPushSubscription: { success: boolean; message: string };
      }>(REGISTER_PUSH_SUBSCRIPTION, {
        input: {
          endpoint: subscriptionData.endpoint,
          keys: {
            p256dh: subscriptionData.keys.p256dh,
            auth: subscriptionData.keys.auth,
          },
        },
      });

      if (result.registerPushSubscription.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.registerPushSubscription.message,
        };
      }
    } catch (error) {
      console.error("Failed to sync subscription to server:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Unregisters push subscription from the backend server.
   *
   * @param endpoint - Subscription endpoint to unregister
   * @returns Promise<void>
   */
  private async unregisterSubscriptionFromServer(
    endpoint: string,
  ): Promise<void> {
    try {
      // Import GraphQL action dynamically
      const { graphqlAction } = await import("./graphql/actions");
      const { UNREGISTER_PUSH_SUBSCRIPTION } =
        await import("./graphql/mutations");

      // Call GraphQL mutation
      await graphqlAction<{
        unregisterPushSubscription: { success: boolean; message: string };
      }>(UNREGISTER_PUSH_SUBSCRIPTION, {
        endpoint,
      });
    } catch (error) {
      console.error("Failed to unregister from server:", error);
      throw error;
    }
  }

  // ─── Private Helper Methods ─────────────────────────────────────────────────

  /**
   * Converts base64 URL-safe string to Uint8Array for VAPID key.
   *
   * @param base64String - Base64 URL-safe encoded string
   * @returns Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Extracts subscription data from PushSubscription object.
   *
   * @param subscription - PushSubscription object
   * @returns PushSubscriptionData
   * @throws Error if keys are missing
   */
  private extractSubscriptionData(
    subscription: PushSubscription,
  ): PushSubscriptionData {
    const json = subscription.toJSON();

    if (!json.keys?.p256dh || !json.keys?.auth) {
      throw new Error("Subscription keys are missing");
    }

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
    };
  }

  /**
   * Saves subscription to IndexedDB.
   *
   * @param subscriptionData - Subscription data to save
   * @returns Promise<void>
   */
  private async saveSubscriptionToIndexedDB(
    subscriptionData: PushSubscriptionData,
  ): Promise<void> {
    const record: PushSubscriptionRecord = {
      userId: this.userId,
      endpoint: subscriptionData.endpoint,
      keys: subscriptionData.keys,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      permissionState: Notification.permission,
      permissionDeniedCount: 0,
    };

    await savePushSubscription(record);
  }

  /**
   * Updates permission state in IndexedDB.
   *
   * @param state - New permission state
   * @returns Promise<void>
   */
  private async updatePermissionStateInDB(
    state: NotificationPermission,
  ): Promise<void> {
    // Check if subscription record exists
    const existing = await getPushSubscription(this.userId);

    if (existing) {
      // Update existing record
      await updatePermissionState(this.userId, state);
    } else {
      // Create new record with permission state only
      const record: PushSubscriptionRecord = {
        userId: this.userId,
        endpoint: "",
        keys: { p256dh: "", auth: "" },
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        permissionState: state,
        permissionAskedAt: Date.now(),
        permissionDeniedCount: state === "denied" ? 1 : 0,
      };

      await savePushSubscription(record);
    }
  }
}

// ─── Factory Function ─────────────────────────────────────────────────────────

/**
 * Creates a PushSubscriptionManager instance with environment configuration.
 *
 * @param userId - User ID
 * @returns PushSubscriptionManager instance
 * @throws Error if VAPID public key is not configured
 */
export function createPushSubscriptionManager(
  userId: string,
): PushSubscriptionManager {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    throw new Error(
      "VAPID public key not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in environment variables.",
    );
  }

  return new PushSubscriptionManager(userId, vapidPublicKey);
}

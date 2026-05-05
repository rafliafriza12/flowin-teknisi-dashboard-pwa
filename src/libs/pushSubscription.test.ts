/**
 * Tests for Push Subscription Manager
 *
 * Tests subscription creation, permission flow, server sync, and expiration handling.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { PushSubscriptionManager } from "./pushSubscription";
import * as pushSubscriptionStorage from "./pushSubscriptionStorage";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock IndexedDB storage functions
vi.mock("./pushSubscriptionStorage", () => ({
  savePushSubscription: vi.fn(),
  getPushSubscription: vi.fn(),
  updatePermissionState: vi.fn(),
  clearPushSubscription: vi.fn(),
  canAskPermission: vi.fn(),
}));

// Mock GraphQL actions
vi.mock("./graphql/actions", () => ({
  graphqlAction: vi.fn(),
}));

// Mock GraphQL mutations
vi.mock("./graphql/mutations", () => ({
  REGISTER_PUSH_SUBSCRIPTION: "mutation RegisterPushSubscription { ... }",
  UNREGISTER_PUSH_SUBSCRIPTION: "mutation UnregisterPushSubscription { ... }",
}));

// ─── Test Setup ───────────────────────────────────────────────────────────────

const TEST_USER_ID = "test-user-123";
const TEST_VAPID_KEY =
  "BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xYjEB6pVJwGGeHfAX_KkgXcCjxbdFcz2bVhYjXqiYW0NkNLvVckBw";

describe("PushSubscriptionManager", () => {
  let manager: PushSubscriptionManager;
  let mockServiceWorkerRegistration: any;
  let mockPushManager: any;
  let mockSubscription: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create manager instance
    manager = new PushSubscriptionManager(TEST_USER_ID, TEST_VAPID_KEY);

    // Mock PushSubscription
    mockSubscription = {
      endpoint: "https://push.example.com/subscription/123",
      expirationTime: null,
      toJSON: vi.fn(() => ({
        endpoint: "https://push.example.com/subscription/123",
        keys: {
          p256dh: "test-p256dh-key",
          auth: "test-auth-key",
        },
      })),
      unsubscribe: vi.fn().mockResolvedValue(true),
    };

    // Mock PushManager
    mockPushManager = {
      subscribe: vi.fn().mockResolvedValue(mockSubscription),
      getSubscription: vi.fn().mockResolvedValue(mockSubscription),
    };

    // Mock ServiceWorkerRegistration
    mockServiceWorkerRegistration = {
      pushManager: mockPushManager,
      showNotification: vi.fn(),
    };

    // Mock navigator.serviceWorker
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve(mockServiceWorkerRegistration),
      },
      writable: true,
      configurable: true,
    });

    // Mock Notification API
    Object.defineProperty(global, "Notification", {
      value: {
        permission: "default",
        requestPermission: vi.fn().mockResolvedValue("granted"),
      },
      writable: true,
      configurable: true,
    });

    // Mock PushManager in window
    Object.defineProperty(global.window, "PushManager", {
      value: class PushManager {},
      writable: true,
      configurable: true,
    });

    // Mock atob for base64 decoding
    global.atob = vi.fn((str: string) => {
      return Buffer.from(str, "base64").toString("binary");
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Permission Request Tests ─────────────────────────────────────────────

  describe("requestPermission", () => {
    it("should request permission when allowed", async () => {
      vi.mocked(pushSubscriptionStorage.canAskPermission).mockResolvedValue(
        true,
      );
      vi.mocked(pushSubscriptionStorage.getPushSubscription).mockResolvedValue(
        null,
      );

      const permission = await manager.requestPermission();

      expect(permission).toBe("granted");
      expect(Notification.requestPermission).toHaveBeenCalled();
      expect(pushSubscriptionStorage.savePushSubscription).toHaveBeenCalled();
    });

    it("should throw error when permission denied within 7 days", async () => {
      vi.mocked(pushSubscriptionStorage.canAskPermission).mockResolvedValue(
        false,
      );

      await expect(manager.requestPermission()).rejects.toThrow(
        "Cannot ask for permission - denied within the last 7 days",
      );

      expect(Notification.requestPermission).not.toHaveBeenCalled();
    });

    it("should update permission state in IndexedDB", async () => {
      vi.mocked(pushSubscriptionStorage.canAskPermission).mockResolvedValue(
        true,
      );
      vi.mocked(pushSubscriptionStorage.getPushSubscription).mockResolvedValue(
        null,
      );

      await manager.requestPermission();

      expect(pushSubscriptionStorage.savePushSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: TEST_USER_ID,
          permissionState: "granted",
        }),
      );
    });

    it("should handle permission denial", async () => {
      vi.mocked(pushSubscriptionStorage.canAskPermission).mockResolvedValue(
        true,
      );
      vi.mocked(pushSubscriptionStorage.getPushSubscription).mockResolvedValue(
        null,
      );
      vi.mocked(Notification.requestPermission).mockResolvedValue("denied");

      const permission = await manager.requestPermission();

      expect(permission).toBe("denied");
      expect(pushSubscriptionStorage.savePushSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          permissionState: "denied",
          permissionDeniedCount: 1,
        }),
      );
    });
  });

  // ─── Subscription Creation Tests ──────────────────────────────────────────

  describe("subscribe", () => {
    beforeEach(() => {
      // Set permission to granted
      Object.defineProperty(Notification, "permission", {
        value: "granted",
        writable: true,
        configurable: true,
      });
    });

    it("should create push subscription with VAPID key", async () => {
      const subscription = await manager.subscribe();

      expect(subscription).toBe(mockSubscription);
      expect(mockPushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array),
      });
    });

    it("should save subscription to IndexedDB", async () => {
      await manager.subscribe();

      expect(pushSubscriptionStorage.savePushSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: TEST_USER_ID,
          endpoint: "https://push.example.com/subscription/123",
          keys: {
            p256dh: "test-p256dh-key",
            auth: "test-auth-key",
          },
        }),
      );
    });

    it("should sync subscription to server", async () => {
      const { graphqlAction } = await import("./graphql/actions");
      vi.mocked(graphqlAction).mockResolvedValue({
        registerPushSubscription: { success: true, message: "Success" },
      });

      await manager.subscribe();

      expect(graphqlAction).toHaveBeenCalled();
    });

    it("should not throw if server sync fails", async () => {
      const { graphqlAction } = await import("./graphql/actions");
      vi.mocked(graphqlAction).mockRejectedValue(new Error("Network error"));

      // Should not throw - subscription is saved locally for retry
      await expect(manager.subscribe()).resolves.toBeDefined();

      expect(pushSubscriptionStorage.savePushSubscription).toHaveBeenCalled();
    });

    it("should throw error if permission not granted", async () => {
      Object.defineProperty(Notification, "permission", {
        value: "denied",
        writable: true,
        configurable: true,
      });

      await expect(manager.subscribe()).rejects.toThrow(
        "Notification permission not granted",
      );
    });

    it("should throw error if Service Worker not supported", async () => {
      // Remove serviceWorker from navigator
      Object.defineProperty(global.navigator, "serviceWorker", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(manager.subscribe()).rejects.toThrow(
        "Service Worker not supported",
      );
    });
  });

  // ─── Unsubscribe Tests ────────────────────────────────────────────────────

  describe("unsubscribe", () => {
    it("should unsubscribe from push notifications", async () => {
      const { graphqlAction } = await import("./graphql/actions");
      vi.mocked(graphqlAction).mockResolvedValue({
        unregisterPushSubscription: { success: true, message: "Success" },
      });

      await manager.unsubscribe();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      expect(
        pushSubscriptionStorage.clearPushSubscription,
      ).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it("should unregister from server", async () => {
      const { graphqlAction } = await import("./graphql/actions");
      vi.mocked(graphqlAction).mockResolvedValue({
        unregisterPushSubscription: { success: true, message: "Success" },
      });

      await manager.unsubscribe();

      expect(graphqlAction).toHaveBeenCalled();
    });

    it("should clear from IndexedDB even if server fails", async () => {
      const { graphqlAction } = await import("./graphql/actions");
      vi.mocked(graphqlAction).mockRejectedValue(new Error("Network error"));

      await manager.unsubscribe();

      expect(
        pushSubscriptionStorage.clearPushSubscription,
      ).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it("should handle no existing subscription", async () => {
      mockPushManager.getSubscription.mockResolvedValue(null);

      await manager.unsubscribe();

      expect(mockSubscription.unsubscribe).not.toHaveBeenCalled();
      expect(pushSubscriptionStorage.clearPushSubscription).toHaveBeenCalled();
    });
  });

  // ─── Get Subscription Tests ───────────────────────────────────────────────

  describe("getSubscription", () => {
    it("should return current subscription", async () => {
      const subscription = await manager.getSubscription();

      expect(subscription).toBe(mockSubscription);
      expect(mockPushManager.getSubscription).toHaveBeenCalled();
    });

    it("should return null if no subscription exists", async () => {
      mockPushManager.getSubscription.mockResolvedValue(null);

      const subscription = await manager.getSubscription();

      expect(subscription).toBeNull();
    });

    it("should return null if Service Worker not supported", async () => {
      Object.defineProperty(global.navigator, "serviceWorker", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const subscription = await manager.getSubscription();

      expect(subscription).toBeNull();
    });
  });

  // ─── Subscription Expiration Tests ────────────────────────────────────────

  describe("checkAndUpdateSubscription", () => {
    it("should return true if subscription is valid", async () => {
      const result = await manager.checkAndUpdateSubscription();

      expect(result).toBe(true);
    });

    it("should return false if no subscription exists", async () => {
      mockPushManager.getSubscription.mockResolvedValue(null);

      const result = await manager.checkAndUpdateSubscription();

      expect(result).toBe(false);
    });

    it("should renew expired subscription", async () => {
      // Set permission to granted
      Object.defineProperty(Notification, "permission", {
        value: "granted",
        writable: true,
        configurable: true,
      });

      // Mock expired subscription
      const expiredSubscription = {
        ...mockSubscription,
        expirationTime: Date.now() - 1000, // Expired 1 second ago
      };

      mockPushManager.getSubscription
        .mockResolvedValueOnce(expiredSubscription)
        .mockResolvedValueOnce(mockSubscription);

      const result = await manager.checkAndUpdateSubscription();

      expect(result).toBe(true);
      expect(expiredSubscription.unsubscribe).toHaveBeenCalled();
      expect(mockPushManager.subscribe).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      mockPushManager.getSubscription.mockRejectedValue(
        new Error("Test error"),
      );

      const result = await manager.checkAndUpdateSubscription();

      expect(result).toBe(false);
    });
  });

  // ─── Server Sync Tests ────────────────────────────────────────────────────

  describe("syncSubscriptionToServer", () => {
    it("should sync subscription successfully", async () => {
      const { graphqlAction } = await import("./graphql/actions");
      vi.mocked(graphqlAction).mockResolvedValue({
        registerPushSubscription: { success: true, message: "Success" },
      });

      const result = await manager.syncSubscriptionToServer({
        endpoint: "https://push.example.com/subscription/123",
        keys: {
          p256dh: "test-p256dh-key",
          auth: "test-auth-key",
        },
      });

      expect(result.success).toBe(true);
      expect(graphqlAction).toHaveBeenCalled();
    });

    it("should return error on sync failure", async () => {
      const { graphqlAction } = await import("./graphql/actions");
      vi.mocked(graphqlAction).mockRejectedValue(new Error("Network error"));

      const result = await manager.syncSubscriptionToServer({
        endpoint: "https://push.example.com/subscription/123",
        keys: {
          p256dh: "test-p256dh-key",
          auth: "test-auth-key",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("should handle server rejection", async () => {
      const { graphqlAction } = await import("./graphql/actions");
      vi.mocked(graphqlAction).mockResolvedValue({
        registerPushSubscription: {
          success: false,
          message: "Invalid subscription",
        },
      });

      const result = await manager.syncSubscriptionToServer({
        endpoint: "https://push.example.com/subscription/123",
        keys: {
          p256dh: "test-p256dh-key",
          auth: "test-auth-key",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid subscription");
    });
  });

  // ─── VAPID Key Conversion Tests ───────────────────────────────────────────

  describe("urlBase64ToUint8Array", () => {
    it("should convert base64 URL-safe string to Uint8Array", async () => {
      // This is tested indirectly through subscribe()
      Object.defineProperty(Notification, "permission", {
        value: "granted",
        writable: true,
        configurable: true,
      });

      await manager.subscribe();

      expect(mockPushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array),
      });
    });
  });
});

// ─── Factory Function Tests ───────────────────────────────────────────────────

describe("createPushSubscriptionManager", () => {
  it("should create manager with environment VAPID key", async () => {
    // Mock environment variable
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = TEST_VAPID_KEY;

    const { createPushSubscriptionManager } =
      await import("./pushSubscription");
    const manager = createPushSubscriptionManager(TEST_USER_ID);

    expect(manager).toBeInstanceOf(PushSubscriptionManager);
  });

  it("should throw error if VAPID key not configured", async () => {
    // Remove environment variable
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    const { createPushSubscriptionManager } =
      await import("./pushSubscription");

    expect(() => createPushSubscriptionManager(TEST_USER_ID)).toThrow(
      "VAPID public key not configured",
    );
  });
});

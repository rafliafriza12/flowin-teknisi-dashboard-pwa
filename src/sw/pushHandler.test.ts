/**
 * Unit Tests for Service Worker Push Handlers
 *
 * Tests push event handling, notification click handling, and notification grouping.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock the imported modules
vi.mock("../libs/notificationParser", () => ({
  parsePushPayload: vi.fn(),
  formatNotificationOptions: vi.fn(),
}));

vi.mock("../libs/notificationHistory", () => ({
  addNotification: vi.fn(),
}));

vi.mock("../libs/analyticsStorage", () => ({
  logAnalyticsEvent: vi.fn(),
}));

import {
  parsePushPayload,
  formatNotificationOptions,
} from "../libs/notificationParser";
import { addNotification } from "../libs/notificationHistory";
import { logAnalyticsEvent } from "../libs/analyticsStorage";

// Mock Service Worker global APIs
const mockShowNotification = vi.fn();
const mockGetNotifications = vi.fn();
const mockMatchAll = vi.fn();
const mockOpenWindow = vi.fn();
const mockFocus = vi.fn();

// Setup global Service Worker context
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();

  // Mock self.registration
  global.self = {
    registration: {
      showNotification: mockShowNotification,
      getNotifications: mockGetNotifications,
    },
    clients: {
      matchAll: mockMatchAll,
      openWindow: mockOpenWindow,
    },
    location: {
      origin: "https://example.com",
    },
  } as any;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Push Event Handler", () => {
  it("should parse payload and show notification", async () => {
    // Arrange
    const mockPayload = {
      type: "new_work_order",
      title: "Work Order Baru",
      message: "WO-001",
      workOrderId: "abc123",
      priority: "normal",
    };

    const mockOptions = {
      body: "WO-001",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "abc123",
      data: {
        url: "https://example.com/pekerjaan/abc123",
        workOrderId: "abc123",
        timestamp: Date.now(),
      },
    };

    vi.mocked(parsePushPayload).mockReturnValue(mockPayload);
    vi.mocked(formatNotificationOptions).mockReturnValue(mockOptions);
    vi.mocked(addNotification).mockResolvedValue("notif_123");
    mockGetNotifications.mockResolvedValue([]); // No existing notifications
    mockMatchAll.mockResolvedValue([]);

    // Import handler after mocks are set up
    const { handlePushEvent } = await import("./pushHandler");

    // Act
    const mockPushEvent = {
      data: {
        json: () => mockPayload,
      },
    } as any;

    await handlePushEvent(mockPushEvent);

    // Assert
    expect(parsePushPayload).toHaveBeenCalledWith(mockPushEvent.data);
    expect(formatNotificationOptions).toHaveBeenCalledWith(mockPayload);
    expect(addNotification).toHaveBeenCalledWith({
      type: "new_work_order",
      title: "Work Order Baru",
      message: "WO-001",
      workOrderId: "abc123",
      timestamp: expect.any(Number),
      read: false,
      clicked: false,
      dismissed: false,
      data: undefined,
    });
    expect(mockShowNotification).toHaveBeenCalledWith(
      "Work Order Baru",
      mockOptions,
    );
    expect(logAnalyticsEvent).toHaveBeenCalledWith({
      type: "notification_shown",
      notificationId: "notif_123",
      notificationType: "new_work_order",
      workOrderId: "abc123",
      timestamp: expect.any(Number),
    });
  });

  it("should handle null push data gracefully", async () => {
    // Arrange
    const mockGenericPayload = {
      type: "generic",
      title: "Notifikasi Baru",
      message: "Anda memiliki update baru",
    };

    vi.mocked(parsePushPayload).mockReturnValue(mockGenericPayload);
    vi.mocked(formatNotificationOptions).mockReturnValue({
      body: "Anda memiliki update baru",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "notification-123",
      data: {
        url: "https://example.com",
        timestamp: Date.now(),
      },
    });
    vi.mocked(addNotification).mockResolvedValue("notif_456");
    mockGetNotifications.mockResolvedValue([]);
    mockMatchAll.mockResolvedValue([]);

    const { handlePushEvent } = await import("./pushHandler");

    // Act
    const mockPushEvent = {
      data: null,
    } as any;

    await handlePushEvent(mockPushEvent);

    // Assert
    expect(parsePushPayload).toHaveBeenCalledWith(null);
    expect(mockShowNotification).toHaveBeenCalled();
  });

  it("should notify foreground clients when app is open", async () => {
    // Arrange
    const mockPayload = {
      type: "status_update",
      title: "Update Status",
      message: "Status changed",
      workOrderId: "wo-001",
    };

    const mockClient = {
      postMessage: vi.fn(),
    };

    vi.mocked(parsePushPayload).mockReturnValue(mockPayload);
    vi.mocked(formatNotificationOptions).mockReturnValue({
      body: "Status changed",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "wo-001",
      data: { url: "/pekerjaan/wo-001", timestamp: Date.now() },
    });
    vi.mocked(addNotification).mockResolvedValue("notif_789");
    mockGetNotifications.mockResolvedValue([]);
    mockMatchAll.mockResolvedValue([mockClient]);

    const { handlePushEvent } = await import("./pushHandler");

    // Act
    const mockPushEvent = {
      data: { json: () => mockPayload },
    } as any;

    await handlePushEvent(mockPushEvent);

    // Assert
    expect(mockClient.postMessage).toHaveBeenCalledWith({
      type: "PUSH_RECEIVED",
      payload: mockPayload,
    });
  });

  it("should show summary notification when exceeding max visible", async () => {
    // Arrange
    const mockPayload = {
      type: "new_work_order",
      title: "Work Order Baru",
      message: "WO-006",
    };

    const existingNotifications = Array(5)
      .fill(null)
      .map((_, i) => ({
        close: vi.fn(),
        data: { type: "new_work_order" },
      }));

    vi.mocked(parsePushPayload).mockReturnValue(mockPayload);
    vi.mocked(formatNotificationOptions).mockReturnValue({
      body: "WO-006",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "wo-006",
      data: { url: "/", timestamp: Date.now() },
    });
    vi.mocked(addNotification).mockResolvedValue("notif_summary");
    mockGetNotifications.mockResolvedValue(existingNotifications);
    mockMatchAll.mockResolvedValue([]);

    const { handlePushEvent } = await import("./pushHandler");

    // Act
    const mockPushEvent = {
      data: { json: () => mockPayload },
    } as any;

    await handlePushEvent(mockPushEvent);

    // Assert
    // Should close all existing notifications
    existingNotifications.forEach((notif) => {
      expect(notif.close).toHaveBeenCalled();
    });

    // Should show summary notification
    expect(mockShowNotification).toHaveBeenCalledWith(
      "5 Notifikasi Baru",
      expect.objectContaining({
        tag: "notification-summary",
        data: expect.objectContaining({
          type: "summary",
          count: 5,
        }),
      }),
    );
  });

  it("should show generic notification on error", async () => {
    // Arrange
    vi.mocked(parsePushPayload).mockImplementation(() => {
      throw new Error("Parse error");
    });
    mockGetNotifications.mockResolvedValue([]);
    mockMatchAll.mockResolvedValue([]);

    const { handlePushEvent } = await import("./pushHandler");

    // Act
    const mockPushEvent = {
      data: { json: () => ({ invalid: true }) },
    } as any;

    await handlePushEvent(mockPushEvent);

    // Assert
    expect(mockShowNotification).toHaveBeenCalledWith(
      "Notifikasi Baru",
      expect.objectContaining({
        body: "Anda memiliki update baru",
        tag: expect.stringContaining("error-"),
      }),
    );
  });
});

describe("Notification Click Handler", () => {
  it("should close notification and open URL", async () => {
    // Arrange
    const mockNotification = {
      close: vi.fn(),
      tag: "notif-123",
      data: {
        url: "https://example.com/pekerjaan/wo-001",
        workOrderId: "wo-001",
        type: "new_work_order",
      },
    };

    mockMatchAll.mockResolvedValue([]);
    mockOpenWindow.mockResolvedValue({});
    vi.mocked(logAnalyticsEvent).mockResolvedValue("analytics-123");

    const { handleNotificationClick } = await import("./pushHandler");

    // Act
    const mockEvent = {
      notification: mockNotification,
    } as any;

    await handleNotificationClick(mockEvent);

    // Assert
    expect(mockNotification.close).toHaveBeenCalled();
    expect(mockOpenWindow).toHaveBeenCalledWith(
      "https://example.com/pekerjaan/wo-001",
    );
    expect(logAnalyticsEvent).toHaveBeenCalledWith({
      type: "notification_clicked",
      notificationId: "notif-123",
      notificationType: "new_work_order",
      workOrderId: "wo-001",
      timestamp: expect.any(Number),
    });
  });

  it("should focus existing window if URL matches", async () => {
    // Arrange
    const mockNotification = {
      close: vi.fn(),
      tag: "notif-456",
      data: {
        url: "https://example.com/pekerjaan/wo-002",
        workOrderId: "wo-002",
        type: "status_update",
      },
    };

    const mockClient = {
      url: "https://example.com/pekerjaan/wo-002",
      focus: mockFocus,
    };

    mockMatchAll.mockResolvedValue([mockClient]);
    vi.mocked(logAnalyticsEvent).mockResolvedValue("analytics-456");

    const { handleNotificationClick } = await import("./pushHandler");

    // Act
    const mockEvent = {
      notification: mockNotification,
    } as any;

    await handleNotificationClick(mockEvent);

    // Assert
    expect(mockNotification.close).toHaveBeenCalled();
    expect(mockFocus).toHaveBeenCalled();
    expect(mockOpenWindow).not.toHaveBeenCalled();
  });

  it("should handle missing notification data gracefully", async () => {
    // Arrange
    const mockNotification = {
      close: vi.fn(),
      tag: "notif-789",
      data: null,
    };

    mockMatchAll.mockResolvedValue([]);
    mockOpenWindow.mockResolvedValue({});
    vi.mocked(logAnalyticsEvent).mockResolvedValue("analytics-789");

    const { handleNotificationClick } = await import("./pushHandler");

    // Act
    const mockEvent = {
      notification: mockNotification,
    } as any;

    await handleNotificationClick(mockEvent);

    // Assert
    expect(mockNotification.close).toHaveBeenCalled();
    expect(mockOpenWindow).toHaveBeenCalledWith("/");
    expect(logAnalyticsEvent).toHaveBeenCalledWith({
      type: "notification_clicked",
      notificationId: "notif-789",
      notificationType: "generic",
      workOrderId: undefined,
      timestamp: expect.any(Number),
    });
  });

  it("should handle errors gracefully", async () => {
    // Arrange
    const mockNotification = {
      close: vi.fn(),
      tag: "notif-error",
      data: {
        url: "https://example.com/test",
      },
    };

    mockMatchAll.mockRejectedValue(new Error("Client error"));

    const { handleNotificationClick } = await import("./pushHandler");

    // Act & Assert - should not throw
    const mockEvent = {
      notification: mockNotification,
    } as any;

    await expect(handleNotificationClick(mockEvent)).resolves.not.toThrow();
    expect(mockNotification.close).toHaveBeenCalled();
  });
});

describe("Notification Grouping", () => {
  it("should group notifications by type in summary", async () => {
    // Arrange
    const existingNotifications = [
      { close: vi.fn(), data: { type: "new_work_order" } },
      { close: vi.fn(), data: { type: "new_work_order" } },
      { close: vi.fn(), data: { type: "status_update" } },
      { close: vi.fn(), data: { type: "status_update" } },
      { close: vi.fn(), data: { type: "generic" } },
    ];

    mockGetNotifications.mockResolvedValue(existingNotifications);

    const mockPayload = {
      type: "new_work_order",
      title: "Work Order Baru",
      message: "WO-006",
    };

    vi.mocked(parsePushPayload).mockReturnValue(mockPayload);
    vi.mocked(formatNotificationOptions).mockReturnValue({
      body: "WO-006",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "wo-006",
      data: { url: "/", timestamp: Date.now() },
    });
    vi.mocked(addNotification).mockResolvedValue("notif_group");
    mockMatchAll.mockResolvedValue([]);

    const { handlePushEvent } = await import("./pushHandler");

    // Act
    const mockPushEvent = {
      data: { json: () => mockPayload },
    } as any;

    await handlePushEvent(mockPushEvent);

    // Assert
    expect(mockShowNotification).toHaveBeenCalledWith(
      "5 Notifikasi Baru",
      expect.objectContaining({
        body: expect.stringContaining("2 work order baru"),
      }),
    );

    expect(mockShowNotification).toHaveBeenCalledWith(
      "5 Notifikasi Baru",
      expect.objectContaining({
        body: expect.stringContaining("2 update status"),
      }),
    );

    expect(mockShowNotification).toHaveBeenCalledWith(
      "5 Notifikasi Baru",
      expect.objectContaining({
        body: expect.stringContaining("1 notifikasi lainnya"),
      }),
    );
  });
});

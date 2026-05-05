/**
 * Unit tests for Notification Payload Parser
 *
 * Tests parsing, formatting, and pretty-printing of push notification payloads.
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3**
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  parsePushPayload,
  formatNotificationOptions,
  prettyPrintNotification,
  parseNotificationString,
  type PushMessageData,
  type PushPayload,
} from "./notificationParser";

// ─── Mock Helpers ─────────────────────────────────────────────────────────────

function createMockPushMessageData(data: unknown): PushMessageData {
  return {
    json: () => data,
    text: () => JSON.stringify(data),
  };
}

// ─── Task 11.1: Parse Push Payload Tests ──────────────────────────────────────

describe("parsePushPayload", () => {
  it("should parse valid new_work_order payload", () => {
    const data = createMockPushMessageData({
      type: "new_work_order",
      message: "Work Order baru: WO-2024-001",
      workOrderId: "abc123",
      priority: "high",
      data: {
        nomorWO: "WO-2024-001",
        jenisPekerjaan: "Pemasangan Baru",
      },
    });

    const result = parsePushPayload(data);

    expect(result.type).toBe("new_work_order");
    expect(result.title).toBe("Work Order Baru");
    expect(result.message).toBe("Work Order baru: WO-2024-001");
    expect(result.workOrderId).toBe("abc123");
    expect(result.priority).toBe("high");
    expect(result.data).toEqual({
      nomorWO: "WO-2024-001",
      jenisPekerjaan: "Pemasangan Baru",
    });
  });

  it("should parse valid status_update payload", () => {
    const data = createMockPushMessageData({
      type: "status_update",
      message: "Status WO-2024-001 diubah menjadi Selesai",
      workOrderId: "abc123",
      data: {
        nomorWO: "WO-2024-001",
        status: "Selesai",
      },
    });

    const result = parsePushPayload(data);

    expect(result.type).toBe("status_update");
    expect(result.title).toBe("Update Status");
    expect(result.message).toBe("Status WO-2024-001 diubah menjadi Selesai");
    expect(result.workOrderId).toBe("abc123");
    expect(result.priority).toBe("normal"); // Default priority
  });

  it("should parse payload with custom title", () => {
    const data = createMockPushMessageData({
      type: "new_work_order",
      title: "Custom Title",
      message: "Custom message",
    });

    const result = parsePushPayload(data);

    expect(result.title).toBe("Custom Title");
  });

  it("should return generic notification for null data", () => {
    const result = parsePushPayload(null);

    expect(result.type).toBe("generic");
    expect(result.title).toBe("Notifikasi Baru");
    expect(result.message).toBe("Anda memiliki update baru");
  });

  it("should return generic notification for invalid payload (missing type)", () => {
    const data = createMockPushMessageData({
      message: "Test message",
    });

    const result = parsePushPayload(data);

    expect(result.type).toBe("generic");
    expect(result.title).toBe("Notifikasi Baru");
    expect(result.message).toBe("Anda memiliki update baru");
  });

  it("should return generic notification for invalid payload (missing message)", () => {
    const data = createMockPushMessageData({
      type: "new_work_order",
    });

    const result = parsePushPayload(data);

    expect(result.type).toBe("generic");
    expect(result.title).toBe("Notifikasi Baru");
    expect(result.message).toBe("Anda memiliki update baru");
  });

  it("should return generic notification for invalid payload (invalid type)", () => {
    const data = createMockPushMessageData({
      type: 123, // Invalid type (not a string)
      message: "Test message",
    });

    const result = parsePushPayload(data);

    expect(result.type).toBe("generic");
    expect(result.title).toBe("Notifikasi Baru");
    expect(result.message).toBe("Anda memiliki update baru");
  });

  it("should handle unknown notification type gracefully", () => {
    const data = createMockPushMessageData({
      type: "unknown_type",
      message: "Test message",
    });

    const result = parsePushPayload(data);

    expect(result.type).toBe("generic");
    expect(result.message).toBe("Test message");
  });

  it("should handle JSON parse errors gracefully", () => {
    const data = {
      json: () => {
        throw new Error("Invalid JSON");
      },
      text: () => "invalid",
    };

    const result = parsePushPayload(data);

    expect(result.type).toBe("generic");
    expect(result.title).toBe("Notifikasi Baru");
    expect(result.message).toBe("Anda memiliki update baru");
  });

  it("should handle priority field correctly (normal)", () => {
    const data = createMockPushMessageData({
      type: "new_work_order",
      message: "Test",
      priority: "normal",
    });

    const result = parsePushPayload(data);

    expect(result.priority).toBe("normal");
  });

  it("should handle priority field correctly (high)", () => {
    const data = createMockPushMessageData({
      type: "new_work_order",
      message: "Test",
      priority: "high",
    });

    const result = parsePushPayload(data);

    expect(result.priority).toBe("high");
  });

  it("should default to normal priority for invalid priority value", () => {
    const data = createMockPushMessageData({
      type: "new_work_order",
      message: "Test",
      priority: "invalid",
    });

    const result = parsePushPayload(data);

    expect(result.priority).toBe("normal");
  });

  it("should handle missing optional fields", () => {
    const data = createMockPushMessageData({
      type: "generic",
      message: "Simple message",
    });

    const result = parsePushPayload(data);

    expect(result.workOrderId).toBeUndefined();
    expect(result.data).toBeUndefined();
    expect(result.priority).toBe("normal");
  });
});

// ─── Task 11.3: Format Notification Options Tests ────────────────────────────

describe("formatNotificationOptions", () => {
  beforeEach(() => {
    // Mock self.location.origin for service worker context
    vi.stubGlobal("self", {
      location: {
        origin: "https://example.com",
      },
    });
  });

  it("should format notification options with workOrderId", () => {
    const payload: PushPayload = {
      type: "new_work_order",
      title: "Work Order Baru",
      message: "WO-2024-001",
      workOrderId: "abc123",
      priority: "normal",
    };

    const result = formatNotificationOptions(payload);

    expect(result.body).toBe("WO-2024-001");
    expect(result.icon).toBe("https://example.com/icon-192.png");
    expect(result.badge).toBe("https://example.com/icon-192.png");
    expect(result.tag).toBe("abc123");
    expect(result.data.url).toBe("https://example.com/pekerjaan/abc123");
    expect(result.data.workOrderId).toBe("abc123");
    expect(result.data.timestamp).toBeGreaterThan(0);
    expect(result.requireInteraction).toBe(false);
    expect(result.vibrate).toEqual([100]);
  });

  it("should format notification options without workOrderId", () => {
    const payload: PushPayload = {
      type: "generic",
      title: "Notifikasi",
      message: "Test message",
      priority: "normal",
    };

    const result = formatNotificationOptions(payload);

    expect(result.tag).toMatch(/^notification-\d+$/);
    expect(result.data.url).toBe("https://example.com");
    expect(result.data.workOrderId).toBeUndefined();
  });

  it("should set requireInteraction and vibrate for high priority", () => {
    const payload: PushPayload = {
      type: "new_work_order",
      title: "Urgent",
      message: "High priority notification",
      priority: "high",
    };

    const result = formatNotificationOptions(payload);

    expect(result.requireInteraction).toBe(true);
    expect(result.vibrate).toEqual([200, 100, 200]);
  });

  it("should set requireInteraction and vibrate for normal priority", () => {
    const payload: PushPayload = {
      type: "status_update",
      title: "Update",
      message: "Normal priority notification",
      priority: "normal",
    };

    const result = formatNotificationOptions(payload);

    expect(result.requireInteraction).toBe(false);
    expect(result.vibrate).toEqual([100]);
  });

  it("should handle missing priority (default to normal)", () => {
    const payload: PushPayload = {
      type: "generic",
      title: "Test",
      message: "Test message",
    };

    const result = formatNotificationOptions(payload);

    expect(result.requireInteraction).toBe(false);
    expect(result.vibrate).toEqual([100]);
  });

  it("should generate unique tags for notifications without workOrderId", async () => {
    const payload: PushPayload = {
      type: "generic",
      title: "Test",
      message: "Test message",
    };

    const result1 = formatNotificationOptions(payload);

    // Wait 1ms to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 1));

    const result2 = formatNotificationOptions(payload);

    expect(result1.tag).not.toBe(result2.tag);
  });
});

// ─── Task 11.4: Pretty Printer Tests ──────────────────────────────────────────

describe("prettyPrintNotification", () => {
  it("should format notification as pretty JSON with 2-space indentation", () => {
    const payload: PushPayload = {
      type: "new_work_order",
      title: "Work Order Baru",
      message: "WO-2024-001",
      workOrderId: "abc123",
      priority: "high",
      data: {
        nomorWO: "WO-2024-001",
      },
    };

    const result = prettyPrintNotification(payload);

    expect(result).toContain('"type": "new_work_order"');
    expect(result).toContain('"title": "Work Order Baru"');
    expect(result).toContain('"message": "WO-2024-001"');
    expect(result).toContain('"workOrderId": "abc123"');
    expect(result).toContain('"priority": "high"');

    // Check indentation (2 spaces)
    const lines = result.split("\n");
    expect(lines[1]).toMatch(/^  /); // Second line should start with 2 spaces
  });

  it("should handle minimal payload", () => {
    const payload: PushPayload = {
      type: "generic",
      title: "Test",
      message: "Test message",
    };

    const result = prettyPrintNotification(payload);

    expect(result).toContain('"type": "generic"');
    expect(result).toContain('"title": "Test"');
    expect(result).toContain('"message": "Test message"');
  });
});

describe("parseNotificationString", () => {
  it("should parse valid JSON string back to payload", () => {
    const jsonString = JSON.stringify({
      type: "new_work_order",
      title: "Work Order Baru",
      message: "WO-2024-001",
      workOrderId: "abc123",
      priority: "high",
    });

    const result = parseNotificationString(jsonString);

    expect(result.type).toBe("new_work_order");
    expect(result.title).toBe("Work Order Baru");
    expect(result.message).toBe("WO-2024-001");
    expect(result.workOrderId).toBe("abc123");
    expect(result.priority).toBe("high");
  });

  it("should throw error for invalid JSON", () => {
    expect(() => parseNotificationString("invalid json")).toThrow();
  });
});

// ─── Round-trip Property Test ─────────────────────────────────────────────────

describe("Round-trip consistency", () => {
  it("should maintain consistency through format -> parse -> format cycle", () => {
    const payload: PushPayload = {
      type: "new_work_order",
      title: "Work Order Baru",
      message: "WO-2024-001",
      workOrderId: "abc123",
      priority: "high",
      data: {
        nomorWO: "WO-2024-001",
        jenisPekerjaan: "Pemasangan Baru",
      },
    };

    // Format -> Parse -> Format
    const formatted1 = prettyPrintNotification(payload);
    const parsed = parseNotificationString(formatted1);
    const formatted2 = prettyPrintNotification(parsed);

    expect(formatted1).toBe(formatted2);
  });

  it("should maintain consistency for minimal payload", () => {
    const payload: PushPayload = {
      type: "generic",
      title: "Test",
      message: "Test message",
    };

    const formatted1 = prettyPrintNotification(payload);
    const parsed = parseNotificationString(formatted1);
    const formatted2 = prettyPrintNotification(parsed);

    expect(formatted1).toBe(formatted2);
  });
});

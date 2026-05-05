/**
 * Notification Payload Parser
 *
 * Parses push notification payloads from the server and formats them
 * for display in the browser. Handles invalid payloads gracefully.
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3**
 */

import type { NotificationType } from "./notificationHistory";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Push message data interface (from Push API)
 */
export interface PushMessageData {
  json(): unknown;
  text(): string;
}

/**
 * Parsed push payload structure
 */
export interface PushPayload {
  /** Type of notification */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification message/body */
  message: string;
  /** Associated work order ID (optional) */
  workOrderId?: string;
  /** Priority level */
  priority?: "normal" | "high";
  /** Additional notification data */
  data?: Record<string, unknown>;
}

/**
 * Notification options for browser Notification API
 */
export interface NotificationOptions {
  /** Notification body text */
  body: string;
  /** Icon URL */
  icon: string;
  /** Badge URL */
  badge: string;
  /** Notification tag for grouping */
  tag: string;
  /** Data attached to notification */
  data: {
    /** URL to navigate to on click */
    url: string;
    /** Associated work order ID */
    workOrderId?: string;
    /** Timestamp when notification was created */
    timestamp: number;
  };
  /** Whether notification requires user interaction to dismiss */
  requireInteraction?: boolean;
  /** Vibration pattern */
  vibrate?: number[];
}

// ─── Default Titles ───────────────────────────────────────────────────────────

/**
 * Gets default title for notification type
 */
function getDefaultTitle(type: NotificationType): string {
  switch (type) {
    case "new_work_order":
      return "Work Order Baru";
    case "status_update":
      return "Update Status";
    case "generic":
    default:
      return "Notifikasi Baru";
  }
}

// ─── Task 11.1: Parse Push Payload ────────────────────────────────────────────

/**
 * Parses push payload from server into structured format.
 * Handles null/undefined data and invalid payloads gracefully.
 *
 * @param data - Push message data from Push API (can be null)
 * @returns Parsed push payload (returns generic notification on error)
 *
 * **Validates: Requirements 6.1, 6.5, 6.7**
 */
export function parsePushPayload(data: PushMessageData | null): PushPayload {
  // Handle null/undefined data
  if (!data) {
    return {
      type: "generic",
      title: "Notifikasi Baru",
      message: "Anda memiliki update baru",
    };
  }

  try {
    const json = data.json() as Record<string, unknown>;

    // Validate required fields
    if (!json.type || typeof json.type !== "string") {
      throw new Error("Missing or invalid 'type' field");
    }

    if (!json.message || typeof json.message !== "string") {
      throw new Error("Missing or invalid 'message' field");
    }

    // Validate type is one of the allowed values
    const validTypes: NotificationType[] = [
      "new_work_order",
      "status_update",
      "generic",
    ];
    const type = validTypes.includes(json.type as NotificationType)
      ? (json.type as NotificationType)
      : "generic";

    // Parse payload
    return {
      type,
      title:
        typeof json.title === "string" ? json.title : getDefaultTitle(type),
      message: json.message,
      workOrderId:
        typeof json.workOrderId === "string" ? json.workOrderId : undefined,
      priority:
        json.priority === "high" || json.priority === "normal"
          ? json.priority
          : "normal",
      data:
        json.data && typeof json.data === "object"
          ? (json.data as Record<string, unknown>)
          : undefined,
    };
  } catch (error) {
    // Return generic notification on parse errors
    console.error("Failed to parse push payload:", error);
    return {
      type: "generic",
      title: "Notifikasi Baru",
      message: "Anda memiliki update baru",
    };
  }
}

// ─── Task 11.3: Format Notification Options ──────────────────────────────────

/**
 * Formats push payload into browser NotificationOptions.
 * Sets title, body, icon, badge, tag, data, requireInteraction, and vibrate.
 *
 * @param payload - Parsed push payload
 * @returns Notification options for browser Notification API
 *
 * **Validates: Requirements 6.2, 6.3, 6.6**
 */
export function formatNotificationOptions(
  payload: PushPayload,
): NotificationOptions {
  // Get base URL (works in both browser and service worker contexts)
  const baseUrl =
    typeof self !== "undefined" && "location" in self
      ? self.location.origin
      : "";

  // Generate notification tag from workOrderId or timestamp
  const tag = payload.workOrderId || `notification-${Date.now()}`;

  // Set data.url for navigation on click
  const url = payload.workOrderId
    ? `${baseUrl}/pekerjaan/${payload.workOrderId}`
    : baseUrl;

  // Set requireInteraction and vibrate based on priority
  const requireInteraction = payload.priority === "high";
  const vibrate = payload.priority === "high" ? [200, 100, 200] : [100];

  return {
    body: payload.message,
    icon: `${baseUrl}/icon-192.png`,
    badge: `${baseUrl}/icon-192.png`,
    tag,
    data: {
      url,
      workOrderId: payload.workOrderId,
      timestamp: Date.now(),
    },
    requireInteraction,
    vibrate,
  };
}

// ─── Task 11.4: Pretty Printer Utilities ──────────────────────────────────────

/**
 * Formats notification payload as pretty-printed JSON string.
 * Uses 2-space indentation for readability.
 *
 * @param payload - Push payload to format
 * @returns Pretty-printed JSON string
 *
 * **Validates: Requirements 7.1, 7.2, 7.3**
 */
export function prettyPrintNotification(payload: PushPayload): string {
  return JSON.stringify(payload, null, 2);
}

/**
 * Parses JSON string back into notification payload.
 *
 * @param jsonString - JSON string to parse
 * @returns Parsed push payload
 * @throws Error if JSON is invalid
 *
 * **Validates: Requirements 7.1, 7.2, 7.3**
 */
export function parseNotificationString(jsonString: string): PushPayload {
  return JSON.parse(jsonString) as PushPayload;
}

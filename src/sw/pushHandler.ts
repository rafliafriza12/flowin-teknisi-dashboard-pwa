/**
 * Service Worker Push Notification Handlers
 *
 * Handles push events and notification clicks in the Service Worker context.
 * Manages notification display, history storage, and navigation on click.
 *
 * **Validates: Requirements 5.1, 5.3, 5.4, 5.5, 5.7, 5.8, 14.2**
 */

import {
  parsePushPayload,
  formatNotificationOptions,
  type PushPayload,
} from "../libs/notificationParser";
import { addNotification } from "../libs/notificationHistory";
import { logAnalyticsEvent } from "../libs/analyticsStorage";

// ─── Service Worker Self Alias ────────────────────────────────────────────────

/**
 * Typed alias for `self` in Service Worker context.
 * The `dom` lib types `self` as `Window & typeof globalThis`, which lacks
 * `registration` and `clients`. We cast here to avoid adding `webworker` lib
 * (which conflicts with DOM types) while still getting proper type safety.
 */
const swSelf = self as unknown as {
  registration: {
    showNotification(
      title: string,
      options?: NotificationOptions,
    ): Promise<void>;
    getNotifications(filter?: { tag?: string }): Promise<Notification[]>;
  };
  clients: {
    matchAll(options?: {
      includeUncontrolled?: boolean;
      type?: string;
    }): Promise<Array<WindowClient>>;
    openWindow(url: string): Promise<WindowClient | null>;
  };
};

// ─── WindowClient type (not available in dom lib without webworker) ───────────
interface WindowClient {
  url: string;
  focus(): Promise<WindowClient>;
  navigate(url: string): Promise<WindowClient | null>;
  postMessage(message: unknown): void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum number of visible notifications before creating summary */
const MAX_VISIBLE_NOTIFICATIONS = 5;

// ─── Push Event Handler ───────────────────────────────────────────────────────

/**
 * Handles incoming push events from the Push Service.
 * Parses payload, stores in history, shows notification, and notifies foreground.
 *
 * **Validates: Requirements 5.1, 5.4, 5.5, 5.7**
 */
export async function handlePushEvent(event: PushEvent): Promise<void> {
  try {
    // Parse push payload (handles null/invalid data gracefully)
    const payload: PushPayload = parsePushPayload(event.data);

    // Format notification options for browser Notification API
    const options = formatNotificationOptions(payload);

    // Store notification in IndexedDB history
    const notificationId = await addNotification({
      type: payload.type,
      title: payload.title,
      message: payload.message,
      workOrderId: payload.workOrderId,
      timestamp: Date.now(),
      read: false,
      clicked: false,
      dismissed: false,
      data: payload.data,
    });

    // Check notification grouping (max 5 visible)
    const shouldGroup = await shouldGroupNotifications();

    if (shouldGroup) {
      // Create summary notification
      await showSummaryNotification();
    } else {
      // Show individual notification
      await swSelf.registration.showNotification(payload.title, options);

      // Log analytics event
      await logAnalyticsEvent({
        type: "notification_shown",
        notificationId,
        notificationType: payload.type,
        workOrderId: payload.workOrderId,
        timestamp: Date.now(),
      });
    }

    // Send message to foreground clients if app is open
    await notifyForegroundClients(payload);
  } catch (error) {
    console.error("Failed to handle push event:", error);

    // Show generic notification on error
    await swSelf.registration.showNotification("Notifikasi Baru", {
      body: "Anda memiliki update baru",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `error-${Date.now()}`,
    });
  }
}

/**
 * Sends push notification data to all open foreground clients.
 * Allows the app to refresh data and show in-app notification.
 *
 * **Validates: Requirements 5.5**
 */
async function notifyForegroundClients(payload: PushPayload): Promise<void> {
  try {
    const clients = await swSelf.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    for (const client of clients) {
      client.postMessage({
        type: "PUSH_RECEIVED",
        payload,
      });
    }
  } catch (error) {
    console.error("Failed to notify foreground clients:", error);
  }
}

// ─── Notification Close (Dismiss) Handler ────────────────────────────────────

/**
 * Handles notification close events when user dismisses without clicking.
 * Logs analytics event for tracking dismissal patterns.
 *
 * **Validates: Requirements 14.3**
 */
export async function handleNotificationClose(
  event: NotificationEvent,
): Promise<void> {
  try {
    const notificationId = event.notification.tag;
    const workOrderId = event.notification.data?.workOrderId;

    await logAnalyticsEvent({
      type: "notification_dismissed",
      notificationId,
      notificationType: event.notification.data?.type || "generic",
      workOrderId,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Failed to handle notification close:", error);
  }
}

// ─── Notification Click Handler ──────────────────────────────────────────────

/**
 * Handles notification click events.
 * Closes notification, focuses/opens app window, and logs analytics.
 *
 * **Validates: Requirements 5.3, 14.2**
 */
export async function handleNotificationClick(
  event: NotificationEvent,
): Promise<void> {
  try {
    // Close the notification
    event.notification.close();

    // Get URL to navigate to
    const urlToOpen = event.notification.data?.url || "/";
    const notificationId = event.notification.tag;
    const workOrderId = event.notification.data?.workOrderId;

    // Try to focus existing window with matching URL
    const clients = await swSelf.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    let clientToFocus: WindowClient | null = null;

    for (const client of clients) {
      if (client.url === urlToOpen && "focus" in client) {
        clientToFocus = client as WindowClient;
        break;
      }
    }

    if (clientToFocus) {
      // Focus existing window
      await clientToFocus.focus();
    } else {
      // Open new window
      await swSelf.clients.openWindow(urlToOpen);
    }

    // Log analytics event
    await logAnalyticsEvent({
      type: "notification_clicked",
      notificationId,
      notificationType: event.notification.data?.type || "generic",
      workOrderId,
      timestamp: Date.now(),
    });

    // Mark notification as clicked in history
    // Note: This will be handled by the foreground app when it receives focus
  } catch (error) {
    console.error("Failed to handle notification click:", error);
  }
}

// ─── Notification Grouping Logic ─────────────────────────────────────────────

/**
 * Checks if notifications should be grouped into a summary.
 * Returns true if there are already MAX_VISIBLE_NOTIFICATIONS or more.
 *
 * **Validates: Requirements 5.8**
 */
async function shouldGroupNotifications(): Promise<boolean> {
  try {
    const notifications = await swSelf.registration.getNotifications();
    return notifications.length >= MAX_VISIBLE_NOTIFICATIONS;
  } catch (error) {
    console.error("Failed to check notification count:", error);
    return false;
  }
}

/**
 * Creates a summary notification when exceeding the max visible limit.
 * Closes all existing notifications and shows a single grouped notification.
 *
 * **Validates: Requirements 5.8**
 */
async function showSummaryNotification(): Promise<void> {
  try {
    // Get all existing notifications
    const notifications = await swSelf.registration.getNotifications();

    // Close all existing notifications
    for (const notification of notifications) {
      notification.close();
    }

    // Count notifications by type
    const workOrderCount = notifications.filter((n: Notification) =>
      (n.data as Record<string, string> | null)?.type?.includes("work_order"),
    ).length;
    const statusUpdateCount = notifications.filter((n: Notification) =>
      (n.data as Record<string, string> | null)?.type?.includes(
        "status_update",
      ),
    ).length;
    const otherCount =
      notifications.length - workOrderCount - statusUpdateCount;

    // Build summary message
    const parts: string[] = [];
    if (workOrderCount > 0) {
      parts.push(`${workOrderCount} work order baru`);
    }
    if (statusUpdateCount > 0) {
      parts.push(`${statusUpdateCount} update status`);
    }
    if (otherCount > 0) {
      parts.push(`${otherCount} notifikasi lainnya`);
    }

    const summaryMessage = parts.join(", ");

    // Show summary notification
    await swSelf.registration.showNotification(
      `${notifications.length} Notifikasi Baru`,
      {
        body: summaryMessage,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "notification-summary",
        data: {
          url: "/",
          type: "summary",
          count: notifications.length,
          timestamp: Date.now(),
        },
        requireInteraction: false,
      },
    );
  } catch (error) {
    console.error("Failed to show summary notification:", error);
  }
}

// ─── Event Listener Registration ─────────────────────────────────────────────

/**
 * Registers push and notification click event listeners.
 * Call this function in the Service Worker global scope.
 */
export function registerPushHandlers(): void {
  self.addEventListener("push", (event: Event) => {
    const pushEvent = event as PushEvent;
    (event as ExtendableEvent).waitUntil(handlePushEvent(pushEvent));
  });

  self.addEventListener("notificationclick", (event: Event) => {
    const notificationEvent = event as NotificationEvent;
    (event as ExtendableEvent).waitUntil(
      handleNotificationClick(notificationEvent),
    );
  });

  self.addEventListener("notificationclose", (event: Event) => {
    const notificationEvent = event as NotificationEvent;
    (event as ExtendableEvent).waitUntil(
      handleNotificationClose(notificationEvent),
    );
  });
}

/**
 * Custom Service Worker Extensions
 *
 * This file contains custom push notification handlers that extend
 * the auto-generated service worker from @ducanh2912/next-pwa.
 *
 * Note: This file is loaded by the main sw.js and provides push notification
 * functionality on top of the Workbox-based caching strategies.
 */

// ─── IndexedDB Helper Functions ──────────────────────────────────────────────

const DB_NAME = "flowin-teknisi-offline";
const DB_VERSION = 3;
const STORE_NOTIFICATION_HISTORY = "notificationHistory";
const STORE_ANALYTICS_EVENTS = "analyticsEvents";

/**
 * Opens IndexedDB connection.
 * If the schema upgrade is required (e.g. v2 → v3), the foreground app's
 * `openDB` in indexedDBMigration.ts handles the actual onupgradeneeded
 * migration. The SW only needs to open at the current version.
 */
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn("IndexedDB upgrade blocked in SW — open clients required");
    };
  });
}

/**
 * Adds notification to history
 */
async function addNotificationToHistory(notification) {
  const db = await openDB();
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NOTIFICATION_HISTORY, "readwrite");
    const store = tx.objectStore(STORE_NOTIFICATION_HISTORY);
    const req = store.add({ ...notification, id });

    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Logs analytics event
 */
async function logAnalytics(event) {
  const db = await openDB();
  const id = `analytics_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYTICS_EVENTS, "readwrite");
    const store = tx.objectStore(STORE_ANALYTICS_EVENTS);
    const req = store.add({ ...event, id, synced: false });

    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error);
  });
}

// ─── Notification Parser ──────────────────────────────────────────────────────

/**
 * Parses push payload from server
 */
function parsePushPayload(data) {
  if (!data) {
    return {
      type: "generic",
      title: "Notifikasi Baru",
      message: "Anda memiliki update baru",
    };
  }

  try {
    const json = data.json();

    if (!json.type || !json.message) {
      throw new Error("Invalid payload structure");
    }

    const validTypes = ["new_work_order", "status_update", "generic"];
    const type = validTypes.includes(json.type) ? json.type : "generic";

    return {
      type,
      title: json.title || getDefaultTitle(type),
      message: json.message,
      workOrderId: json.workOrderId,
      priority: json.priority === "high" ? "high" : "normal",
      data: json.data,
    };
  } catch (error) {
    console.error("Failed to parse push payload:", error);
    return {
      type: "generic",
      title: "Notifikasi Baru",
      message: "Anda memiliki update baru",
    };
  }
}

/**
 * Gets default title for notification type
 */
function getDefaultTitle(type) {
  switch (type) {
    case "new_work_order":
      return "Work Order Baru";
    case "status_update":
      return "Update Status";
    default:
      return "Notifikasi Baru";
  }
}

/**
 * Formats notification options for browser API
 */
function formatNotificationOptions(payload) {
  const baseUrl = self.location.origin;
  const tag = payload.workOrderId || `notification-${Date.now()}`;
  const url = payload.workOrderId
    ? `${baseUrl}/pekerjaan/${payload.workOrderId}`
    : baseUrl;

  return {
    body: payload.message,
    icon: `${baseUrl}/icon-192.png`,
    badge: `${baseUrl}/icon-192.png`,
    tag,
    data: {
      url,
      workOrderId: payload.workOrderId,
      type: payload.type,
      timestamp: Date.now(),
    },
    requireInteraction: payload.priority === "high",
    vibrate: payload.priority === "high" ? [200, 100, 200] : [100],
  };
}

// ─── Notification Grouping ───────────────────────────────────────────────────

const MAX_VISIBLE_NOTIFICATIONS = 5;

/**
 * Checks if notifications should be grouped
 */
async function shouldGroupNotifications() {
  try {
    const notifications = await self.registration.getNotifications();
    return notifications.length >= MAX_VISIBLE_NOTIFICATIONS;
  } catch (error) {
    console.error("Failed to check notification count:", error);
    return false;
  }
}

/**
 * Shows summary notification
 */
async function showSummaryNotification() {
  try {
    const notifications = await self.registration.getNotifications();

    // Close all existing notifications
    for (const notification of notifications) {
      notification.close();
    }

    // Count by type
    const workOrderCount = notifications.filter((n) =>
      n.data?.type?.includes("work_order"),
    ).length;
    const statusUpdateCount = notifications.filter((n) =>
      n.data?.type?.includes("status_update"),
    ).length;
    const otherCount =
      notifications.length - workOrderCount - statusUpdateCount;

    // Build summary message
    const parts = [];
    if (workOrderCount > 0) parts.push(`${workOrderCount} work order baru`);
    if (statusUpdateCount > 0) parts.push(`${statusUpdateCount} update status`);
    if (otherCount > 0) parts.push(`${otherCount} notifikasi lainnya`);

    const summaryMessage = parts.join(", ");

    await self.registration.showNotification(
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

// ─── Push Event Handler ───────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Parse payload
        const payload = parsePushPayload(event.data);
        const options = formatNotificationOptions(payload);

        // Store in history
        const notificationId = await addNotificationToHistory({
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

        // Check if should group
        const shouldGroup = await shouldGroupNotifications();

        if (shouldGroup) {
          await showSummaryNotification();
        } else {
          await self.registration.showNotification(payload.title, options);

          // Log analytics
          await logAnalytics({
            type: "notification_shown",
            notificationId,
            notificationType: payload.type,
            workOrderId: payload.workOrderId,
            timestamp: Date.now(),
          });
        }

        // Notify foreground clients
        const clients = await self.clients.matchAll({
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
        console.error("Failed to handle push event:", error);

        // Show generic notification on error
        await self.registration.showNotification("Notifikasi Baru", {
          body: "Anda memiliki update baru",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: `error-${Date.now()}`,
        });
      }
    })(),
  );
});

// ─── Notification Click Handler ──────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Close notification
        event.notification.close();

        // Get URL and data
        const urlToOpen = event.notification.data?.url || "/";
        const notificationId = event.notification.tag;
        const workOrderId = event.notification.data?.workOrderId;

        // Try to focus existing window
        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });

        let clientToFocus = null;

        for (const client of clients) {
          if (client.url === urlToOpen && "focus" in client) {
            clientToFocus = client;
            break;
          }
        }

        if (clientToFocus) {
          await clientToFocus.focus();
        } else {
          await self.clients.openWindow(urlToOpen);
        }

        // Log analytics
        await logAnalytics({
          type: "notification_clicked",
          notificationId,
          notificationType: event.notification.data?.type || "generic",
          workOrderId,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Failed to handle notification click:", error);
      }
    })(),
  );
});

// ─── Activation: Schema Migration & Notify Clients ──────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const db = await openDB();
        db.close();

        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        for (const client of clients) {
          client.postMessage({
            type: "SW_ACTIVATED",
            version: DB_VERSION,
          });
        }
      } catch (err) {
        console.error("SW activation migration failed:", err);
        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        for (const client of clients) {
          client.postMessage({
            type: "SW_ACTIVATION_ERROR",
            error: String(err),
          });
        }
      }
    })(),
  );
});

// ─── Skip Waiting (SW Update) ────────────────────────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ─── Background Sync Handler ─────────────────────────────────────────────────

const SYNC_TAG = "offline-sync";
const STORE_UPLOADS = "pendingUploads";
const MAX_RETRY_ATTEMPTS = 3;
const BACKOFF_MS = [60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000]; // 1m, 5m, 15m

async function getActivePendingItemsSW() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_UPLOADS, "readonly");
    const store = tx.objectStore(STORE_UPLOADS);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      resolve(
        all.filter((i) => i.status === "pending" || i.status === "error"),
      );
    };
    req.onerror = () => reject(req.error);
  });
}

async function notifyClientsSyncComplete(stats) {
  try {
    const clients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    for (const client of clients) {
      client.postMessage({ type: "OFFLINE_SYNC_COMPLETE", stats });
    }
  } catch (err) {
    console.error("Failed to notify clients about sync completion:", err);
  }
}

async function syncOfflineQueue() {
  try {
    const items = await getActivePendingItemsSW();

    if (items.length === 0) {
      return { synced: 0, failed: 0, attempted: 0 };
    }

    // SW cannot run the full upload pipeline (Cloudinary uploads, signed
    // mutations) directly — it delegates to the foreground client. If no
    // client is open, we ping any future client that opens.
    const clients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    if (clients.length > 0) {
      for (const client of clients) {
        client.postMessage({
          type: "OFFLINE_SYNC_REQUEST",
          itemCount: items.length,
        });
      }
      return { synced: 0, failed: 0, attempted: items.length, delegated: true };
    }

    // No active clients — leave items in queue, retry will be scheduled below.
    return { synced: 0, failed: items.length, attempted: items.length };
  } catch (err) {
    console.error("syncOfflineQueue error:", err);
    return { synced: 0, failed: 0, attempted: 0, error: String(err) };
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag !== SYNC_TAG) return;

  event.waitUntil(
    (async () => {
      const stats = await syncOfflineQueue();
      await notifyClientsSyncComplete(stats);

      // If items remain after delegation (no clients), schedule retry by
      // re-registering with the SyncManager. The browser handles backoff,
      // but we cap attempts at MAX_RETRY_ATTEMPTS via a counter on self.
      if (stats.failed > 0 && self.registration.sync) {
        self.__offlineSyncAttempts = (self.__offlineSyncAttempts || 0) + 1;
        if (self.__offlineSyncAttempts < MAX_RETRY_ATTEMPTS) {
          const delay =
            BACKOFF_MS[self.__offlineSyncAttempts - 1] || BACKOFF_MS[BACKOFF_MS.length - 1];
          setTimeout(() => {
            self.registration.sync
              .register(SYNC_TAG)
              .catch((err) => console.error("Retry sync register failed:", err));
          }, delay);
        }
      } else {
        self.__offlineSyncAttempts = 0;
      }
    })(),
  );
});

// ─── Notification Close (Dismiss) Handler ────────────────────────────────────

self.addEventListener("notificationclose", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const notificationId = event.notification.tag;
        const workOrderId = event.notification.data?.workOrderId;

        await logAnalytics({
          type: "notification_dismissed",
          notificationId,
          notificationType: event.notification.data?.type || "generic",
          workOrderId,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Failed to handle notification close:", error);
      }
    })(),
  );
});

console.log("Custom push notification handlers registered");

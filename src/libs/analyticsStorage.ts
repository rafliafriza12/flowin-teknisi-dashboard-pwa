/**
 * Analytics Events Storage Operations
 *
 * Manages analytics event storage in IndexedDB for notification tracking.
 * Provides operations for logging events, batch syncing, and LRU eviction.
 *
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**
 */

import { openDB, STORE_ANALYTICS_EVENTS } from "./indexedDBMigration";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | "notification_shown"
  | "notification_clicked"
  | "notification_dismissed";

export interface AnalyticsEvent {
  /** Unique identifier (auto-generated) */
  id: string;
  /** Type of analytics event */
  type: AnalyticsEventType;
  /** Notification ID that triggered this event */
  notificationId: string;
  /** Type of notification (for categorization) */
  notificationType: string;
  /** Associated work order ID (optional) */
  workOrderId?: string;
  /** Timestamp when event occurred */
  timestamp: number;
  /** Whether event has been synced to server */
  synced: boolean;
  /** Timestamp when event was synced (if synced) */
  syncedAt?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum number of analytics events to store (LRU eviction) */
const MAX_ANALYTICS_EVENTS = 1000;

// ─── CRUD Operations ──────────────────────────────────────────────────────────

/**
 * Logs a new analytics event.
 * Enforces the 1000 event limit with LRU eviction.
 *
 * @param event - Analytics event (without id, will be auto-generated)
 * @returns Promise<string> - The generated event ID
 *
 * **Validates: Requirements 14.1, 14.6**
 */
export async function logAnalyticsEvent(
  event: Omit<AnalyticsEvent, "id" | "synced" | "syncedAt">,
): Promise<string> {
  const db = await openDB();

  // Check if we need to evict old events
  const currentCount = await countAnalyticsEvents();

  if (currentCount >= MAX_ANALYTICS_EVENTS) {
    // Evict oldest synced events first, then oldest unsynced if needed
    await evictOldestEvents(1);
  }

  const id = `analytics_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const record: AnalyticsEvent = {
    ...event,
    id,
    synced: false,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYTICS_EVENTS, "readwrite");
    const store = tx.objectStore(STORE_ANALYTICS_EVENTS);
    const req = store.add(record);

    req.onsuccess = () => resolve(id);
    req.onerror = () =>
      reject(
        new Error(
          `Failed to log analytics event: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Gets all unsynced analytics events for batch sending to server.
 *
 * @returns Promise<AnalyticsEvent[]> - Array of unsynced events
 *
 * **Validates: Requirements 14.2**
 */
export async function getUnsyncedEvents(): Promise<AnalyticsEvent[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYTICS_EVENTS, "readonly");
    const store = tx.objectStore(STORE_ANALYTICS_EVENTS);
    const index = store.index("synced");
    const req = index.getAll(IDBKeyRange.only(false)); // Get where synced = false

    req.onsuccess = () => {
      resolve(req.result as AnalyticsEvent[]);
    };

    req.onerror = () =>
      reject(
        new Error(
          `Failed to get unsynced events: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Marks multiple events as synced.
 * Called after successfully sending events to server.
 *
 * @param eventIds - Array of event IDs to mark as synced
 * @returns Promise<void>
 *
 * **Validates: Requirements 14.3**
 */
export async function markEventsSynced(eventIds: string[]): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYTICS_EVENTS, "readwrite");
    const store = tx.objectStore(STORE_ANALYTICS_EVENTS);

    let completed = 0;
    let hasError = false;

    if (eventIds.length === 0) {
      resolve();
      return;
    }

    for (const id of eventIds) {
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const record = getReq.result as AnalyticsEvent | undefined;

        if (!record) {
          completed++;
          if (completed === eventIds.length && !hasError) {
            resolve();
          }
          return;
        }

        const updated: AnalyticsEvent = {
          ...record,
          synced: true,
          syncedAt: Date.now(),
        };

        const putReq = store.put(updated);

        putReq.onsuccess = () => {
          completed++;
          if (completed === eventIds.length && !hasError) {
            resolve();
          }
        };

        putReq.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(
              new Error(
                `Failed to mark event as synced: ${putReq.error?.message || "Unknown error"}`,
              ),
            );
          }
        };
      };

      getReq.onerror = () => {
        if (!hasError) {
          hasError = true;
          reject(
            new Error(
              `Failed to get event: ${getReq.error?.message || "Unknown error"}`,
            ),
          );
        }
      };
    }
  });
}

/**
 * Cleans up synced events to free up storage.
 * Deletes all events that have been successfully synced.
 *
 * @returns Promise<number> - Number of events deleted
 *
 * **Validates: Requirements 14.3**
 */
export async function cleanupSyncedEvents(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYTICS_EVENTS, "readwrite");
    const store = tx.objectStore(STORE_ANALYTICS_EVENTS);
    const index = store.index("synced");
    const req = index.openCursor(IDBKeyRange.only(true)); // Get where synced = true

    let deletedCount = 0;

    req.onsuccess = () => {
      const cursor = req.result;

      if (!cursor) {
        resolve(deletedCount);
        return;
      }

      cursor.delete();
      deletedCount++;
      cursor.continue();
    };

    req.onerror = () =>
      reject(
        new Error(
          `Failed to cleanup synced events: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Evicts the oldest events to maintain the MAX_ANALYTICS_EVENTS limit.
 * Uses LRU strategy: removes oldest synced events first, then oldest unsynced.
 *
 * @param count - Number of events to evict
 * @returns Promise<number> - Number of events actually evicted
 *
 * **Validates: Requirements 14.6**
 */
export async function evictOldestEvents(count: number): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYTICS_EVENTS, "readwrite");
    const store = tx.objectStore(STORE_ANALYTICS_EVENTS);
    const index = store.index("timestamp");
    const req = index.openCursor(); // Ascending order (oldest first)

    let evictedCount = 0;
    let syncedEvicted = 0;

    req.onsuccess = () => {
      const cursor = req.result;

      if (!cursor || evictedCount >= count) {
        resolve(evictedCount);
        return;
      }

      const event = cursor.value as AnalyticsEvent;

      // Prefer evicting synced events first
      if (event.synced || syncedEvicted >= count) {
        cursor.delete();
        evictedCount++;
        if (event.synced) {
          syncedEvicted++;
        }
      }

      cursor.continue();
    };

    req.onerror = () =>
      reject(
        new Error(
          `Failed to evict events: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Gets the total count of analytics events.
 *
 * @returns Promise<number> - Total number of events
 */
export async function countAnalyticsEvents(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYTICS_EVENTS, "readonly");
    const store = tx.objectStore(STORE_ANALYTICS_EVENTS);
    const req = store.count();

    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(
        new Error(
          `Failed to count events: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Gets analytics events by type.
 *
 * @param type - Event type to filter by
 * @returns Promise<AnalyticsEvent[]> - Array of matching events
 */
export async function getEventsByType(
  type: AnalyticsEventType,
): Promise<AnalyticsEvent[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYTICS_EVENTS, "readonly");
    const store = tx.objectStore(STORE_ANALYTICS_EVENTS);
    const req = store.getAll();

    req.onsuccess = () => {
      const all = req.result as AnalyticsEvent[];
      const filtered = all.filter((event) => event.type === type);
      resolve(filtered);
    };

    req.onerror = () =>
      reject(
        new Error(
          `Failed to get events by type: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Deletes all analytics events.
 * Use with caution - this will delete all tracking data.
 *
 * @returns Promise<void>
 */
export async function clearAllAnalyticsEvents(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYTICS_EVENTS, "readwrite");
    const store = tx.objectStore(STORE_ANALYTICS_EVENTS);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(
        new Error(
          `Failed to clear analytics events: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Gets analytics statistics for a specific notification.
 *
 * @param notificationId - Notification ID
 * @returns Promise<{ shown: number; clicked: number; dismissed: number }> - Event counts
 */
export async function getNotificationStats(notificationId: string): Promise<{
  shown: number;
  clicked: number;
  dismissed: number;
}> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANALYTICS_EVENTS, "readonly");
    const store = tx.objectStore(STORE_ANALYTICS_EVENTS);
    const req = store.getAll();

    req.onsuccess = () => {
      const all = req.result as AnalyticsEvent[];
      const filtered = all.filter(
        (event) => event.notificationId === notificationId,
      );

      const stats = {
        shown: filtered.filter((e) => e.type === "notification_shown").length,
        clicked: filtered.filter((e) => e.type === "notification_clicked")
          .length,
        dismissed: filtered.filter((e) => e.type === "notification_dismissed")
          .length,
      };

      resolve(stats);
    };

    req.onerror = () =>
      reject(
        new Error(
          `Failed to get notification stats: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

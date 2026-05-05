/**
 * Notification History Operations
 *
 * Manages notification history storage in IndexedDB for push notifications.
 * Provides operations for adding, querying, marking as read/clicked, and cleanup.
 *
 * **Validates: Requirements 5.7, 14.1, 14.2, 14.3**
 */

import { openDB, STORE_NOTIFICATION_HISTORY } from "./indexedDBMigration";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = "new_work_order" | "status_update" | "generic";

export interface NotificationHistoryItem {
  /** Unique identifier (auto-generated) */
  id: string;
  /** Type of notification */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification message/body */
  message: string;
  /** Associated work order ID (optional) */
  workOrderId?: string;
  /** Timestamp when notification was received */
  timestamp: number;
  /** Whether notification has been read */
  read: boolean;
  /** Whether notification has been clicked */
  clicked: boolean;
  /** Whether notification was dismissed without clicking */
  dismissed: boolean;
  /** Additional notification data */
  data?: Record<string, unknown>;
}

export interface NotificationFilters {
  /** Filter by notification type */
  type?: NotificationType;
  /** Filter by work order ID */
  workOrderId?: string;
  /** Filter by read status */
  read?: boolean;
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum age of notifications in milliseconds (30 days) */
const MAX_NOTIFICATION_AGE = 30 * 24 * 60 * 60 * 1000;

// ─── CRUD Operations ──────────────────────────────────────────────────────────

/**
 * Adds a new notification to history.
 *
 * @param item - Notification item (without id, will be auto-generated)
 * @returns Promise<string> - The generated notification ID
 *
 * **Validates: Requirements 5.7, 14.1**
 */
export async function addNotification(
  item: Omit<NotificationHistoryItem, "id">,
): Promise<string> {
  const db = await openDB();
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const record: NotificationHistoryItem = {
    ...item,
    id,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NOTIFICATION_HISTORY, "readwrite");
    const store = tx.objectStore(STORE_NOTIFICATION_HISTORY);
    const req = store.add(record);

    req.onsuccess = () => resolve(id);
    req.onerror = () =>
      reject(
        new Error(
          `Failed to add notification: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Gets notifications with optional filters and pagination.
 *
 * @param filters - Optional filters for querying notifications
 * @returns Promise<NotificationHistoryItem[]> - Array of matching notifications
 *
 * **Validates: Requirements 5.7, 14.2**
 */
export async function getNotifications(
  filters?: NotificationFilters,
): Promise<NotificationHistoryItem[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NOTIFICATION_HISTORY, "readonly");
    const store = tx.objectStore(STORE_NOTIFICATION_HISTORY);

    // Get all notifications sorted by timestamp (newest first)
    const index = store.index("timestamp");
    const req = index.openCursor(null, "prev"); // 'prev' for descending order

    const results: NotificationHistoryItem[] = [];
    let skipped = 0;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || Infinity;

    req.onsuccess = () => {
      const cursor = req.result;

      if (!cursor || results.length >= limit) {
        resolve(results);
        return;
      }

      const item = cursor.value as NotificationHistoryItem;

      // Apply filters
      let matches = true;

      if (filters?.type && item.type !== filters.type) {
        matches = false;
      }

      if (filters?.workOrderId && item.workOrderId !== filters.workOrderId) {
        matches = false;
      }

      if (filters?.read !== undefined && item.read !== filters.read) {
        matches = false;
      }

      if (matches) {
        // Handle pagination offset
        if (skipped < offset) {
          skipped++;
        } else {
          results.push(item);
        }
      }

      cursor.continue();
    };

    req.onerror = () =>
      reject(
        new Error(
          `Failed to get notifications: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Marks a notification as read.
 *
 * @param id - Notification ID
 * @returns Promise<void>
 *
 * **Validates: Requirements 5.7, 14.2**
 */
export async function markAsRead(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NOTIFICATION_HISTORY, "readwrite");
    const store = tx.objectStore(STORE_NOTIFICATION_HISTORY);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result as NotificationHistoryItem | undefined;

      if (!record) {
        reject(new Error(`Notification not found: ${id}`));
        return;
      }

      const updated: NotificationHistoryItem = {
        ...record,
        read: true,
      };

      const putReq = store.put(updated);

      putReq.onsuccess = () => resolve();
      putReq.onerror = () =>
        reject(
          new Error(
            `Failed to mark as read: ${putReq.error?.message || "Unknown error"}`,
          ),
        );
    };

    getReq.onerror = () =>
      reject(
        new Error(
          `Failed to get notification: ${getReq.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Marks a notification as clicked.
 * Also marks it as read automatically.
 *
 * @param id - Notification ID
 * @returns Promise<void>
 *
 * **Validates: Requirements 5.7, 14.2**
 */
export async function markAsClicked(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NOTIFICATION_HISTORY, "readwrite");
    const store = tx.objectStore(STORE_NOTIFICATION_HISTORY);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result as NotificationHistoryItem | undefined;

      if (!record) {
        reject(new Error(`Notification not found: ${id}`));
        return;
      }

      const updated: NotificationHistoryItem = {
        ...record,
        clicked: true,
        read: true, // Clicking implies reading
      };

      const putReq = store.put(updated);

      putReq.onsuccess = () => resolve();
      putReq.onerror = () =>
        reject(
          new Error(
            `Failed to mark as clicked: ${putReq.error?.message || "Unknown error"}`,
          ),
        );
    };

    getReq.onerror = () =>
      reject(
        new Error(
          `Failed to get notification: ${getReq.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Gets the count of unread notifications.
 *
 * @returns Promise<number> - Number of unread notifications
 *
 * **Validates: Requirements 5.7, 14.2**
 */
export async function getUnreadCount(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NOTIFICATION_HISTORY, "readonly");
    const store = tx.objectStore(STORE_NOTIFICATION_HISTORY);
    const index = store.index("read");
    const req = index.count(IDBKeyRange.only(false)); // Count where read = false

    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(
        new Error(
          `Failed to get unread count: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Cleans up old notifications (older than 30 days).
 * Should be called periodically to prevent storage bloat.
 *
 * @returns Promise<number> - Number of notifications deleted
 *
 * **Validates: Requirements 14.3**
 */
export async function cleanupOldNotifications(): Promise<number> {
  const db = await openDB();
  const cutoffTime = Date.now() - MAX_NOTIFICATION_AGE;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NOTIFICATION_HISTORY, "readwrite");
    const store = tx.objectStore(STORE_NOTIFICATION_HISTORY);
    const index = store.index("timestamp");
    const req = index.openCursor();

    let deletedCount = 0;

    req.onsuccess = () => {
      const cursor = req.result;

      if (!cursor) {
        resolve(deletedCount);
        return;
      }

      const item = cursor.value as NotificationHistoryItem;

      if (item.timestamp < cutoffTime) {
        cursor.delete();
        deletedCount++;
      }

      cursor.continue();
    };

    req.onerror = () =>
      reject(
        new Error(
          `Failed to cleanup notifications: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Deletes a specific notification by ID.
 *
 * @param id - Notification ID
 * @returns Promise<void>
 */
export async function deleteNotification(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NOTIFICATION_HISTORY, "readwrite");
    const store = tx.objectStore(STORE_NOTIFICATION_HISTORY);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(
        new Error(
          `Failed to delete notification: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

/**
 * Deletes all notifications.
 * Use with caution.
 *
 * @returns Promise<void>
 */
export async function clearAllNotifications(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NOTIFICATION_HISTORY, "readwrite");
    const store = tx.objectStore(STORE_NOTIFICATION_HISTORY);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(
        new Error(
          `Failed to clear notifications: ${req.error?.message || "Unknown error"}`,
        ),
      );
  });
}

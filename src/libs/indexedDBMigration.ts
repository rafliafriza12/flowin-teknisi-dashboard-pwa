/**
 * IndexedDB Migration Utility
 *
 * Handles database version upgrades and schema migrations for the offline-first system.
 * Manages migration from v1 → v2 with new object stores for push notifications and analytics.
 *
 * **Validates: Requirements 5.7, 11.1, 11.2, 14.1**
 */

const DB_NAME = "flowin-teknisi-offline";
const DB_VERSION = 3;

// Store names
export const STORE_UPLOADS = "pendingUploads";
export const STORE_NOTIFICATION_HISTORY = "notificationHistory";
export const STORE_PUSH_SUBSCRIPTION = "pushSubscription";
export const STORE_ANALYTICS_EVENTS = "analyticsEvents";
export const STORE_CONFLICT_RESOLUTIONS = "conflictResolutions";

/**
 * Opens the IndexedDB database with version 2 schema.
 * Handles migration from v1 to v2 by adding new object stores.
 *
 * @returns Promise<IDBDatabase> - The opened database instance
 * @throws Error if IndexedDB is not available (SSR or private mode)
 */
export async function openDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB tidak tersedia di server");
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      try {
        // Version 1: pendingUploads store (existing)
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains(STORE_UPLOADS)) {
            const uploadsStore = db.createObjectStore(STORE_UPLOADS, {
              keyPath: "id",
            });
            uploadsStore.createIndex("status", "status", { unique: false });
            uploadsStore.createIndex("workOrderId", "workOrderId", {
              unique: false,
            });
            uploadsStore.createIndex("createdAt", "createdAt", {
              unique: false,
            });
          }
        }

        // Version 2: Add notification, subscription, and analytics stores
        if (oldVersion < 2) {
          // Notification History Store
          if (!db.objectStoreNames.contains(STORE_NOTIFICATION_HISTORY)) {
            const notificationStore = db.createObjectStore(
              STORE_NOTIFICATION_HISTORY,
              {
                keyPath: "id",
                autoIncrement: false,
              },
            );
            notificationStore.createIndex("timestamp", "timestamp", {
              unique: false,
            });
            notificationStore.createIndex("type", "type", { unique: false });
            notificationStore.createIndex("read", "read", { unique: false });
            notificationStore.createIndex("workOrderId", "workOrderId", {
              unique: false,
            });
          }

          // Push Subscription Store
          if (!db.objectStoreNames.contains(STORE_PUSH_SUBSCRIPTION)) {
            db.createObjectStore(STORE_PUSH_SUBSCRIPTION, {
              keyPath: "userId",
            });
          }

          // Analytics Events Store
          if (!db.objectStoreNames.contains(STORE_ANALYTICS_EVENTS)) {
            const analyticsStore = db.createObjectStore(
              STORE_ANALYTICS_EVENTS,
              {
                keyPath: "id",
                autoIncrement: false,
              },
            );
            analyticsStore.createIndex("timestamp", "timestamp", {
              unique: false,
            });
            analyticsStore.createIndex("synced", "synced", { unique: false });
          }
        }

        // Version 3: Add conflict resolutions store
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains(STORE_CONFLICT_RESOLUTIONS)) {
            const conflictStore = db.createObjectStore(
              STORE_CONFLICT_RESOLUTIONS,
              {
                keyPath: "itemId",
                autoIncrement: false,
              },
            );
            conflictStore.createIndex("detectedAt", "detectedAt", {
              unique: false,
            });
            conflictStore.createIndex("resolved", "resolved", {
              unique: false,
            });
          }
        }
      } catch (error) {
        console.error("Migration error:", error);
        reject(
          new Error(
            `Failed to migrate database: ${error instanceof Error ? error.message : "Unknown error"}`,
          ),
        );
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        new Error(
          `Failed to open database: ${request.error?.message || "Unknown error"}`,
        ),
      );
    };

    request.onblocked = () => {
      console.warn(
        "Database upgrade blocked. Please close other tabs with this app.",
      );
    };
  });
}

/**
 * Checks if the database needs migration.
 *
 * @returns Promise<boolean> - True if migration is needed
 */
export async function needsMigration(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME);

    request.onsuccess = () => {
      const db = request.result;
      const needsUpgrade = db.version < DB_VERSION;
      db.close();
      resolve(needsUpgrade);
    };

    request.onerror = () => {
      // If database doesn't exist or error, migration is needed
      resolve(true);
    };
  });
}

/**
 * Gets the current database version.
 *
 * @returns Promise<number> - Current database version, or 0 if database doesn't exist
 */
export async function getCurrentVersion(): Promise<number> {
  if (typeof window === "undefined") {
    return 0;
  }

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME);

    request.onsuccess = () => {
      const db = request.result;
      const version = db.version;
      db.close();
      resolve(version);
    };

    request.onerror = () => {
      resolve(0);
    };
  });
}

/**
 * Deletes the entire database (for testing or reset purposes).
 * Use with caution - this will delete all offline data.
 *
 * @returns Promise<void>
 */
export async function deleteDatabase(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB tidak tersedia di server");
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(
        new Error(
          `Failed to delete database: ${request.error?.message || "Unknown error"}`,
        ),
      );
    };

    request.onblocked = () => {
      console.warn(
        "Database deletion blocked. Please close other tabs with this app.",
      );
    };
  });
}

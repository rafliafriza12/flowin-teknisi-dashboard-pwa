/**
 * Service Worker type declarations.
 *
 * These types are part of the Service Worker API but are NOT included in
 * TypeScript's `dom` lib. Declaring them here avoids adding `webworker`
 * to tsconfig.json (which would conflict with dom types across the project).
 */

// PushMessageData – the payload carried by a PushEvent
interface PushMessageData {
  arrayBuffer(): ArrayBuffer;
  blob(): Blob;
  json(): unknown;
  text(): string;
}

// PushEvent – fired when a push message is received by the SW
interface PushEvent extends Event {
  readonly data: PushMessageData | null;
  waitUntil(promise: Promise<unknown>): void;
}

// NotificationEvent – fired when the user interacts with a shown notification
interface NotificationEvent extends Event {
  readonly notification: Notification;
  readonly action: string;
  waitUntil(promise: Promise<unknown>): void;
}

// ExtendableEvent – base for SW lifecycle events (install, activate, sync, …)
interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

// SyncEvent – fired by the Background Sync API
interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
  readonly lastChance: boolean;
}

// ServiceWorkerRegistration subset needed by pushHandler.ts
// (full type is in the webworker lib; we only need showNotification here)
interface ServiceWorkerRegistration {
  showNotification(title: string, options?: NotificationOptions): Promise<void>;
  getNotifications(filter?: { tag?: string }): Promise<Notification[]>;
}

// Augment `self` so SW files can access `self.registration` and `self.clients`
declare const self: Window &
  typeof globalThis & {
    registration: ServiceWorkerRegistration;
    clients: {
      matchAll(options?: {
        includeUncontrolled?: boolean;
        type?: "window" | "worker" | "sharedworker" | "all";
      }): Promise<{ postMessage(message: unknown): void }[]>;
    };
  };

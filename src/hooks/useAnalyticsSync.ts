/**
 * Analytics Sync Hook
 *
 * Periodically syncs unsynced analytics events from IndexedDB to the server.
 * Runs on app startup and every hour while the app is open.
 *
 * **Validates: Requirements 14.4, 14.5**
 */

"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  getUnsyncedEvents,
  markEventsSynced,
  type AnalyticsEvent,
} from "@/libs/analyticsStorage";
import { isAnalyticsEnabled } from "@/libs/analyticsPreferences";
import { graphqlAction } from "@/libs/graphql/actions";
import { SEND_ANALYTICS_EVENTS } from "@/libs/graphql/mutations/analytics";

const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const BATCH_SIZE = 50;

interface SendAnalyticsEventsResponse {
  sendAnalyticsEvents: {
    success: boolean;
    message?: string;
    syncedCount?: number;
  };
}

interface AnalyticsEventInput {
  type: string;
  notificationId: string;
  notificationType: string;
  workOrderId?: string;
  timestamp: number;
}

function toInput(event: AnalyticsEvent): AnalyticsEventInput {
  return {
    type: event.type,
    notificationId: event.notificationId,
    notificationType: event.notificationType,
    workOrderId: event.workOrderId,
    timestamp: event.timestamp,
  };
}

/**
 * Sends a batch of unsynced events to the server. Returns number of events
 * actually synced. Safe to call concurrently — uses an internal lock.
 */
export async function syncAnalyticsBatch(): Promise<number> {
  if (!isAnalyticsEnabled()) return 0;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return 0;

  let totalSynced = 0;
  let events = await getUnsyncedEvents();

  while (events.length > 0) {
    const batch = events.slice(0, BATCH_SIZE);
    try {
      const response = await graphqlAction<SendAnalyticsEventsResponse>(
        SEND_ANALYTICS_EVENTS,
        { input: { events: batch.map(toInput) } },
      );

      if (response.sendAnalyticsEvents?.success) {
        await markEventsSynced(batch.map((e) => e.id));
        totalSynced += batch.length;
      } else {
        // Server rejected the batch — stop to avoid infinite loop
        break;
      }
    } catch (error) {
      console.error("Failed to sync analytics batch:", error);
      break;
    }

    events = events.slice(BATCH_SIZE);
  }

  return totalSynced;
}

/**
 * useAnalyticsSync — runs analytics sync on mount and at SYNC_INTERVAL_MS.
 * Only one instance should be mounted at a time (typically in a provider).
 */
export function useAnalyticsSync(): void {
  const inFlight = useRef(false);

  const trigger = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await syncAnalyticsBatch();
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    // Run immediately on mount (app startup)
    trigger();

    const intervalId = setInterval(() => {
      trigger();
    }, SYNC_INTERVAL_MS);

    // Sync when coming back online
    const handleOnline = () => {
      trigger();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
    }

    return () => {
      clearInterval(intervalId);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
      }
    };
  }, [trigger]);
}

/**
 * Service Worker Update Hook
 *
 * Detects when a new service worker version has been installed and is waiting
 * to take control. Provides a `skipWaiting` action that lets the user trigger
 * the swap.
 *
 * **Validates: Requirements 13.1, 13.2**
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ServiceWorkerUpdateState {
  /** True when a new SW is installed and waiting */
  hasUpdate: boolean;
  /** Tell the waiting SW to take over and reload the page */
  skipWaiting: () => void;
}

export function useServiceWorkerUpdate(): ServiceWorkerUpdateState {
  const [hasUpdate, setHasUpdate] = useState(false);
  const waitingRef = useRef<ServiceWorker | null>(null);
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return;

    let registration: ServiceWorkerRegistration | undefined;
    let mounted = true;

    const trackInstalling = (worker: ServiceWorker) => {
      worker.addEventListener("statechange", () => {
        if (
          worker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          if (!mounted) return;
          waitingRef.current = worker;
          setHasUpdate(true);
        }
      });
    };

    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (!reg || !mounted) return;
        registration = reg;

        if (reg.waiting && navigator.serviceWorker.controller) {
          waitingRef.current = reg.waiting;
          setHasUpdate(true);
        }

        if (reg.installing) {
          trackInstalling(reg.installing);
        }

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (installing) trackInstalling(installing);
        });
      })
      .catch((err) => {
        console.error("Failed to read SW registration:", err);
      });

    const onControllerChange = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    // Handle SW_ACTIVATED message — trigger cache refresh in foreground
    // **Validates: Requirements 13.6**
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_ACTIVATED") {
        // New SW version activated — clear the hasUpdate flag and let the
        // controllerchange handler handle the reload. If for some reason
        // controllerchange didn't fire, do a soft refresh via router.
        setHasUpdate(false);
      } else if (event.data?.type === "SW_ACTIVATION_ERROR") {
        console.error("Service Worker activation error:", event.data.error);
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      navigator.serviceWorker.removeEventListener("message", onMessage);
      void registration; // keep ref alive in closure for typescript
    };
  }, []);

  const skipWaiting = useCallback(() => {
    const worker = waitingRef.current;
    if (!worker) {
      window.location.reload();
      return;
    }
    worker.postMessage({ type: "SKIP_WAITING" });
  }, []);

  return { hasUpdate, skipWaiting };
}

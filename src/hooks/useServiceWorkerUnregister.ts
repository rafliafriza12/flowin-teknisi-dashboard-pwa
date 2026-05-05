/**
 * useServiceWorkerUnregister
 *
 * Detects when the active service worker has been unregistered (e.g. user
 * cleared site data or developer tools was used to unregister). Shows a
 * warning modal so the user understands offline functionality is lost and
 * can re-register the SW.
 *
 * **Validates: Requirements 13.7**
 */

"use client";

import { useState, useEffect, useCallback } from "react";

export interface ServiceWorkerUnregisterState {
  /** True when the SW is detected as unregistered / not controlling the page */
  isUnregistered: boolean;
  /** Re-register the service worker (reloads the page to trigger install) */
  reRegister: () => void;
  /** Dismiss the warning without re-registering */
  dismiss: () => void;
}

export function useServiceWorkerUnregister(): ServiceWorkerUnregisterState {
  const [isUnregistered, setIsUnregistered] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
      return;

    let mounted = true;

    // Check current state on mount — if there's no controller yet but SW is
    // supported, the page was likely opened after a clearSiteData / unregister.
    const checkRegistration = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();

        // No registration at all after the page was already loaded with a SW
        // previously (persisted in localStorage flag) → show warning.
        const hadSW = localStorage.getItem("flowin-sw-registered") === "true";

        if (hadSW && !registration) {
          if (mounted) setIsUnregistered(true);
          return;
        }

        // If we have a registration, mark SW as ever-registered
        if (registration) {
          localStorage.setItem("flowin-sw-registered", "true");
        }
      } catch (err) {
        console.error("SW registration check failed:", err);
      }
    };

    checkRegistration();

    // Listen for controllerchange → if controller becomes null it means SW
    // was unregistered while the page was open.
    const handleControllerChange = () => {
      if (!navigator.serviceWorker.controller) {
        const hadSW = localStorage.getItem("flowin-sw-registered") === "true";
        if (hadSW && mounted) setIsUnregistered(true);
      }
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);

  const reRegister = useCallback(() => {
    // Clear the flag so after reload it won't immediately show the warning again
    localStorage.removeItem("flowin-sw-registered");
    window.location.reload();
  }, []);

  const dismiss = useCallback(() => {
    setIsUnregistered(false);
  }, []);

  return { isUnregistered, reRegister, dismiss };
}

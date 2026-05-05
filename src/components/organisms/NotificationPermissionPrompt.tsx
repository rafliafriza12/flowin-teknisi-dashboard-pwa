/**
 * Notification Permission Prompt Component
 *
 * Custom prompt for requesting notification permission with explanation.
 * Displays only when permission is "default" and respects denial cooldown.
 *
 * **Validates: Requirements 4.1, 4.5**
 */

"use client";

import React, { useState, useEffect } from "react";
import { createPushSubscriptionManager } from "@/libs/pushSubscription";
import { canAskPermission } from "@/libs/pushSubscriptionStorage";
import { showToast } from "@/libs/toast";
import XIcon from "@/components/atoms/icons/XIcon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationPermissionPromptProps {
  /** User ID for permission tracking */
  userId: string;
  /** Callback when permission is granted */
  onPermissionGranted?: () => void;
  /** Callback when permission is denied */
  onPermissionDenied?: () => void;
  /** Callback when prompt is dismissed */
  onDismiss?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * NotificationPermissionPrompt displays a custom prompt to request notification permission.
 * Only shows when permission is "default" and respects 7-day denial cooldown.
 *
 * **Validates: Requirements 4.1, 4.5**
 */
export default function NotificationPermissionPrompt({
  userId,
  onPermissionGranted,
  onPermissionDenied,
  onDismiss,
}: NotificationPermissionPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Check if we should show the prompt
  useEffect(() => {
    async function checkShouldShow() {
      // Check if Notification API is supported
      if (!("Notification" in window) || !window.Notification) {
        return;
      }

      // Only show if permission is default
      if (Notification.permission !== "default") {
        return;
      }

      // Check if we can ask (not denied within 7 days)
      const canAsk = await canAskPermission(userId);
      if (!canAsk) {
        return;
      }

      setIsVisible(true);
    }

    checkShouldShow();
  }, [userId]);

  const handleAllow = async () => {
    setIsRequesting(true);

    try {
      const manager = createPushSubscriptionManager(userId);
      const permission = await manager.requestPermission();

      if (permission === "granted") {
        showToast.success("Notifikasi diaktifkan");
        onPermissionGranted?.();

        // Create subscription
        try {
          await manager.subscribe();
        } catch (error) {
          console.error("Failed to create subscription:", error);
          // Don't show error to user - subscription will be created later
        }
      } else if (permission === "denied") {
        showToast.info(
          "Notifikasi dinonaktifkan. Anda dapat mengaktifkannya kembali di pengaturan profil.",
        );
        onPermissionDenied?.();
      }

      setIsVisible(false);
    } catch (error) {
      console.error("Failed to request permission:", error);
      showToast.error("Gagal meminta izin notifikasi");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleNotNow = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-03">
            Aktifkan Notifikasi
          </h2>
          <button
            onClick={handleNotNow}
            className="text-grey hover:text-neutral-03"
            disabled={isRequesting}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[#1F2375]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#1F2375]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm text-neutral-03">
            Dapatkan notifikasi untuk work order baru dan update status
            pekerjaan secara real-time.
          </p>
          <p className="text-xs text-grey">
            Anda dapat menonaktifkan notifikasi kapan saja di halaman profil.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleAllow}
            disabled={isRequesting}
            className="w-full py-3 rounded-xl bg-[#1F2375] text-white text-sm font-medium hover:bg-[#1F2375]/90 transition-colors disabled:opacity-60"
          >
            {isRequesting ? "Memproses..." : "Izinkan Notifikasi"}
          </button>
          <button
            onClick={handleNotNow}
            disabled={isRequesting}
            className="w-full py-3 rounded-xl border border-neutral-200 text-sm font-medium text-grey hover:bg-neutral-50 transition-colors disabled:opacity-60"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
}

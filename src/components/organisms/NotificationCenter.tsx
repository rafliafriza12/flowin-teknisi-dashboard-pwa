/**
 * Notification Center Component
 *
 * Displays notification history from IndexedDB with filtering, pagination,
 * and mark as read functionality.
 *
 * **Validates: Requirements 5.6, 5.7**
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  markAsRead,
  markAsClicked,
  type NotificationHistoryItem,
  type NotificationType,
} from "@/libs/notificationHistory";
import { showToast } from "@/libs/toast";
import XIcon from "@/components/atoms/icons/XIcon";
import NotificationIcon from "@/components/atoms/icons/NotificationIcon";

const PAGE_SIZE = 20;

type FilterType = "all" | NotificationType;

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;

  return new Date(timestamp).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getNotificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case "new_work_order":
      return "Work Order Baru";
    case "status_update":
      return "Update Status";
    default:
      return "Notifikasi";
  }
}

function getNotificationTypeColor(type: NotificationType): string {
  switch (type) {
    case "new_work_order":
      return "bg-blue-100 text-blue-700";
    case "status_update":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const router = useRouter();
  const [items, setItems] = useState<NotificationHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const loadPage = useCallback(
    async (pageIdx: number, currentFilter: FilterType, append: boolean) => {
      setIsLoading(true);
      try {
        const filters: { limit: number; offset: number; type?: NotificationType } = {
          limit: PAGE_SIZE,
          offset: pageIdx * PAGE_SIZE,
        };
        if (currentFilter !== "all") {
          filters.type = currentFilter;
        }
        const data = await getNotifications(filters);
        setHasMore(data.length === PAGE_SIZE);
        setItems((prev) => (append ? [...prev, ...data] : data));
      } catch (error) {
        console.error("Failed to load notifications:", error);
        showToast.error("Gagal memuat notifikasi");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    setPage(0);
    loadPage(0, filter, false);
  }, [isOpen, filter, loadPage]);

  // Mark visible unread items as read after a short delay
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    const unreadIds = items.filter((i) => !i.read).map((i) => i.id);
    if (unreadIds.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        await Promise.all(unreadIds.map((id) => markAsRead(id)));
        setItems((prev) =>
          prev.map((i) => (unreadIds.includes(i.id) ? { ...i, read: true } : i)),
        );
        onUnreadCountChange?.(0);
      } catch (error) {
        console.error("Failed to mark notifications as read:", error);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isOpen, items, onUnreadCountChange]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadPage(next, filter, true);
  };

  const handleItemClick = async (item: NotificationHistoryItem) => {
    try {
      await markAsClicked(item.id);
    } catch (error) {
      console.error("Failed to mark as clicked:", error);
    }

    if (item.workOrderId) {
      router.push(`/pekerjaan/${item.workOrderId}`);
    }
    onClose();
  };

  const filterOptions: { value: FilterType; label: string }[] = useMemo(
    () => [
      { value: "all", label: "Semua" },
      { value: "new_work_order", label: "Work Order" },
      { value: "status_update", label: "Status" },
    ],
    [],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="text-base font-bold text-neutral-03">Notifikasi</h2>
          <button
            onClick={onClose}
            className="text-grey hover:text-neutral-03"
            aria-label="Tutup"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-5 py-3 border-b border-neutral-100 overflow-x-auto">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === opt.value
                  ? "bg-[#1F2375] text-white"
                  : "bg-neutral-100 text-neutral-03 hover:bg-neutral-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && items.length === 0 ? (
            <div className="flex flex-col gap-2 p-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 rounded-xl bg-neutral-100" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-12 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
                <NotificationIcon className="w-6 h-6 text-grey" />
              </div>
              <p className="text-sm font-semibold text-neutral-03">
                Belum ada notifikasi
              </p>
              <p className="text-xs text-grey">
                Notifikasi akan muncul di sini saat ada update.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {items.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex items-start gap-3 px-5 py-4 border-b border-neutral-100 cursor-pointer transition-colors hover:bg-neutral-50 ${
                    !item.read ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div className="w-9 h-9 shrink-0 rounded-full bg-[#1F2375]/10 flex items-center justify-center mt-0.5">
                    <NotificationIcon className="w-4 h-4 text-[#1F2375]" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getNotificationTypeColor(item.type)}`}
                      >
                        {getNotificationTypeLabel(item.type)}
                      </span>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-[#1F2375] mt-1.5 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-neutral-03 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-grey line-clamp-2">
                      {item.message}
                    </p>
                    <span className="text-[11px] text-grey mt-0.5">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                </li>
              ))}
              {hasMore && (
                <li className="px-5 py-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="w-full py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-03 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    {isLoading ? "Memuat..." : "Muat lebih banyak"}
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;

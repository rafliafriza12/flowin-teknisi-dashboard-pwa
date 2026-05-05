"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useOfflineSyncContext } from "@/providers/OfflineSyncProvider";
import { showToast } from "@/libs/toast";

interface PullToRefreshOptions {
  queryKey: QueryKey;
  threshold?: number;
  onRefresh?: () => Promise<void>;
}

/**
 * Hook untuk menambahkan pull-to-refresh gesture pada halaman.
 *
 * **Validates: Requirements 15.4, 15.5, 15.7**
 *
 * - Requirement 15.4: Pull-to-refresh attempts fetch from server and updates cache if online
 * - Requirement 15.5: Shows toast "Tidak dapat refresh - Anda sedang offline" when offline
 * - Requirement 15.7: Updates staleness indicator to "Just updated" on successful refresh
 *
 * @param options - Configuration options
 * @param options.queryKey - TanStack Query key to invalidate on refresh
 * @param options.threshold - Pull distance threshold in pixels (default: 80)
 * @param options.onRefresh - Optional custom refresh handler
 */
export function usePullToRefresh({
  queryKey,
  threshold = 80,
  onRefresh,
}: PullToRefreshOptions) {
  const queryClient = useQueryClient();
  const { isOnline } = useOfflineSyncContext();
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const touchStartY = useRef<number>(0);
  const scrollableElement = useRef<HTMLElement | null>(null);

  const handleRefresh = useCallback(async () => {
    // Requirement 15.5: Show toast when offline
    if (!isOnline) {
      showToast.warning("Tidak dapat refresh - Anda sedang offline");
      return;
    }

    setIsRefreshing(true);

    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        // Requirement 15.4: Trigger query refetch and update cache
        await queryClient.invalidateQueries({ queryKey });
        await queryClient.refetchQueries({ queryKey });
      }

      // Requirement 15.7: Staleness indicator will automatically update
      // because the query's dataUpdatedAt timestamp is refreshed
      showToast.success("Data berhasil diperbarui");
    } catch (error) {
      showToast.error("Gagal memperbarui data");
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isOnline, onRefresh, queryClient, queryKey]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only start tracking if we're at the top of the page
      const target = e.target as HTMLElement;
      const scrollable = target.closest("[data-scrollable]") as HTMLElement;
      scrollableElement.current = scrollable || document.documentElement;

      const scrollTop = scrollableElement.current.scrollTop;

      if (scrollTop === 0 && !isRefreshing) {
        touchStartY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStartY.current;

      // Only track downward pulls
      if (distance > 0) {
        // Apply resistance to the pull (diminishing returns)
        const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
        setPullDistance(resistedDistance);

        // Prevent default scroll behavior when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling) return;

      setIsPulling(false);

      // Trigger refresh if pulled past threshold
      if (pullDistance >= threshold) {
        handleRefresh();
      }

      // Reset pull distance
      setPullDistance(0);
      touchStartY.current = 0;
    };

    // Add event listeners
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPulling, isRefreshing, pullDistance, threshold, handleRefresh]);

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    threshold,
  };
}

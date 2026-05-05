"use client";

import React from "react";

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
  threshold: number;
}

/**
 * Visual indicator for pull-to-refresh gesture.
 * Shows a spinner that grows as the user pulls down.
 */
export default function PullToRefreshIndicator({
  isPulling,
  pullDistance,
  isRefreshing,
  threshold,
}: PullToRefreshIndicatorProps) {
  // Don't show anything if not pulling or refreshing
  if (!isPulling && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;
  const opacity = Math.min(progress * 2, 1);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{
        transform: `translateY(${isRefreshing ? "16px" : `${pullDistance * 0.5}px`})`,
        transition: isRefreshing ? "transform 0.2s ease-out" : "none",
      }}
    >
      <div
        className="bg-white rounded-full shadow-lg p-3 flex items-center justify-center"
        style={{
          opacity: isRefreshing ? 1 : opacity,
          transition: isRefreshing ? "opacity 0.2s ease-out" : "none",
        }}
      >
        {isRefreshing ? (
          // Spinning loader when refreshing
          <svg
            className="w-6 h-6 text-moss-stone animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          // Arrow that rotates as user pulls
          <svg
            className="w-6 h-6 text-moss-stone"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            <path
              d="M12 5V19M12 5L7 10M12 5L17 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

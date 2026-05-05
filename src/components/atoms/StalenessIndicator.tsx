"use client";

import { type QueryKey } from "@tanstack/react-query";
import { useQueryStaleness } from "@/hooks/useQueryStaleness";
import { useOfflineSyncContext } from "@/providers/OfflineSyncProvider";
import StatusBadge from "./StatusBadge";

interface StalenessIndicatorProps {
  queryKey: QueryKey;
  className?: string;
}

/**
 * Komponen untuk menampilkan indikator staleness data query.
 * 
 * Menampilkan timestamp terakhir data di-update dan badge peringatan
 * untuk data yang sudah stale (> 1 jam) atau very stale (> 6 jam).
 * 
 * Hanya ditampilkan saat offline.
 * 
 * @example
 * ```tsx
 * <StalenessIndicator queryKey={['workOrder', id]} />
 * ```
 */
export default function StalenessIndicator({
  queryKey,
  className,
}: StalenessIndicatorProps) {
  const { isOnline } = useOfflineSyncContext();
  const staleness = useQueryStaleness(queryKey);

  // Hanya render saat offline
  if (isOnline) {
    return null;
  }

  // Tentukan warna badge berdasarkan staleness
  const getBadgeColor = () => {
    switch (staleness.staleness) {
      case "very_stale":
        return "bg-red-100 text-red-800";
      case "stale":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Tentukan apakah perlu menampilkan warning badge
  const showWarningBadge = staleness.staleness === "stale" || staleness.staleness === "very_stale";

  return (
    <div className={`flex items-center gap-2 text-sm ${className || ""}`}>
      <span className="text-gray-600">{staleness.message}</span>
      {showWarningBadge && (
        <StatusBadge
          label={
            staleness.staleness === "very_stale"
              ? "Data sudah outdated"
              : "Data mungkin tidak akurat"
          }
          colorClass={getBadgeColor()}
        />
      )}
    </div>
  );
}

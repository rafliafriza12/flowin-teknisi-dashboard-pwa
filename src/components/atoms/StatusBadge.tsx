"use client";

import { cn } from "@/libs/utils";

interface StatusBadgeProps {
  label: string;
  colorClass: string;
  className?: string;
}

/**
 * Badge generik untuk menampilkan status dengan warna tertentu.
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  colorClass,
  className,
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
};

export default StatusBadge;

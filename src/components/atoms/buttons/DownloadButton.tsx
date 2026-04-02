"use client";

import React from "react";
import { cn } from "@/libs/utils"; // gunakan helper merge class jika kamu sudah punya
// Jika belum ada cn, bisa hapus dan langsung pakai string concat

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  text: string;
  iconColor?: string;
}

export const DownloadButton: React.FC<ButtonProps> = ({
  variant = "primary",
  text,
  iconColor,
  className,
  ...props
}) => {
  const baseStyles =
    "flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all w-fit group";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-charcoal-green-dark text-white-mineral hover:bg-charcoal-green hover:text-white",
    secondary:
      "bg-transparent text-white border-[1px] border-white-mineral hover:border-charcoal-green-dark hover:bg-charcoal-green-dark hover:text-white-mineral",
    outline:
      "border border-charcoal-green-dark text-charcoal-green-dark hover:bg-charcoal-green-dark hover:text-white-mineral",
    ghost:
      "bg-transparent text-charcoal-green-dark hover:bg-charcoal-green-lighter hover:text-white",
  };

  return (
    <button className={cn(baseStyles, variants[variant], className)} {...props}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        className={`${
          iconColor
            ? `${iconColor} group-hover:stroke-white-mineral`
            : "stroke-white-mineral"
        } transition-all`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>

      <span>{text}</span>
    </button>
  );
};

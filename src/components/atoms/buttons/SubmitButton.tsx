"use client";

import React from "react";
import { cn } from "@/libs/utils"; // gunakan helper merge class jika kamu sudah punya
import { BodyMediumMedium } from "../Typography";
// Jika belum ada cn, bisa hapus dan langsung pakai string concat

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  text: string;
}

export const SubmitButton: React.FC<ButtonProps> = ({
  variant = "primary",
  text,
  className,
  ...props
}) => {
  const baseStyles =
    "flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all w-fit group";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-charcoal-green text-white-mineral hover:bg-charcoal-green/90 hover:text-white",
    secondary:
      "bg-transparent text-white border-[1px] border-white-mineral hover:border-charcoal-green-dark hover:bg-charcoal-green-dark hover:text-white-mineral",
    outline:
      "border border-charcoal-green-dark text-charcoal-green-dark hover:bg-charcoal-green-dark hover:text-white-mineral",
    ghost:
      "bg-transparent text-charcoal-green-dark hover:bg-charcoal-green-lighter hover:text-white",
  };

  return (
    <button
      type="submit"
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      <BodyMediumMedium>{text}</BodyMediumMedium>
    </button>
  );
};

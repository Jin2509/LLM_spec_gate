"use client";

import React, { forwardRef } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const SIZE: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-[12.5px] gap-1.5",
  md: "h-9 px-4 text-[13.5px] gap-2",
  lg: "h-10 px-5 text-sm gap-2",
};

// Màu qua token (tokens.css) để hover/active/theme đều theo một công thức.
const VARIANT: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--on-accent)] border-transparent shadow-[var(--shadow-sm)] hover:brightness-110 active:brightness-95",
  secondary:
    "bg-[var(--bg-elevated)] text-[var(--ink)] border-[var(--rule)] shadow-[var(--shadow-sm)] hover:bg-[var(--bg-hover)]",
  ghost: "bg-transparent text-[var(--ink)] border-transparent hover:bg-[var(--bg-hover)]",
  danger:
    "bg-[var(--v-code-bg)] text-[var(--v-code)] border-[var(--v-code-line)] hover:border-[var(--v-code)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] border font-medium transition-[background-color,filter,border-color] duration-quick select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 ${SIZE[size]} ${VARIANT[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  ),
);

Button.displayName = "Button";

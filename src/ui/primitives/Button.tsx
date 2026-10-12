"use client";

import React, { forwardRef } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      className = "",
      style,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: {
        fontSize: "12px",
        padding: "4px 8px",
        height: "28px",
      },
      md: {
        fontSize: "13px",
        padding: "6px 14px",
        height: "34px",
      },
      lg: {
        fontSize: "14px",
        padding: "8px 18px",
        height: "40px",
      },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: "var(--action)",
        color: "var(--paper-surface)",
        borderColor: "transparent",
      },
      secondary: {
        backgroundColor: "var(--paper-surface)",
        color: "var(--ink)",
        borderColor: "var(--rule)",
      },
      ghost: {
        backgroundColor: "transparent",
        color: "var(--ink)",
        borderColor: "transparent",
      },
      danger: {
        backgroundColor: "var(--v-code-bg)",
        color: "var(--v-code)",
        borderColor: "var(--v-code)",
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center font-mono font-medium border transition-colors select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        style={{
          borderRadius: "var(--r-cell)",
          outline: "none",
          ...sizeStyles[size],
          ...variantStyles[variant],
          ...style,
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

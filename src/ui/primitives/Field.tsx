/**
 * src/ui/primitives/Field.tsx — Ô nhập liệu dùng chung (nhãn + gợi ý + control) theo token.
 */
import React from "react";

/** Class cho <input>/<select>/<textarea> để mọi form cùng kiểu dáng. */
export const inputClass =
  "w-full h-9 px-3 rounded-[var(--radius-sm)] border text-[13.5px] bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--ink)] outline-none transition-[border-color,box-shadow] hover:border-[var(--text-muted)] focus-visible:border-[var(--accent-line)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed";

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      {children}
      {hint && (
        <span className="text-[12px]" style={{ color: "var(--ink-soft)" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

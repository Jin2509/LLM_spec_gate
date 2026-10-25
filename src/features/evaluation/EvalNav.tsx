import React from "react";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Kiểm thử" },
  { href: "/history", label: "Lịch sử" },
  { href: "/stats", label: "Thống kê" },
] as const;

/** Thanh điều hướng của nhóm trang đánh giá (Kiểm thử / Lịch sử / Thống kê). */
export function EvalNav({ current }: { current?: (typeof LINKS)[number]["href"] }) {
  return (
    <nav className="eval-nav">
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} aria-current={current === link.href ? "page" : undefined}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function verdictLabel(verdict: unknown): string {
  const v = String(verdict ?? "");
  return v.startsWith("UNKNOWN") ? "UNKNOWN" : v;
}

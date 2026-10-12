"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { i18n } from "@/i18n/vi";

interface NavItem {
  key: keyof typeof i18n.navigation;
  href: string;
  icon: string;
  badge?: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { key: "library", href: "/library", icon: "📚" },
  { key: "admission", href: "/runs/run_evalplus_01/admission", icon: "🛡️" },
  { key: "workbench", href: "/lab", icon: "🔬" },
  { key: "annotate", href: "/annotate", icon: "✏️" },
  { key: "evidence", href: "/evidence", icon: "🔍" },
  { key: "revocation", href: "/revocation", icon: "🔄" },
  { key: "experiments", href: "/experiments", icon: "⚗️" },
  { key: "results", href: "/results", icon: "📊" },
  { key: "faultInjection", href: "/fault-injection", icon: "⚡" },
  { key: "settings", href: "/settings", icon: "⚙️" },
];

export interface SidebarProps {
  currentRunId?: string;
}

export function Sidebar({ currentRunId = "run_evalplus_01" }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile drawer toggle (<900px) */}
      <div
        className="block min-[900px]:hidden fixed bottom-4 right-4 z-50 p-2.5 rounded-full shadow-lg border cursor-pointer font-mono text-sm"
        style={{
          backgroundColor: "var(--paper-surface)",
          borderColor: "var(--rule)",
          color: "var(--ink)",
        }}
        onClick={() => setIsMobileOpen((v) => !v)}
        role="button"
        aria-label="Chuyển đổi menu điều hướng"
      >
        {isMobileOpen ? "✕ Đóng" : "☰ Menu"}
      </div>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 min-[900px]:hidden backdrop-blur-[1px]"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r transition-all duration-200 select-none ${
          isMobileOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full min-[900px]:translate-x-0 min-[900px]:w-16 min-[1200px]:w-60"
        }`}
        style={{
          backgroundColor: "var(--paper-surface)",
          borderColor: "var(--rule)",
        }}
      >
        {/* Brand / Title Header */}
        <div
          className="h-14 flex items-center px-4 border-b font-mono font-bold tracking-tight text-sm"
          style={{
            borderColor: "var(--rule)",
            color: "var(--ink)",
          }}
        >
          <span className="text-base mr-2">⚖️</span>
          <span className="inline min-[900px]:hidden min-[1200px]:inline truncate">
            ADJUDICATOR LAB
          </span>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const label = i18n.navigation[item.key];
            const resolvedHref = item.href.replace("run_evalplus_01", currentRunId);
            const isActive =
              pathname === resolvedHref ||
              (item.href !== "/" && pathname.startsWith(resolvedHref));

            return (
              <Link
                key={item.key}
                href={resolvedHref}
                onClick={() => setIsMobileOpen(false)}
                title={label}
                className={`flex items-center gap-3 px-2.5 py-2 text-xs font-mono rounded transition-colors group relative ${
                  isActive
                    ? "font-semibold"
                    : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  borderRadius: "var(--r-cell)",
                  backgroundColor: isActive ? "var(--paper-ground)" : "transparent",
                  color: isActive ? "var(--action)" : "var(--ink)",
                  borderLeft: isActive ? "3px solid var(--action)" : "3px solid transparent",
                }}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                <span className="inline min-[900px]:hidden min-[1200px]:inline truncate">
                  {label}
                </span>

                {/* Floating tooltip on mid screens (900-1199px) */}
                <div
                  className="hidden min-[900px]:block min-[1200px]:hidden absolute left-14 z-50 px-2 py-1 text-[11px] rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  style={{
                    backgroundColor: "var(--ink)",
                    color: "var(--paper-ground)",
                    borderRadius: "var(--r-cell)",
                  }}
                >
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div
          className="p-3 border-t text-[11px] font-mono opacity-60 text-center"
          style={{
            borderColor: "var(--rule)",
            color: "var(--ink-soft)",
          }}
        >
          <span className="inline min-[900px]:hidden min-[1200px]:inline">
            v1.4 Formal Lab
          </span>
          <span className="hidden min-[900px]:inline min-[1200px]:hidden">
            v1.4
          </span>
        </div>
      </aside>
    </>
  );
}

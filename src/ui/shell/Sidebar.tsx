"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FlaskConical,
  Gauge,
  Menu,
  Microscope,
  PenLine,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { i18n } from "@/i18n/vi";
import { SpecGateLogo } from "./SpecGateLogo";

interface NavItem {
  key: keyof typeof i18n.navigation;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /** Mục gắn với run: có run hiện hành thì trỏ tới /runs/{runId}{href}. */
  runScoped?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { key: "library", href: "/library", icon: BookOpen },
  { key: "admission", href: "/admission", icon: ShieldCheck, runScoped: true },
  { key: "workbench", href: "/lab", icon: Microscope },
  { key: "annotate", href: "/annotate", icon: PenLine },
  { key: "evidence", href: "/evidence", icon: Search },
  { key: "revocation", href: "/revocation", icon: RotateCcw },
  { key: "experiments", href: "/experiments", icon: FlaskConical },
  { key: "results", href: "/results", icon: Gauge },
  { key: "faultInjection", href: "/fault-injection", icon: Zap },
  { key: "settings", href: "/settings", icon: Settings },
];

export interface SidebarProps {
  currentRunId?: string;
}

export function Sidebar({ currentRunId }: SidebarProps) {
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
        <span className="inline-flex items-center gap-1.5">
          {isMobileOpen ? <X size={14} aria-hidden="true" /> : <Menu size={14} aria-hidden="true" />}
          {isMobileOpen ? "Đóng" : "Menu"}
        </span>
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
          <SpecGateLogo size={22} className="mr-2 shrink-0" />
          <span className="inline min-[900px]:hidden min-[1200px]:inline truncate">
            {i18n.app.title}
          </span>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const label = i18n.navigation[item.key];
            const Icon = item.icon;
            const resolvedHref = item.runScoped && currentRunId ? `/runs/${currentRunId}${item.href}` : item.href;
            const safePath = pathname || "";
            const isActive =
              safePath === resolvedHref ||
              (item.href !== "/" && safePath.startsWith(resolvedHref));

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
                <Icon size={16} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
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
            SpecGate v1.4
          </span>
          <span className="hidden min-[900px]:inline min-[1200px]:hidden">
            v1.4
          </span>
        </div>
      </aside>
    </>
  );
}

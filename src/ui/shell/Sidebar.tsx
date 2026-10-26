"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  ChartColumn,
  FlaskConical,
  Gauge,
  History,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { i18n } from "@/i18n/vi";
import { SpecGateLogo } from "./SpecGateLogo";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Có run hiện hành thì trỏ tới /runs/{runId}{href}. */
  runScoped?: boolean;
};

const nav = i18n.navigation;

const GROUPS: ReadonlyArray<{ title?: string; items: readonly NavLink[] }> = [
  { items: [{ href: "/", label: nav.chat, icon: MessageSquare }] },
  {
    title: nav.groupData,
    items: [
      { href: "/evidence", label: nav.evidence, icon: Archive },
      { href: "/history", label: nav.history, icon: History },
      { href: "/stats", label: nav.stats, icon: ChartColumn },
    ],
  },
  {
    title: nav.groupResearch,
    items: [
      { href: "/experiments", label: nav.experiments, icon: FlaskConical },
      { href: "/results", label: nav.results, icon: Gauge },
      { href: "/fault-injection", label: nav.faultInjection, icon: Zap },
    ],
  },
];

const SETTINGS: NavLink = { href: "/settings", label: nav.settings, icon: Settings };

export interface SidebarProps {
  currentRunId?: string;
  /** Chỉ áp dụng từ 900px trở lên; màn hẹp luôn dùng ngăn kéo. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

/** Mục đang mở nếu một đoạn của URL trùng mục (bắt cả /runs/{id}/...). */
function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.split("/").includes(href.slice(1));
}

/** Nhãn ẩn khi thanh bên thu gọn (trừ ngăn kéo trên màn hẹp). */
function labelClass(collapsed: boolean) {
  return collapsed ? "inline min-[900px]:hidden" : "inline";
}

function NavItem({
  item,
  currentRunId,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavLink;
  currentRunId?: string;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const href = item.runScoped && currentRunId ? `/runs/${currentRunId}${item.href}` : item.href;
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={item.label}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 h-9 px-2.5 rounded-[var(--radius-sm)] text-[13.5px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${
        active
          ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink)]"
      }`}
    >
      <Icon size={17} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
      <span className={`${labelClass(collapsed)} truncate`}>{item.label}</span>

      {collapsed && (
        <span
          className="hidden min-[900px]:block absolute left-12 z-50 px-2 py-1 text-[12px] rounded-[var(--radius-sm)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
          style={{ backgroundColor: "var(--ink)", color: "var(--paper-ground)" }}
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ currentRunId, collapsed = false, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const close = () => setIsMobileOpen(false);
  const toggleLabel = collapsed ? nav.expand : nav.collapse;

  return (
    <>
      {/* Nút mở menu trên màn hình hẹp (<900px), nằm ở góc trái thanh trên */}
      <button
        type="button"
        className="min-[900px]:hidden fixed top-2.5 left-3 z-50 inline-flex items-center gap-1.5 h-9 px-3 rounded-full border text-[13px] font-medium"
        style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--rule)", color: "var(--ink)", boxShadow: "var(--shadow-md)" }}
        onClick={() => setIsMobileOpen((v) => !v)}
        aria-label="Chuyển đổi menu điều hướng"
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? <X size={15} aria-hidden="true" /> : <Menu size={15} aria-hidden="true" />}
        {isMobileOpen ? nav.close : nav.menu}
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 min-[900px]:hidden backdrop-blur-[1px]"
          style={{ backgroundColor: "var(--overlay)" }}
          onClick={close}
        />
      )}

      <aside
        data-collapsed={collapsed}
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r transition-all duration-200 select-none ${
          isMobileOpen ? "translate-x-0 w-64" : `-translate-x-full min-[900px]:translate-x-0 ${collapsed ? "min-[900px]:w-16" : "min-[900px]:w-60"}`
        }`}
        style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-subtle)" }}
      >
        <Link href="/" onClick={close} className="h-14 flex items-center gap-2.5 px-4 shrink-0" style={{ color: "var(--ink)" }}>
          <SpecGateLogo size={26} className="shrink-0" />
          <span className={`${labelClass(collapsed)} text-[15px] font-semibold tracking-[-0.01em]`}>{i18n.app.title}</span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-3 flex flex-col gap-4" aria-label="Điều hướng chính">
          {GROUPS.map((group, index) => (
            <div key={group.title ?? index} className="flex flex-col gap-0.5">
              {group.title && (
                <span
                  className={`${labelClass(collapsed)} px-2.5 pb-1 text-[11.5px] font-medium uppercase tracking-[0.06em]`}
                  style={{ color: "var(--ink-soft)" }}
                >
                  {group.title}
                </span>
              )}
              {group.items.map((item) => (
                <NavItem key={item.href} item={item} currentRunId={currentRunId} pathname={pathname} collapsed={collapsed} onNavigate={close} />
              ))}
            </div>
          ))}
        </nav>

        <div className="px-2.5 py-3 border-t flex flex-col gap-0.5" style={{ borderColor: "var(--border-subtle)" }}>
          <NavItem item={SETTINGS} currentRunId={currentRunId} pathname={pathname} collapsed={collapsed} onNavigate={close} />
          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              title={toggleLabel}
              aria-label={toggleLabel}
              aria-expanded={!collapsed}
              data-testid="sidebar-toggle"
              className="hidden min-[900px]:flex items-center gap-3 h-9 px-2.5 rounded-[var(--radius-sm)] text-[13.5px] cursor-pointer outline-none text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              {collapsed ? (
                <PanelLeftOpen size={17} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
              ) : (
                <PanelLeftClose size={17} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
              )}
              {!collapsed && <span className="truncate">{toggleLabel}</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

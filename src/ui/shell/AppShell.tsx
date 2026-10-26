"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar, type TopbarProps } from "./Topbar";
import { useSidebarCollapsed } from "./use-sidebar-collapsed";

export interface AppShellProps {
  children: React.ReactNode;
  topbarProps?: TopbarProps;
  currentRunId?: string;
  /** Trang cần toàn bộ chiều rộng/cao (ví dụ trang hỏi đáp). */
  fullBleed?: boolean;
}

export function AppShell({ children, topbarProps, currentRunId, fullBleed }: AppShellProps) {
  const { collapsed, toggle } = useSidebarCollapsed();

  return (
    <div
      className="min-h-screen w-full flex flex-col overflow-x-hidden"
      style={{ backgroundColor: "var(--bg-app)", color: "var(--ink)" }}
    >
      <Sidebar currentRunId={currentRunId} collapsed={collapsed} onToggleCollapsed={toggle} />

      <div className={`flex-1 flex flex-col min-w-0 transition-[padding] duration-200 ${collapsed ? "min-[900px]:pl-16" : "min-[900px]:pl-60"}`}>
        <Topbar runId={currentRunId} {...topbarProps} />
        <main className={fullBleed ? "flex-1 flex flex-col min-h-0" : "flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8"}>
          {children}
        </main>
      </div>
    </div>
  );
}

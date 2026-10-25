"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar, type TopbarProps } from "./Topbar";

export interface AppShellProps {
  children: React.ReactNode;
  topbarProps?: TopbarProps;
  currentRunId?: string;
}

export function AppShell({
  children,
  topbarProps,
  currentRunId,
}: AppShellProps) {
  return (
    <div
      className="min-h-screen w-full flex flex-col font-sans overflow-x-hidden transition-colors"
      style={{
        backgroundColor: "var(--paper-ground)",
        color: "var(--ink)",
      }}
    >
      {/* Sidebar fixed left */}
      <Sidebar currentRunId={currentRunId} />

      {/* Main content area shifted by sidebar width */}
      <div className="flex-1 flex flex-col min-[900px]:pl-16 min-[1200px]:pl-60 transition-all duration-200">
        <Topbar runId={currentRunId} {...topbarProps} />
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

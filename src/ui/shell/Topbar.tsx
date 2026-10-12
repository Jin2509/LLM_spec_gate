"use client";

import React from "react";
import { InvariantBar } from "@/ui/domain/InvariantBar";
import { useTheme } from "@/features/theme/use-theme";
import { Button } from "@/ui/primitives/Button";

export interface TopbarProps {
  runId?: string;
  datasetName?: string;
  anchorLevel?: "A0" | "A1" | "A2" | "A3";
  monitorVersion?: string;
  isHeldOutLocked?: boolean;
  ticketsUsedCount?: number;
  rejectedWritesCount?: number;
}

export function Topbar({
  runId = "run_evalplus_01",
  datasetName = "EvalPlus Tập Minh Họa (12 bài)",
  anchorLevel = "A3",
  monitorVersion = "P_0",
  isHeldOutLocked = true,
  ticketsUsedCount = 1,
  rejectedWritesCount = 0,
}: TopbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="h-14 border-b flex items-center justify-between px-4 gap-4 sticky top-0 z-30 select-none overflow-x-auto"
      style={{
        backgroundColor: "var(--paper-surface)",
        borderColor: "var(--rule)",
        color: "var(--ink)",
      }}
    >
      {/* Left: Research Context Badges */}
      <div className="flex items-center gap-2 text-xs font-mono shrink-0">
        <span
          className="px-2 py-0.5 rounded font-semibold border flex items-center gap-1.5"
          style={{
            backgroundColor: "var(--paper-ground)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-cell)",
            color: "var(--action)",
          }}
          title="Mã lượt chạy nghiên cứu hiện hành"
        >
          <span className="opacity-60 text-[10px]">RUN:</span>
          <span>{runId}</span>
        </span>

        <span
          className="hidden sm:inline-flex px-2 py-0.5 rounded border text-[11px]"
          style={{
            backgroundColor: "transparent",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-cell)",
            color: "var(--ink)",
          }}
          title="Tên tập dữ liệu đang kiểm nghiệm"
        >
          {datasetName}
        </span>

        <span
          className="px-2 py-0.5 rounded font-bold border text-[11px]"
          style={{
            backgroundColor: "var(--v-spec-bg)",
            borderColor: "var(--v-spec)",
            color: "var(--v-spec)",
            borderRadius: "var(--r-cell)",
          }}
          title="Mức độ neo bằng chứng cao nhất hiện hành"
        >
          ANCHOR: {anchorLevel}
        </span>

        <span
          className="px-2 py-0.5 rounded font-semibold border text-[11px]"
          style={{
            backgroundColor: "var(--v-dual-bg)",
            borderColor: "var(--v-dual)",
            color: "var(--v-dual)",
            borderRadius: "var(--r-cell)",
          }}
          title="Phiên bản đặc tả Monitor runtime hiện tại"
        >
          MONITOR: {monitorVersion}
        </span>
      </div>

      {/* Right: InvariantBar & Theme Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:block">
          <InvariantBar
            isDisjointGB={true}
            isHeldOutLocked={isHeldOutLocked}
            ticketsSpent={ticketsUsedCount}
            ticketsTotal={12}
            rejectedWritesCount={rejectedWritesCount}
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={toggleTheme}
          title={theme === "dark" ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
          className="h-7 px-2 text-xs flex items-center gap-1"
        >
          <span>{theme === "dark" ? "☀️" : "🌙"}</span>
          <span className="hidden lg:inline text-[11px]">
            {theme === "dark" ? "Sáng" : "Tối"}
          </span>
        </Button>
      </div>
    </header>
  );
}

"use client";

import { Moon, Sun } from "lucide-react";
import React from "react";
import { InvariantBar } from "@/ui/shell/InvariantBar";
import { useTheme } from "@/ui/shell/use-theme";
import { Badge } from "@/ui/layout";
import { api } from "@/lib/api/endpoints";
import { useApiQuery } from "@/lib/api/use-api-query";

export interface TopbarProps {
  runId?: string;
  /** Ghi đè trạng thái khoá held-out ngay sau khi người dùng khoá (trước khi summary tải lại). */
  isHeldOutLocked?: boolean;
}

/** Thanh bối cảnh lượt chạy — mọi số liệu lấy từ GET /api/runs/{runId}/summary. */
export function Topbar({ runId, isHeldOutLocked }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const summary = useApiQuery(runId ? `run-summary:${runId}` : null, (signal) => api.runs.summary(runId!, signal)).data;

  return (
    <header
      className="h-14 border-b flex items-center justify-between pl-28 pr-4 min-[900px]:px-6 gap-4 sticky top-0 z-30 backdrop-blur-md"
      style={{ backgroundColor: "color-mix(in oklch, var(--bg-app) 85%, transparent)", borderColor: "var(--border-subtle)", color: "var(--ink)" }}
    >
      <div className="flex items-center gap-2.5 min-w-0 text-[13px]">
        {runId && (
          <>
            <span className="hidden sm:inline shrink-0" style={{ color: "var(--ink-soft)" }}>
              Lượt chạy
            </span>
            <span className="font-mono text-[12.5px] font-medium truncate max-w-[220px]" title={runId} style={{ color: "var(--ink)" }}>
              {runId}
            </span>
          </>
        )}
        {summary && (
          <>
            <span className="hidden lg:inline-flex gap-2 min-w-0" style={{ color: "var(--ink-soft)" }}>
              <span aria-hidden="true">·</span>
              <span className="truncate" title="Tập dữ liệu">
                {summary.datasetName}
              </span>
            </span>
            <span className="hidden md:inline-flex gap-1.5 shrink-0">
              <Badge tone="neutral">
                <span title="Mức neo bằng chứng cao nhất của lượt chạy">Mức neo {summary.anchorLevel}</span>
              </Badge>
              <Badge tone="action">
                <span title="Phiên bản monitor đang chạy">Monitor {summary.monitorVersion}</span>
              </Badge>
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {summary && (
          <div className="hidden xl:block">
            <InvariantBar
              isDisjointGB={summary.isDisjointGB}
              isHeldOutLocked={isHeldOutLocked ?? summary.isHeldOutLocked}
              ticketsSpent={summary.ticketsSpent}
              ticketsTotal={summary.ticketsTotal}
              rejectedWritesCount={summary.rejectedWritesCount}
            />
          </div>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          className="grid place-items-center size-9 rounded-[var(--radius-sm)] cursor-pointer outline-none hover:bg-[var(--bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          style={{ color: "var(--ink-soft)" }}
        >
          {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}

"use client";

import { Moon, Sun } from "lucide-react";
import React from "react";
import { InvariantBar } from "@/ui/domain/InvariantBar";
import { useTheme } from "@/features/theme/use-theme";
import { Button } from "@/ui/primitives/Button";
import { api } from "@/lib/api/endpoints";
import { useApiQuery } from "@/lib/api/use-api-query";

export interface TopbarProps {
  runId?: string;
  /** Ghi đè trạng thái khoá held-out ngay sau khi người dùng khoá (trước khi summary tải lại). */
  isHeldOutLocked?: boolean;
}

const badgeBase: React.CSSProperties = { borderRadius: "var(--r-cell)" };

/** Thanh bối cảnh run — mọi số liệu lấy từ GET /api/runs/{runId}/summary. */
export function Topbar({ runId, isHeldOutLocked }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const summary = useApiQuery(runId ? `run-summary:${runId}` : null, (signal) => api.runs.summary(runId!, signal)).data;

  return (
    <header
      className="h-14 border-b flex items-center justify-between px-4 gap-4 sticky top-0 z-30 select-none overflow-x-auto"
      style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)", color: "var(--ink)" }}
    >
      <div className="flex items-center gap-2 text-xs font-mono shrink-0">
        <span
          className="px-2 py-0.5 rounded font-semibold border flex items-center gap-1.5"
          style={{ ...badgeBase, backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--action)" }}
          title="Mã lượt chạy nghiên cứu hiện hành"
        >
          <span className="opacity-60 text-[10px]">RUN:</span>
          <span>{runId ?? "—"}</span>
        </span>

        {summary && (
          <>
            <span
              className="hidden sm:inline-flex px-2 py-0.5 rounded border text-[11px]"
              style={{ ...badgeBase, borderColor: "var(--rule)", color: "var(--ink)" }}
              title="Tên tập dữ liệu đang kiểm nghiệm"
            >
              {summary.datasetName}
            </span>
            <span
              className="px-2 py-0.5 rounded font-bold border text-[11px]"
              style={{ ...badgeBase, backgroundColor: "var(--v-spec-bg)", borderColor: "var(--v-spec)", color: "var(--v-spec)" }}
              title="Mức độ neo bằng chứng cao nhất hiện hành"
            >
              ANCHOR: {summary.anchorLevel}
            </span>
            <span
              className="px-2 py-0.5 rounded font-semibold border text-[11px]"
              style={{ ...badgeBase, backgroundColor: "var(--v-dual-bg)", borderColor: "var(--v-dual)", color: "var(--v-dual)" }}
              title="Phiên bản đặc tả Monitor runtime hiện tại"
            >
              MONITOR: {summary.monitorVersion}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {summary && (
          <div className="hidden md:block">
            <InvariantBar
              isDisjointGB={summary.isDisjointGB}
              isHeldOutLocked={isHeldOutLocked ?? summary.isHeldOutLocked}
              ticketsSpent={summary.ticketsSpent}
              ticketsTotal={summary.ticketsTotal}
              rejectedWritesCount={summary.rejectedWritesCount}
            />
          </div>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={toggleTheme}
          title={theme === "dark" ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
          className="h-7 px-2 text-xs flex items-center gap-1"
        >
          {theme === "dark" ? <Sun size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> : <Moon size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" />}
          <span className="hidden lg:inline text-[11px]">{theme === "dark" ? "Sáng" : "Tối"}</span>
        </Button>
      </div>
    </header>
  );
}

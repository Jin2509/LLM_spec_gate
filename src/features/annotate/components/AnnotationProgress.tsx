import React from "react";
import { i18n } from "@/i18n/vi";

export interface AnnotationProgressProps {
  completed: number;
  total: number;
  lastLatencyMs: number;
  sessionCompleted: number;
}

export function AnnotationProgress({ completed, total, lastLatencyMs, sessionCompleted }: AnnotationProgressProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 100;
  return (
    <div className="p-4 border rounded shadow-sm" style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)", borderRadius: "var(--r-card)" }}>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-base font-bold font-mono tracking-tight" style={{ color: "var(--ink)" }}>
          {i18n.focusMode.title}
        </h1>
        <span className="text-xs font-mono font-semibold" style={{ color: "var(--action)" }}>
          {completed} / {total} ({percent}%)
        </span>
      </div>
      <div className="w-full h-2 rounded overflow-hidden" style={{ backgroundColor: "var(--paper-ground)" }}>
        <div className="h-full transition-all duration-300" style={{ width: `${percent}%`, backgroundColor: "var(--action)" }} />
      </div>
      <div className="flex items-center justify-between mt-3 text-[11px] font-mono text-[var(--ink-soft)]">
        <span>Thời gian trả lời thẻ gần nhất: {lastLatencyMs > 0 ? `${lastLatencyMs}ms` : "—"}</span>
        <span>Đã làm liên tục: {sessionCompleted} thẻ</span>
      </div>
    </div>
  );
}

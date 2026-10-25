"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { RunLog } from "@/core/evaluation-types";
import { i18n } from "@/i18n/vi";

/** Nhật ký trực tiếp của một evaluation run (SSE GET /api/logs/stream?runId=). */
export function LiveLogPanel({ runId }: { runId?: string }) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState("all");
  const [entries, setEntries] = useState<RunLog[]>([]);

  useEffect(() => {
    if (!runId) return;
    const source = new EventSource(api.runs.logStreamUrl(runId));
    source.onmessage = (event) => {
      try {
        const row = JSON.parse(event.data) as RunLog;
        setEntries((previous) => (previous.some((item) => item.id === row.id) ? previous : [...previous, row]));
      } catch {
        // Bỏ qua bản ghi log hỏng.
      }
    };
    return () => source.close();
  }, [runId]);

  const visible = entries.filter((entry) => level === "all" || entry.level === level);
  return (
    <section className="live-log">
      <div className="live-log-head">
        <strong>{i18n.chat.logs}</strong>
        <button className="text-button" onClick={() => setOpen((v) => !v)}>
          {open ? i18n.chat.collapse : i18n.chat.expand}
        </button>
        {open && (
          <>
            <select aria-label={i18n.chat.logs} value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="all">Tất cả mức</option>
              <option value="info">{i18n.chat.logInfo}</option>
              <option value="warn">{i18n.chat.logWarn}</option>
              <option value="error">{i18n.chat.logError}</option>
            </select>
            <button
              className="text-button"
              onClick={() => void navigator.clipboard?.writeText(visible.map((e) => `${e.at} [${e.level}] ${e.message}`).join("\n"))}
            >
              {i18n.chat.copy}
            </button>
            <button className="text-button" onClick={() => setEntries([])}>
              {i18n.chat.clear}
            </button>
          </>
        )}
      </div>
      {open && (
        <div className="live-log-content" aria-live="polite">
          {visible.length ? (
            visible.map((entry) => (
              <div key={entry.id} className="mono">
                {entry.at} [{entry.level}] {entry.message}
              </div>
            ))
          ) : (
            <span>{i18n.chat.noLogs}</span>
          )}
        </div>
      )}
    </section>
  );
}

"use client";

import React from "react";
import { i18n } from "@/i18n/vi";
import { SpecGateLogo } from "@/ui/shell/SpecGateLogo";

export function SessionSidebar({ history, onNew, onClear }: { history: { id: string; title: string }[]; onNew: () => void; onClear: () => void }) {
  return (
    <aside className="session-sidebar">
      <div className="brand-row">
        <SpecGateLogo size={18} /> <strong>{i18n.app.title}</strong>
      </div>
      <button className="new-session" onClick={onNew}>
        {i18n.chat.newSession}
      </button>
      <div className="history-title">{i18n.chat.recent}</div>
      <div className="history-list">
        {history.length ? (
          history.map((entry) => (
            <div key={entry.id} className="history-item">
              {entry.title}
            </div>
          ))
        ) : (
          <p className="muted small">{i18n.chat.noHistory}</p>
        )}
      </div>
      <button className="text-button clear-history" onClick={onClear}>
        {i18n.chat.clearHistory}
      </button>
    </aside>
  );
}

"use client";

import React from "react";
import { i18n } from "@/i18n/vi";
import type { DatasetSummary } from "@/lib/api";
import type { ChatTurn } from "../chat-session";
import { DatasetBadge } from "./DatasetBadge";

function download(json: string, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function VerdictPanel({ item, dataset, runId, onClose }: { item?: ChatTurn; dataset?: DatasetSummary; runId: string; onClose: () => void }) {
  const json = JSON.stringify(
    { verdict: item?.verdict ?? null, explanation: item?.text ?? null, dataset: dataset?.id ?? null, sessionId: runId, responseMs: item?.ms ?? null },
    null,
    2,
  );
  return (
    <aside className="verdict-panel">
      <div className="panel-heading">
        <h2>{i18n.chat.result}</h2>
        <button className="text-button panel-close" onClick={onClose}>
          {i18n.chat.collapse}
        </button>
      </div>
      <div className="panel-field">
        <span>{i18n.chat.verdict}</span>
        <strong className="mono">{item?.verdict ?? "—"}</strong>
      </div>
      <div className="panel-field">
        <span>{i18n.chat.dataset}</span>
        <strong>
          <DatasetBadge dataset={dataset} />
        </strong>
      </div>
      <div className="panel-field">
        <span>{i18n.chat.responseTime}</span>
        <strong className="mono">{item?.ms == null ? "—" : `${item.ms} ms`}</strong>
      </div>
      <div className="panel-field">
        <span>{i18n.chat.sessionId}</span>
        <strong className="mono">{runId}</strong>
      </div>
      <div className="panel-actions">
        <button className="text-button" onClick={() => void navigator.clipboard?.writeText(json)}>
          {i18n.chat.copyJson}
        </button>
        <button className="text-button" onClick={() => download(json, `${runId}.json`)}>
          {i18n.chat.export}
        </button>
      </div>
    </aside>
  );
}

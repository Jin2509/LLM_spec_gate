import React from "react";
import type { CaseDossier } from "@/core/types";

function Cell({ label, children, divided }: { label: string; children: React.ReactNode; divided?: boolean }) {
  return (
    <div className={divided ? "border-l pl-4" : undefined} style={divided ? { borderColor: "var(--rule)" } : undefined}>
      <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

export function CaseSummaryBanner({ caseDossier, monitorVersion }: { caseDossier: CaseDossier; monitorVersion: string }) {
  return (
    <div
      className="p-4 rounded border flex flex-wrap items-center justify-between gap-4 font-mono text-xs"
      style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)", borderRadius: "var(--r-card)" }}
    >
      <div className="flex items-center gap-4">
        <Cell label="Vụ việc (Case ID)">
          <strong className="text-sm" style={{ color: "var(--ink)" }}>
            {caseDossier.id}
          </strong>
        </Cell>
        <Cell label="Task ID" divided>
          <span style={{ color: "var(--ink)" }}>{caseDossier.taskId}</span>
        </Cell>
        <Cell label="Phán quyết" divided>
          <span className="font-bold" style={{ color: "var(--action)" }}>
            {caseDossier.adjudication.verdict} ({caseDossier.adjudication.matchedRule})
          </span>
        </Cell>
      </div>
      <div className="flex items-center gap-3">
        <span style={{ color: "var(--ink-soft)" }}>Phiên bản Monitor:</span>
        <span className="px-2 py-1 rounded font-bold" style={{ backgroundColor: "var(--paper-ground)", border: "1px solid var(--action)", color: "var(--action)" }}>
          {monitorVersion}
        </span>
      </div>
    </div>
  );
}

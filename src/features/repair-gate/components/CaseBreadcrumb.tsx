"use client";

import React from "react";
import Link from "next/link";
import type { CaseDossier } from "@/core/types";

export interface CaseBreadcrumbProps {
  runId: string;
  activeCaseId: string;
  cases: readonly CaseDossier[];
  onSelectCase: (caseId: string) => void;
}

export function CaseBreadcrumb({ runId, activeCaseId, cases, onSelectCase }: CaseBreadcrumbProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-mono">
        <Link href={`/runs/${runId}/workbench`} className="hover:underline flex items-center gap-1" style={{ color: "var(--action)" }}>
          ← Trở lại Bàn phân xử
        </Link>
        <span style={{ color: "var(--ink-soft)" }}>/</span>
        <span style={{ color: "var(--ink-soft)" }}>Run: {runId}</span>
        <span style={{ color: "var(--ink-soft)" }}>/</span>
        <span className="font-semibold" style={{ color: "var(--ink)" }}>
          {activeCaseId}
        </span>
      </div>

      <label className="flex items-center gap-2 text-xs font-mono">
        <span style={{ color: "var(--ink-soft)" }}>Chọn Case:</span>
        <select
          value={activeCaseId}
          onChange={(e) => onSelectCase(e.target.value)}
          className="p-1 rounded border font-mono text-xs cursor-pointer"
          style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)", color: "var(--ink)" }}
        >
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} ({c.adjudication.verdict})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

"use client";

import React from "react";
import type { RQId } from "@/lib/api";

const TABS: ReadonlyArray<{ id: RQId; label: string }> = [
  { id: "rq1", label: "RQ1: Lọc Lỗi Spec" },
  { id: "rq2", label: "RQ2: Risk-Coverage" },
  { id: "rq3", label: "RQ3: Ablation A0–A3" },
  { id: "rq4", label: "RQ4: Tương quan Model" },
  { id: "rq5", label: "RQ5: Bộ tứ Repair" },
  { id: "rq6", label: "RQ6: Human Query" },
];

export function RQTabs({ active, onChange }: { active: RQId; onChange: (rq: RQId) => void }) {
  return (
    <div
      data-testid="results-rq-tabs"
      className="flex flex-wrap items-center gap-1 p-1 rounded border font-mono text-xs"
      style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)", borderRadius: "var(--r-card)" }}
    >
      {TABS.map((tab) => {
        const isSelected = active === tab.id;
        return (
          <button
            key={tab.id}
            data-testid={`rq-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className="px-3 py-1.5 rounded font-semibold cursor-pointer transition-colors"
            style={{
              backgroundColor: isSelected ? "var(--action)" : "transparent",
              color: isSelected ? "var(--paper-surface)" : "var(--ink-soft)",
              borderRadius: "var(--r-cell)",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

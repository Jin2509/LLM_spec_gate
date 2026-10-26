"use client";

import React from "react";

export type EvidenceTab = "G" | "B" | "B_synth" | "anchor_closure" | "spec_debt";

export interface EvidenceTabsProps {
  active: EvidenceTab;
  counts: { G: number; B: number; B_synth: number; spec_debt: number };
  onChange: (tab: EvidenceTab) => void;
}

export function EvidenceTabs({ active, counts, onChange }: EvidenceTabsProps) {
  const tabs: Array<{ key: EvidenceTab; label: string; count?: number }> = [
    { key: "G", label: "Kết quả đúng (G)", count: counts.G },
    { key: "B", label: "Kết quả sai (B)", count: counts.B },
    { key: "B_synth", label: "Đột biến", count: counts.B_synth },
    { key: "anchor_closure", label: "Điểm neo" },
    { key: "spec_debt", label: "Nợ đặc tả", count: counts.spec_debt },
  ];

  return (
    <div role="tablist" aria-label="Loại bằng chứng" className="inline-flex flex-wrap gap-1 p-1 rounded-[var(--radius-md)] self-start" style={{ backgroundColor: "var(--bg-sunken)" }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            data-testid={`evidence-tab-${tab.key}`}
            onClick={() => onChange(tab.key)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-sm)] text-[13px] font-medium cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            style={{
              backgroundColor: isActive ? "var(--bg-elevated)" : "transparent",
              color: isActive ? "var(--ink)" : "var(--ink-soft)",
              boxShadow: isActive ? "var(--shadow-sm)" : "none",
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-[12px] tabular-nums" style={{ color: "var(--ink-soft)" }}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

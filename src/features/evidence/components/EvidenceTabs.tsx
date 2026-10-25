"use client";

import React from "react";

export type EvidenceTab = "G" | "B" | "B_synth" | "anchor_closure" | "spec_debt";

export interface EvidenceTabsProps {
  active: EvidenceTab;
  counts: { G: number; B: number; B_synth: number; spec_debt: number };
  onChange: (tab: EvidenceTab) => void;
}

export function EvidenceTabs({ active, counts, onChange }: EvidenceTabsProps) {
  const tabs: Array<{ key: EvidenceTab; label: string }> = [
    { key: "G", label: `Tập G - Chấp nhận (${counts.G})` },
    { key: "B", label: `Tập B - Bác bỏ (${counts.B})` },
    { key: "B_synth", label: `Tập B_synth - Đột biến (${counts.B_synth})` },
    { key: "anchor_closure", label: "Anchor & Bao đóng MR" },
    { key: "spec_debt", label: `Nợ đặc tả (${counts.spec_debt})` },
  ];

  return (
    <div className="flex items-center gap-2 border-b pb-1 font-mono text-xs" style={{ borderColor: "var(--rule)" }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            data-testid={`evidence-tab-${tab.key}`}
            onClick={() => onChange(tab.key)}
            className="px-3 py-2 rounded-t font-semibold cursor-pointer transition-colors relative"
            style={{
              backgroundColor: isActive ? "var(--paper-surface)" : "transparent",
              color: isActive ? "var(--action)" : "var(--ink-soft)",
              borderBottom: isActive ? "2px solid var(--action)" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

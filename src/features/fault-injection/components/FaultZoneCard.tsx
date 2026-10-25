"use client";

import React from "react";
import type { FaultInjectionOption } from "@/lib/api";

export interface FaultZoneCardProps {
  zone: 1 | 2 | 3;
  title: string;
  tag: string;
  selectLabel: string;
  selectTestId: string;
  hint: string;
  value: string;
  options: readonly FaultInjectionOption[];
  onChange: (value: string) => void;
}

export function FaultZoneCard({ zone, title, tag, selectLabel, selectTestId, hint, value, options, onChange }: FaultZoneCardProps) {
  return (
    <div data-testid={`fault-zone-${zone}`} className="p-4 rounded border flex flex-col gap-3" style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)" }}>
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--rule)" }}>
        <span className="font-bold" style={{ color: "var(--ink)" }}>
          {title}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--paper-ground)", border: "1px solid var(--rule)" }}>
          {tag}
        </span>
      </div>
      <label className="flex flex-col gap-1 cursor-pointer">
        <span style={{ color: "var(--ink-soft)" }}>{selectLabel}</span>
        <select
          data-testid={selectTestId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="p-2 rounded border"
          style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink)" }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-[11px] m-0 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        {hint}
      </p>
    </div>
  );
}

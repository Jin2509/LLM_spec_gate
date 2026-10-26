"use client";

import React from "react";
import type { FaultInjectionOption } from "@/lib/api";
import { Panel } from "@/ui/layout";
import { Field, inputClass } from "@/ui/primitives/Field";

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

/** Một vùng tiêm lỗi; danh mục kiểu lỗi do backend cung cấp. */
export function FaultZoneCard({ zone, title, tag, selectLabel, selectTestId, hint, value, options, onChange }: FaultZoneCardProps) {
  return (
    <Panel testId={`fault-zone-${zone}`} title={title} aside={tag}>
      <Field label={selectLabel} hint={hint}>
        <select data-testid={selectTestId} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    </Panel>
  );
}

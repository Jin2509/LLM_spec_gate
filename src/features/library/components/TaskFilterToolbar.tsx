"use client";

import React from "react";
import type { AcademicTask } from "@/core/types";

export interface TaskFilters {
  outputType: string;
  uniqueness: "all" | "unique_only" | "non_unique";
  anchor: "all" | "has_a2" | "has_a3";
}

export const DEFAULT_TASK_FILTERS: TaskFilters = { outputType: "all", uniqueness: "all", anchor: "all" };

export function applyTaskFilters(tasks: readonly AcademicTask[], f: TaskFilters): AcademicTask[] {
  return tasks.filter((t) => {
    if (f.outputType !== "all" && t.outputType !== f.outputType) return false;
    if (f.uniqueness === "unique_only" && !t.isUniqueOutput) return false;
    if (f.uniqueness === "non_unique" && t.isUniqueOutput) return false;
    if (f.anchor === "has_a2" && !t.hasA2) return false;
    if (f.anchor === "has_a3" && !t.hasA3) return false;
    return true;
  });
}

const selectStyle: React.CSSProperties = {
  backgroundColor: "var(--paper-ground)",
  borderColor: "var(--rule)",
  color: "var(--ink)",
  borderRadius: "var(--r-cell)",
};

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<[string, string]>;
}) {
  return (
    <label className="flex items-center gap-2">
      <span style={{ color: "var(--ink-soft)" }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="px-2 py-1 border rounded outline-none" style={selectStyle}>
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

export interface TaskFilterToolbarProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  visibleCount: number;
  totalCount: number;
}

export function TaskFilterToolbar({ filters, onChange, visibleCount, totalCount }: TaskFilterToolbarProps) {
  return (
    <div
      className="p-3 border rounded flex flex-wrap items-center gap-4 text-xs font-mono"
      style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)", borderRadius: "var(--r-card)" }}
    >
      <FilterSelect
        label="Kiểu đầu ra:"
        value={filters.outputType}
        onChange={(outputType) => onChange({ ...filters, outputType })}
        options={[["all", "Tất cả kiểu"], ["int", "int"], ["str", "str"], ["list", "list"], ["float", "float"], ["bool", "bool"], ["other", "other"]]}
      />
      <FilterSelect
        label="Độc nhất (Unique):"
        value={filters.uniqueness}
        onChange={(v) => onChange({ ...filters, uniqueness: v as TaskFilters["uniqueness"] })}
        options={[["all", "Tất cả"], ["unique_only", "Chỉ UniqueOutput"], ["non_unique", "Nhiều nghiệm hợp lệ"]]}
      />
      <FilterSelect
        label="Bằng chứng A2 / A3:"
        value={filters.anchor}
        onChange={(v) => onChange({ ...filters, anchor: v as TaskFilters["anchor"] })}
        options={[["all", "Tất cả"], ["has_a2", "Có A2 (Hình thức)"], ["has_a3", "Có A3 (Sai phân)"]]}
      />
      <div className="ml-auto text-[11px]" style={{ color: "var(--ink-soft)" }}>
        Hiển thị {visibleCount} / {totalCount} task
      </div>
    </div>
  );
}

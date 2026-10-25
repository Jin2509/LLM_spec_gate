"use client";

import React from "react";
import type { RunFilters } from "@/lib/api";

export type HistoryFilterValues = Required<Pick<RunFilters, "verdict" | "problem" | "dataset" | "from" | "to">>;

export const EMPTY_HISTORY_FILTERS: HistoryFilterValues = { verdict: "", problem: "", dataset: "", from: "", to: "" };

export function HistoryFilters({ value, onChange }: { value: HistoryFilterValues; onChange: (next: HistoryFilterValues) => void }) {
  const set = (key: keyof HistoryFilterValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [key]: e.target.value });
  return (
    <section className="eval-filters">
      <input aria-label="Tìm đề bài" placeholder="Đề bài / mã đề" value={value.problem} onChange={set("problem")} />
      <select aria-label="Lọc verdict" value={value.verdict} onChange={set("verdict")}>
        <option value="">Mọi verdict</option>
        <option>CODE_FAULT</option>
        <option>SPEC_FAULT</option>
        <option>UNKNOWN</option>
      </select>
      <input aria-label="Dataset" placeholder="Dataset" value={value.dataset} onChange={set("dataset")} />
      <label>
        Từ <input type="date" value={value.from} onChange={set("from")} />
      </label>
      <label>
        Đến <input type="date" value={value.to} onChange={set("to")} />
      </label>
    </section>
  );
}

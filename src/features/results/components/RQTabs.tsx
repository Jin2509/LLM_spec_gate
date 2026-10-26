"use client";

import React from "react";
import type { RQId } from "@/lib/api";

const TABS: ReadonlyArray<{ id: RQId; label: string; hint: string }> = [
  { id: "rq1", label: "Lọc lỗi đặc tả", hint: "RQ1: hệ thống loại được bao nhiêu báo động sai do đặc tả" },
  { id: "rq2", label: "Rủi ro – độ phủ", hint: "RQ2: đánh đổi giữa rủi ro và tỷ lệ ca được kết luận" },
  { id: "rq3", label: "Mức tham chiếu", hint: "RQ3: ảnh hưởng của mức nguồn tham chiếu A0–A3" },
  { id: "rq4", label: "Tương quan mô hình", hint: "RQ4: kết quả theo cặp mô hình sinh code / sinh đặc tả" },
  { id: "rq5", label: "Chất lượng sửa", hint: "RQ5: chất lượng các bản sửa đặc tả" },
  { id: "rq6", label: "Hỏi người", hint: "RQ6: hiệu quả của câu hỏi cho người" },
];

export function RQTabs({ active, onChange }: { active: RQId; onChange: (rq: RQId) => void }) {
  return (
    <div
      data-testid="results-rq-tabs"
      role="tablist"
      aria-label="Câu hỏi nghiên cứu"
      className="inline-flex flex-wrap gap-1 p-1 rounded-[var(--radius-md)] self-start"
      style={{ backgroundColor: "var(--bg-sunken)" }}
    >
      {TABS.map((tab) => {
        const isSelected = active === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isSelected}
            title={tab.hint}
            data-testid={`rq-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-sm)] text-[13px] font-medium cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            style={{
              backgroundColor: isSelected ? "var(--bg-elevated)" : "transparent",
              color: isSelected ? "var(--ink)" : "var(--ink-soft)",
              boxShadow: isSelected ? "var(--shadow-sm)" : "none",
            }}
          >
            <span className="text-[11.5px] uppercase tabular-nums" style={{ color: "var(--ink-soft)" }}>
              {tab.id}
            </span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

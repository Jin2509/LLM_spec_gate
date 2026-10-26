/**
 * src/ui/domain/InvariantBar.tsx — Trạng thái bất biến của run (số liệu do backend tính, UI chỉ hiển thị).
 *
 *   - Kho đúng G và kho sai B không giao nhau (G ∩ B = ∅)
 *   - Tập held-out đã khoá
 *   - Số câu hỏi người đã dùng / tổng
 *   - Số lần ghi kho bị từ chối (chỉ hiện khi > 0)
 */
"use client";

import { Check, TriangleAlert, X } from "lucide-react";
import React from "react";
import { i18n } from "@/i18n/vi";
import { toneStyle, type Tone } from "@/ui/layout";

export interface InvariantBarProps {
  isDisjointGB: boolean;
  isHeldOutLocked: boolean;
  ticketsSpent: number;
  ticketsTotal: number;
  rejectedWritesCount: number;
}

function Pill({ tone, title, children }: { tone: Tone; title: string; children: React.ReactNode }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border text-[12px] font-medium whitespace-nowrap"
      style={toneStyle(tone)}
    >
      {children}
    </span>
  );
}

export function InvariantBar({ isDisjointGB, isHeldOutLocked, ticketsSpent, ticketsTotal, rejectedWritesCount }: InvariantBarProps) {
  const t = i18n.invariants;
  const mark = (ok: boolean) => (ok ? <Check size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />);
  return (
    <div role="region" aria-label="Trạng thái bất biến của lượt chạy" data-testid="invariant-bar" className="flex items-center gap-1.5">
      <Pill tone={isDisjointGB ? "success" : "danger"} title={t.disjointGBHint}>
        {mark(isDisjointGB)} {isDisjointGB ? t.disjointGB : t.disjointGBBroken}
      </Pill>
      <Pill tone={isHeldOutLocked ? "success" : "warning"} title={t.heldOutHint}>
        {mark(isHeldOutLocked)} {isHeldOutLocked ? t.heldOutLocked : t.heldOutOpen}
      </Pill>
      <Pill tone="neutral" title={t.ticketsHint}>
        {t.ticketsUsed} {ticketsSpent}/{ticketsTotal}
      </Pill>
      {rejectedWritesCount > 0 && (
        <Pill tone="warning" title={t.rejectedWritesHint}>
          <TriangleAlert size={13} aria-hidden="true" /> {t.rejectedWrites}: {rejectedWritesCount}
        </Pill>
      )}
    </div>
  );
}

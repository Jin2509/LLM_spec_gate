/**
 * Danh sách bằng chứng — CHỈ ĐỌC. Không được thêm input/button vào các list G/B
 * (bất biến được kiểm thử ở tests/ui/evidence-store-readonly.test.tsx).
 */
import React from "react";
import type { BSynthRecord, EvidenceRecord, SpecDebtItem } from "@/lib/api";
import { ProvenanceTag } from "@/ui/domain/ProvenanceTag";
import { Badge, type Tone } from "@/ui/layout";

const rowStyle: React.CSSProperties = {
  backgroundColor: "var(--paper-surface)",
  borderColor: "var(--rule)",
  borderRadius: "var(--r-card)",
};

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <span style={{ color: "var(--ink-soft)" }}>{label}: </span>
      <code>{JSON.stringify(value)}</code>
    </div>
  );
}

function ListShell({ testId, intro, children }: { testId: string; intro: string; children: React.ReactNode }) {
  return (
    <div data-testid={testId} className="flex flex-col gap-3">
      <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
        {intro}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

export function EvidenceRecordList({
  testId,
  intro,
  records,
  verdictTone,
  outputLabel,
}: {
  testId: string;
  intro: string;
  records: readonly EvidenceRecord[];
  verdictTone: Tone;
  outputLabel: string;
}) {
  return (
    <ListShell testId={testId} intro={intro}>
      {records.map((item) => (
        <div key={item.id} data-testid={`evidence-row-${item.id}`} className="p-3 rounded border font-mono text-xs flex flex-col gap-1.5" style={rowStyle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: "var(--ink)" }}>
                {item.id}
              </span>
              <span style={{ color: "var(--ink-soft)" }}>({item.taskId})</span>
              <ProvenanceTag isGrounded={true} source={item.source} />
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={verdictTone}>{item.verdict}</Badge>
              <span className="text-[11px]" style={{ color: "var(--ink-soft)" }}>
                {item.timestamp}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
            <Field label="Input w" value={item.input} />
            <Field label={outputLabel} value={item.output} />
          </div>
          {item.notes && (
            <div className="text-[11px] opacity-75" style={{ color: "var(--ink-soft)" }}>
              {item.notes}
            </div>
          )}
        </div>
      ))}
    </ListShell>
  );
}

export function BSynthList({ records }: { records: readonly BSynthRecord[] }) {
  return (
    <ListShell
      testId="tab-content-B_synth"
      intro="Tập B_synth: Vết đột biến sinh tự động dùng để đo độ lỏng của monitor P0 qua kiểm định Fuzzing."
    >
      {records.map((item) => (
        <div key={item.id} data-testid={`evidence-row-${item.id}`} className="p-3 rounded border font-mono text-xs flex flex-col gap-1.5" style={rowStyle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: "var(--ink)" }}>
                {item.id}
              </span>
              <span style={{ color: "var(--ink-soft)" }}>({item.taskId})</span>
              <Badge>Loại: {item.mutationType}</Badge>
            </div>
            <Badge tone={item.isCaughtByP0 ? "success" : "warning"}>{item.isCaughtByP0 ? "P0 Bác bỏ" : "P0 Bị lọt (Slack)"}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
            <Field label="Input" value={item.input} />
            <Field label="Mutant" value={item.mutantOutput} />
          </div>
        </div>
      ))}
    </ListShell>
  );
}

const SEVERITY_TONE: Record<SpecDebtItem["severity"], Tone> = { high: "danger", medium: "warning", low: "neutral" };

export function SpecDebtList({ items }: { items: readonly SpecDebtItem[] }) {
  return (
    <ListShell
      testId="tab-content-spec_debt"
      intro="Nợ Đặc tả (Spec Debt): Các ca tồn đọng cần bổ sung quan hệ biến đổi MR, mở rộng tiên đề hoặc gán nhãn người."
    >
      {items.map((item) => (
        <div key={item.id} data-testid={`debt-row-${item.id}`} className="p-3 rounded border font-mono text-xs flex flex-col gap-1.5" style={rowStyle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: "var(--ink)" }}>
                {item.id}
              </span>
              <span style={{ color: "var(--ink-soft)" }}>({item.taskId})</span>
              <span className="font-semibold" style={{ color: "var(--action)" }}>
                {item.title}
              </span>
            </div>
            <Badge tone={SEVERITY_TONE[item.severity]} className="uppercase">
              Mức: {item.severity}
            </Badge>
          </div>
          <p className="text-[11px] m-0 leading-relaxed opacity-80" style={{ color: "var(--ink)" }}>
            {item.description}
          </p>
        </div>
      ))}
    </ListShell>
  );
}

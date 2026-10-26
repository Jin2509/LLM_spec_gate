/**
 * Danh sách bằng chứng — CHỈ ĐỌC. Không được thêm input/button vào các list G/B
 * (bất biến được kiểm thử ở tests/ui/evidence-store-readonly.test.tsx).
 */
import React from "react";
import type { BSynthRecord, EvidenceRecord, SpecDebtItem } from "@/lib/api";
import { ProvenanceTag } from "@/features/evidence/components/ProvenanceTag";
import { Badge, type Tone } from "@/ui/layout";
import { formatValue } from "@/features/evidence/format";

function Value({ value }: { value: unknown }) {
  return <code className="text-[12.5px] break-all">{formatValue(value)}</code>;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("vi-VN");
}

function ListShell({ testId, intro, empty, children }: { testId: string; intro: string; empty: boolean; children: React.ReactNode }) {
  return (
    <div data-testid={testId} className="flex flex-col gap-3">
      <p className="m-0 text-[13px]" style={{ color: "var(--ink-soft)" }}>
        {intro}
      </p>
      {empty ? <p className="empty-data m-0 eval-table-wrap">Chưa có mục nào.</p> : children}
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
    <ListShell testId={testId} intro={intro} empty={!records.length}>
      <div className="eval-table-wrap">
        <table className="eval-table">
          <thead>
            <tr>
              <th>Tác vụ</th>
              <th>Đầu vào</th>
              <th>{outputLabel}</th>
              <th>Nguồn</th>
              <th>Thời điểm</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item) => (
              <tr key={item.id} data-testid={`evidence-row-${item.id}`} title={item.notes ?? item.id}>
                <td>
                  <span className="font-mono text-[12.5px]">{item.taskId}</span>
                </td>
                <td>
                  <Value value={item.input} />
                </td>
                <td>
                  <span className="inline-flex items-center gap-2">
                    <Value value={item.output} />
                    <Badge tone={verdictTone}>{item.verdict}</Badge>
                  </span>
                </td>
                <td>
                  <ProvenanceTag isGrounded={true} source={item.source} />
                </td>
                <td className="whitespace-nowrap" style={{ color: "var(--ink-soft)" }}>
                  {formatTime(item.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ListShell>
  );
}

const MUTATION_LABELS: Record<BSynthRecord["mutationType"], string> = {
  boundary_shift: "Lệch biên",
  type_perturbation: "Đổi kiểu",
  extreme_value: "Giá trị cực trị",
  null_injection: "Giá trị rỗng",
};

export function BSynthList({ records }: { records: readonly BSynthRecord[] }) {
  return (
    <ListShell
      testId="tab-content-B_synth"
      intro="Kết quả sai được sinh tự động từ điểm neo. Đặc tả chấp nhận càng nhiều đột biến thì càng lỏng."
      empty={!records.length}
    >
      <div className="eval-table-wrap">
        <table className="eval-table">
          <thead>
            <tr>
              <th>Tác vụ</th>
              <th>Đầu vào</th>
              <th>Kết quả đột biến</th>
              <th>Loại</th>
              <th>Đặc tả</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item) => (
              <tr key={item.id} data-testid={`evidence-row-${item.id}`}>
                <td>
                  <span className="font-mono text-[12.5px]">{item.taskId}</span>
                </td>
                <td>
                  <Value value={item.input} />
                </td>
                <td>
                  <Value value={item.mutantOutput} />
                </td>
                <td>{MUTATION_LABELS[item.mutationType] ?? item.mutationType}</td>
                <td>
                  <Badge tone={item.isCaughtByP0 ? "success" : "warning"}>{item.isCaughtByP0 ? "Đã chặn" : "Bị lọt"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ListShell>
  );
}

const SEVERITY: Record<SpecDebtItem["severity"], { tone: Tone; label: string }> = {
  high: { tone: "danger", label: "Cao" },
  medium: { tone: "warning", label: "Trung bình" },
  low: { tone: "neutral", label: "Thấp" },
};

export function SpecDebtList({ items }: { items: readonly SpecDebtItem[] }) {
  return (
    <ListShell
      testId="tab-content-spec_debt"
      intro="Những lỗi của đặc tả nằm ngoài vùng sửa hoặc chưa đủ bằng chứng để sửa; cần bổ sung điểm neo, ràng buộc hoặc câu trả lời của người."
      empty={!items.length}
    >
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            data-testid={`debt-row-${item.id}`}
            className="p-4 rounded-[var(--radius-md)] border flex flex-col gap-1.5"
            style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                {item.title}
              </strong>
              <span className="font-mono text-[12px]" style={{ color: "var(--ink-soft)" }}>
                {item.taskId}
              </span>
              <span className="ml-auto">
                <Badge tone={SEVERITY[item.severity].tone}>Mức {SEVERITY[item.severity].label.toLowerCase()}</Badge>
              </span>
            </div>
            <p className="m-0 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </ListShell>
  );
}

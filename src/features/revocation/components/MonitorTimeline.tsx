import React from "react";
import type { MonitorVersionRecord } from "@/core/revocation";
import { Badge } from "@/ui/layout";

function TimelineNode({ record }: { record: MonitorVersionRecord }) {
  const isActive = record.status === "active";
  const isRevoked = record.status === "revoked";
  const accent = isRevoked ? "var(--v-code)" : isActive ? "var(--action)" : "var(--rule)";

  return (
    <div
      data-testid={`timeline-node-${record.version}`}
      className="p-3 rounded border font-mono text-xs flex flex-col gap-1.5 relative transition-all"
      style={{
        backgroundColor: isActive ? "var(--paper-ground)" : "var(--paper-surface)",
        borderColor: accent,
        borderWidth: isActive || isRevoked ? "1.5px" : "1px",
        borderRadius: "var(--r-card)",
      }}
    >
      <span
        className="absolute -left-[31px] top-4 w-3 h-3 rounded-full border-2"
        style={{ backgroundColor: accent, borderColor: "var(--paper-surface)" }}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <strong className="text-sm" style={{ color: "var(--ink)" }}>
            {record.version}
          </strong>
          <Badge tone={isRevoked ? "danger" : isActive ? "success" : "neutral"} className="uppercase">
            {record.status}
          </Badge>
        </div>
        <span className="text-[11px]" style={{ color: "var(--ink-soft)" }}>
          Triển khai: {record.deployedAt}
        </span>
      </div>
      {record.guard && (
        <div className="text-[11px] pt-1">
          <span style={{ color: "var(--ink-soft)" }}>Miền guard g: </span>
          <code>{record.guard}</code>
        </div>
      )}
      {record.replacement && (
        <div className="text-[11px]">
          <span style={{ color: "var(--ink-soft)" }}>Mệnh đề thay thế C&apos;: </span>
          <code>{record.replacement}</code>
        </div>
      )}
      {isRevoked && (
        <div
          data-testid={`revocation-detail-${record.version}`}
          className="mt-1 p-2 rounded border text-[11px]"
          style={{ borderColor: "var(--v-code)", borderStyle: "dashed", color: "var(--v-code)" }}
        >
          <strong>Nguyên nhân Thu hồi:</strong> {record.revocationReason}
          {record.violatingTraceId && (
            <div>
              Vết xấu vi phạm: <code>{record.violatingTraceId}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MonitorTimeline({ history }: { history: readonly MonitorVersionRecord[] }) {
  return (
    <div
      data-testid="monitor-timeline"
      className="p-4 rounded border flex flex-col gap-4 font-sans"
      style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)", borderRadius: "var(--r-card)" }}
    >
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--rule)" }}>
        <span className="text-xs font-mono font-semibold" style={{ color: "var(--ink)" }}>
          Dòng thời gian Monitor (P_0 → P_k)
        </span>
        <span className="text-[11px] font-mono" style={{ color: "var(--ink-soft)" }}>
          Tổng cộng {history.length} mốc tiến hóa
        </span>
      </div>
      <div className="flex flex-col gap-3 relative pl-6 border-l-2 ml-4" style={{ borderColor: "var(--rule)" }}>
        {history.map((record, idx) => (
          <TimelineNode key={`${record.version}_${idx}`} record={record} />
        ))}
      </div>
    </div>
  );
}

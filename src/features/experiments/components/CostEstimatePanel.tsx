import React from "react";
import type { CostEstimate } from "@/core/experiment";
import { MetricTile, Panel } from "@/ui/layout";

export function CostEstimatePanel({ estimate, runTaskCount }: { estimate?: CostEstimate; runTaskCount?: number }) {
  const v = (value: number | undefined, format: (n: number) => string) => (value === undefined ? "…" : format(value));
  return (
    <Panel
      testId="cost-estimation-table"
      title={<>2. Bảng Dự toán Chi phí &amp; Tài nguyên trước khi chạy</>}
      aside={runTaskCount !== undefined ? `Định mức dựa trên ${runTaskCount} tasks chạy thực` : "Đang dự toán..."}
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricTile label="Lời gọi hàm" value={v(estimate?.functionCalls, (n) => `~${n.toLocaleString()}`)} />
        <MetricTile label="Thời gian LLM" value={v(estimate?.llmDurationSec, (n) => `~${n} giây`)} />
        <MetricTile label="Thời gian Z3" value={v(estimate?.z3DurationSec, (n) => `~${n} giây`)} />
        <MetricTile label="Tokens ước tính" value={v(estimate?.totalTokens, (n) => `~${n.toLocaleString()}`)} />
        <MetricTile label="Chi phí dự kiến" value={v(estimate?.estimatedUsd, (n) => `$${n}`)} valueColor="var(--action)" />
      </div>
    </Panel>
  );
}

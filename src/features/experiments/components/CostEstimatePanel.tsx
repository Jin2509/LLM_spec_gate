import React from "react";
import type { CostEstimate } from "@/core/experiment";
import { MetricTile, Panel } from "@/ui/layout";

/** Ước tính chi phí do backend tính (POST /api/experiments/plan); UI chỉ hiển thị. */
export function CostEstimatePanel({ estimate, runTaskCount }: { estimate?: CostEstimate; runTaskCount?: number }) {
  const v = (value: number | undefined, format: (n: number) => string) => (value === undefined ? "—" : format(value));
  return (
    <Panel
      testId="cost-estimation-table"
      title="Ước tính trước khi chạy"
      aside={runTaskCount !== undefined ? `Cho ${runTaskCount} tác vụ chạy` : "Chưa có ước tính"}
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricTile label="Lời gọi hàm" value={v(estimate?.functionCalls, (n) => `~${n.toLocaleString("vi-VN")}`)} />
        <MetricTile label="Thời gian LLM" value={v(estimate?.llmDurationSec, (n) => `~${n} giây`)} />
        <MetricTile label="Thời gian Z3" value={v(estimate?.z3DurationSec, (n) => `~${n} giây`)} />
        <MetricTile label="Tokens" value={v(estimate?.totalTokens, (n) => `~${n.toLocaleString("vi-VN")}`)} />
        <MetricTile label="Chi phí" value={v(estimate?.estimatedUsd, (n) => `$${n}`)} valueColor="var(--accent)" />
      </div>
    </Panel>
  );
}

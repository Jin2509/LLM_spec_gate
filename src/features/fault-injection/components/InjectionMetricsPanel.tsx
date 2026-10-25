import React from "react";
import type { FaultInjectionMetrics } from "@/lib/api";
import { MetricTile, Panel } from "@/ui/layout";

export function InjectionMetricsPanel({ metrics }: { metrics: FaultInjectionMetrics }) {
  return (
    <Panel
      testId="injection-metrics-dashboard"
      title={<>Đo lường Trực tiếp Tỷ lệ Quy sai &amp; Độ lọt Gate</>}
      aside={`Tổng cộng ${metrics.totalInjections} ca thử nghiệm`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricTile
          label="Tỷ lệ Quy sai lỗi (Misattribution)"
          value={`${metrics.misattributionRate}%`}
          valueTestId="metric-misattribution-rate"
          valueColor={metrics.misattributionRate > 10 ? "var(--v-spec)" : "var(--action)"}
          hint="Tỷ lệ nhầm SPEC_FAULT thành CODE_FAULT hoặc ngược lại"
        />
        <MetricTile
          label="Tỷ lệ Patch sai lọt Gate (Slippage)"
          value={`${metrics.faultyPatchSlipRate}%`}
          valueTestId="metric-patch-slip-rate"
          valueColor={metrics.faultyPatchSlipRate > 0 ? "var(--v-code)" : "var(--v-acc)"}
          hint="Pipeline G1–G5 chặn hầu hết mọi bản vá vi phạm"
        />
        <MetricTile
          label="Số ca bị Gate chặn thành công"
          value={`${metrics.gateBlockedCount} / ${metrics.totalInjections} ca`}
          valueColor="var(--v-acc)"
          hint="Bảo đảm fail-closed tuyệt đối"
        />
      </div>
    </Panel>
  );
}

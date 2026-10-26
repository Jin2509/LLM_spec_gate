import React from "react";
import type { FaultInjectionMetrics } from "@/lib/api";
import { MetricTile, Panel } from "@/ui/layout";

/** Số đo do backend tính sau khi tiêm lỗi; UI chỉ hiển thị. */
export function InjectionMetricsPanel({ metrics }: { metrics: FaultInjectionMetrics }) {
  return (
    <Panel testId="injection-metrics-dashboard" title="Kết quả đo" aside={`${metrics.totalInjections} ca đã tiêm`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricTile
          label="Quy lỗi sai chỗ"
          value={`${metrics.misattributionRate}%`}
          valueTestId="metric-misattribution-rate"
          hint="Lỗi đặc tả bị kết luận là lỗi code, hoặc ngược lại"
        />
        <MetricTile
          label="Bản sửa sai lọt qua cổng"
          value={`${metrics.faultyPatchSlipRate}%`}
          valueTestId="metric-patch-slip-rate"
          valueColor={metrics.faultyPatchSlipRate > 0 ? "var(--v-code)" : "var(--ink)"}
          hint="Tỷ lệ bản sửa có hại vẫn qua cổng kiểm"
        />
        <MetricTile
          label="Bị cổng chặn"
          value={`${metrics.gateBlockedCount} / ${metrics.totalInjections} ca`}
          hint="Số ca cổng kiểm từ chối bản sửa"
        />
      </div>
    </Panel>
  );
}

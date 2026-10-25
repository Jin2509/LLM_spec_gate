"use client";

import React, { useMemo, useState } from "react";
import { ErrorState } from "@/ui/layout";
import { api, useApiQuery, type StatsFilters } from "@/lib/api";
import { EvalNav } from "@/features/evaluation/EvalNav";
import {
  VERDICT_CLASSES,
  confidenceHistogram,
  confusionMatrix,
  countByDay,
  countByModelPair,
  countByProblem,
  runsNeedingReview,
} from "./derive";
import {
  BarChartCard,
  ConfusionMatrixCard,
  DailyRunsCard,
  MetricGrid,
  ModelPairsCard,
  ProblemBreakdownCard,
  RawMetricsCard,
  ReviewQueueCard,
} from "./components/StatCards";

function downloadJson(raw: string, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function StatsScreen() {
  const [filters, setFilters] = useState<Required<Pick<StatsFilters, "dataset" | "from" | "to">>>({ dataset: "", from: "", to: "" });
  const statsQuery = useApiQuery(`stats:${JSON.stringify(filters)}`, (signal) => api.stats.get(filters, signal));

  const runs = useMemo(() => statsQuery.data?.runs ?? [], [statsQuery.data]);
  const metrics = statsQuery.data?.metrics;
  const raw = JSON.stringify(metrics ?? {}, null, 2);
  const set = (key: keyof typeof filters) => (e: React.ChangeEvent<HTMLInputElement>) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <main className="eval-page">
      <EvalNav current="/stats" />
      <header className="eval-header">
        <div>
          <h1>Thống kê phiên chạy</h1>
          <p>Số liệu được tính từ các run đã lưu; chưa có dữ liệu thì không thay bằng số liệu trong bài báo.</p>
        </div>
        <button className="eval-button" onClick={() => downloadJson(raw, "thong-ke.json")}>
          Xuất thống kê
        </button>
      </header>
      <section className="eval-filters">
        <input aria-label="Dataset" placeholder="Mọi dataset" value={filters.dataset} onChange={set("dataset")} />
        <label>
          Từ <input type="date" value={filters.from} onChange={set("from")} />
        </label>
        <label>
          Đến <input type="date" value={filters.to} onChange={set("to")} />
        </label>
      </section>
      {statsQuery.error && <ErrorState message={statsQuery.error} status={statsQuery.errorStatus} onRetry={statsQuery.reload} />}
      <MetricGrid metrics={metrics} />
      <div className="stats-grid">
        <BarChartCard title="Số lượng theo verdict" rows={VERDICT_CLASSES.map((label) => ({ label, value: metrics?.byVerdict[label] ?? 0 }))} />
        <ProblemBreakdownCard rows={countByProblem(runs)} />
        <ConfusionMatrixCard matrix={confusionMatrix(runs)} totalRuns={runs.length} />
        <DailyRunsCard rows={countByDay(runs)} />
        <BarChartCard
          title="Histogram confidence (có nhãn đúng / sai)"
          rows={confidenceHistogram(runs).map((v, i) => ({ label: `${i * 20}–${(i + 1) * 20}%`, value: v }))}
        />
        <ModelPairsCard rows={countByModelPair(runs)} />
        <RawMetricsCard raw={raw} />
        <ReviewQueueCard runs={runsNeedingReview(runs)} />
      </div>
    </main>
  );
}

"use client";

import React, { useState } from "react";
import { AppShell } from "@/ui/shell";
import { Badge, ErrorState, PageHeader, QueryBoundary } from "@/ui/layout";
import { api, useApiQuery, type ExperimentOptionsResponse, type ExperimentProgress } from "@/lib/api";
import { useRouteParam } from "@/features/runs/use-run-id";
import { ExperimentConfigForm, type EditableExperimentConfig } from "./components/ExperimentConfigForm";
import { CostEstimatePanel } from "./components/CostEstimatePanel";
import { BatchProgressPanel } from "./components/BatchProgressPanel";
import { useBatchRun } from "./use-batch-run";

function ExperimentsWorkspace({ options }: { options: ExperimentOptionsResponse }) {
  const [config, setConfig] = useState<EditableExperimentConfig>(() => ({ ...options.defaults, baselines: [...options.defaults.baselines] }));
  const planQuery = useApiQuery(`experiments:plan:${JSON.stringify(config)}`, (signal) => api.experiments.plan(config, signal));
  const batch = useBatchRun();

  const manifest = planQuery.data?.manifest;
  const idleProgress: ExperimentProgress = {
    completed: 0,
    total: manifest?.runTaskCount ?? 0,
    accCount: 0,
    rejCount: 0,
    unknownCount: 0,
    repairCount: 0,
    revocations: 0,
    pendingHumanTickets: 0,
  };

  return (
    <>
      <div className="flex justify-end">
        <Badge tone="action">Hash: {manifest?.manifestHash ?? "…"}</Badge>
      </div>
      <ExperimentConfigForm
        config={config}
        options={options}
        familyWarning={planQuery.data?.familyCheck.isSameFamily ? planQuery.data.familyCheck.warning : undefined}
        onChange={setConfig}
      />
      {planQuery.error && !planQuery.isLoading && <ErrorState message={planQuery.error} status={planQuery.errorStatus} onRetry={planQuery.reload} />}
      <CostEstimatePanel estimate={planQuery.data?.costEstimate} runTaskCount={manifest?.runTaskCount} />
      <BatchProgressPanel
        progress={batch.status?.progress ?? idleProgress}
        isRunning={batch.isRunning}
        canStart={!!manifest}
        showHumanOracleLink={config.humanOracle === "real_human"}
        error={batch.error}
        onStart={() => void batch.start(config)}
      />
    </>
  );
}

export function ExperimentsScreen() {
  const runId = useRouteParam("runId");
  const optionsQuery = useApiQuery("experiments:options", (signal) => api.experiments.options(signal));

  return (
    <AppShell currentRunId={runId}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2 font-sans">
        <PageHeader
          testId="experiments-header"
          eyebrow="Thực nghiệm Nghiên cứu Khoa học (RQ1 → RQ6)"
          title={<>Experiment Runner &amp; Batch Orchestration</>}
          description="Thiết lập cấu hình tất định, đối chứng baseline và ước lượng chi phí chính xác trước khi chạy."
        />
        <QueryBoundary query={optionsQuery} loadingLabel="Đang tải danh mục thực nghiệm...">
          {(options) => <ExperimentsWorkspace options={options} />}
        </QueryBoundary>
      </div>
    </AppShell>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/ui/shell";
import { ChartContainer } from "@/features/results/components/ChartContainer";
import { PageHeader, QueryBoundary } from "@/ui/layout";
import { RQ_IDS, api, useApiQuery, type RQId } from "@/lib/api";
import type { LinkedWitness } from "@/core/results";
import { RQTabs } from "./components/RQTabs";
import { RQChart, rawDataOf } from "./components/RQChart";
import { useRouteParam } from "@/features/runs/use-run-id";
import { RunGate } from "@/features/runs/RunGate";

function toRQId(raw: string | undefined): RQId {
  const value = raw?.toLowerCase();
  return RQ_IDS.find((id) => id === value) ?? "rq1";
}

export function ResultsScreen() {
  return <RunGate>{(runId) => <ResultsContent runId={runId} />}</RunGate>;
}

function ResultsContent({ runId }: { runId: string }) {
  const router = useRouter();
  const activeRq = toRQId(useRouteParam("rq"));

  const result = useApiQuery(`results:${runId}:${activeRq}`, (signal) => api.results.get(runId, activeRq, signal));
  const [selectedWitnesses, setSelectedWitnesses] = useState<ReadonlyArray<LinkedWitness> | null>(null);

  const handleTabChange = (rq: RQId) => {
    setSelectedWitnesses(null);
    router.push(`/runs/${runId}/results/${rq}`);
  };

  return (
    <AppShell currentRunId={runId}>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Thực nghiệm"
          title="Kết quả nghiên cứu"
          description="Số liệu tổng hợp từ kết quả thực nghiệm thật của lượt chạy. Bấm vào một phần tử biểu đồ để xem các ca minh chứng."
        />
        <RQTabs active={activeRq} onChange={handleTabChange} />
        <QueryBoundary query={result} loadingLabel="Đang tải kết quả...">
          {(data) => (
            <ChartContainer
              runId={runId}
              rqId={data.rq}
              title={data.title}
              sampleSize={data.sampleSize}
              description={data.description}
              tableHeaders={data.table.headers}
              tableRows={data.table.rows}
              rawData={rawDataOf(data.data)}
              selectedWitnesses={selectedWitnesses}
              onClearWitnesses={() => setSelectedWitnesses(null)}
            >
              <RQChart data={data.data} onSelectWitnesses={setSelectedWitnesses} />
            </ChartContainer>
          )}
        </QueryBoundary>
      </div>
    </AppShell>
  );
}

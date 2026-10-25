"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/ui/shell";
import { RepairGatePanel } from "@/ui/domain/RepairGatePanel";
import { QueryBoundary } from "@/ui/layout";
import { api, useApiQuery } from "@/lib/api";
import type { CaseDossier } from "@/core/types";
import { RunGate } from "@/features/runs/RunGate";
import { useRouteParam } from "@/features/runs/use-run-id";
import { CaseBreadcrumb } from "./components/CaseBreadcrumb";
import { CaseSummaryBanner } from "./components/CaseSummaryBanner";

export function RepairGateScreen() {
  return <RunGate>{(runId) => <RepairGateContent runId={runId} />}</RunGate>;
}

function CaseRepairPanel({ runId, caseDossier, onDeployed }: { runId: string; caseDossier: CaseDossier; onDeployed: (version: string) => void }) {
  const candidatesQuery = useApiQuery(`repair-candidates:${runId}:${caseDossier.id}`, (signal) =>
    api.cases.repairCandidates(runId, caseDossier.id, signal),
  );
  return (
    <QueryBoundary query={candidatesQuery} loadingLabel="Đang tải ứng viên sửa đặc tả...">
      {({ candidates }) => (
        <RepairGatePanel
          caseDossier={caseDossier}
          candidates={candidates}
          onDeploySuccess={({ nextVersion, isShadow }) => {
            if (!isShadow) onDeployed(nextVersion);
          }}
        />
      )}
    </QueryBoundary>
  );
}

function RepairGateContent({ runId }: { runId: string }) {
  const router = useRouter();
  const routeCaseId = useRouteParam("caseId");
  const casesQuery = useApiQuery(`cases:${runId}`, (signal) => api.cases.list({ runId }, signal));
  const [activeCaseId, setActiveCaseId] = useState(routeCaseId);
  // Phiên bản monitor sau khi deploy (ghi đè giá trị trong dossier cho tới khi đổi case).
  const [deployedVersion, setDeployedVersion] = useState<{ caseId: string; version: string } | null>(null);

  const handleSelectCase = (nextId: string) => {
    setActiveCaseId(nextId);
    router.push(`/runs/${runId}/cases/${nextId}/repair-gate`);
  };

  return (
    <AppShell currentRunId={runId}>
      <QueryBoundary query={casesQuery} loadingLabel="Đang tải Không gian sửa đổi...">
        {({ cases }) => {
          const currentCase = cases.find((c) => c.id === activeCaseId) ?? cases[0];
          if (!currentCase) return <p className="font-mono text-xs">Run này chưa có hồ sơ vụ việc nào.</p>;
          const monitorVersion =
            deployedVersion?.caseId === currentCase.id ? deployedVersion.version : currentCase.currentMonitorVersion;
          return (
            <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
              <CaseBreadcrumb runId={runId} activeCaseId={currentCase.id} cases={cases} onSelectCase={handleSelectCase} />
              <CaseSummaryBanner caseDossier={currentCase} monitorVersion={monitorVersion} />
              <CaseRepairPanel
                key={currentCase.id}
                runId={runId}
                caseDossier={currentCase}
                onDeployed={(version) => setDeployedVersion({ caseId: currentCase.id, version })}
              />
            </div>
          );
        }}
      </QueryBoundary>
    </AppShell>
  );
}

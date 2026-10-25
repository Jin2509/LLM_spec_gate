"use client";

import React, { useState } from "react";
import { AppShell } from "@/ui/shell";
import { Button } from "@/ui/primitives/Button";
import { Badge, ErrorState, QueryBoundary } from "@/ui/layout";
import { api, toDisplayError, useApiQuery, type DisplayError } from "@/lib/api";
import { useRunEvents } from "@/features/runs/use-run-events";
import { RunGate } from "@/features/runs/RunGate";
import { i18n } from "@/i18n/vi";
import { AdmissionSummaryCards } from "./components/AdmissionSummaryCards";
import { AdmissionStepCard } from "./components/AdmissionStepCard";

export function AdmissionScreen() {
  return <RunGate>{(runId) => <AdmissionContent runId={runId} />}</RunGate>;
}

function AdmissionContent({ runId }: { runId: string }) {
  const { isConnected } = useRunEvents({ runId, batchIntervalMs: 250 });
  const report = useApiQuery(`admission:${runId}`, (signal) => api.admission.get(runId, signal));
  const [isRunning, setIsRunning] = useState(false);
  const [markingTaskId, setMarkingTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<DisplayError | null>(null);

  const handleRunAdmission = async () => {
    setIsRunning(true);
    setActionError(null);
    try {
      const next = await api.admission.run(runId);
      report.setData(() => next);
    } catch (error) {
      setActionError(toDisplayError(error));
    } finally {
      setIsRunning(false);
    }
  };

  const handleMarkForReview = async (taskId: string) => {
    setMarkingTaskId(taskId);
    setActionError(null);
    try {
      const { reviewedTaskIds } = await api.admission.markForReview(runId, taskId);
      report.setData((prev) => prev && { ...prev, reviewedTaskIds });
    } catch (error) {
      setActionError(toDisplayError(error));
    } finally {
      setMarkingTaskId(null);
    }
  };

  return (
    <AppShell currentRunId={runId}>
      <div className="space-y-6">
        <div className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: "var(--rule)" }}>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                {i18n.admission.title}
              </h1>
              <Badge tone={isConnected ? "success" : "neutral"}>{isConnected ? "● SSE Live" : "○ Offline"}</Badge>
            </div>
            <p className="text-xs font-mono mt-1" style={{ color: "var(--ink-soft)" }}>
              Lượt chạy: {runId} · {i18n.admission.subtitle}
            </p>
          </div>

          <Button variant="primary" size="md" disabled={isRunning} onClick={() => void handleRunAdmission()} className="gap-2 shrink-0">
            <span>{isRunning ? "⏳" : "▶"}</span>
            <span>{isRunning ? "Đang kiểm nạp..." : i18n.admission.runAdmission}</span>
          </Button>
        </div>

        {actionError && <ErrorState {...actionError} />}

        <QueryBoundary query={report} loadingLabel="Đang tải báo cáo kiểm nạp...">
          {(data) => (
            <>
              <AdmissionSummaryCards summary={data.summary} />
              <div className="space-y-4">
                <h2 className="text-sm font-mono font-semibold" style={{ color: "var(--ink)" }}>
                  Bảng Kiểm tra 6 Bước Toàn Cảnh
                </h2>
                <div className="space-y-3">
                  {data.steps.map((step) => (
                    <AdmissionStepCard
                      key={step.key}
                      step={step}
                      isReviewed={!!step.violatedTaskId && data.reviewedTaskIds.includes(step.violatedTaskId)}
                      isMarking={markingTaskId === step.violatedTaskId}
                      onMarkForReview={(taskId) => void handleMarkForReview(taskId)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </QueryBoundary>
      </div>
    </AppShell>
  );
}

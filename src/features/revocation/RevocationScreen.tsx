"use client";

import React, { useState } from "react";
import { AppShell } from "@/ui/shell";
import { ErrorState, Notice, PageHeader, QueryBoundary } from "@/ui/layout";
import { api, toDisplayError, useApiQuery, type DisplayError } from "@/lib/api";
import type { BadTraceItem } from "@/core/revocation";
import { RunGate } from "@/features/runs/RunGate";
import { MonitorTimeline } from "./components/MonitorTimeline";
import { BadTraceForm } from "./components/BadTraceForm";

export function RevocationScreen() {
  return <RunGate>{(runId) => <RevocationContent runId={runId} />}</RunGate>;
}

function RevocationContent({ runId }: { runId: string }) {
  const historyQuery = useApiQuery(`revocation:${runId}`, (signal) => api.revocation.history(runId, signal));
  const [isInjecting, setIsInjecting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [injectError, setInjectError] = useState<DisplayError | null>(null);

  const handleInject = async (trace: BadTraceItem) => {
    setIsInjecting(true);
    setFeedback(null);
    setInjectError(null);
    try {
      const data = await api.revocation.injectBadTrace(runId, trace);
      const result = data.revocationResult;
      setFeedback(
        result.revoked
          ? `PHẢN ỨNG DÂY CHUYỀN KÍCH HOẠT: ${result.reason} Nâng cấp Monitor lên ${result.newActiveVersion}.`
          : "Vết tiêm không xâm phạm vùng guard g. Monitor giữ nguyên.",
      );
      historyQuery.setData((prev) => ({ runId, ...prev, monitorHistory: data.currentHistory }));
    } catch (error) {
      setInjectError(toDisplayError(error));
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <AppShell currentRunId={runId}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
        <PageHeader
          testId="revocation-header"
          eyebrow={<>Quản lý Vòng đời &amp; Thu hồi Bản vá</>}
          title={<>Patch Revocation &amp; Dynamic Monitor Evolution</>}
          description="Quy tắc G2 (Reject-B): Nếu vết xấu mới t ∈ B xâm phạm vùng g của monitor hiện tại, bản vá bị thu hồi ngay lập tức."
        />

        <BadTraceForm isSubmitting={isInjecting} onSubmit={(trace) => void handleInject(trace)} />

        {feedback && (
          <Notice tone="danger" testId="injection-feedback">
            {feedback}
          </Notice>
        )}
        {injectError && <ErrorState {...injectError} />}

        <QueryBoundary query={historyQuery} loadingLabel="Đang tải Vòng đời Thu hồi...">
          {(data) => <MonitorTimeline history={data.monitorHistory} />}
        </QueryBoundary>
      </div>
    </AppShell>
  );
}

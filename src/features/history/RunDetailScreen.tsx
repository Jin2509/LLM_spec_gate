"use client";

import React from "react";
import { ErrorState } from "@/ui/layout";
import { api, errorMessage, useApiQuery } from "@/lib/api";
import { ShellPage } from "@/ui/shell/ShellPage";
import { RunLogs, RunOutputs, RunTurns } from "./components/RunDetailSections";
import { ReviewForm } from "./components/ReviewForm";

export function RunDetailScreen({ runId }: { runId: string }) {
  const runQuery = useApiQuery(`run:${runId}`, (signal) => api.runs.get(runId, signal));
  const run = runQuery.data?.run;

  const review = async (agree: boolean, note: string) => {
    try {
      const data = await api.runs.review(runId, { agree, note });
      runQuery.setData(() => data);
      return "Đã lưu đánh giá.";
    } catch (error) {
      return errorMessage(error);
    }
  };

  if (!run) {
    return (
      <ShellPage eyebrow="Lịch sử" title="Chi tiết phiên">
        {runQuery.error ? <ErrorState message={runQuery.error} onRetry={runQuery.reload} /> : <p style={{ color: "var(--ink-soft)" }}>Đang tải phiên…</p>}
      </ShellPage>
    );
  }

  return (
    <ShellPage
      eyebrow="Lịch sử"
      title="Chi tiết phiên"
      description={
        <>
          <span className="font-mono">{run.run_id}</span> · {run.dataset.id} · {run.dataset.version}
        </>
      }
    >
      <RunOutputs run={run} />
      <RunTurns run={run} />
      <RunLogs run={run} />
      <ReviewForm key={run.run_id} initialNote={run.review?.note ?? ""} onSubmit={review} />
    </ShellPage>
  );
}

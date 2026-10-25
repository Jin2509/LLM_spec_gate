"use client";

import React from "react";
import { ErrorState } from "@/ui/layout";
import { api, errorMessage, useApiQuery } from "@/lib/api";
import { EvalNav } from "@/features/evaluation/EvalNav";
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
      <main className="eval-page">
        {runQuery.error ? <ErrorState message={runQuery.error} onRetry={runQuery.reload} /> : "Đang tải phiên…"}
      </main>
    );
  }

  return (
    <main className="eval-page">
      <EvalNav />
      <header className="eval-header">
        <div>
          <h1>Chi tiết phiên</h1>
          <p className="mono">{run.run_id}</p>
        </div>
        <span>
          {run.dataset.id} · {run.dataset.version}
        </span>
      </header>
      <RunOutputs run={run} />
      <RunTurns run={run} />
      <RunLogs run={run} />
      <ReviewForm key={run.run_id} initialNote={run.review?.note ?? ""} onSubmit={review} />
    </main>
  );
}

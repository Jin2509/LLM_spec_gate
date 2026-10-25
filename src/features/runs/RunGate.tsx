"use client";

import React from "react";
import { AppShell } from "@/ui/shell";
import { QueryBoundary } from "@/ui/layout";
import { api, useApiQuery } from "@/lib/api";
import { useRouteParam } from "./use-run-id";

/**
 * Xác định run cho màn hình: lấy [runId] trên URL; route không có runId
 * (ví dụ /evidence) thì hỏi backend run đang hoạt động qua GET /api/runs/current.
 */
export function RunGate({ children }: { children: (runId: string) => React.ReactNode }) {
  const routeRunId = useRouteParam("runId");
  const current = useApiQuery(routeRunId ? null : "runs:current", (signal) => api.runs.current(signal));
  const runId = routeRunId ?? current.data?.runId;

  if (runId) return <>{children(runId)}</>;
  return (
    <AppShell>
      <QueryBoundary query={current} loadingLabel="Đang xác định run hiện hành...">
        {() => null}
      </QueryBoundary>
    </AppShell>
  );
}

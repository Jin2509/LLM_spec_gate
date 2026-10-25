"use client";

import React, { useMemo, useState } from "react";
import { AppShell } from "@/ui/shell";
import { QueryBoundary } from "@/ui/layout";
import { api, toDisplayError, useApiQuery, type RunManifest } from "@/lib/api";
import { i18n } from "@/i18n/vi";
import { RunGate } from "@/features/runs/RunGate";
import { HeldOutPartitionCard } from "./components/HeldOutPartitionCard";
import { DEFAULT_TASK_FILTERS, TaskFilterToolbar, applyTaskFilters, type TaskFilters } from "./components/TaskFilterToolbar";
import { TaskTable } from "./components/TaskTable";

function LibraryView({ runId, manifest, onManifest }: { runId: string; manifest: RunManifest; onManifest: (m: RunManifest) => void }) {
  const tasksQuery = useApiQuery(`tasks:${manifest.datasetId}`, (signal) => api.datasets.tasks(manifest.datasetId, signal));
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_TASK_FILTERS);
  const [heldOutRatio, setHeldOutRatio] = useState(manifest.heldOutRatio);
  const [seed, setSeed] = useState(manifest.seed);
  const [isLocking, setIsLocking] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const tasks = useMemo(() => tasksQuery.data?.tasks ?? [], [tasksQuery.data]);
  const filteredTasks = useMemo(() => applyTaskFilters(tasks, filters), [tasks, filters]);
  const isLocked = manifest.isHeldOutLocked;

  const handleLock = async () => {
    if (isLocked) return;
    setIsLocking(true);
    try {
      const result = await api.runs.lockHeldOut(runId, { seed, heldOutRatio });
      onManifest(result.manifest);
      setMessage({ tone: "success", text: "Tập held-out đã được khóa cứng vĩnh viễn với seed đã chọn." });
    } catch (error) {
      setMessage({ tone: "danger", text: `Lỗi khóa tập: ${toDisplayError(error).message}` });
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <>
      <HeldOutPartitionCard
        totalTasks={tasks.length}
        heldOutRatio={heldOutRatio}
        seed={seed}
        isLocked={isLocked}
        isLocking={isLocking}
        message={message}
        onRatioChange={setHeldOutRatio}
        onSeedChange={setSeed}
        onLock={() => void handleLock()}
      />
      <TaskFilterToolbar filters={filters} onChange={setFilters} visibleCount={filteredTasks.length} totalCount={tasks.length} />
      <QueryBoundary query={tasksQuery} loadingLabel="Đang tải thư viện task...">
        {() => <TaskTable tasks={filteredTasks} />}
      </QueryBoundary>
    </>
  );
}

function LibraryContent({ runId }: { runId: string }) {
  const manifestQuery = useApiQuery(`manifest:${runId}`, (signal) => api.runs.manifest(runId, signal));

  return (
    <AppShell currentRunId={runId} topbarProps={{ isHeldOutLocked: manifestQuery.data?.isHeldOutLocked }}>
      <div className="space-y-6">
        <div className="border-b pb-4" style={{ borderColor: "var(--rule)" }}>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
            {i18n.library.title}
          </h1>
          <p className="text-xs font-mono mt-1" style={{ color: "var(--ink-soft)" }}>
            {i18n.library.subtitle}
          </p>
        </div>
        <QueryBoundary query={manifestQuery} loadingLabel="Đang tải manifest của run...">
          {(manifest) => (
            <LibraryView key={manifest.id} runId={runId} manifest={manifest} onManifest={(m) => manifestQuery.setData(() => m)} />
          )}
        </QueryBoundary>
      </div>
    </AppShell>
  );
}

export function LibraryScreen() {
  return <RunGate>{(runId) => <LibraryContent runId={runId} />}</RunGate>;
}

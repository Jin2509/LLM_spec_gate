"use client";

import React, { useState } from "react";
import { AppShell } from "@/ui/shell";
import { Button } from "@/ui/primitives/Button";
import { i18n } from "@/i18n/vi";
import { PIPELINE_STEPS, type StepStatus } from "@/features/backend/run-state";
import { useBackendHealth, useBackendRun, type StartRunInput } from "@/features/backend/use-backend-run";

// The three tasks that ship with fixed LLM answers in spec-gate/adom/tests/fixtures.
const FIXTURE_TASKS = "HumanEval/53, HumanEval/13, HumanEval/23";
const LEVELS: StartRunInput["level"][] = ["A0", "A1", "A2", "A3"];

const STEP_COLOR: Record<StepStatus, string> = {
  pending: "var(--ink-soft)",
  running: "var(--state-running)",
  done: "var(--state-done)",
  failed: "var(--state-error)",
};

const card: React.CSSProperties = {
  borderColor: "var(--rule)",
  backgroundColor: "var(--paper-surface)",
  borderRadius: "var(--r-card)",
};

function PipelineContent() {
  const t = i18n.pipeline;
  const health = useBackendHealth();
  const { manifest, view, connectionError, isStarting, start } = useBackendRun();
  const [seed, setSeed] = useState("42");
  const [level, setLevel] = useState<StartRunInput["level"]>("A3");
  const [taskText, setTaskText] = useState(FIXTURE_TASKS);

  const taskIds = taskText.split(",").map((s) => s.trim()).filter(Boolean);
  const running = manifest !== null && !view.finished && !connectionError?.startsWith("Backend");
  const counts = Object.entries(view.adomCounts).sort((a, b) => b[1] - a[1]);

  return (
    <AppShell currentRunId={manifest?.id}>
      <div className="space-y-6">
        <div className="border-b pb-4" style={{ borderColor: "var(--rule)" }}>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
            {t.title}
          </h1>
          <p className="text-xs font-mono mt-1" style={{ color: "var(--ink-soft)" }}>
            {t.subtitle}
          </p>
          <p className="text-xs font-mono mt-2" style={{ color: health?.ok ? "var(--state-done)" : "var(--state-error)" }}>
            {health === null
              ? t.healthChecking
              : health.ok
                ? `${t.healthOk} · adom: ${health.adom ? "OK" : t.adomMissing}`
                : t.healthDown}
          </p>
        </div>

        <form
          className="p-4 border grid gap-3 sm:grid-cols-[8rem_6rem_1fr_auto] items-end"
          style={card}
          onSubmit={(e) => {
            e.preventDefault();
            void start({ seed, level, taskIds });
          }}
        >
          <label className="text-xs font-mono flex flex-col gap-1" style={{ color: "var(--ink-soft)" }}>
            Seed
            <input className="border px-2 py-1" style={{ borderColor: "var(--rule)" }} value={seed} onChange={(e) => setSeed(e.target.value)} />
          </label>
          <label className="text-xs font-mono flex flex-col gap-1" style={{ color: "var(--ink-soft)" }}>
            {t.level}
            <select
              className="border px-2 py-1"
              style={{ borderColor: "var(--rule)" }}
              value={level}
              onChange={(e) => setLevel(e.target.value as StartRunInput["level"])}
            >
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-mono flex flex-col gap-1" style={{ color: "var(--ink-soft)" }}>
            {t.tasks}
            <input className="border px-2 py-1" style={{ borderColor: "var(--rule)" }} value={taskText} onChange={(e) => setTaskText(e.target.value)} />
          </label>
          <Button type="submit" variant="primary" size="md" disabled={isStarting || running || health?.ok === false}>
            {isStarting || running ? t.running : t.start}
          </Button>
        </form>

        {connectionError && (
          <p className="text-xs font-mono" role="alert" style={{ color: "var(--state-error)" }}>
            {connectionError}
          </p>
        )}

        {manifest && (
          <section className="p-4 border space-y-3" style={card} aria-label={t.progress}>
            <p className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
              {manifest.id} · status: <b style={{ color: "var(--ink)" }}>{manifest.status}</b> · {t.taskCount}: {manifest.totalTasks}
            </p>
            <ol className="flex flex-wrap gap-3">
              {PIPELINE_STEPS.map((step) => (
                <li
                  key={step}
                  className="px-3 py-1 border text-xs font-mono"
                  style={{ borderColor: STEP_COLOR[view.steps[step]], color: STEP_COLOR[view.steps[step]], borderRadius: "var(--r-cell)" }}
                >
                  {step}: {view.steps[step]}
                </li>
              ))}
            </ol>
            {view.failure && (
              <p className="text-xs font-mono" role="alert" style={{ color: "var(--state-error)" }}>
                {t.failedAt} {view.failure.step ?? "?"}: {view.failure.message}
              </p>
            )}
          </section>
        )}

        {view.adomCount > 0 && (
          <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
            <section className="p-4 border" style={card}>
              <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--ink)" }}>
                {t.eventCounts} ({view.adomCount})
              </h2>
              <table className="w-full text-xs font-mono">
                <tbody>
                  {counts.map(([key, n]) => (
                    <tr key={key}>
                      <td style={{ color: "var(--ink-soft)" }}>{key}</td>
                      <td className="text-right" style={{ color: "var(--ink)" }}>{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="p-4 border overflow-x-auto" style={card}>
              <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--ink)" }}>
                {t.recentEvents}
              </h2>
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr style={{ color: "var(--ink-soft)" }}>
                    <th className="text-left">task</th>
                    <th className="text-left">phase</th>
                    <th className="text-left">event</th>
                    <th className="text-right">monitor</th>
                  </tr>
                </thead>
                <tbody>
                  {view.recent.map((ev, i) => (
                    <tr key={`${ev.timestamp}-${i}`} style={{ color: "var(--ink)" }}>
                      <td>{ev.task_id}</td>
                      <td>{ev.phase}</td>
                      <td>{ev.event}</td>
                      <td className="text-right">v{ev.monitor_version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function PipelinePage() {
  return <PipelineContent />;
}

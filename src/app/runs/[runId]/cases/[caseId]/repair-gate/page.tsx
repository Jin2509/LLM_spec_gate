"use client";

import React, { Suspense, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/ui/shell";
import { SAMPLE_CASES } from "@/mock/fixtures/sample-cases";
import { RepairGatePanel } from "@/ui/domain/RepairGatePanel";
import { Button } from "@/ui/primitives/Button";

function RepairGateContent() {
  const params = useParams();
  const router = useRouter();

  const runId = (params?.runId as string) || "run_evalplus_01";
  const caseId = (params?.caseId as string) || "case_spec_fault";

  const [activeCaseId, setActiveCaseId] = useState<string>(caseId);
  const currentCase = SAMPLE_CASES[activeCaseId] ?? SAMPLE_CASES.case_spec_fault!;

  return (
    <AppShell currentRunId={runId}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Link
              href={`/runs/${runId}/workbench`}
              className="hover:underline flex items-center gap-1"
              style={{ color: "var(--action)" }}
            >
              ← Trở lại Bàn phân xử
            </Link>
            <span style={{ color: "var(--ink-soft)" }}>/</span>
            <span style={{ color: "var(--ink-soft)" }}>Run: {runId}</span>
            <span style={{ color: "var(--ink-soft)" }}>/</span>
            <span className="font-semibold" style={{ color: "var(--ink)" }}>
              {activeCaseId}
            </span>
          </div>

          {/* Quick Case Switcher */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span style={{ color: "var(--ink-soft)" }}>Chọn Case:</span>
            <select
              value={activeCaseId}
              onChange={(e) => {
                setActiveCaseId(e.target.value);
                router.push(`/runs/${runId}/cases/${e.target.value}/repair-gate`);
              }}
              className="p-1 rounded border font-mono text-xs cursor-pointer"
              style={{
                backgroundColor: "var(--paper-surface)",
                borderColor: "var(--rule)",
                color: "var(--ink)",
              }}
            >
              {Object.keys(SAMPLE_CASES).map((id) => (
                <option key={id} value={id}>
                  {id} ({SAMPLE_CASES[id]?.adjudication.verdict})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Case Dossier Summary Banner */}
        <div
          className="p-4 rounded border flex flex-wrap items-center justify-between gap-4 font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div className="flex items-center gap-4">
            <div>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Vụ việc (Case ID)</span>
              <strong className="text-sm" style={{ color: "var(--ink)" }}>{currentCase.id}</strong>
            </div>
            <div className="border-l pl-4" style={{ borderColor: "var(--rule)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Task ID</span>
              <span style={{ color: "var(--ink)" }}>{currentCase.taskId}</span>
            </div>
            <div className="border-l pl-4" style={{ borderColor: "var(--rule)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Phán quyết</span>
              <span className="font-bold" style={{ color: "var(--action)" }}>
                {currentCase.adjudication.verdict} ({currentCase.adjudication.matchedRule})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span style={{ color: "var(--ink-soft)" }}>Phiên bản Monitor:</span>
            <span
              className="px-2 py-1 rounded font-bold"
              style={{
                backgroundColor: "var(--paper-ground)",
                border: "1px solid var(--action)",
                color: "var(--action)",
              }}
            >
              {currentCase.currentMonitorVersion}
            </span>
          </div>
        </div>

        {/* The Core Repair & Gate Panel */}
        <RepairGatePanel
          caseDossier={currentCase}
          onDeploySuccess={({ nextVersion }) => {
            // Optional callback
          }}
        />
      </div>
    </AppShell>
  );
}

export default function RepairGatePage() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-sm">Đang tải Không gian sửa đổi...</div>}>
      <RepairGateContent />
    </Suspense>
  );
}

"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/ui/shell";
import { ChatTestbed } from "@/features/chat";
import { RunGate } from "@/features/runs/RunGate";

function WorkbenchContent({ runId }: { runId: string }) {
  const caseId = useSearchParams()?.get("caseId") ?? undefined;

  return (
    <AppShell currentRunId={runId}>
      <div className="h-[calc(100vh-5.5rem)] rounded-lg overflow-hidden border" style={{ borderColor: "var(--rule)" }}>
        <ChatTestbed key={caseId ?? "first-case"} initialCaseId={caseId} runId={runId} />
      </div>
    </AppShell>
  );
}

export function WorkbenchScreen() {
  return <RunGate>{(runId) => <WorkbenchContent runId={runId} />}</RunGate>;
}

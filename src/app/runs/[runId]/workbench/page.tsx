"use client";

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppShell } from "@/ui/shell";
import { ChatTestbed } from "@/ui/chat";

function WorkbenchContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const runId = (params?.runId as string) || "run_evalplus_01";
  const caseId = searchParams?.get("caseId") || "case_spec_fault";

  return (
    <AppShell currentRunId={runId}>
      <div
        className="h-[calc(100vh-5.5rem)] rounded-lg overflow-hidden border"
        style={{ borderColor: "var(--rule)" }}
      >
        <ChatTestbed initialCaseId={caseId} runId={runId} />
      </div>
    </AppShell>
  );
}

export default function WorkbenchPage() {
  return (
    <React.Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center font-mono text-xs opacity-60"
          style={{ backgroundColor: "var(--paper-ground)", color: "var(--ink)" }}
        >
          Đang tải bàn phân xử...
        </div>
      }
    >
      <WorkbenchContent />
    </React.Suspense>
  );
}

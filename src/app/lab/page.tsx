/**
 * src/app/lab/page.tsx — Adjudicator Lab Workbench (LLM Interaction Testbed)
 *
 * Requirements:
 *   - Conversational LLM-style testbed (ChatTestbed).
 *   - Left sidebar: Dataset selection & task/test case list.
 *   - Center stream: System execution trace, UNKNOWN single-shot prompt box.
 *   - Collapsed inspection drawer: Evidence, RuleLadder R1–R6, Gate G1–G5.
 *   - Zero hardcoded HEX colors.
 */
"use client";

import React from "react";
import { ChatTestbed } from "@/ui/chat";

export default function LabPage() {
  return (
    <React.Suspense
      fallback={
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--ink-soft)",
            background: "var(--paper-ground)",
          }}
        >
          Đang tải Lab Testbed...
        </div>
      }
    >
      <ChatTestbed initialCaseId="case_spec_fault" runId="run_evalplus_01" />
    </React.Suspense>
  );
}

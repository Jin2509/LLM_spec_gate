"use client";

import React, { useState, useReducer } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/ui/shell";
import { SAMPLE_CASES } from "@/mock/fixtures/sample-cases";
import {
  VerdictChip,
  ProvenanceTag,
  RuleLadder,
  ValueCompare,
  QueryTicket,
  DocketStrip,
  CallFeed,
  SpecCodeViewer,
  type CallTraceItem,
  type CallStatus,
} from "@/ui/domain";
import {
  createInitialDocketState,
  docketReducer,
} from "@/core/docket-reducer";
import type { HumanQueryTicket } from "@/core/types";
import { aggregate } from "@/core/aggregator";

// Generate >5,000 deterministic call traces for virtualized feed demonstration
function generateMockCallFeed(): CallTraceItem[] {
  const caseKeys = Object.keys(SAMPLE_CASES);
  const items: CallTraceItem[] = [];
  const statuses: CallStatus[] = [
    "REJ",
    "ACC",
    "UNKNOWN",
    "PRE_VIOLATION",
    "CONTRACT_ERROR",
    "FLAKY",
  ];

  for (let i = 1; i <= 5200; i++) {
    const caseKey = caseKeys[(i - 1) % caseKeys.length] || "case_spec_fault";
    const status = statuses[(i - 1) % statuses.length] || "ACC";
    items.push({
      id: `call_${i}`,
      caseId: caseKey,
      callIndex: i,
      functionName: `eval_witness_fn_${(i % 12) + 1}`,
      inputPreview: `[${(i * 3) % 100}, ${(i * 7) % 100}]`,
      status,
      timestamp: "2026-10-12T10:00:00Z",
    });
  }
  return items;
}

const STATIC_FEED_ITEMS = generateMockCallFeed();

function WorkbenchContent() {
  const params = useParams();
  const runId = (params?.runId as string) || "run_evalplus_01";

  const [selectedCallId, setSelectedCallId] = useState<string>("call_1");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("case_spec_fault");
  const [evalCounter, setEvalCounter] = useState<number>(1);

  // Tickets state
  const [ticketsState, setTicketsState] = useState<Record<string, HumanQueryTicket>>(() => {
    const init: Record<string, HumanQueryTicket> = {};
    for (const [id, c] of Object.entries(SAMPLE_CASES)) {
      if (c.ticket) {
        init[id] = { ...c.ticket };
      }
    }
    return init;
  });

  // Docket strip state machine managed by pure docketReducer
  const [docketState, dispatchDocket] = useReducer(
    docketReducer,
    createInitialDocketState(selectedCaseId, 1)
  );

  const activeCase = SAMPLE_CASES[selectedCaseId] ?? SAMPLE_CASES.case_spec_fault!;
  const activeTicket = ticketsState[selectedCaseId];

  const handleSelectCall = (callId: string, caseId: string) => {
    setSelectedCallId(callId);
    setSelectedCaseId(caseId);

    const nextEvalId = evalCounter + 1;
    setEvalCounter(nextEvalId);

    dispatchDocket({
      type: "INIT_EVAL",
      evalId: nextEvalId,
      caseId,
    });
  };

  const handleAnswerTicket = async (answer: unknown) => {
    if (!activeTicket) return;
    const res = await fetch(`/api/tickets/${activeTicket.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, durationMs: 1800 }),
    });

    if (res.ok) {
      setTicketsState((prev) => ({
        ...prev,
        [selectedCaseId]: {
          ...activeTicket,
          status: "spent",
          answer,
          answeredAt: "Vừa xong",
        },
      }));

      // Re-evaluate aggregator with newly grounded human answer
      const humanGrounded = [
        ...activeCase.groundedEvidence,
        {
          id: `ev_human_${Date.now()}`,
          isGrounded: true as const,
          kind: "expected_output" as const,
          source: "human_query" as const,
          input: activeCase.witness,
          expected: answer,
        },
      ];
      aggregate(humanGrounded, activeCase.codeOutput, {
        specRejectsOutput: () => true,
      });

      // Update Docket Stage 1
      dispatchDocket({
        type: "UPDATE_STAGE",
        evalId: docketState.currentEvalId,
        stageId: 1,
        status: "done",
        summary: `Đã nạp câu trả lời người: ${String(answer)}`,
      });
    }
  };

  const handleUncertainTicket = async () => {
    if (!activeTicket) return;
    const res = await fetch(`/api/tickets/${activeTicket.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isUncertain: true }),
    });

    if (res.ok) {
      setTicketsState((prev) => ({
        ...prev,
        [selectedCaseId]: {
          ...activeTicket,
          status: "spent",
          isUncertain: true,
          answeredAt: "Vừa xong",
        },
      }));
    }
  };

  const handleDeferTicket = async () => {
    if (!activeTicket) return;
    await fetch(`/api/tickets/${activeTicket.id}/defer`, {
      method: "POST",
    });
  };

  return (
    <AppShell currentRunId={runId}>
      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-6rem)]">
        {/* Left Column: Virtualized Call Feed (col-span-3) */}
        <div className="lg:col-span-3 h-full flex flex-col border rounded overflow-hidden shadow-sm"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div
            className="p-3 border-b flex items-center justify-between text-xs font-mono select-none"
            style={{
              backgroundColor: "var(--paper-ground)",
              borderColor: "var(--rule)",
              color: "var(--ink)",
            }}
          >
            <span className="font-semibold">Feed Lời Gọi ({STATIC_FEED_ITEMS.length})</span>
            <span className="text-[10px] opacity-70">Ảo hóa 5.000+</span>
          </div>

          <div className="flex-1 overflow-hidden">
            <CallFeed
              items={STATIC_FEED_ITEMS}
              selectedCallId={selectedCallId}
              onSelectCall={handleSelectCall}
            />
          </div>
        </div>

        {/* Middle Column: Case Dossier & Docket Strip (col-span-5) */}
        <div className="lg:col-span-5 h-full overflow-y-auto space-y-4 pr-1">
          {/* Case Header & Verdict */}
          <div
            className="p-4 border rounded shadow-sm"
            style={{
              backgroundColor: "var(--paper-surface)",
              borderColor: "var(--rule)",
              borderRadius: "var(--r-card)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold" style={{ color: "var(--action)" }}>
                VỤ VIỆC: {activeCase.id}
              </span>
              <VerdictChip verdict={activeCase.adjudication.verdict} size="sm" showFullLabel />
            </div>

            <div className="text-xs font-mono space-y-1">
              <div><strong>Task:</strong> {activeCase.taskId}</div>
              <div><strong>Witness (w):</strong> {JSON.stringify(activeCase.witness)}</div>
              <div><strong>Code Output (c):</strong> {JSON.stringify(activeCase.codeOutput)}</div>
              <div className="text-[11px] pt-1" style={{ color: "var(--ink-soft)" }}>
                {activeCase.adjudication.explanation}
              </div>
            </div>
          </div>

          {/* Docket Strip 2-Phase Pipeline */}
          <div
            className="border rounded shadow-sm overflow-hidden"
            style={{
              backgroundColor: "var(--paper-surface)",
              borderColor: "var(--rule)",
              borderRadius: "var(--r-card)",
            }}
          >
            <div
              className="p-2.5 border-b text-xs font-mono font-semibold"
              style={{
                backgroundColor: "var(--paper-ground)",
                borderColor: "var(--rule)",
                color: "var(--ink)",
              }}
            >
              Dải Hồ Sơ 2 Pha (Docket Strip · evalId #{docketState.currentEvalId})
            </div>
            <div className="p-3">
              <DocketStrip
                caseId={activeCase.id}
                evalId={docketState.currentEvalId}
                stages={docketState.stages}
                onCancelStage={(stageId) =>
                  dispatchDocket({
                    type: "CANCEL_STAGE",
                    evalId: docketState.currentEvalId,
                    stageId,
                  })
                }
              />
            </div>
          </div>

          {/* Evidence List (Grounded vs Advisory) */}
          <div
            className="p-3 border rounded shadow-sm space-y-2"
            style={{
              backgroundColor: "var(--paper-surface)",
              borderColor: "var(--rule)",
              borderRadius: "var(--r-card)",
            }}
          >
            <div className="text-xs font-mono font-semibold" style={{ color: "var(--ink)" }}>
              Bằng chứng liên quan
            </div>
            <div className="space-y-1.5">
              {activeCase.groundedEvidence.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs font-mono">
                  <ProvenanceTag isGrounded={true} source={e.source} />
                  <span className="truncate max-w-[200px]" style={{ color: "var(--ink)" }}>
                    e(w) = {String(e.kind === "expected_output" ? e.expected : e.propertyId)}
                  </span>
                </div>
              ))}
              {activeCase.advisoryEvidence.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs font-mono">
                  <ProvenanceTag isGrounded={false} source={e.source} />
                  <span className="truncate max-w-[200px] opacity-70" style={{ color: "var(--ink-soft)" }}>
                    {typeof e.content === "string" ? e.content : JSON.stringify(e.content)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RuleLadder R1-R6 */}
          <div
            className="p-3 border rounded shadow-sm"
            style={{
              backgroundColor: "var(--paper-surface)",
              borderColor: "var(--rule)",
              borderRadius: "var(--r-card)",
            }}
          >
            <RuleLadder
              matchedRule={activeCase.adjudication.matchedRule}
              skippedRules={activeCase.adjudication.skippedRules}
            />
          </div>

          {/* ValueCompare ≃ */}
          <div
            className="border rounded shadow-sm overflow-hidden"
            style={{
              backgroundColor: "var(--paper-surface)",
              borderColor: "var(--rule)",
              borderRadius: "var(--r-card)",
            }}
          >
            <div
              className="p-2.5 border-b text-xs font-mono font-semibold"
              style={{
                backgroundColor: "var(--paper-ground)",
                borderColor: "var(--rule)",
                color: "var(--ink)",
              }}
            >
              So sánh Giá trị ValueCompare (≃)
            </div>
            <div className="p-3">
              <ValueCompare
                expected={activeCase.adjudication.expectedOutput ?? [2, 3, 5, 8]}
                actual={activeCase.codeOutput}
                isUniqueOutput={true}
                epsilon={1e-5}
              />
            </div>
          </div>

          {/* Query Ticket Card (floating beside docket) */}
          {activeTicket && (
            <div className="pt-2">
              <QueryTicket
                ticket={activeTicket}
                verdict={activeCase.adjudication.verdict}
                isUniqueOutput={true}
                codeOutput={activeCase.codeOutput}
                onAnswer={handleAnswerTicket}
                onUncertain={handleUncertainTicket}
                onDefer={handleDeferTicket}
              />
            </div>
          )}
        </div>

        {/* Right Column: Spec & Code Viewer (col-span-4) */}
        <div className="lg:col-span-4 h-full flex flex-col">
          <SpecCodeViewer
            monitorCode={activeCase.specP0}
            rejectionClause={activeCase.monitorRejectionClause}
            repairCandidate={activeCase.repairCandidate}
          />
        </div>
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

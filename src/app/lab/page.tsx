/**
 * src/app/lab/page.tsx — Main Adjudicator Lab Workbench
 *
 * Requirements:
 *   - Lab Notebook aesthetic: Cold paper ground, crisp ink, typography tokens.
 *   - Case selector switching between all 6 paper scenarios:
 *       SPEC_FAULT, CODE_FAULT, DUAL_FAULT, UNKNOWN_EVIDENCE, UNKNOWN_CONFLICT, UNKNOWN_GATE.
 *   - Top: Context bar with InvariantBar + DocketStrip (2-phase pipeline).
 *   - Main layout:
 *       1. Case Dossier & Evidence (Grounded vs Advisory via ProvenanceTag)
 *       2. Adjudication Engine (RuleLadder R1–R6, ValueCompare ≃)
 *       3. Interactive Single-Shot Human Query (QueryTicket wired to API) + Fail-Closed Gate
 *   - Zero hardcoded HEX colors.
 */
"use client";

import React, { useState } from "react";
import { SAMPLE_CASES } from "@/mock/fixtures/sample-cases";
import {
  VerdictChip,
  ProvenanceTag,
  CStateChip,
  GuaranteeBadge,
  InvariantBar,
  RuleLadder,
  ValueCompare,
  QueryTicket,
  DocketStrip,
  type StageInfo,
} from "@/ui/domain";
import { useTheme } from "@/features/theme/use-theme";
import { i18n } from "@/i18n/vi";
import type { HumanQueryTicket } from "@/core/types";

export default function LabPage() {
  const { theme, toggleTheme } = useTheme();
  const [selectedCaseId, setSelectedCaseId] = useState<string>("case_spec_fault");

  // Local ticket state to reflect answers interactively
  const [ticketsState, setTicketsState] = useState<Record<string, HumanQueryTicket>>(() => {
    const init: Record<string, HumanQueryTicket> = {};
    for (const [id, c] of Object.entries(SAMPLE_CASES)) {
      if (c.ticket) {
        init[id] = { ...c.ticket };
      }
    }
    return init;
  });

  const activeCase = SAMPLE_CASES[selectedCaseId] ?? SAMPLE_CASES.case_spec_fault!;
  const activeTicket = ticketsState[selectedCaseId];

  const handleAnswerTicket = async (answer: unknown) => {
    if (!activeTicket) return;
    const res = await fetch(`/api/tickets/${activeTicket.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, durationMs: 2400 }),
    });

    if (res.status === 409) {
      throw new Error(i18n.ticket.alreadySpentError);
    }

    if (!res.ok) {
      throw new Error("Lỗi khi gửi phản hồi lên server.");
    }

    const data = await res.json();
    setTicketsState((prev) => ({
      ...prev,
      [selectedCaseId]: {
        ...prev[selectedCaseId]!,
        status: "spent",
        answer: data.ticket?.answer ?? answer,
        answeredAt: new Date().toLocaleTimeString("vi-VN"),
      },
    }));
  };

  const handleUncertain = async () => {
    if (!activeTicket) return;
    setTicketsState((prev) => ({
      ...prev,
      [selectedCaseId]: {
        ...prev[selectedCaseId]!,
        status: "spent",
        isUncertain: true,
        answeredAt: new Date().toLocaleTimeString("vi-VN"),
      },
    }));
  };

  // Generate Docket stages for active case
  const docketStages: StageInfo[] = [
    {
      id: 1,
      name: i18n.docket.stage1,
      status: activeCase.groundedEvidence.length > 0 ? "done" : "done",
      summary: `${activeCase.groundedEvidence.length} grounded, ${activeCase.advisoryEvidence.length} advisory`,
    },
    {
      id: 2,
      name: i18n.docket.stage2,
      status: "done",
      summary: activeCase.adjudication.verdict === "SPEC_FAULT" ? "c = e(w)" : "c vi phạm",
    },
    {
      id: 3,
      name: i18n.docket.stage3,
      status: "done",
      summary: `Khớp ${activeCase.adjudication.matchedRule} (${activeCase.adjudication.verdict})`,
    },
    {
      id: 4,
      name: i18n.docket.stage4,
      status: "done",
      summary:
        activeCase.adjudication.verdict === "SPEC_FAULT"
          ? "Sinh P' → Gate"
          : activeCase.adjudication.verdict === "CODE_FAULT"
            ? "Chặn / Rollback"
            : "Giữ monitor",
    },
    {
      id: 5,
      name: i18n.docket.stage5,
      status: activeCase.repairCandidate ? "done" : "skipped",
      summary: activeCase.repairCandidate ? `Họ luật: ${activeCase.repairCandidate.family}` : "Không có repair",
    },
    {
      id: 6,
      name: i18n.docket.stage6,
      status: activeCase.gateResult ? (activeCase.gateResult.passed ? "done" : "error") : "skipped",
      summary: activeCase.gateResult ? activeCase.gateResult.message : "Chưa kiểm Gate",
      errorReason: activeCase.gateResult?.passed ? undefined : activeCase.gateResult?.firstFailedCheck,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--paper-ground)",
        color: "var(--ink)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {/* ── Top Navigation Bar ── */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "var(--s-3) var(--s-6)",
          background: "var(--paper-surface)",
          borderBottom: "1.5px solid var(--rule)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
            <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 700, letterSpacing: "-0.01em" }}>
              {i18n.app.title}
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                padding: "1px 6px",
                borderRadius: "var(--r-cell)",
                background: "var(--paper-ground)",
                border: "1px solid var(--rule)",
                color: "var(--ink-soft)",
              }}
            >
              v1.4 Paper Testbed
            </span>
          </div>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--ink-soft)" }}>
            {i18n.app.tagline}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
          <a
            href="/dev/kit"
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--action)",
              textDecoration: "none",
              padding: "var(--s-1) var(--s-2)",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--rule)",
            }}
          >
            Kho linh kiện (Dev Kit) →
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? i18n.theme.toggleLight : i18n.theme.toggleDark}
            style={{
              padding: "var(--s-1) var(--s-3)",
              borderRadius: "var(--r-card)",
              border: "1px solid var(--rule)",
              background: "var(--paper-ground)",
              color: "var(--ink)",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? `☀ ${i18n.theme.light}` : `◑ ${i18n.theme.dark}`}
          </button>
        </div>
      </header>

      {/* ── Context & Invariant Bar ── */}
      <div
        style={{
          padding: "var(--s-3) var(--s-6)",
          background: "var(--paper-surface)",
          borderBottom: "1px solid var(--rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--s-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
          <span style={{ fontSize: "12px", color: "var(--ink-soft)" }}>Chọn kịch bản vụ việc:</span>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            style={{
              padding: "var(--s-1) var(--s-2)",
              borderRadius: "var(--r-cell)",
              border: "1.5px solid var(--action)",
              background: "var(--paper-ground)",
              color: "var(--ink)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <option value="case_spec_fault">1. SPEC_FAULT (R2: c=e(w), P0 quá chặt)</option>
            <option value="case_code_fault">2. CODE_FAULT (R5: c vi phạm gcd)</option>
            <option value="case_dual_fault">3. DUAL_FAULT (R3: Cả code và P0 cùng sai)</option>
            <option value="case_und_evidence">4. UNKNOWN_EVIDENCE (R6: Thiếu bằng chứng)</option>
            <option value="case_und_conflict">5. UNKNOWN_CONFLICT (R1: Mâu thuẫn nguồn)</option>
            <option value="case_und_gate">6. UNKNOWN_GATE (Repair bị Gate chặn)</option>
          </select>
        </div>

        <InvariantBar
          isDisjointGB={true}
          isHeldOutLocked={true}
          ticketsSpent={Object.values(ticketsState).filter((t) => t.status === "spent").length}
          ticketsTotal={Object.keys(ticketsState).length}
          rejectedWritesCount={0}
        />
      </div>

      {/* ── Main Container ── */}
      <main style={{ padding: "var(--s-6)", maxWidth: "1400px", margin: "0 auto" }}>
        {/* 1. Docket Strip Pipeline */}
        <section style={{ marginBottom: "var(--s-6)" }}>
          <DocketStrip
            caseId={activeCase.id}
            evalId={1}
            stages={docketStages}
          />
        </section>

        {/* 2. Grid 3 Panels */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1.4fr 1.4fr",
            gap: "var(--s-6)",
            alignItems: "start",
          }}
        >
          {/* ── PANEL 1: Case Dossier & Evidence ── */}
          <div
            style={{
              background: "var(--paper-surface)",
              borderRadius: "var(--r-card)",
              border: "1px solid var(--rule)",
              padding: "var(--s-4)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-4)",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s-2)" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}>
                  HỒ SƠ TÁC VỤ: {activeCase.taskId}
                </span>
                <VerdictChip verdict={activeCase.adjudication.verdict} />
              </div>
              <h2 style={{ margin: "0 0 var(--s-2)", fontSize: "16px", fontWeight: 700 }}>
                Vụ việc: {activeCase.id}
              </h2>
              <div style={{ display: "flex", gap: "var(--s-2)", alignItems: "center" }}>
                <CStateChip
                  state={activeCase.adjudication.verdict === "SPEC_FAULT" ? "ACC" : "REJ"}
                  reason={activeCase.adjudication.explanation}
                />
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}>
                  Monitor: {activeCase.currentMonitorVersion}
                </span>
              </div>
            </div>

            {/* Witness & Output */}
            <div style={{ background: "var(--paper-ground)", padding: "var(--s-3)", borderRadius: "var(--r-cell)", border: "1px solid var(--rule)" }}>
              <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginBottom: "2px" }}>
                Witness đầu vào (w):
              </div>
              <code style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
                {JSON.stringify(activeCase.witness)}
              </code>
              <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginTop: "8px", marginBottom: "2px" }}>
                Đầu ra thực tế của code (c):
              </div>
              <code style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--action)", fontWeight: 600 }}>
                {JSON.stringify(activeCase.codeOutput)}
              </code>
            </div>

            {/* Grounded Evidence List */}
            <div>
              <h3 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {i18n.evidence.grounded} ({activeCase.groundedEvidence.length})
              </h3>
              {activeCase.groundedEvidence.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--ink-soft)", fontStyle: "italic" }}>
                  Không có bằng chứng grounded tại witness này.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                  {activeCase.groundedEvidence.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: "var(--s-2)",
                        borderRadius: "var(--r-cell)",
                        border: "1px solid var(--rule)",
                        background: "var(--paper-ground)",
                      }}
                    >
                      <ProvenanceTag isGrounded={true} source={ev.source} />
                      <div style={{ marginTop: "4px", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                        {ev.kind === "expected_output" ? `e(w) = ${JSON.stringify(ev.expected)}` : `φ: ${ev.description}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Advisory Evidence List */}
            {activeCase.advisoryEvidence.length > 0 && (
              <div>
                <h3 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {i18n.evidence.advisory} ({activeCase.advisoryEvidence.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                  {activeCase.advisoryEvidence.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: "var(--s-2)",
                        borderRadius: "var(--r-cell)",
                        border: "1px dashed var(--rule)",
                        background: "transparent",
                      }}
                    >
                      <ProvenanceTag isGrounded={false} source={ev.source} />
                      <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--ink-soft)" }}>
                        {String(ev.content)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── PANEL 2: Adjudication Engine (RuleLadder & ValueCompare) ── */}
          <div
            style={{
              background: "var(--paper-surface)",
              borderRadius: "var(--r-card)",
              border: "1px solid var(--rule)",
              padding: "var(--s-4)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-4)",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 var(--s-1)", fontSize: "15px", fontWeight: 700 }}>
                Bộ Phán Xử Tất Định (R1–R6)
              </h2>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--ink-soft)" }}>
                {activeCase.adjudication.explanation}
              </p>
            </div>

            <RuleLadder
              matchedRule={activeCase.adjudication.matchedRule}
              skippedRules={activeCase.adjudication.skippedRules}
            />

            <div>
              <h3 style={{ margin: "0 0 var(--s-2)", fontSize: "13px", fontWeight: 600 }}>
                So sánh giá trị ≃ (ValueCompare)
              </h3>
              <ValueCompare
                expected={activeCase.adjudication.expectedOutput ?? "Chưa xác định"}
                actual={activeCase.codeOutput}
                isUniqueOutput={true}
              />
            </div>
          </div>

          {/* ── PANEL 3: Human Query Ticket & Gate Pipeline ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-4)",
            }}
          >
            {/* Single-shot Ticket Section */}
            {activeTicket ? (
              <QueryTicket
                ticket={activeTicket}
                onAnswer={handleAnswerTicket}
                onUncertain={handleUncertain}
              />
            ) : (
              <div
                style={{
                  padding: "var(--s-4)",
                  background: "var(--paper-surface)",
                  borderRadius: "var(--r-card)",
                  border: "1px solid var(--rule)",
                  color: "var(--ink-soft)",
                  fontSize: "12px",
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>
                  Vé hỏi tương tác người:
                </div>
                {activeCase.adjudication.verdict === "UNKNOWN_GATE"
                  ? i18n.ticket.unknownGateForbidden
                  : "Không áp dụng vé hỏi cho vụ việc có verdict xác định."}
              </div>
            )}

            {/* Repair & Gate Status */}
            <div
              style={{
                background: "var(--paper-surface)",
                borderRadius: "var(--r-card)",
                border: "1px solid var(--rule)",
                padding: "var(--s-4)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s-2)" }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>
                  {i18n.repairAndGate.title}
                </h3>
                {activeCase.gateResult && (
                  <GuaranteeBadge
                    id="S1"
                    nature={activeCase.gateResult.guaranteeNature}
                    claimLabel="Gate"
                  />
                )}
              </div>

              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--action)", marginBottom: "var(--s-3)" }}>
                {i18n.repairAndGate.grammarForm}
              </div>

              {activeCase.repairCandidate ? (
                <div style={{ background: "var(--paper-ground)", padding: "var(--s-3)", borderRadius: "var(--r-cell)", border: "1px solid var(--rule)", marginBottom: "var(--s-3)" }}>
                  <div style={{ fontSize: "11px", color: "var(--ink-soft)" }}>
                    Họ luật: <strong>{activeCase.repairCandidate.family}</strong> · Hạng: #{activeCase.repairCandidate.rank}
                  </div>
                  <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", marginTop: "4px", color: "var(--ink)" }}>
                    Vùng g: <code>{activeCase.repairCandidate.guard}</code>
                  </div>
                  <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", marginTop: "2px", color: "var(--v-acc)" }}>
                    Ràng buộc mới C&apos;: <code>{activeCase.repairCandidate.replacement}</code>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "12px", color: "var(--ink-soft)", marginBottom: "var(--s-3)", fontStyle: "italic" }}>
                  Không có ứng viên repair cho vụ việc này.
                </div>
              )}

              {/* 5 Gate Checks breakdown */}
              {activeCase.gateResult && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink)", marginBottom: "var(--s-2)" }}>
                    {i18n.repairAndGate.gateChecks}:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                    <div style={{ color: activeCase.gateResult.checks.g1_accept_grounded ? "var(--v-acc)" : "var(--v-code)" }}>
                      {activeCase.gateResult.checks.g1_accept_grounded ? "✓" : "✗"} {i18n.repairAndGate.g1}
                    </div>
                    <div style={{ color: activeCase.gateResult.checks.g2_reject_b ? "var(--v-acc)" : "var(--v-code)" }}>
                      {activeCase.gateResult.checks.g2_reject_b ? "✓" : "✗"} {i18n.repairAndGate.g2}
                    </div>
                    <div style={{ color: activeCase.gateResult.checks.g3_locality ? "var(--v-acc)" : "var(--v-code)" }}>
                      {activeCase.gateResult.checks.g3_locality ? "✓" : "✗"} {i18n.repairAndGate.g3}
                    </div>
                    <div style={{ color: activeCase.gateResult.checks.g4_preserve_g_a2 ? "var(--v-acc)" : "var(--v-code)" }}>
                      {activeCase.gateResult.checks.g4_preserve_g_a2 ? "✓" : "✗"} {i18n.repairAndGate.g4}
                    </div>
                    <div style={{ color: activeCase.gateResult.checks.g5_in_repair_space_and_bsynth ? "var(--v-acc)" : "var(--v-code)" }}>
                      {activeCase.gateResult.checks.g5_in_repair_space_and_bsynth ? "✓" : "✗"} {i18n.repairAndGate.g5}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

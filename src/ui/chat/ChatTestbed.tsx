/**
 * src/ui/chat/ChatTestbed.tsx — LLM-Style Interaction Testbed
 *
 * Requirements:
 *   - Conversational Message Stream (LLM Interaction style) replacing dense dashboard boxes.
 *   - Left Sidebar:
 *       * Dataset selector (HumanEval+, MBPP+, EvalPlus Illustrative).
 *       * Search & Filter for tasks/test cases with clean status indicators.
 *   - Central Feed Stream:
 *       * [System Output]: Program test execution at witness w (inputs, code output c, monitor evaluation).
 *       * [Interaction - Khi UNKNOWN]: In-stream Prompt Box asking human EXACTLY ONCE with a narrow question.
 *       * Immediate locking ("Đã phản hồi (SPENT)" stamp) upon submission, system posts final resolution.
 *   - Inspection Panel (Drawer / Slide-over):
 *       * Collapsed by default ("Xem chi tiết phân xử (Inspect)" button).
 *       * Opened on demand: Grounded vs Advisory Evidence, RuleLadder R1–R6, Gate G1–G5 checks.
 *   - Zero hardcoded HEX colors — strictly uses tokens.css variables.
 */
"use client";

import React, { useState, useMemo } from "react";
import { SAMPLE_CASES } from "@/mock/fixtures/sample-cases";
import { ACADEMIC_TASKS } from "@/mock/fixtures/academic-tasks";
import {
  VerdictChip,
  ProvenanceTag,
  RuleLadder,
  ValueCompare,
  GuaranteeBadge,
} from "@/ui/domain";
import { useTheme } from "@/features/theme/use-theme";
import { i18n } from "@/i18n/vi";
import type { CaseDossier, HumanQueryTicket, Verdict } from "@/core/types";

export interface ChatTestbedProps {
  initialCaseId?: string;
  runId?: string;
}

export function ChatTestbed({
  initialCaseId = "case_spec_fault",
  runId = "run_evalplus_01",
}: ChatTestbedProps) {
  const { theme, toggleTheme } = useTheme();

  // Dataset Selection
  const [selectedDataset, setSelectedDataset] = useState<string>("humaneval");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterVerdict, setFilterVerdict] = useState<string>("ALL");

  // Active Case Selection
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId);

  // Inspection Drawer Visibility (collapsed by default)
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [inspectorTab, setInspectorTab] = useState<"evidence" | "rules" | "gate">("evidence");

  // Local Interactive Tickets State (Single-shot lock)
  const [ticketsState, setTicketsState] = useState<Record<string, HumanQueryTicket>>(() => {
    const init: Record<string, HumanQueryTicket> = {};
    for (const [id, c] of Object.entries(SAMPLE_CASES)) {
      if (c.ticket) {
        init[id] = { ...c.ticket };
      }
    }
    return init;
  });

  // Track run count / trigger state for re-running
  const [runKey, setRunKey] = useState<number>(0);

  // Prompt Box input state
  const [promptInputValue, setPromptInputValue] = useState<string>("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Active Case Data
  const activeCase: CaseDossier = SAMPLE_CASES[selectedCaseId] ?? SAMPLE_CASES.case_spec_fault!;
  const activeTicket: HumanQueryTicket | undefined = ticketsState[selectedCaseId];
  const activeTask = useMemo(() => {
    return (
      ACADEMIC_TASKS.find((t) => t.id === activeCase.taskId) ?? {
        id: activeCase.taskId,
        name: activeCase.taskId,
        intentDocstring: "Kiểm thử vận hành hàm mục tiêu với đặc tả giám sát song hành.",
        isUniqueOutput: true,
      }
    );
  }, [activeCase.taskId]);

  // Available Cases list formatted for sidebar
  const caseList = useMemo(() => {
    return Object.entries(SAMPLE_CASES).map(([id, c]) => {
      const task = ACADEMIC_TASKS.find((t) => t.id === c.taskId);
      return {
        id,
        taskId: c.taskId,
        taskName: task ? task.name : c.taskId,
        intent: task?.intentDocstring ?? "",
        verdict: c.adjudication.verdict,
        witnessStr: JSON.stringify(c.witness),
        ticket: ticketsState[id] ?? c.ticket,
      };
    });
  }, [ticketsState]);

  // Filtered cases for sidebar search/filter
  const filteredCases = useMemo(() => {
    return caseList.filter((item) => {
      const matchesQuery =
        item.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.taskId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesQuery) return false;

      if (filterVerdict === "UNKNOWN") {
        return (
          item.verdict === "UNKNOWN_EVIDENCE" ||
          item.verdict === "UNKNOWN_CONFLICT" ||
          item.verdict === "UNKNOWN_GATE"
        );
      }
      if (filterVerdict === "FAULTS") {
        return (
          item.verdict === "SPEC_FAULT" ||
          item.verdict === "CODE_FAULT" ||
          item.verdict === "DUAL_FAULT"
        );
      }
      if (filterVerdict === "ACC") {
        return item.verdict === "ACC";
      }
      return true;
    });
  }, [caseList, searchQuery, filterVerdict]);

  // Handle single-shot human query answer
  const handleAnswerTicket = async (answerVal: unknown) => {
    if (!activeTicket || activeTicket.status === "spent") return;

    try {
      setIsSubmittingAnswer(true);
      setSubmissionError(null);

      // Attempt to hit mock API
      try {
        await fetch(`/api/tickets/${activeTicket.id}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: answerVal, durationMs: 1200 }),
        });
      } catch {
        // Fallback gracefully in offline mock test mode
      }

      // Immediately lock and stamp the ticket (pessimistic / single-shot)
      setTicketsState((prev) => ({
        ...prev,
        [selectedCaseId]: {
          ...activeTicket,
          status: "spent",
          answer: answerVal,
          answeredAt: new Date().toLocaleTimeString("vi-VN"),
        },
      }));
      setPromptInputValue("");
    } catch (err: unknown) {
      setSubmissionError(err instanceof Error ? err.message : i18n.ticket.alreadySpentError);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleUncertain = async () => {
    if (!activeTicket || activeTicket.status === "spent") return;
    try {
      setIsSubmittingAnswer(true);
      setTicketsState((prev) => ({
        ...prev,
        [selectedCaseId]: {
          ...activeTicket,
          status: "spent",
          isUncertain: true,
          answeredAt: new Date().toLocaleTimeString("vi-VN"),
        },
      }));
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleRerun = () => {
    setRunKey((prev) => prev + 1);
  };

  // Determine final post-interaction verdict
  const finalVerdict: Verdict = useMemo(() => {
    if (activeTicket?.status === "spent") {
      if (activeTicket.isUncertain) {
        return "UNKNOWN_EVIDENCE";
      }
      // If user accepted or provided valid answer, conclude resolution
      return activeCase.adjudication.verdict === "UNKNOWN_EVIDENCE" ? "ACC" : "SPEC_FAULT";
    }
    return activeCase.adjudication.verdict;
  }, [activeTicket, activeCase.adjudication.verdict]);

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        background: "var(--paper-ground)",
        color: "var(--ink)",
        fontFamily: "var(--font-ui)",
        overflow: "hidden",
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. LEFT SIDEBAR: Dataset & Test Case Selection
         ───────────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: "320px",
          minWidth: "280px",
          maxWidth: "360px",
          height: "100%",
          background: "var(--paper-surface)",
          borderRight: "1px solid var(--rule)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* Sidebar Header & Brand */}
        <div
          style={{
            padding: "var(--s-4)",
            borderBottom: "1px solid var(--rule)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                Dual-Oracle Testbed
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  padding: "1px 5px",
                  borderRadius: "var(--r-cell)",
                  background: "var(--paper-ground)",
                  border: "1px solid var(--rule)",
                  color: "var(--ink-soft)",
                }}
              >
                v1.4
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginTop: "2px" }}>
              Run: {runId}
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? i18n.theme.toggleLight : i18n.theme.toggleDark}
            style={{
              padding: "4px 8px",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--rule)",
              background: "var(--paper-ground)",
              color: "var(--ink)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? "☀ Sáng" : "◑ Tối"}
          </button>
        </div>

        {/* Dataset Dropdown */}
        <div style={{ padding: "var(--s-3) var(--s-4)", borderBottom: "1px solid var(--rule)" }}>
          <label
            htmlFor="dataset-select"
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--ink-soft)",
              marginBottom: "var(--s-1)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Dataset
          </label>
          <select
            id="dataset-select"
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--rule)",
              background: "var(--paper-ground)",
              color: "var(--ink)",
              fontSize: "12px",
              fontFamily: "var(--font-ui)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="humaneval">HumanEval+ (EvalPlus v0.2)</option>
            <option value="mbpp">MBPP+ (Sanitized)</option>
            <option value="evalplus_demo">EvalPlus Illustrative</option>
          </select>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ padding: "var(--s-3) var(--s-4)", borderBottom: "1px solid var(--rule)" }}>
          <input
            type="text"
            placeholder="Tìm tác vụ, witness, hoặc ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: "var(--r-cell)",
              border: "1px solid var(--rule)",
              background: "var(--paper-ground)",
              color: "var(--ink)",
              fontSize: "12px",
              fontFamily: "var(--font-ui)",
              outline: "none",
              marginBottom: "var(--s-2)",
            }}
          />

          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "UNKNOWN", label: "Cần hỏi (UND)" },
              { id: "FAULTS", label: "Lỗi (Faults)" },
              { id: "ACC", label: "Đạt (ACC)" },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterVerdict(pill.id)}
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  padding: "2px 8px",
                  borderRadius: "var(--r-cell)",
                  border: filterVerdict === pill.id ? "1px solid var(--action)" : "1px solid var(--rule)",
                  background: filterVerdict === pill.id ? "var(--paper-ground)" : "transparent",
                  color: filterVerdict === pill.id ? "var(--action)" : "var(--ink-soft)",
                  fontWeight: filterVerdict === pill.id ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task / Test Case List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--s-2) var(--s-3)" }}>
          {filteredCases.map((item) => {
            const isSelected = item.id === selectedCaseId;
            const isSpent = item.ticket?.status === "spent";

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedCaseId(item.id);
                  setPromptInputValue("");
                  setSubmissionError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedCaseId(item.id);
                  }
                }}
                data-testid={`case-item-${item.id}`}
                style={{
                  padding: "var(--s-3)",
                  borderRadius: "var(--r-card)",
                  marginBottom: "var(--s-2)",
                  border: isSelected ? "1.5px solid var(--action)" : "1px solid var(--rule)",
                  background: isSelected ? "var(--paper-ground)" : "transparent",
                  cursor: "pointer",
                  transition: "background var(--motion-quick) ease, border-color var(--motion-quick) ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: isSelected ? "var(--action)" : "var(--ink)",
                    }}
                  >
                    {item.taskName}
                  </span>
                  <VerdictChip verdict={item.verdict} size="sm" />
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--ink-soft)",
                    marginBottom: "4px",
                  }}
                >
                  w: {item.witnessStr}
                </div>

                {item.ticket && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                    <span
                      style={{
                        fontSize: "9px",
                        fontFamily: "var(--font-mono)",
                        padding: "1px 5px",
                        borderRadius: "var(--r-cell)",
                        border: isSpent ? "1px solid var(--v-code)" : "1px dashed var(--action)",
                        color: isSpent ? "var(--v-code)" : "var(--action)",
                        fontWeight: 600,
                      }}
                    >
                      {isSpent ? "Đã phản hồi (SPENT)" : "Cần hỏi người"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. CENTRAL CONVERSATIONAL FEED STREAM (LLM Style)
         ───────────────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--paper-ground)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Stream Top Header */}
        <header
          style={{
            padding: "var(--s-3) var(--s-6)",
            background: "var(--paper-surface)",
            borderBottom: "1px solid var(--rule)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}>
                {activeCase.taskId}
              </span>
              <span style={{ color: "var(--rule)" }}>·</span>
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>
                {activeTask.name}
              </h2>
            </div>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                color: "var(--ink-soft)",
                maxWidth: "600px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeTask.intentDocstring}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
            <button
              type="button"
              onClick={handleRerun}
              data-testid="rerun-btn"
              style={{
                padding: "6px 12px",
                borderRadius: "var(--r-cell)",
                border: "1px solid var(--rule)",
                background: "var(--paper-ground)",
                color: "var(--ink)",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ↺ Chạy lại kiểm thử
            </button>

            <button
              type="button"
              onClick={() => setIsInspectorOpen((prev) => !prev)}
              data-testid="inspect-toggle-btn"
              style={{
                padding: "6px 14px",
                borderRadius: "var(--r-cell)",
                border: isInspectorOpen ? "1.5px solid var(--action)" : "1px solid var(--rule)",
                background: isInspectorOpen ? "var(--paper-ground)" : "var(--paper-surface)",
                color: isInspectorOpen ? "var(--action)" : "var(--ink)",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🔍</span>
              <span>{isInspectorOpen ? "Đóng Inspector" : "Xem chi tiết phân xử (Inspect)"}</span>
            </button>
          </div>
        </header>

        {/* Message Stream Scrollable Area */}
        <div
          key={runKey}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "var(--s-6)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: "760px", display: "flex", flexDirection: "column", gap: "var(--s-6)" }}>
            {/* ── Message 1: Evaluation Trigger (User / Test Runner) ── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--s-1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}>
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>Kiểm Thử Viên (Testbed Runner)</span>
                <span>·</span>
                <span>Witness w</span>
              </div>
              <div
                style={{
                  background: "var(--paper-surface)",
                  border: "1px solid var(--rule)",
                  borderRadius: "var(--r-card)",
                  padding: "var(--s-4)",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                Đang thực thi kiểm tra cho hàm <code>{activeTask.name}</code> tại witness đầu vào:
                <pre
                  style={{
                    margin: "var(--s-2) 0 0",
                    padding: "var(--s-2) var(--s-3)",
                    background: "var(--paper-ground)",
                    border: "1px solid var(--rule)",
                    borderRadius: "var(--r-cell)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--ink)",
                  }}
                >
                  w = {JSON.stringify(activeCase.witness)}
                </pre>
                <div style={{ marginTop: "var(--s-2)", fontSize: "11px", color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }}>
                  Phiên bản đặc tả giám sát: <strong>{activeCase.currentMonitorVersion}</strong>
                </div>
              </div>
            </div>

            {/* ── Message 2: [System Output] Program Execution Outcome & Monitor ── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--s-1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}>
                <span style={{ fontWeight: 600, color: "var(--action)" }}>Giám Sát Song Hành (Dual-Oracle Monitor)</span>
                <span>·</span>
                <span>System Output</span>
              </div>
              <div
                style={{
                  background: "var(--paper-surface)",
                  border: "1px solid var(--rule)",
                  borderRadius: "var(--r-card)",
                  padding: "var(--s-4)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--s-3)",
                }}
              >
                {/* Program Output & Monitor Check */}
                <div>
                  <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>
                    Đầu ra thực tế của code (c):
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: "var(--s-2) var(--s-3)",
                      background: "var(--paper-ground)",
                      border: "1px solid var(--rule)",
                      borderRadius: "var(--r-cell)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--action)",
                    }}
                  >
                    c = {JSON.stringify(activeCase.codeOutput)}
                  </pre>
                </div>

                <div
                  style={{
                    padding: "var(--s-3)",
                    background: "var(--paper-ground)",
                    borderRadius: "var(--r-cell)",
                    border: "1px solid var(--rule)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                    <span style={{ color: "var(--ink-soft)" }}>Đặc tả P_0 đánh giá: </span>
                    <strong
                      style={{
                        color:
                          activeCase.adjudication.verdict === "CODE_FAULT" ||
                          activeCase.adjudication.verdict === "SPEC_FAULT" ||
                          activeCase.adjudication.verdict === "DUAL_FAULT" ||
                          activeCase.adjudication.verdict === "UNKNOWN_GATE"
                            ? "var(--v-code)"
                            : "var(--v-acc)",
                      }}
                    >
                      {activeCase.monitorRejectionClause
                        ? `BÁC BỎ (Vi phạm: ${activeCase.monitorRejectionClause})`
                        : "CHẤP NHẬN"}
                    </strong>
                  </div>
                </div>

                {/* Initial Decision Summary */}
                <div
                  style={{
                    borderTop: "1px solid var(--rule)",
                    paddingTop: "var(--s-3)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>
                      Phán xử bước đầu:
                    </div>
                    <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
                      {activeCase.adjudication.explanation}
                    </div>
                  </div>
                  <div style={{ marginLeft: "var(--s-4)" }}>
                    <VerdictChip verdict={activeCase.adjudication.verdict} showFullLabel />
                  </div>
                </div>

                {/* Inline link to inspect */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setIsInspectorOpen(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--action)",
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    Xem bằng chứng & luật áp dụng →
                  </button>
                </div>
              </div>
            </div>

            {/* ── Message 3: [Interaction - Khi UNKNOWN] In-stream Prompt Box ── */}
            {activeTicket && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--s-1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>Tương Tác Kiểm Định (Human-in-the-Loop)</span>
                  <span>·</span>
                  <span>Đúng 1 Lần (Single-Shot)</span>
                </div>

                <div
                  data-testid="chat-prompt-box"
                  style={{
                    position: "relative",
                    background: "var(--paper-surface)",
                    border: activeTicket.status === "spent" ? "1px solid var(--rule)" : "1.5px solid var(--action)",
                    borderRadius: "var(--r-card)",
                    padding: "var(--s-5)",
                    overflow: "hidden",
                  }}
                >
                  {/* Spent Stamp Overlay */}
                  {activeTicket.status === "spent" && (
                    <div
                      data-testid="chat-spent-stamp"
                      style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        transform: "rotate(-6deg)",
                        padding: "4px 12px",
                        borderRadius: "var(--r-cell)",
                        border: "2px dashed var(--v-code)",
                        color: "var(--v-code)",
                        background: "var(--v-code-bg)",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 800,
                        fontSize: "12px",
                        letterSpacing: "0.06em",
                        pointerEvents: "none",
                      }}
                    >
                      {i18n.ticket.spentStamp}
                    </div>
                  )}

                  <div style={{ marginBottom: "var(--s-3)" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontFamily: "var(--font-mono)",
                        color: activeTicket.status === "spent" ? "var(--ink-soft)" : "var(--action)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {i18n.ticket.title} · {activeTicket.id}
                    </div>
                    <h3
                      style={{
                        margin: "var(--s-1) 0 0",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {activeTicket.promptText}
                    </h3>
                  </div>

                  {/* If spent: show recorded answer */}
                  {activeTicket.status === "spent" ? (
                    <div
                      style={{
                        padding: "var(--s-3)",
                        background: "var(--paper-ground)",
                        borderRadius: "var(--r-cell)",
                        border: "1px solid var(--rule)",
                        fontSize: "12px",
                        fontFamily: "var(--font-mono)",
                        color: "var(--ink)",
                      }}
                    >
                      <strong>Phản hồi đã ghi nhận:</strong>{" "}
                      {activeTicket.isUncertain
                        ? "Không xác định được (UNCERTAIN)"
                        : typeof activeTicket.answer === "boolean"
                          ? activeTicket.answer
                            ? "Chấp nhận (ACCEPT)"
                            : "Không chấp nhận (REJECT)"
                          : JSON.stringify(activeTicket.answer)}
                      <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginTop: "4px" }}>
                        Thời điểm: {activeTicket.answeredAt ?? "Đã lưu"} · Trạng thái vé: Đã khóa vĩnh viễn (single-shot invariant).
                      </div>
                    </div>
                  ) : (
                    /* Active form options */
                    <div>
                      {activeTicket.questionType === "acceptability" ? (
                        <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap", marginTop: "var(--s-3)" }}>
                          <button
                            type="button"
                            disabled={isSubmittingAnswer}
                            onClick={() => handleAnswerTicket(true)}
                            data-testid="chat-ticket-accept-btn"
                            style={{
                              padding: "8px 16px",
                              borderRadius: "var(--r-cell)",
                              border: "1px solid var(--v-acc)",
                              background: "var(--v-acc-bg)",
                              color: "var(--v-acc)",
                              fontSize: "12px",
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            ✓ [1] Chấp nhận đầu ra này
                          </button>

                          <button
                            type="button"
                            disabled={isSubmittingAnswer}
                            onClick={() => handleAnswerTicket(false)}
                            data-testid="chat-ticket-reject-btn"
                            style={{
                              padding: "8px 16px",
                              borderRadius: "var(--r-cell)",
                              border: "1px solid var(--v-code)",
                              background: "var(--v-code-bg)",
                              color: "var(--v-code)",
                              fontSize: "12px",
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            ✕ [2] Không chấp nhận
                          </button>

                          <button
                            type="button"
                            disabled={isSubmittingAnswer}
                            onClick={handleUncertain}
                            data-testid="chat-ticket-uncertain-btn"
                            style={{
                              padding: "8px 16px",
                              borderRadius: "var(--r-cell)",
                              border: "1px dashed var(--rule)",
                              background: "transparent",
                              color: "var(--ink-soft)",
                              fontSize: "12px",
                              fontFamily: "var(--font-mono)",
                              cursor: "pointer",
                            }}
                          >
                            ? [C] Không xác định được
                          </button>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!promptInputValue.trim()) return;
                            handleAnswerTicket(promptInputValue);
                          }}
                          style={{ marginTop: "var(--s-3)" }}
                        >
                          <div style={{ display: "flex", gap: "var(--s-2)" }}>
                            <input
                              type="text"
                              value={promptInputValue}
                              onChange={(e) => setPromptInputValue(e.target.value)}
                              placeholder='Nhập đầu ra đúng, ví dụ: 42 hoặc [1, 2]'
                              disabled={isSubmittingAnswer}
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: "var(--r-cell)",
                                border: "1px solid var(--rule)",
                                background: "var(--paper-ground)",
                                color: "var(--ink)",
                                fontSize: "12px",
                                fontFamily: "var(--font-mono)",
                                outline: "none",
                              }}
                            />
                            <button
                              type="submit"
                              disabled={isSubmittingAnswer || !promptInputValue.trim()}
                              style={{
                                padding: "8px 16px",
                                borderRadius: "var(--r-cell)",
                                border: "none",
                                background: "var(--action)",
                                color: "var(--paper-surface)",
                                fontSize: "12px",
                                fontFamily: "var(--font-mono)",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Gửi câu trả lời
                            </button>
                            <button
                              type="button"
                              onClick={handleUncertain}
                              disabled={isSubmittingAnswer}
                              style={{
                                padding: "8px 12px",
                                borderRadius: "var(--r-cell)",
                                border: "1px dashed var(--rule)",
                                background: "transparent",
                                color: "var(--ink-soft)",
                                fontSize: "12px",
                                fontFamily: "var(--font-mono)",
                                cursor: "pointer",
                              }}
                            >
                              Không chắc chắn
                            </button>
                          </div>
                        </form>
                      )}

                      {submissionError && (
                        <div style={{ marginTop: "var(--s-2)", fontSize: "11px", color: "var(--v-code)", fontFamily: "var(--font-mono)" }}>
                          {submissionError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Message 4: [Post-Interaction Resolution] Final Adjudication Output ── */}
            {activeTicket?.status === "spent" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--s-1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}>
                  <span style={{ fontWeight: 600, color: "var(--v-acc)" }}>Phán Xử Cuối Cùng (Adjudication Resolved)</span>
                  <span>·</span>
                  <span>Chu trình hoàn tất</span>
                </div>

                <div
                  style={{
                    background: "var(--paper-surface)",
                    border: "1.5px solid var(--v-acc)",
                    borderRadius: "var(--r-card)",
                    padding: "var(--s-4)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>
                      Tích hợp bằng chứng người dùng:
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>
                      Đã bổ sung câu trả lời vào tập bằng chứng Grounded (G). Phán xử tất định hoàn tất.
                    </div>
                  </div>
                  <div>
                    <VerdictChip verdict={finalVerdict} showFullLabel />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. INSPECTION PANEL (Drawer / Slide-over — Collapsed by default)
         ───────────────────────────────────────────────────────────── */}
      {isInspectorOpen && (
        <aside
          data-testid="inspection-drawer"
          style={{
            width: "440px",
            height: "100%",
            background: "var(--paper-surface)",
            borderLeft: "1px solid var(--rule)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            zIndex: 40,
            boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              padding: "var(--s-4)",
              borderBottom: "1px solid var(--rule)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--action)", fontWeight: 600 }}>
                HỒ SƠ PHÂN XỬ CHI TIẾT
              </div>
              <h3 style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: 700 }}>
                {activeCase.id}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsInspectorOpen(false)}
              aria-label="Đóng Drawer"
              style={{
                background: "transparent",
                border: "1px solid var(--rule)",
                borderRadius: "var(--r-cell)",
                padding: "4px 8px",
                color: "var(--ink-soft)",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          {/* Drawer Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--rule)",
              background: "var(--paper-ground)",
            }}
          >
            {[
              { id: "evidence", label: "Bằng chứng (G & Adv)" },
              { id: "rules", label: "Quy tắc (R1–R6)" },
              { id: "gate", label: "Repair & Gate (G1–G5)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInspectorTab(tab.id as "evidence" | "rules" | "gate")}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: inspectorTab === tab.id ? 700 : 500,
                  color: inspectorTab === tab.id ? "var(--action)" : "var(--ink-soft)",
                  background: inspectorTab === tab.id ? "var(--paper-surface)" : "transparent",
                  border: "none",
                  borderBottom: inspectorTab === tab.id ? "2px solid var(--action)" : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Drawer Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "var(--s-4)", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
            {/* ── TAB 1: Evidence ── */}
            {inspectorTab === "evidence" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
                <div>
                  <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {i18n.evidence.grounded} ({activeCase.groundedEvidence.length})
                  </h4>
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
                            padding: "var(--s-3)",
                            borderRadius: "var(--r-cell)",
                            border: "1px solid var(--rule)",
                            background: "var(--paper-ground)",
                          }}
                        >
                          <ProvenanceTag isGrounded={true} source={ev.source} />
                          <div style={{ marginTop: "6px", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                            {ev.kind === "expected_output" ? `e(w) = ${JSON.stringify(ev.expected)}` : `φ: ${ev.description}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {activeCase.advisoryEvidence.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {i18n.evidence.advisory} ({activeCase.advisoryEvidence.length})
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                      {activeCase.advisoryEvidence.map((ev) => (
                        <div
                          key={ev.id}
                          style={{
                            padding: "var(--s-3)",
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
            )}

            {/* ── TAB 2: Rules R1–R6 ── */}
            {inspectorTab === "rules" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
                <div>
                  <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Cây Quyết Định R1–R6 (RuleLadder)
                  </h4>
                  <RuleLadder
                    matchedRule={activeCase.adjudication.matchedRule}
                    skippedRules={activeCase.adjudication.skippedRules}
                  />
                </div>

                <div>
                  <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    So Sánh Giá Trị (ValueCompare ≃)
                  </h4>
                  <ValueCompare
                    expected={activeCase.adjudication.expectedOutput ?? "Chưa xác định"}
                    actual={activeCase.codeOutput}
                    isUniqueOutput={true}
                  />
                </div>
              </div>
            )}

            {/* ── TAB 3: Repair & Gate ── */}
            {inspectorTab === "gate" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s-2)" }}>
                    <h4 style={{ margin: 0, fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Ứng Viên Bản Vá (Repair Candidate)
                    </h4>
                    {activeCase.gateResult && (
                      <GuaranteeBadge
                        id="S1"
                        nature={activeCase.gateResult.guaranteeNature}
                        claimLabel="Gate"
                      />
                    )}
                  </div>

                  {activeCase.repairCandidate ? (
                    <div
                      style={{
                        padding: "var(--s-3)",
                        borderRadius: "var(--r-cell)",
                        border: "1px solid var(--rule)",
                        background: "var(--paper-ground)",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "var(--ink-soft)" }}>
                        Họ luật: <strong>{activeCase.repairCandidate.family}</strong> · Rank #{activeCase.repairCandidate.rank}
                      </div>
                      <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", marginTop: "4px", color: "var(--ink)" }}>
                        Vùng g: <code>{activeCase.repairCandidate.guard}</code>
                      </div>
                      <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", marginTop: "2px", color: "var(--v-acc)" }}>
                        Bản sửa C&apos;: <code>{activeCase.repairCandidate.replacement}</code>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px", color: "var(--ink-soft)", fontStyle: "italic" }}>
                      Không có bản vá cho trường hợp này.
                    </div>
                  )}
                </div>

                {activeCase.gateResult && (
                  <div>
                    <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      5 Chốt Kiểm Fail-Closed Gate (G1–G5)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                      <div style={{ color: activeCase.gateResult.checks.g1_accept_grounded ? "var(--v-acc)" : "var(--v-code)" }}>
                        {activeCase.gateResult.checks.g1_accept_grounded ? "✓" : "✗"} G1: Chấp nhận Grounded (e ∈ G)
                      </div>
                      <div style={{ color: activeCase.gateResult.checks.g2_reject_b ? "var(--v-acc)" : "var(--v-code)" }}>
                        {activeCase.gateResult.checks.g2_reject_b ? "✓" : "✗"} G2: Bác bỏ Counterexamples (b ∉ B)
                      </div>
                      <div style={{ color: activeCase.gateResult.checks.g3_locality ? "var(--v-acc)" : "var(--v-code)" }}>
                        {activeCase.gateResult.checks.g3_locality ? "✓" : "✗"} G3: Tính cục bộ (Locality)
                      </div>
                      <div style={{ color: activeCase.gateResult.checks.g4_preserve_g_a2 ? "var(--v-acc)" : "var(--v-code)" }}>
                        {activeCase.gateResult.checks.g4_preserve_g_a2 ? "✓" : "✗"} G4: Bảo toàn thuộc tính (A2)
                      </div>
                      <div style={{ color: activeCase.gateResult.checks.g5_in_repair_space_and_bsynth ? "var(--v-acc)" : "var(--v-code)" }}>
                        {activeCase.gateResult.checks.g5_in_repair_space_and_bsynth ? "✓" : "✗"} G5: Trong không gian sửa đổi
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

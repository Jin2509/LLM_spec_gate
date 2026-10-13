/**
 * src/ui/chat/ChatTestbed.tsx — Dual-Oracle Monitor Testbed (LLM-Style Interaction)
 *
 * Requirements:
 *   - Layout: height: 100dvh; overflow: hidden; Full viewport height.
 *   - Sidebar: Sticky header, independent scrollable list, responsive drawer under 768px.
 *   - Main area: Sticky top header, MessageList (flex: 1; overflow-y: auto), anchored Composer at bottom.
 *   - Real-time NDJSON / stepper timeline streaming on send / rerun.
 *   - Single-shot human query protection preserved.
 *   - Inspection drawer preserved.
 *   - Zero hardcoded HEX colors.
 */
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  RefreshCw,
  PanelRight,
  Search,
  ChevronDown,
  X,
  Sun,
  Moon,
  Menu,
} from "lucide-react";
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
import { MessageList, type ChatMessageItem } from "./MessageList";
import { Composer } from "./Composer";
import { useDualOracleStream } from "./useDualOracleStream";
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

  const [selectedDataset, setSelectedDataset] = useState<string>("humaneval");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterVerdict, setFilterVerdict] = useState<string>("ALL");
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [inspectorTab, setInspectorTab] = useState<"evidence" | "rules" | "gate">("evidence");
  const [composerInput, setComposerInput] = useState<string>("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

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

  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

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

  // Messages per task history map
  const [taskHistory, setTaskHistory] = useState<Record<string, ChatMessageItem[]>>(() => {
    const map: Record<string, ChatMessageItem[]> = {};
    for (const [id, c] of Object.entries(SAMPLE_CASES)) {
      const isUnknown =
        c.adjudication.verdict === "UNKNOWN_EVIDENCE" ||
        c.adjudication.verdict === "UNKNOWN_CONFLICT";
      const t = ACADEMIC_TASKS.find((item) => item.id === c.taskId);
      const name = t ? t.name : c.taskId;

      map[id] = [
        {
          id: `init_runner_${id}`,
          role: "user",
          text: `Kiểm thử tác vụ ${name} (${c.taskId}) với witness w = ${JSON.stringify(c.witness)}.`,
          timestamp: "09:00",
        },
        {
          id: `init_resp_${id}`,
          role: "assistant",
          text: `Đã thực thi kiểm thử cho hàm **${name}** tại witness: \`w = ${JSON.stringify(
            c.witness
          )}\`.\n\n**Đầu ra thực tế (c):** \`${JSON.stringify(c.codeOutput)}\`\n\n**Đặc tả P_0:** ${
            c.monitorRejectionClause
              ? `BÁC BỎ (Vi phạm mệnh đề: \`${c.monitorRejectionClause}\`)`
              : "CHẤP NHẬN"
          }\n\n**Phán xử:** **${c.adjudication.verdict}** (${c.adjudication.matchedRule})\n\n${
            c.adjudication.explanation
          }`,
          timestamp: "09:00",
          hasDetails: true,
          isTicketPrompt: isUnknown,
          verdict: c.adjudication.verdict,
        },
      ];
    }
    return map;
  });

  const messages = useMemo(() => {
    return taskHistory[selectedCaseId] ?? [];
  }, [taskHistory, selectedCaseId]);

  // Hook for streaming execution
  const {
    steps,
    isStreaming,
    streamedText,
    finalVerdict,
    totalMs,
    isHumanQueryTriggered,
    startStream,
    stopStream,
  } = useDualOracleStream(runId);

  // When stream finishes, convert live streaming into finished message in history
  useEffect(() => {
    if (!isStreaming && finalVerdict) {
      setTaskHistory((prev) => {
        const cur = prev[selectedCaseId] ?? [];
        const isUnknown =
          finalVerdict === "UNKNOWN_EVIDENCE" ||
          finalVerdict === "UNKNOWN_CONFLICT" ||
          finalVerdict === "UNKNOWN_GATE";

        return {
          ...prev,
          [selectedCaseId]: [
            ...cur,
            {
              id: `stream_done_${Date.now()}`,
              role: "assistant",
              text: streamedText || activeCase.adjudication.explanation,
              timestamp: new Date().toLocaleTimeString("vi-VN"),
              steps,
              totalMs,
              verdict: finalVerdict,
              hasDetails: true,
              isTicketPrompt: isUnknown || isHumanQueryTriggered,
            },
          ],
        };
      });
    }
  }, [isStreaming, finalVerdict, selectedCaseId, streamedText, steps, totalMs, isHumanQueryTriggered, activeCase]);

  // Case list for sidebar
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

  // Human ticket answering
  const handleAnswerTicket = async (answerVal: unknown) => {
    if (!activeTicket || activeTicket.status === "spent") return;

    try {
      setIsSubmittingAnswer(true);
      setSubmissionError(null);

      try {
        await fetch(`/api/tickets/${activeTicket.id}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: answerVal, durationMs: 1200 }),
        });
      } catch {
        // mock fallback
      }

      setTicketsState((prev) => ({
        ...prev,
        [selectedCaseId]: {
          ...activeTicket,
          status: "spent",
          answer: answerVal,
          answeredAt: new Date().toLocaleTimeString("vi-VN"),
        },
      }));

      const resolutionVerdict: Verdict =
        activeCase.adjudication.verdict === "UNKNOWN_EVIDENCE" ? "ACC" : "SPEC_FAULT";

      const answerLabel =
        typeof answerVal === "boolean"
          ? answerVal
            ? "Chấp nhận"
            : "Không chấp nhận"
          : JSON.stringify(answerVal);

      setTaskHistory((prev) => ({
        ...prev,
        [selectedCaseId]: [
          ...(prev[selectedCaseId] ?? []),
          {
            id: `res_${Date.now()}`,
            role: "assistant",
            text: `**Đã ghi nhận phản hồi:** \`${answerLabel}\`.\n\nCâu trả lời đã được đưa vào tập chứng cứ Grounded ($G$). Vé hỏi tương tác người đã chính thức khóa vĩnh viễn (Single-Shot Invariant).\n\n- **Phán xử cập nhật:** **${resolutionVerdict}**\n- **Quy tắc phân xử:** R2 / R4. Chu trình phân xử đã khép lại an toàn.`,
            timestamp: new Date().toLocaleTimeString("vi-VN"),
            isResolution: true,
            verdict: resolutionVerdict,
          },
        ],
      }));
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

      setTaskHistory((prev) => ({
        ...prev,
        [selectedCaseId]: [
          ...(prev[selectedCaseId] ?? []),
          {
            id: `uncert_${Date.now()}`,
            role: "assistant",
            text: `Bạn đã đánh dấu **Không xác định được (UNCERTAIN)**. Vé hỏi đã khóa vĩnh viễn. Trạng thái vụ việc được giữ nguyên là **UNKNOWN_EVIDENCE** theo nguyên tắc Fail-Closed (không đoán mò).`,
            timestamp: new Date().toLocaleTimeString("vi-VN"),
            isResolution: true,
            verdict: "UNKNOWN_EVIDENCE",
          },
        ],
      }));
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Sending message / Triggering stream
  const handleSendMessage = useCallback(
    (textToSend?: string) => {
      const text = (textToSend ?? composerInput).trim();
      if (!text || isStreaming) return;

      setComposerInput("");
      const userMsg: ChatMessageItem = {
        id: `usr_${Date.now()}`,
        role: "user",
        text,
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      };

      setTaskHistory((prev) => ({
        ...prev,
        [selectedCaseId]: [...(prev[selectedCaseId] ?? []), userMsg],
      }));

      const lower = text.toLowerCase();
      if (
        lower.includes("mô tả") ||
        lower.includes("giải thích") ||
        lower.includes("yêu cầu") ||
        lower.includes("đặc tả")
      ) {
        setTimeout(() => {
          setTaskHistory((prev) => ({
            ...prev,
            [selectedCaseId]: [
              ...(prev[selectedCaseId] ?? []),
              {
                id: `asst_desc_${Date.now()}`,
                role: "assistant",
                text: `### Mô Tả Tác Vụ: ${activeTask.name} (${activeCase.taskId})\n\n**Mục tiêu bài toán:**\n${
                  activeTask.intentDocstring
                }\n\n**Hành vi kiểm thử:**\n- **Đầu vào witness (w):** \`${JSON.stringify(
                  activeCase.witness
                )}\`\n- **Đầu ra thực tế của code (c):** \`${JSON.stringify(
                  activeCase.codeOutput
                )}\`\n- **Đặc tả P_0 kiểm tra:** \`${
                  activeCase.monitorRejectionClause ?? "Mặc định"
                }\`\n\n**Phân tích nguyên nhân:**\n${
                  activeCase.adjudication.explanation
                }`,
                timestamp: new Date().toLocaleTimeString("vi-VN"),
                hasDetails: true,
                verdict: activeCase.adjudication.verdict,
              },
            ],
          }));
        }, 300);
        return;
      }

      // Default: Trigger real-time streaming execution steps
      startStream(activeCase, text);
    },
    [composerInput, isStreaming, selectedCaseId, activeTask, activeCase, startStream]
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        width: "100%",
        background: "var(--bg-app)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          1. LEFT SIDEBAR (Full Viewport Height)
         ═══════════════════════════════════════════════════════════════════ */}
      <aside
        style={{
          width: "280px",
          minWidth: "260px",
          maxWidth: "320px",
          height: "100dvh",
          background: "var(--bg-panel)",
          borderRight: "1px solid var(--border-default)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          zIndex: 30,
        }}
        className={`sidebar-container ${isMobileSidebarOpen ? "mobile-open" : ""}`}
      >
        {/* Sticky Sidebar Header */}
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  color: "var(--text-primary)",
                }}
              >
                Dual-Oracle Testbed
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  padding: "1px 5px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-app)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                }}
              >
                v1.4
              </span>
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "2px",
                fontFamily: "var(--font-mono)",
              }}
            >
              Run: {runId}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? i18n.theme.toggleLight : i18n.theme.toggleDark}
              style={{
                background: "none",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "5px",
                cursor: "pointer",
                color: "var(--text-primary)",
                display: "flex",
              }}
            >
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button
              type="button"
              className="md:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Đóng thanh bên"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Dataset Selector */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--border-subtle)",
            flexShrink: 0,
          }}
        >
          <label
            htmlFor="dataset-select"
            style={{
              display: "block",
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--text-muted)",
              marginBottom: "5px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-sans)",
            }}
          >
            Dataset
          </label>
          <div style={{ position: "relative" }}>
            <select
              id="dataset-select"
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              style={{
                width: "100%",
                padding: "5px 28px 5px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-default)",
                background: "var(--bg-app)",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                outline: "none",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            >
              <option value="humaneval">HumanEval+ (EvalPlus v0.2)</option>
              <option value="mbpp">MBPP+ (Sanitized)</option>
              <option value="evalplus_demo">EvalPlus Illustrative</option>
            </select>
            <ChevronDown
              size={12}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* Search & Filter */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--border-subtle)",
            flexShrink: 0,
          }}
        >
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <Search
              size={12}
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Tìm tác vụ, witness, hoặc ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm tác vụ"
              style={{
                width: "100%",
                padding: "5px 8px 5px 26px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-default)",
                background: "var(--bg-app)",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontFamily: "var(--font-sans)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "UNKNOWN", label: "Cần hỏi" },
              { id: "FAULTS", label: "Lỗi" },
              { id: "ACC", label: "Đạt" },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterVerdict(pill.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  border:
                    filterVerdict === pill.id
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border-subtle)",
                  background:
                    filterVerdict === pill.id ? "var(--bg-hover)" : "transparent",
                  color:
                    filterVerdict === pill.id
                      ? "var(--accent)"
                      : "var(--text-muted)",
                  fontSize: "11px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: filterVerdict === pill.id ? 600 : 500,
                  cursor: "pointer",
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task List — Independent scroll, filling remainder with no bottom gap */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
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
                  setSubmissionError(null);
                  setIsMobileSidebarOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedCaseId(item.id);
                    setIsMobileSidebarOpen(false);
                  }
                }}
                data-testid={`case-item-${item.id}`}
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "3px",
                  border: "1px solid transparent",
                  borderLeft: isSelected
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                  background: isSelected ? "var(--bg-hover)" : "transparent",
                  cursor: "pointer",
                  transition: "background var(--motion-quick) ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "3px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      fontFamily: "var(--font-sans)",
                      color: isSelected ? "var(--accent)" : "var(--text-primary)",
                    }}
                  >
                    {item.taskName}
                  </span>
                  <VerdictChip verdict={item.verdict} size="sm" />
                </div>

                <div
                  style={{
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-muted)",
                    marginBottom: "3px",
                  }}
                >
                  w: {item.witnessStr}
                </div>

                {item.ticket && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "3px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontFamily: "var(--font-sans)",
                        padding: "1px 5px",
                        borderRadius: "var(--radius-sm)",
                        background: isSpent ? "var(--v-code-bg)" : "var(--bg-hover)",
                        border: `1px solid ${
                          isSpent ? "var(--v-code)" : "var(--accent)"
                        }`,
                        color: isSpent ? "var(--v-code)" : "var(--accent)",
                        fontWeight: 500,
                      }}
                    >
                      {isSpent ? "Đã phản hồi" : "Cần hỏi người"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════
          2. MAIN CONTENT (Flex Column: Sticky Header + Scroll MessageList + Bottom Composer)
         ═══════════════════════════════════════════════════════════════════ */}
      <main
        style={{
          flex: 1,
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-app)",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* ── Sticky Top Header ── */}
        <header
          style={{
            padding: "10px 20px",
            background: "var(--bg-panel)",
            borderBottom: "1px solid var(--border-default)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Mở danh sách tác vụ"
              style={{
                background: "none",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "4px",
                color: "var(--text-primary)",
                cursor: "pointer",
                display: "flex",
              }}
            >
              <Menu size={15} />
            </button>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-muted)",
                  }}
                >
                  {activeCase.taskId}
                </span>
                <span style={{ color: "var(--border-default)" }}>·</span>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {activeTask.name}
                </h2>
              </div>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {activeTask.intentDocstring}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => startStream(activeCase, "Chạy lại kiểm thử")}
              disabled={isStreaming}
              data-testid="rerun-btn"
              aria-label="Chạy lại kiểm thử"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 11px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                cursor: isStreaming ? "not-allowed" : "pointer",
                opacity: isStreaming ? 0.6 : 1,
              }}
            >
              <RefreshCw size={13} className={isStreaming ? "animate-spin" : ""} />
              Chạy lại
            </button>

            <button
              type="button"
              onClick={() => setIsInspectorOpen((prev) => !prev)}
              data-testid="inspect-toggle-btn"
              aria-label={isInspectorOpen ? "Đóng Inspector" : "Xem chi tiết phân xử"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 11px",
                borderRadius: "var(--radius-md)",
                border: isInspectorOpen
                  ? "1px solid var(--accent)"
                  : "1px solid var(--border-default)",
                background: isInspectorOpen ? "var(--bg-hover)" : "transparent",
                color: isInspectorOpen ? "var(--accent)" : "var(--text-primary)",
                fontSize: "12px",
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <PanelRight size={13} />
              {isInspectorOpen ? "Đóng Inspector" : "Xem chi tiết phân xử (Inspect)"}
            </button>
          </div>
        </header>

        {/* ── Scrollable Message Stream ── */}
        <MessageList
          messages={messages}
          activeCase={activeCase}
          activeTicket={activeTicket}
          activeSteps={steps}
          isStreamingActive={isStreaming}
          streamedText={streamedText}
          streamTotalMs={totalMs}
          onOpenInspector={() => setIsInspectorOpen(true)}
          onAnswerTicket={handleAnswerTicket}
          onUncertainTicket={handleUncertain}
          isSubmittingAnswer={isSubmittingAnswer}
          submissionError={submissionError}
          onSendPreset={(t) => handleSendMessage(t)}
        />

        {/* ── Fixed Bottom Composer ── */}
        <Composer
          input={composerInput}
          onChange={setComposerInput}
          onSend={handleSendMessage}
          onStop={stopStream}
          isStreaming={isStreaming}
          onOpenInspector={() => setIsInspectorOpen(true)}
          isInspectorOpen={isInspectorOpen}
        />
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          3. INSPECTION DRAWER (Evidence, Rules R1–R6, Gate G1–G5)
         ═══════════════════════════════════════════════════════════════════ */}
      {isInspectorOpen && (
        <aside
          data-testid="inspection-drawer"
          style={{
            width: "420px",
            height: "100dvh",
            background: "var(--bg-panel)",
            borderLeft: "1px solid var(--border-default)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            zIndex: 40,
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-sans)",
                  color: "var(--accent)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                HỒ SƠ PHÂN XỬ CHI TIẾT
              </div>
              <h3
                style={{
                  margin: "2px 0 0",
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {activeCase.id}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsInspectorOpen(false)}
              aria-label="Đóng Inspector"
              style={{
                background: "none",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "4px",
                cursor: "pointer",
                color: "var(--text-primary)",
                display: "flex",
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Drawer Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border-default)",
              background: "var(--bg-app)",
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
                onClick={() =>
                  setInspectorTab(tab.id as "evidence" | "rules" | "gate")
                }
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  fontSize: "11px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: inspectorTab === tab.id ? 600 : 500,
                  color:
                    inspectorTab === tab.id
                      ? "var(--accent)"
                      : "var(--text-muted)",
                  background:
                    inspectorTab === tab.id ? "var(--bg-panel)" : "transparent",
                  border: "none",
                  borderBottom:
                    inspectorTab === tab.id
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* TAB 1: Evidence */}
            {inspectorTab === "evidence" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <h4
                    style={{
                      margin: "0 0 8px",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                    }}
                  >
                    {i18n.evidence.grounded} ({activeCase.groundedEvidence.length})
                  </h4>
                  {activeCase.groundedEvidence.length === 0 ? (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      Không có bằng chứng grounded tại witness này.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {activeCase.groundedEvidence.map((ev) => (
                        <div
                          key={ev.id}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-subtle)",
                            background: "var(--bg-app)",
                          }}
                        >
                          <ProvenanceTag isGrounded={true} source={ev.source} />
                          <div
                            style={{
                              marginTop: "5px",
                              fontSize: "11px",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {ev.kind === "expected_output"
                              ? `e(w) = ${JSON.stringify(ev.expected)}`
                              : `φ: ${ev.description}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {activeCase.advisoryEvidence.length > 0 && (
                  <div>
                    <h4
                      style={{
                        margin: "0 0 8px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontFamily: "var(--font-sans)",
                        fontWeight: 600,
                      }}
                    >
                      {i18n.evidence.advisory} ({activeCase.advisoryEvidence.length})
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {activeCase.advisoryEvidence.map((ev) => (
                        <div
                          key={ev.id}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-subtle)",
                            background: "transparent",
                          }}
                        >
                          <ProvenanceTag isGrounded={false} source={ev.source} />
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "11px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {String(ev.content)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Rules */}
            {inspectorTab === "rules" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <h4
                    style={{
                      margin: "0 0 8px",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                    }}
                  >
                    Cây Quyết Định R1–R6 (RuleLadder)
                  </h4>
                  <RuleLadder
                    matchedRule={activeCase.adjudication.matchedRule}
                    skippedRules={activeCase.adjudication.skippedRules}
                  />
                </div>

                <div>
                  <h4
                    style={{
                      margin: "0 0 8px",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                    }}
                  >
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

            {/* TAB 3: Gate */}
            {inspectorTab === "gate" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontFamily: "var(--font-sans)",
                        fontWeight: 600,
                      }}
                    >
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
                        padding: "10px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-app)",
                        fontSize: "11px",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        Họ luật:{" "}
                        <strong style={{ color: "var(--text-primary)" }}>
                          {activeCase.repairCandidate.family}
                        </strong>{" "}
                        · Rank #{activeCase.repairCandidate.rank}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          marginTop: "4px",
                          color: "var(--text-primary)",
                        }}
                      >
                        Vùng g:{" "}
                        <code
                          style={{
                            background: "var(--bg-panel)",
                            padding: "0 4px",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          {activeCase.repairCandidate.guard}
                        </code>
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          marginTop: "2px",
                          color: "var(--v-acc)",
                        }}
                      >
                        Bản sửa C&apos;:{" "}
                        <code
                          style={{
                            background: "var(--bg-panel)",
                            padding: "0 4px",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          {activeCase.repairCandidate.replacement}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      Không có bản vá cho trường hợp này.
                    </div>
                  )}
                </div>

                {activeCase.gateResult && (
                  <div>
                    <h4
                      style={{
                        margin: "0 0 8px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontFamily: "var(--font-sans)",
                        fontWeight: 600,
                      }}
                    >
                      5 Chốt Kiểm Fail-Closed Gate (G1–G5)
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        fontSize: "11px",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {[
                        {
                          key: "g1_accept_grounded" as const,
                          label: "G1: Chấp nhận Grounded (e ∈ G)",
                        },
                        {
                          key: "g2_reject_b" as const,
                          label: "G2: Bác bỏ Counterexamples (b ∉ B)",
                        },
                        {
                          key: "g3_locality" as const,
                          label: "G3: Tính cục bộ (Locality)",
                        },
                        {
                          key: "g4_preserve_g_a2" as const,
                          label: "G4: Bảo toàn thuộc tính (A2)",
                        },
                        {
                          key: "g5_in_repair_space_and_bsynth" as const,
                          label: "G5: Trong không gian sửa đổi",
                        },
                      ].map(({ key, label }) => {
                        const pass = activeCase.gateResult!.checks[key];
                        return (
                          <div
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              color: pass ? "var(--v-acc)" : "var(--v-code)",
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{pass ? "✓" : "✕"}</span>
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Global CSS for mobile drawer positioning */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .sidebar-container {
            position: fixed;
            left: -320px;
            top: 0;
            bottom: 0;
            transition: left 0.25s ease-in-out;
            box-shadow: 4px 0 16px rgba(0, 0, 0, 0.2);
          }
          .sidebar-container.mobile-open {
            left: 0;
          }
        }
      `}</style>
    </div>
  );
}

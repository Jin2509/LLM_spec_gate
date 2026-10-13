/**
 * src/ui/chat/MessageList.tsx — Scrollable Message List with Auto-scroll Detection
 *
 * Requirements:
 *   - role="log", aria-live="polite"
 *   - Handles auto-scrolling to bottom on new content
 *   - If user scrolls up, detects it, stops auto-scroll, and surfaces floating "↓ Xuống cuối" button
 *   - Empty state when no messages: helpful hints centered in message area
 *   - In-stream Single-Shot Ticket prompt box with lock mechanism
 */
"use client";

import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowDown,
  CheckCircle2,
  XCircle,
  FileText,
  Play,
  PanelRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ProcessTimeline } from "./ProcessTimeline";
import { VerdictCard } from "./VerdictCard";
import { AdjudicationLogic } from "./AdjudicationLogic";
import { i18n } from "@/i18n/vi";
import type { StreamStepState } from "@/core/stream-types";
import type { CaseDossier, HumanQueryTicket, Verdict } from "@/core/types";

function TechnicalDetailsToggle({ activeCase }: { activeCase: CaseDossier }) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-expanded={show}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: "11px",
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {show ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {show ? "Ẩn chi tiết kỹ thuật" : "Hiện chi tiết kỹ thuật (Witness & Spec)"}
      </button>

      {show && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px 10px",
            background: "var(--bg-app)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-subtle)",
            fontSize: "11px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ color: "var(--text-muted)", width: "130px" }}>Witness w:</span>
            <code style={{ fontFamily: "var(--font-mono)" }}>{JSON.stringify(activeCase.witness)}</code>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ color: "var(--text-muted)", width: "130px" }}>Đầu ra thực tế c:</span>
            <code style={{ fontFamily: "var(--font-mono)" }}>{JSON.stringify(activeCase.codeOutput)}</code>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ color: "var(--text-muted)", width: "130px" }}>Mệnh đề kiểm tra:</span>
            <code style={{ fontFamily: "var(--font-mono)" }}>{activeCase.monitorRejectionClause ?? "Mặc định"}</code>
          </div>
        </div>
      )}
    </div>
  );
}

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  steps?: StreamStepState[];
  isStreaming?: boolean;
  totalMs?: number;
  verdict?: Verdict;
  hasDetails?: boolean;
  isTicketPrompt?: boolean;
  isResolution?: boolean;
}

export interface MessageListProps {
  messages: ChatMessageItem[];
  activeCase: CaseDossier;
  activeTicket?: HumanQueryTicket;
  activeSteps: StreamStepState[];
  isStreamingActive: boolean;
  streamedText: string;
  streamTotalMs?: number;
  onOpenInspector: () => void;
  onAnswerTicket: (answer: unknown) => void;
  onUncertainTicket: () => void;
  isSubmittingAnswer: boolean;
  submissionError: string | null;
  onSendPreset: (text: string) => void;
}

export function MessageList({
  messages,
  activeCase,
  activeTicket,
  activeSteps,
  isStreamingActive,
  streamedText,
  streamTotalMs,
  onOpenInspector,
  onAnswerTicket,
  onUncertainTicket,
  isSubmittingAnswer,
  submissionError,
  onSendPreset,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);
  const userScrolledUpRef = useRef<boolean>(false);

  const [promptInputValue, setPromptInputValue] = useState<string>("");

  // Check scroll position
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isUp = distanceToBottom > 80;
    userScrolledUpRef.current = isUp;
    setShowScrollBottom(isUp);
  };

  // Auto-scroll when new content arrives if user hasn't scrolled up
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeSteps, streamedText, isStreamingActive]);

  const scrollToBottom = () => {
    userScrolledUpRef.current = false;
    setShowScrollBottom(false);
    bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      style={{
        flex: 1,
        overflowY: "auto",
        minHeight: 0,
        padding: "16px 20px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "860px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Empty State if no messages */}
        {messages.length === 0 && !isStreamingActive && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "320px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-panel)",
                border: "1px solid var(--border-default)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
                marginBottom: "12px",
              }}
            >
              <Play size={22} />
            </div>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: "0 0 6px",
                fontFamily: "var(--font-sans)",
              }}
            >
              Sẵn sàng kiểm thử: {activeCase.taskId}
            </h3>
            <p
              style={{
                maxWidth: "480px",
                fontSize: "12px",
                color: "var(--text-muted)",
                lineHeight: 1.6,
                margin: "0 0 20px",
                fontFamily: "var(--font-sans)",
              }}
            >
              Gửi một câu lệnh hoặc bấm các nút tác vụ bên dưới để chạy quy trình
              phán xử song hành Dual-Oracle với witness w ={" "}
              <code style={{ fontFamily: "var(--font-mono)" }}>
                {JSON.stringify(activeCase.witness)}
              </code>
              .
            </p>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => onSendPreset("Kiểm thử witness w")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--accent)",
                  background: "var(--bg-hover)",
                  color: "var(--accent)",
                  fontSize: "12px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <Play size={12} />
                Chạy kiểm thử ngay
              </button>

              <button
                type="button"
                onClick={() => onSendPreset("Mô tả lại bài toán và phân tích lỗi")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-panel)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <FileText size={12} />
                Mô tả bài toán
              </button>

              <button
                type="button"
                onClick={onOpenInspector}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-panel)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <PanelRight size={12} />
                Mở Inspector
              </button>
            </div>
          </div>
        )}

        {/* Render message stream */}
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div key={msg.id}>
              {/* Header: Sender + Time */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    color: isUser ? "var(--text-secondary)" : "var(--accent)",
                  }}
                >
                  {isUser
                    ? "Kiểm Thử Viên (Testbed Runner)"
                    : "Giám Sát Song Hành (Dual-Oracle Monitor)"}
                </span>
                <span style={{ color: "var(--border-default)" }}>·</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message card */}
              <div
                style={{
                  background: isUser
                    ? "var(--bg-panel)"
                    : "var(--bg-elevated, var(--bg-panel))",
                  border: `1px solid ${
                    isUser ? "var(--border-subtle)" : "var(--border-default)"
                  }`,
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {/* Stepper Timeline inside system message if present */}
                {msg.steps && (
                  <ProcessTimeline
                    steps={msg.steps}
                    isStreaming={Boolean(msg.isStreaming)}
                    totalMs={msg.totalMs}
                  />
                )}

                {/* Markdown text body */}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.text}
                </ReactMarkdown>

                {/* Structured Verdict Card */}
                {msg.verdict && (
                  <VerdictCard
                    verdict={msg.verdict}
                    codeOutput={activeCase.codeOutput}
                    monitorRejectionClause={activeCase.monitorRejectionClause}
                    matchedRule={activeCase.adjudication.matchedRule}
                    explanation={activeCase.adjudication.explanation}
                    onOpenInspector={onOpenInspector}
                  />
                )}

                {/* Structured Adjudication Logic */}
                {msg.hasDetails && (
                  <AdjudicationLogic caseDossier={activeCase} />
                )}

                {/* Collapsible technical details (Witness & Spec) */}
                {msg.hasDetails && (
                  <div style={{ marginTop: "10px", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
                    <TechnicalDetailsToggle activeCase={activeCase} />
                  </div>
                )}

                {/* In-stream Single-Shot Ticket Prompt */}
                {msg.isTicketPrompt && activeTicket && (
                  <div
                    data-testid="chat-prompt-box"
                    style={{
                      position: "relative",
                      marginTop: "12px",
                      padding: "12px 14px",
                      background: "var(--bg-app)",
                      borderRadius: "var(--radius-md)",
                      border:
                        activeTicket.status === "spent"
                          ? "1px solid var(--border-subtle)"
                          : "1px solid var(--accent)",
                    }}
                  >
                    {/* Spent stamp */}
                    {activeTicket.status === "spent" && (
                      <div
                        data-testid="chat-spent-stamp"
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          transform: "rotate(-4deg)",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--v-code)",
                          color: "var(--v-code)",
                          background: "var(--v-code-bg)",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          fontSize: "10px",
                          letterSpacing: "0.05em",
                          pointerEvents: "none",
                        }}
                      >
                        {i18n.ticket.spentStamp}
                      </div>
                    )}

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
                      {i18n.ticket.title} · ĐÚNG 1 LẦN
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        margin: "4px 0 10px",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {activeTicket.promptText}
                    </div>

                    {activeTicket.status === "spent" ? (
                      <div
                        style={{
                          fontSize: "12px",
                          fontFamily: "var(--font-sans)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <strong>Phản hồi đã lưu:</strong>{" "}
                        {activeTicket.isUncertain
                          ? "Không xác định được (UNCERTAIN)"
                          : typeof activeTicket.answer === "boolean"
                          ? activeTicket.answer
                            ? "Chấp nhận (ACCEPT)"
                            : "Không chấp nhận (REJECT)"
                          : JSON.stringify(activeTicket.answer)}
                        <div
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                            marginTop: "2px",
                          }}
                        >
                          Trạng thái: Đã khóa vĩnh viễn (Single-Shot Invariant).
                        </div>
                      </div>
                    ) : (
                      <div>
                        {activeTicket.questionType === "acceptability" ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              type="button"
                              disabled={isSubmittingAnswer}
                              onClick={() => onAnswerTicket(true)}
                              data-testid="chat-ticket-accept-btn"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 12px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--v-acc)",
                                background: "var(--v-acc-bg)",
                                color: "var(--v-acc)",
                                fontSize: "12px",
                                fontFamily: "var(--font-sans)",
                                fontWeight: 500,
                                cursor: "pointer",
                              }}
                            >
                              <CheckCircle2 size={13} />
                              [1] Chấp nhận
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingAnswer}
                              onClick={() => onAnswerTicket(false)}
                              data-testid="chat-ticket-reject-btn"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 12px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--v-code)",
                                background: "var(--v-code-bg)",
                                color: "var(--v-code)",
                                fontSize: "12px",
                                fontFamily: "var(--font-sans)",
                                fontWeight: 500,
                                cursor: "pointer",
                              }}
                            >
                              <XCircle size={13} />
                              [2] Không chấp nhận
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingAnswer}
                              onClick={onUncertainTicket}
                              data-testid="chat-ticket-uncertain-btn"
                              style={{
                                padding: "5px 10px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border-default)",
                                background: "transparent",
                                color: "var(--text-muted)",
                                fontSize: "12px",
                                fontFamily: "var(--font-sans)",
                                cursor: "pointer",
                              }}
                            >
                              [C] Không xác định
                            </button>
                          </div>
                        ) : (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!promptInputValue.trim()) return;
                              onAnswerTicket(promptInputValue);
                              setPromptInputValue("");
                            }}
                          >
                            <div style={{ display: "flex", gap: "6px" }}>
                              <input
                                type="text"
                                value={promptInputValue}
                                onChange={(e) => setPromptInputValue(e.target.value)}
                                placeholder="Nhập giá trị mong muốn e(w), ví dụ: 42 hoặc [1, 2]"
                                disabled={isSubmittingAnswer}
                                style={{
                                  flex: 1,
                                  padding: "5px 10px",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--border-default)",
                                  background: "var(--bg-panel)",
                                  color: "var(--text-primary)",
                                  fontSize: "12px",
                                  fontFamily: "var(--font-mono)",
                                  outline: "none",
                                }}
                              />
                              <button
                                type="submit"
                                disabled={isSubmittingAnswer || !promptInputValue.trim()}
                                style={{
                                  padding: "5px 14px",
                                  borderRadius: "var(--radius-sm)",
                                  border: "none",
                                  background: "var(--accent)",
                                  color: "var(--bg-panel)",
                                  fontSize: "12px",
                                  fontFamily: "var(--font-sans)",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                }}
                              >
                                Gửi câu trả lời
                              </button>
                            </div>
                          </form>
                        )}

                        {submissionError && (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "11px",
                              color: "var(--v-code)",
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            {submissionError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Active Streaming Message */}
        {isStreamingActive && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "4px",
                fontSize: "11px",
                color: "var(--text-muted)",
                fontFamily: "var(--font-sans)",
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--accent)" }}>
                Giám Sát Song Hành (Dual-Oracle Monitor)
              </span>
              <span style={{ color: "var(--border-default)" }}>·</span>
              <span>Đang xử lý</span>
            </div>

            <div
              style={{
                background: "var(--bg-elevated, var(--bg-panel))",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
              }}
            >
              <ProcessTimeline
                steps={activeSteps}
                isStreaming={true}
                totalMs={streamTotalMs}
              />

              {streamedText && (
                <div style={{ marginTop: "10px" }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamedText}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={bottomAnchorRef} />
      </div>

      {/* Floating Scroll-to-bottom button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Cuộn xuống cuối tin nhắn"
          style={{
            position: "sticky",
            bottom: "20px",
            alignSelf: "center",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            borderRadius: "20px",
            border: "1px solid var(--border-default)",
            background: "var(--bg-panel)",
            color: "var(--text-primary)",
            fontSize: "11px",
            fontFamily: "var(--font-sans)",
            fontWeight: 500,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          <ArrowDown size={12} />
          Xuống cuối
        </button>
      )}
    </div>
  );
}

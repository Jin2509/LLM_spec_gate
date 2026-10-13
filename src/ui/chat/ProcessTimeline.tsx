/**
 * src/ui/chat/ProcessTimeline.tsx — Vertical Stepper Timeline for Dual-Oracle Backend Steps
 *
 * Requirements:
 *   - Stepper: pending -> running (spinner) -> done (✓) / error (✕)
 *   - Step duration (ms) display
 *   - Collapsible summary bar when completed ("Đã xử lý 6 bước · 1.2s", click to expand)
 *   - Accordion for done steps
 *   - Respects prefers-reduced-motion
 */
"use client";

import React, { useState } from "react";
import { Check, X, Loader2, ChevronDown, ChevronRight, Clock } from "lucide-react";
import type { StreamStepState } from "@/core/stream-types";

export interface ProcessTimelineProps {
  steps: StreamStepState[];
  isStreaming: boolean;
  totalMs?: number;
}

export function ProcessTimeline({
  steps,
  isStreaming,
  totalMs,
}: ProcessTimelineProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const doneCount = steps.filter((s) => s.status === "done").length;
  const isAllDone = !isStreaming && doneCount === steps.length;

  return (
    <div
      style={{
        marginBottom: "10px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-app)",
        overflow: "hidden",
      }}
      aria-busy={isStreaming}
    >
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 12px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "11px",
          fontFamily: "var(--font-sans)",
          color: "var(--text-muted)",
          textAlign: "left",
        }}
        aria-label={isExpanded ? "Thu gọn tiến trình" : "Mở rộng tiến trình"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {isStreaming ? (
            <Loader2
              size={13}
              style={{
                color: "var(--accent)",
                animation: "spin 1s linear infinite",
              }}
            />
          ) : (
            <Check size={13} style={{ color: "var(--v-acc)" }} />
          )}
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {isAllDone
              ? `Đã xử lý ${steps.length} bước · ${(
                  (totalMs ?? 800) / 1000
                ).toFixed(1)}s`
              : isStreaming
              ? `Đang thực thi quy trình Dual-Oracle (${doneCount}/${steps.length})...`
              : `Tiến trình kiểm thử (${doneCount}/${steps.length})`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            {isExpanded ? "Thu gọn" : "Chi tiết"}
          </span>
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </div>
      </button>

      {/* Stepper list */}
      {isExpanded && (
        <div
          style={{
            padding: "6px 12px 10px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {steps.map((step, idx) => {
            const isRunning = step.status === "running";
            const isDone = step.status === "done";
            const isError = step.status === "error";

            return (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  fontSize: "11px",
                  lineHeight: 1.4,
                }}
              >
                {/* Status indicator icon */}
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                    background: isDone
                      ? "var(--v-acc-bg)"
                      : isRunning
                      ? "var(--bg-hover)"
                      : isError
                      ? "var(--v-code-bg)"
                      : "transparent",
                    border: `1px solid ${
                      isDone
                        ? "var(--v-acc)"
                        : isRunning
                        ? "var(--accent)"
                        : isError
                        ? "var(--v-code)"
                        : "var(--border-default)"
                    }`,
                    color: isDone
                      ? "var(--v-acc)"
                      : isRunning
                      ? "var(--accent)"
                      : isError
                      ? "var(--v-code)"
                      : "var(--text-muted)",
                  }}
                >
                  {isDone ? (
                    <Check size={10} strokeWidth={2.5} />
                  ) : isRunning ? (
                    <Loader2
                      size={10}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : isError ? (
                    <X size={10} strokeWidth={2.5} />
                  ) : (
                    <span style={{ fontSize: "9px" }}>{idx + 1}</span>
                  )}
                </div>

                {/* Step label and metadata */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: isRunning ? 600 : 500,
                        color: isRunning
                          ? "var(--accent)"
                          : isDone
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {step.label}
                    </span>
                    {step.durationMs !== undefined && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-muted)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Clock size={10} />
                        {step.durationMs}ms
                      </span>
                    )}
                  </div>

                  {/* Inline step data preview if done */}
                  {step.data && (
                    <div
                      style={{
                        marginTop: "2px",
                        fontSize: "10px",
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {step.data.c !== undefined && (
                        <span>
                          Đầu ra thực tế: <code>c = {JSON.stringify(step.data.c)}</code>
                        </span>
                      )}
                      {step.data.violated && (
                        <span style={{ color: "var(--v-spec)" }}>
                          Vi phạm: <code>{step.data.violated}</code>
                        </span>
                      )}
                      {step.data.verdict && (
                        <span style={{ fontWeight: 600 }}>
                          Phán xử: <code>{step.data.verdict}</code> (Luật: {step.data.rule})
                        </span>
                      )}
                      {step.data.details && <span>{step.data.details}</span>}
                    </div>
                  )}

                  {/* Error display */}
                  {step.error && (
                    <div
                      style={{
                        marginTop: "2px",
                        fontSize: "10px",
                        color: "var(--v-code)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {step.error}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

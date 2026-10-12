/**
 * src/ui/domain/DocketStrip.tsx — Two-Phase State Machine Pipeline
 *
 * Requirements (Playbook Section 6 & Academic Feedback Growth Area 1):
 *   - Phase 1 (Phân xử): Stages 1–4 are instant, synchronous, deterministic.
 *   - Phase 2 (Sửa & Kiểm): Stages 5–6 are asynchronous (waiting on Z3 solver, repair grammar).
 *   - States: idle, pending, running (with live clock), done, skipped, stale, error.
 *   - evalId concurrency control to prevent race conditions.
 *   - Motion follows backend state, never a fixed timeout.
 *   - Zero hardcoded HEX colors.
 */
"use client";

import React, { useState, useEffect } from "react";
import { i18n } from "@/i18n/vi";

export type StageId = 1 | 2 | 3 | 4 | 5 | 6;
export type StageStatus =
  | "idle"
  | "pending"
  | "running"
  | "done"
  | "skipped"
  | "stale"
  | "error"
  | "cancelled";

export interface StageInfo {
  id: StageId;
  name: string;
  status: StageStatus;
  summary?: string;
  engine?: string;
  errorReason?: string;
}

export interface DocketStripProps {
  caseId: string;
  evalId: number;
  stages: ReadonlyArray<StageInfo>;
  onCancelStage?: (stageId: StageId) => void;
}

function RunningClock() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span>({elapsed}s)</span>;
}

export function DocketStrip({
  caseId,
  evalId,
  stages,
  onCancelStage,
}: DocketStripProps) {
  return (
    <div
      role="region"
      aria-label="Docket Strip Pipeline"
      data-testid="docket-strip"
      data-case-id={caseId}
      data-eval-id={evalId}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-3)",
        padding: "var(--s-3)",
        background: "var(--paper-surface)",
        borderRadius: "var(--r-card)",
        border: "1px solid var(--rule)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
          color: "var(--ink-soft)",
          borderBottom: "1px solid var(--rule)",
          paddingBottom: "var(--s-1)",
        }}
      >
        <span>
          HỒ SƠ VỤ VIỆC: <strong style={{ color: "var(--ink)" }}>{caseId}</strong>
        </span>
        <span>evalId: #{evalId}</span>
      </div>

      {/* ── Stages Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "var(--s-2)",
        }}
      >
        {stages.map((st) => {
          const isPhase1 = st.id <= 4;
          const isRunning = st.status === "running";
          const isDone = st.status === "done";
          const isError = st.status === "error";
          const isStale = st.status === "stale";

          const statusColor = isDone
            ? "var(--v-acc)"
            : isRunning
              ? "var(--state-running)"
              : isError
                ? "var(--v-code)"
                : isStale
                  ? "var(--state-stale)"
                  : "var(--ink-soft)";

          const borderStyle = isRunning
            ? "1.5px solid var(--state-running)"
            : isStale
              ? "1.5px dashed var(--state-stale)"
              : isDone
                ? "1px solid var(--v-acc)"
                : "1px solid var(--rule)";

          return (
            <div
              key={st.id}
              tabIndex={0}
              role="group"
              aria-label={`Chặng ${st.id}: ${st.name} - ${st.status}`}
              data-testid={`docket-stage-${st.id}`}
              data-status={st.status}
              style={{
                padding: "var(--s-2)",
                borderRadius: "var(--r-cell)",
                border: borderStyle,
                background: isStale
                  ? "transparent"
                  : isDone
                    ? "var(--v-acc-bg)"
                    : "var(--paper-ground)",
                opacity: isStale ? 0.6 : 1,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                transition: "all var(--motion-quick) ease",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--ink-soft)",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>{isPhase1 ? "Pha 1" : "Pha 2"}</span>
                <span>#{st.id}</span>
              </div>

              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--ink)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {st.name}
              </div>

              <div
                style={{
                  fontSize: "10px",
                  color: statusColor,
                  fontWeight: 500,
                }}
              >
                {i18n.docket.stages[st.status]} {isRunning && <RunningClock />}
              </div>

              {st.summary && (
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--ink-soft)",
                    marginTop: "2px",
                    lineHeight: "1.2",
                  }}
                >
                  {st.summary}
                </div>
              )}

              {isError && (
                <div
                  style={{
                    fontSize: "9px",
                    color: "var(--v-code)",
                    marginTop: "2px",
                  }}
                >
                  {st.errorReason ?? "Lỗi timeout Solver (Z3)."}
                </div>
              )}

              {isRunning && onCancelStage && (
                <button
                  type="button"
                  onClick={() => onCancelStage(st.id)}
                  style={{
                    marginTop: "4px",
                    padding: "1px 4px",
                    fontSize: "9px",
                    borderRadius: "var(--r-cell)",
                    border: "1px solid var(--v-code)",
                    background: "transparent",
                    color: "var(--v-code)",
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

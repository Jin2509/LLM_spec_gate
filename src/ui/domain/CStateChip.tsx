/**
 * src/ui/domain/CStateChip.tsx — c-State Chip Component
 *
 * Shows acceptance state of code output c:
 *   - ACC: accepted by spec or oracle
 *   - REJ: rejected by spec
 *   - UND: undetermined
 *
 * Zero hardcoded HEX colors.
 */
"use client";

import React from "react";
import { i18n } from "@/i18n/vi";

export type CState = "ACC" | "REJ" | "UND";

export interface CStateChipProps {
  state: CState;
  reason?: string;
}

export function CStateChip({ state, reason }: CStateChipProps) {
  const colorVar =
    state === "ACC"
      ? "--v-acc"
      : state === "REJ"
        ? "--v-code"
        : "--v-unknown";

  const bgVar =
    state === "ACC"
      ? "var(--v-acc-bg)"
      : state === "REJ"
        ? "var(--v-code-bg)"
        : "transparent";

  const border =
    state === "UND"
      ? "var(--border-unknown)"
      : `1px solid var(${colorVar})`;

  return (
    <span
      data-testid="c-state-chip"
      data-state={state}
      title={reason ?? i18n.cState[state]}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 6px",
        borderRadius: "var(--r-cell)",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        color: `var(${colorVar})`,
        background: bgVar,
        border,
      }}
    >
      <span>c: {state}</span>
      {reason && (
        <span
          style={{
            fontSize: "10px",
            color: "var(--ink-soft)",
            fontWeight: 400,
            maxWidth: "180px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          ({reason})
        </span>
      )}
    </span>
  );
}

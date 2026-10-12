/**
 * src/ui/domain/VerdictChip.tsx — Verdict Chip Component
 *
 * Requirements:
 *   - Lab Notebook styling: Cold paper, clear typography, geometric symbols.
 *   - UNKNOWN is first-class:
 *       * Border: MUST be dashed (var(--border-unknown))
 *       * Background: MUST be transparent (var(--v-unknown-bg))
 *       * Symbol: Contains letter distinction: 'E' (Evidence), 'C' (Conflict), 'G' (Gate)
 *       * NEVER solid background fill.
 *   - Accessible: includes text labels and geometric indicators.
 *   - Zero hardcoded HEX colors.
 */
"use client";

import React from "react";
import type { Verdict } from "@/core/types";
import { i18n } from "@/i18n/vi";

export interface VerdictChipProps {
  verdict: Verdict;
  size?: "sm" | "md";
  showFullLabel?: boolean;
}

export function VerdictChip({
  verdict,
  size = "md",
  showFullLabel = false,
}: VerdictChipProps) {
  const isUnknown =
    verdict === "UNKNOWN_EVIDENCE" ||
    verdict === "UNKNOWN_CONFLICT" ||
    verdict === "UNKNOWN_GATE";

  let unknownSymbol: "E" | "C" | "G" | undefined;
  if (verdict === "UNKNOWN_EVIDENCE") unknownSymbol = "E";
  if (verdict === "UNKNOWN_CONFLICT") unknownSymbol = "C";
  if (verdict === "UNKNOWN_GATE") unknownSymbol = "G";

  const colorVar =
    verdict === "ACC"
      ? "--v-acc"
      : verdict === "SPEC_FAULT"
        ? "--v-spec"
        : verdict === "CODE_FAULT"
          ? "--v-code"
          : verdict === "DUAL_FAULT"
            ? "--v-dual"
            : isUnknown
              ? "--v-unknown"
              : "--v-neutral";

  const bgVar = isUnknown
    ? "transparent"
    : verdict === "ACC"
      ? "var(--v-acc-bg)"
      : verdict === "SPEC_FAULT"
        ? "var(--v-spec-bg)"
        : verdict === "CODE_FAULT"
          ? "var(--v-code-bg)"
          : verdict === "DUAL_FAULT"
            ? "var(--v-dual-bg)"
            : "var(--v-neutral-bg)";

  const borderStyle = isUnknown
    ? "1.5px dashed var(--v-unknown)"
    : `1.5px solid var(${colorVar})`;

  const label = showFullLabel ? i18n.verdicts[verdict] : i18n.verdictShort[verdict];
  const padding = size === "sm" ? "2px 6px" : "3px 8px";
  const fontSize = size === "sm" ? "11px" : "12px";

  return (
    <span
      role="status"
      aria-label={`Verdict: ${i18n.verdicts[verdict]}`}
      data-testid="verdict-chip"
      data-verdict={verdict}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding,
        borderRadius: "var(--r-cell)",
        fontSize,
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em",
        background: bgVar,
        color: `var(${colorVar})`,
        border: borderStyle,
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      {unknownSymbol && (
        <span
          data-testid="unknown-symbol"
          style={{
            fontSize: "9px",
            lineHeight: "12px",
            padding: "0 2px",
            border: `1px solid var(${colorVar})`,
            borderRadius: "var(--r-cell)",
            fontWeight: 700,
          }}
        >
          {unknownSymbol}
        </span>
      )}
      <span>{label}</span>
    </span>
  );
}

/**
 * src/ui/domain/VerdictChip.tsx — Verdict Chip Component
 *
 * Tool-feel style: uniform badge shape, semantic colors, status dot.
 * UND_* variants: no dashed border; distinguished by dot color + symbol suffix.
 * Zero hardcoded HEX colors.
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

interface VerdictStyle {
  colorVar: string;
  bgVar: string;
  dotColor: string;
  symbol?: string; // sub-type suffix for UND_*
}

function getStyle(verdict: Verdict): VerdictStyle {
  switch (verdict) {
    case "ACC":
      return { colorVar: "--v-acc", bgVar: "--v-acc-bg", dotColor: "var(--v-acc)" };
    case "SPEC_FAULT":
      return { colorVar: "--v-spec", bgVar: "--v-spec-bg", dotColor: "var(--v-spec)" };
    case "CODE_FAULT":
      return { colorVar: "--v-code", bgVar: "--v-code-bg", dotColor: "var(--v-code)" };
    case "DUAL_FAULT":
      return { colorVar: "--v-dual", bgVar: "--v-dual-bg", dotColor: "var(--v-dual)" };
    case "UNKNOWN_EVIDENCE":
      return { colorVar: "--v-unknown", bgVar: "--v-neutral-bg", dotColor: "var(--v-unknown)", symbol: "E" };
    case "UNKNOWN_CONFLICT":
      return { colorVar: "--v-unknown", bgVar: "--v-neutral-bg", dotColor: "var(--v-unknown)", symbol: "C" };
    case "UNKNOWN_GATE":
      return { colorVar: "--v-unknown", bgVar: "--v-neutral-bg", dotColor: "var(--v-unknown)", symbol: "G" };
    default:
      return { colorVar: "--v-neutral", bgVar: "--v-neutral-bg", dotColor: "var(--v-neutral)" };
  }
}

export function VerdictChip({
  verdict,
  size = "md",
  showFullLabel = false,
}: VerdictChipProps) {
  const { colorVar, bgVar, dotColor, symbol } = getStyle(verdict);

  const label = showFullLabel ? i18n.verdicts[verdict] : i18n.verdictShort[verdict];
  const padding = size === "sm" ? "2px 6px" : "3px 8px";
  const fontSize = size === "sm" ? "11px" : "12px";
  const dotSize = size === "sm" ? "5px" : "6px";

  return (
    <span
      role="status"
      aria-label={`Verdict: ${i18n.verdicts[verdict]}`}
      data-testid="verdict-chip"
      data-verdict={verdict}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding,
        borderRadius: "var(--radius-sm)",
        fontSize,
        fontWeight: 500,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.02em",
        background: `var(${bgVar})`,
        color: `var(${colorVar})`,
        border: `1px solid var(${colorVar})`,
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      {/* Status dot */}
      <span
        aria-hidden="true"
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: dotColor,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      <span>{label}</span>
      {/* UND sub-type suffix */}
      {symbol && (
        <span
          data-testid="unknown-symbol"
          style={{
            fontSize: "9px",
            fontWeight: 700,
            opacity: 0.75,
          }}
        >
          /{symbol}
        </span>
      )}
    </span>
  );
}

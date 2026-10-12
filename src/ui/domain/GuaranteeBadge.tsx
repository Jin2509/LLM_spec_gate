/**
 * src/ui/domain/GuaranteeBadge.tsx — Guarantee Badge Component
 *
 * Requirements:
 *   - Strictly displays the nature of guarantee (structural | finite-set | proof).
 *   - NEVER uses unadorned/plain "an toàn" word.
 *   - Zero hardcoded HEX colors.
 */
"use client";

import React from "react";
import type { GuaranteeNature } from "@/core/types";
import { i18n } from "@/i18n/vi";

export interface GuaranteeBadgeProps {
  id: "S1" | "S2" | "S3" | "S4" | "S5";
  nature: GuaranteeNature;
  claimLabel?: string;
}

export function GuaranteeBadge({ id, nature, claimLabel }: GuaranteeBadgeProps) {
  const natureLabel = i18n.guarantees[nature];

  const colorVar =
    nature === "proof"
      ? "--v-acc"
      : nature === "structural"
        ? "--action"
        : nature === "finite-set"
          ? "--v-spec"
          : "--ink-soft";

  const bgVar =
    nature === "proof"
      ? "var(--v-acc-bg)"
      : nature === "structural"
        ? "var(--paper-surface)"
        : nature === "finite-set"
          ? "var(--v-spec-bg)"
          : "transparent";

  return (
    <span
      data-testid="guarantee-badge"
      data-nature={nature}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 8px",
        borderRadius: "var(--r-cell)",
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        border: `1px solid var(${colorVar})`,
        background: bgVar,
        color: `var(${colorVar})`,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontWeight: 700 }}>{id}</span>
      <span>·</span>
      <span style={{ fontFamily: "var(--font-ui)", fontWeight: 500 }}>
        {claimLabel ? `${claimLabel}: ${natureLabel}` : natureLabel}
      </span>
    </span>
  );
}

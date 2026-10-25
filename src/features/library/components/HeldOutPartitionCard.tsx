"use client";

import { Lock, LockOpen, ShieldCheck } from "lucide-react";
import React from "react";
import { Button } from "@/ui/primitives/Button";
import { Badge, Notice } from "@/ui/layout";
import { i18n } from "@/i18n/vi";

export interface HeldOutPartitionCardProps {
  totalTasks: number;
  heldOutRatio: number;
  seed: string;
  isLocked: boolean;
  isLocking: boolean;
  message: { tone: "success" | "danger"; text: string } | null;
  onRatioChange: (ratio: number) => void;
  onSeedChange: (seed: string) => void;
  onLock: () => void;
}

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--paper-ground)",
  borderColor: "var(--rule)",
  color: "var(--ink)",
  borderRadius: "var(--r-cell)",
};

export function HeldOutPartitionCard({
  totalTasks,
  heldOutRatio,
  seed,
  isLocked,
  isLocking,
  message,
  onRatioChange,
  onSeedChange,
  onLock,
}: HeldOutPartitionCardProps) {
  const heldOutCount = totalTasks > 0 ? Math.max(1, Math.round(totalTasks * heldOutRatio)) : 0;
  const runCount = totalTasks - heldOutCount;

  return (
    <div
      className="p-4 border rounded shadow-sm"
      style={{
        backgroundColor: "var(--paper-surface)",
        borderColor: isLocked ? "var(--v-spec)" : "var(--rule)",
        borderRadius: "var(--r-card)",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {isLocked ? <Lock size={16} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> : <LockOpen size={16} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" />}
            <h2 className="font-mono font-semibold text-sm" style={{ color: "var(--ink)" }}>
              Phân chia & Khóa Tập Held-Out (Structural Partition)
            </h2>
            <Badge tone={isLocked ? "warning" : "neutral"}>
              {isLocked ? i18n.library.lockedBadge : i18n.library.unlockedBadge}
            </Badge>
          </div>
          <p className="text-xs font-mono mt-1" style={{ color: "var(--ink-soft)" }}>
            Tất định theo seed: {runCount} task chạy (Run set) · {heldOutCount} task giữ lại (Held-out).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
            Tỷ lệ:
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="0.5"
              disabled={isLocked}
              value={heldOutRatio}
              onChange={(e) => onRatioChange(parseFloat(e.target.value) || 0.2)}
              className="w-20 px-2 py-1 text-xs font-mono border rounded outline-none disabled:opacity-50"
              style={inputStyle}
            />
          </label>

          <label className="flex items-center gap-2 text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
            Seed:
            <input
              type="text"
              disabled={isLocked}
              value={seed}
              onChange={(e) => onSeedChange(e.target.value)}
              className="w-40 px-2 py-1 text-xs font-mono border rounded outline-none disabled:opacity-50"
              style={inputStyle}
            />
          </label>

          <Button
            variant={isLocked ? "secondary" : "primary"}
            size="sm"
            disabled={isLocked || isLocking}
            onClick={onLock}
            className="gap-1.5"
          >
            {isLocked ? <Lock size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> : <ShieldCheck size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" />}
            <span>{isLocked ? "Đã đóng băng vĩnh viễn" : isLocking ? "Đang khóa..." : i18n.library.lockButton}</span>
          </Button>
        </div>
      </div>

      {message && (
        <div className="mt-3">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}
    </div>
  );
}

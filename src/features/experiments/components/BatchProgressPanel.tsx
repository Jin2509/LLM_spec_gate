"use client";

import { PenLine } from "lucide-react";
import React from "react";
import Link from "next/link";
import type { DisplayError, ExperimentProgress } from "@/lib/api";
import { Button } from "@/ui/primitives/Button";
import { ErrorState, MetricTile, Panel } from "@/ui/layout";

export interface BatchProgressPanelProps {
  progress: ExperimentProgress;
  isRunning: boolean;
  canStart: boolean;
  showHumanOracleLink: boolean;
  error?: DisplayError | null;
  onStart: () => void;
}

export function BatchProgressPanel({ progress, isRunning, canStart, showHumanOracleLink, error, onStart }: BatchProgressPanelProps) {
  return (
    <Panel
      testId="batch-progress-table"
      title={<>3. Tiến độ Batch Run &amp; Giám sát Luồng</>}
      aside={
        <Button data-testid="start-batch-btn" variant="primary" disabled={isRunning || !canStart} onClick={onStart}>
          {isRunning ? "Đang chạy Batch..." : "▶ Chạy Batch Thực nghiệm"}
        </Button>
      }
    >
      {error && <ErrorState {...error} />}

      {showHumanOracleLink && (
        <div
          data-testid="human-oracle-link-banner"
          className="p-3 rounded border flex items-center justify-between"
          style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--action)", borderWidth: "1.5px" }}
        >
          <div className="flex items-center gap-2">
            <PenLine size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" />
            <span>
              Chế độ Human Oracle đang chọn <strong>Người thật</strong>. Cần con người giải quyết các vé mâu thuẫn/chưa rõ.
            </span>
          </div>
          <Link
            href="/annotate"
            data-testid="go-to-annotate-link"
            className="px-3 py-1.5 rounded font-bold hover:underline flex items-center gap-2"
            style={{ backgroundColor: "var(--action)", color: "var(--paper-surface)", borderRadius: "var(--r-cell)" }}
          >
            <span>Mở Focus Mode Gán nhãn</span>
            <span className="px-1.5 rounded text-[11px]" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              {progress.pendingHumanTickets} thẻ chờ
            </span>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <MetricTile label="Tiến độ" value={`${progress.completed} / ${progress.total}`} />
        <MetricTile label="Qua (ACC)" value={progress.accCount} valueColor="var(--v-acc)" borderColor="var(--v-acc)" />
        <MetricTile label="Bác (REJ)" value={progress.rejCount} valueColor="var(--v-code)" borderColor="var(--v-code)" />
        <MetricTile label="UNKNOWN" value={progress.unknownCount} valueColor="var(--v-unknown)" borderColor="var(--v-unknown)" />
        <MetricTile label="Repair Thành công" value={progress.repairCount} valueColor="var(--action)" borderColor="var(--action)" />
        <MetricTile label="Thu hồi (Revoked)" value={progress.revocations} valueColor="var(--v-code)" borderColor="var(--v-code)" />
      </div>
    </Panel>
  );
}

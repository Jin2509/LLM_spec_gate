"use client";

import { MessageCircleQuestion, Play } from "lucide-react";
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
      title="Tiến độ"
      aside={
        <Button data-testid="start-batch-btn" variant="primary" disabled={isRunning || !canStart} onClick={onStart}>
          <Play size={15} aria-hidden="true" />
          {isRunning ? "Đang chạy..." : "Chạy thực nghiệm"}
        </Button>
      }
    >
      {error && <ErrorState {...error} />}

      {showHumanOracleLink && (
        <div
          data-testid="human-oracle-link-banner"
          className="px-4 py-3 rounded-[var(--radius-md)] border flex flex-wrap items-center justify-between gap-3 text-[13.5px]"
          style={{ backgroundColor: "var(--accent-soft)", borderColor: "var(--accent-line)" }}
        >
          <span className="flex items-center gap-2" style={{ color: "var(--ink)" }}>
            <MessageCircleQuestion size={16} aria-hidden="true" style={{ color: "var(--accent)" }} />
            Đang chọn <strong>người thật</strong> trả lời: các câu hỏi phát sinh sẽ nằm ở màn Hỏi người.
          </span>
          <Link
            href="/annotate"
            data-testid="go-to-annotate-link"
            className="inline-flex items-center gap-2 h-8 px-3 rounded-[var(--radius-sm)] font-medium"
            style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)" }}
          >
            Trả lời câu hỏi
            <span className="px-1.5 rounded-full text-[11.5px]" style={{ backgroundColor: "color-mix(in oklch, var(--on-accent) 22%, transparent)" }}>
              {progress.pendingHumanTickets} đang chờ
            </span>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricTile label="Đã xong" value={`${progress.completed} / ${progress.total}`} />
        <MetricTile label="Chấp nhận (ACC)" value={progress.accCount} valueColor="var(--v-acc)" />
        <MetricTile label="Bác bỏ (REJ)" value={progress.rejCount} valueColor="var(--v-code)" />
        <MetricTile label="Chưa kết luận" value={progress.unknownCount} valueColor="var(--v-unknown)" />
        <MetricTile label="Bản sửa đã triển khai" value={progress.repairCount} valueColor="var(--accent)" />
        <MetricTile label="Bản sửa bị thu hồi" value={progress.revocations} valueColor="var(--v-code)" />
      </div>
    </Panel>
  );
}

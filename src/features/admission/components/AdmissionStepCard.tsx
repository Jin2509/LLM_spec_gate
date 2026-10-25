"use client";

import { CircleCheck, Info, PenLine, Siren, TriangleAlert } from "lucide-react";
import React from "react";
import type { AdmissionStep } from "@/lib/api";
import { Button } from "@/ui/primitives/Button";
import { Badge } from "@/ui/layout";
import { i18n } from "@/i18n/vi";

export interface AdmissionStepCardProps {
  step: AdmissionStep;
  isReviewed: boolean;
  isMarking: boolean;
  onMarkForReview: (taskId: string) => void;
}

export function AdmissionStepCard({ step, isReviewed, isMarking, onMarkForReview }: AdmissionStepCardProps) {
  const violatedTaskId = step.hasViolation ? step.violatedTaskId : undefined;

  return (
    <div
      className="p-4 border rounded transition-all"
      style={{
        backgroundColor: violatedTaskId ? "var(--v-code-bg)" : "var(--paper-surface)",
        borderColor: violatedTaskId ? "var(--v-code)" : "var(--rule)",
        borderRadius: "var(--r-card)",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {violatedTaskId ? <TriangleAlert size={16} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" style={{ color: "var(--v-code)" }} /> : step.status === "passed" ? <CircleCheck size={16} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" style={{ color: "var(--v-acc)" }} /> : <Info size={16} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" style={{ color: "var(--ink-soft)" }} />}
            <h3 className="font-mono font-semibold text-sm" style={{ color: violatedTaskId ? "var(--v-code)" : "var(--ink)" }}>
              {step.title}
            </h3>
            {violatedTaskId && (
              <Badge tone="danger" className="uppercase text-[10px]">
                Vi phạm Anchor
              </Badge>
            )}
          </div>
          <p className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
            {step.description}
          </p>
          {step.details && (
            <p className="text-xs font-mono pt-1" style={{ color: violatedTaskId ? "var(--v-code)" : "var(--ink)" }}>
              → {step.details}
            </p>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {violatedTaskId &&
            (isReviewed ? (
              <Badge tone="success">✓ Đã đánh dấu để người kiểm lại</Badge>
            ) : (
              <Button
                variant="danger"
                size="sm"
                disabled={isMarking}
                onClick={() => onMarkForReview(violatedTaskId)}
                className="gap-1 shadow-sm"
              >
                <PenLine size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" />
                <span>{i18n.admission.markForReview}</span>
              </Button>
            ))}
          {step.slackRatio !== undefined && <Badge tone="warning">Slack: {step.slackRatio}%</Badge>}
          {step.silentFaultsCount !== undefined && <Badge tone="danger">{step.silentFaultsCount} Silent Faults</Badge>}
        </div>
      </div>

      {violatedTaskId && (
        <div
          className="mt-3 p-2.5 rounded border text-xs font-mono flex items-center gap-2"
          style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--v-code)", color: "var(--v-code)", borderRadius: "var(--r-cell)" }}
        >
          <Siren size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" />
          <span>
            <strong>{i18n.admission.violationAlert}</strong> Mẫu {violatedTaskId} đã bị loại khỏi Trust Base tự động.
          </span>
        </div>
      )}
    </div>
  );
}

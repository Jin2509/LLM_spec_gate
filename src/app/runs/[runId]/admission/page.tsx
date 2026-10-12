"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/ui/shell";
import { useRunEvents } from "@/features/runs/use-run-events";
import { Button } from "@/ui/primitives/Button";
import { i18n } from "@/i18n/vi";

interface AdmissionStepState {
  index: number;
  key: string;
  title: string;
  description: string;
  status: "idle" | "running" | "passed" | "warning" | "error";
  details?: string;
  hasViolation?: boolean;
  violatedTaskId?: string;
  silentFaultsCount?: number;
  silentFaultCases?: string[];
  slackRatio?: number;
}

const INITIAL_STEPS: AdmissionStepState[] = [
  {
    index: 1,
    key: "static_checker",
    title: i18n.admission.step1,
    description: "Kiểm tra cú pháp AST, an toàn kiểu và loại trừ các cấu trúc không xác định.",
    status: "passed",
    details: "12/12 task vượt qua kiểm tra AST tĩnh. Không có lỗi kiểu dữ liệu.",
  },
  {
    index: 2,
    key: "contract_runner",
    title: i18n.admission.step2,
    description: "Thực thi kiểm chứng tiền nghiệm và hậu nghiệm (pre/post-conditions).",
    status: "passed",
    details: "Tất cả contract đều thoả mãn ràng buộc miền giá trị hợp lệ.",
  },
  {
    index: 3,
    key: "anchor_cross_check",
    title: i18n.admission.step3,
    description: "So sánh chéo mệnh đề A2/A3 với tập đóng anchor (docstring ground truth).",
    status: "warning",
    hasViolation: true,
    violatedTaskId: "task_04 (find_valid_partition)",
    details: "Mệnh đề A2 cho phép nghiệm lệch so với tập đóng anchor gốc.",
  },
  {
    index: 4,
    key: "silent_fault_replay",
    title: i18n.admission.step4,
    description: "Chạy lại trace kiểm thử để phát hiện lỗi ngầm mà monitor bỏ sót.",
    status: "passed",
    silentFaultsCount: 2,
    silentFaultCases: ["case_spec_fault", "case_dual_fault"],
    details: "Đã phát hiện 2 ca SILENT_FAULT do monitor bỏ sót trong giai đoạn tiền thẩm định.",
  },
  {
    index: 5,
    key: "z3_property_verifier",
    title: i18n.admission.step5,
    description: "Bộ giải hình thức Z3 kiểm tra tính thỏa mãn và bảo toàn của mệnh đề A2.",
    status: "passed",
    details: "Z3 Solver: SAT & PROVEN. Không tìm thấy phản ví dụ logic trong tập A2.",
  },
  {
    index: 6,
    key: "bsynth_slack_measurement",
    title: i18n.admission.step6,
    description: "Bơm lỗi nhân tạo B_synth để đo độ lỏng lẻo của đặc tả monitor P0.",
    status: "passed",
    slackRatio: 16.7,
    details: "Độ lỏng monitor P_0: 16.7% (2/12 ca lọt qua bộ lọc B_synth).",
  },
];

function AdmissionContent() {
  const params = useParams();
  const runId = (params?.runId as string) || "run_evalplus_01";

  const { isConnected } = useRunEvents({
    runId,
    batchIntervalMs: 250,
  });

  const [steps] = useState<AdmissionStepState[]>(INITIAL_STEPS);
  const [reviewedTasks, setReviewedTasks] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);

  const handleMarkForReview = (taskId: string) => {
    setReviewedTasks((prev) => new Set([...prev, taskId]));
  };

  const handleRunAdmission = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
    }, 800);
  };

  return (
    <AppShell currentRunId={runId}>
      <div className="space-y-6">
        {/* Header */}
        <div
          className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{ borderColor: "var(--rule)" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                {i18n.admission.title}
              </h1>
              <span
                className="px-2 py-0.5 text-xs font-mono font-semibold rounded border"
                style={{
                  backgroundColor: isConnected ? "var(--v-acc-bg)" : "var(--v-neutral-bg)",
                  borderColor: isConnected ? "var(--v-acc)" : "var(--rule)",
                  color: isConnected ? "var(--v-acc)" : "var(--ink-soft)",
                  borderRadius: "var(--r-cell)",
                }}
              >
                {isConnected ? "● SSE Live" : "○ Offline"}
              </span>
            </div>
            <p className="text-xs font-mono mt-1" style={{ color: "var(--ink-soft)" }}>
              Lượt chạy: {runId} · {i18n.admission.subtitle}
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            disabled={isRunning}
            onClick={handleRunAdmission}
            className="gap-2 shrink-0"
          >
            <span>{isRunning ? "⏳" : "▶"}</span>
            <span>{isRunning ? "Đang kiểm nạp..." : i18n.admission.runAdmission}</span>
          </Button>
        </div>

        {/* Admission Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="p-3.5 border rounded shadow-sm"
            style={{
              backgroundColor: "var(--paper-surface)",
              borderColor: "var(--rule)",
              borderRadius: "var(--r-card)",
            }}
          >
            <div className="text-[11px] font-mono" style={{ color: "var(--ink-soft)" }}>
              {i18n.admission.slackRatio}
            </div>
            <div className="text-2xl font-mono font-bold mt-1" style={{ color: "var(--v-spec)" }}>
              16.7%
            </div>
            <div className="text-[11px] font-mono mt-1 opacity-70">
              2 / 12 ca lọt qua $B_{'{'}synth{'}'}$
            </div>
          </div>

          <div
            className="p-3.5 border rounded shadow-sm"
            style={{
              backgroundColor: "var(--paper-surface)",
              borderColor: "var(--rule)",
              borderRadius: "var(--r-card)",
            }}
          >
            <div className="text-[11px] font-mono" style={{ color: "var(--ink-soft)" }}>
              {i18n.admission.silentFaultsDetected}
            </div>
            <div className="text-2xl font-mono font-bold mt-1" style={{ color: "var(--v-code)" }}>
              2 ca
            </div>
            <div className="text-[11px] font-mono mt-1 opacity-70">
              case_spec_fault, case_dual_fault
            </div>
          </div>

          <div
            className="p-3.5 border rounded shadow-sm"
            style={{
              backgroundColor: "var(--paper-surface)",
              borderColor: "var(--rule)",
              borderRadius: "var(--r-card)",
            }}
          >
            <div className="text-[11px] font-mono" style={{ color: "var(--ink-soft)" }}>
              Trạng thái Trust Base
            </div>
            <div className="text-2xl font-mono font-bold mt-1" style={{ color: "var(--v-acc)" }}>
              11 / 12 Task
            </div>
            <div className="text-[11px] font-mono mt-1 opacity-70">
              1 task bị loại do vi phạm anchor
            </div>
          </div>
        </div>

        {/* 6-Step Checklist */}
        <div className="space-y-4">
          <h2 className="text-sm font-mono font-semibold" style={{ color: "var(--ink)" }}>
            Bảng Kiểm tra 6 Bước Toàn Cảnh
          </h2>

          <div className="space-y-3">
            {steps.map((step) => {
              const isViolated = step.hasViolation && step.violatedTaskId;
              const isReviewed = isViolated && reviewedTasks.has(step.violatedTaskId || "");

              return (
                <div
                  key={step.key}
                  className="p-4 border rounded transition-all"
                  style={{
                    backgroundColor: isViolated
                      ? "var(--v-code-bg)"
                      : "var(--paper-surface)",
                    borderColor: isViolated
                      ? "var(--v-code)"
                      : "var(--rule)",
                    borderRadius: "var(--r-card)",
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {step.status === "passed" && !isViolated
                            ? "✅"
                            : isViolated
                              ? "⚠️"
                              : "ℹ️"}
                        </span>
                        <h3
                          className="font-mono font-semibold text-sm"
                          style={{
                            color: isViolated ? "var(--v-code)" : "var(--ink)",
                          }}
                        >
                          {step.title}
                        </h3>

                        {isViolated && (
                          <span
                            className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border"
                            style={{
                              backgroundColor: "var(--paper-surface)",
                              borderColor: "var(--v-code)",
                              color: "var(--v-code)",
                              borderRadius: "var(--r-cell)",
                            }}
                          >
                            Vi phạm Anchor
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
                        {step.description}
                      </p>

                      {step.details && (
                        <p
                          className="text-xs font-mono pt-1"
                          style={{
                            color: isViolated ? "var(--v-code)" : "var(--ink)",
                          }}
                        >
                          → {step.details}
                        </p>
                      )}
                    </div>

                    {/* Step specific action or badges */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isViolated && step.violatedTaskId && (
                        <div>
                          {isReviewed ? (
                            <span
                              className="px-2.5 py-1 text-xs font-mono font-semibold rounded border"
                              style={{
                                backgroundColor: "var(--v-acc-bg)",
                                borderColor: "var(--v-acc)",
                                color: "var(--v-acc)",
                                borderRadius: "var(--r-cell)",
                              }}
                            >
                              ✓ Đã đánh dấu để người kiểm lại
                            </span>
                          ) : (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleMarkForReview(step.violatedTaskId!)}
                              className="gap-1 shadow-sm"
                            >
                              <span>✏️</span>
                              <span>{i18n.admission.markForReview}</span>
                            </Button>
                          )}
                        </div>
                      )}

                      {step.slackRatio !== undefined && (
                        <span
                          className="px-2 py-0.5 text-xs font-mono font-bold rounded border"
                          style={{
                            backgroundColor: "var(--v-spec-bg)",
                            borderColor: "var(--v-spec)",
                            color: "var(--v-spec)",
                            borderRadius: "var(--r-cell)",
                          }}
                        >
                          Slack: {step.slackRatio}%
                        </span>
                      )}

                      {step.silentFaultsCount !== undefined && (
                        <span
                          className="px-2 py-0.5 text-xs font-mono font-bold rounded border"
                          style={{
                            backgroundColor: "var(--v-code-bg)",
                            borderColor: "var(--v-code)",
                            color: "var(--v-code)",
                            borderRadius: "var(--r-cell)",
                          }}
                        >
                          {step.silentFaultsCount} Silent Faults
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Red Alert Banner if Violated */}
                  {isViolated && (
                    <div
                      className="mt-3 p-2.5 rounded border text-xs font-mono flex items-center justify-between"
                      style={{
                        backgroundColor: "var(--paper-surface)",
                        borderColor: "var(--v-code)",
                        color: "var(--v-code)",
                        borderRadius: "var(--r-cell)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span>🚨</span>
                        <span>
                          <strong>{i18n.admission.violationAlert}</strong> Mẫu {step.violatedTaskId} đã bị loại khỏi Trust Base tự động.
                        </span>
                      </div>
                      <span className="text-[11px] underline cursor-pointer opacity-80">
                        Chi tiết sai lệch
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function AdmissionPage() {
  return (
    <React.Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center font-mono text-xs opacity-60"
          style={{ backgroundColor: "var(--paper-ground)", color: "var(--ink)" }}
        >
          Đang tải kiểm nạp...
        </div>
      }
    >
      <AdmissionContent />
    </React.Suspense>
  );
}

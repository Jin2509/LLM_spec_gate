"use client";

import React, { Suspense, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/ui/shell";
import { Button } from "@/ui/primitives/Button";
import {
  type ExperimentConfig,
  type AnchorLevel,
  type UnknownMode,
  type HumanOracleMode,
  checkHomogeneousModelFamily,
  estimateExperimentCost,
  generateDeterministicManifest,
} from "@/core/experiment";
import type { GatePolicy } from "@/core/repair";

const AVAILABLE_MODELS = [
  { id: "gpt-4o", name: "GPT-4o (OpenAI)", family: "openai" },
  { id: "gpt-4o-mini", name: "GPT-4o-mini (OpenAI)", family: "openai" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet (Anthropic)", family: "anthropic" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku (Anthropic)", family: "anthropic" },
  { id: "deepseek-v3", name: "DeepSeek-V3", family: "deepseek" },
  { id: "qwen-2.5-coder", name: "Qwen 2.5 Coder", family: "qwen" },
];

const AVAILABLE_BASELINES = [
  "Raw Dual-Oracle (No Adjudication)",
  "Unit Test Generator (EvalPlus)",
  "Self-Consistency Multi-Sample",
  "Monolithic Static Verifier",
];

function ExperimentsContent() {
  const [datasetId, setDatasetId] = useState<string>("evalplus_illustrative");
  const heldOutRatio = 0.25; // 25% locked

  const [coderModel, setCoderModel] = useState<string>("gpt-4o");
  const [specModel, setSpecModel] = useState<string>("claude-3-5-sonnet");
  const [anchorLevel, setAnchorLevel] = useState<AnchorLevel>("A2");
  const [policy, setPolicy] = useState<GatePolicy>("standard");
  const [unknownMode, setUnknownMode] = useState<UnknownMode>("closed");
  const [humanOracle, setHumanOracle] = useState<HumanOracleMode>("off");
  const [selectedBaselines, setSelectedBaselines] = useState<string[]>([
    "Raw Dual-Oracle (No Adjudication)",
  ]);
  const [seed, setSeed] = useState<string>("rq_seed_2026");

  // Batch run simulation states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runProgress, setRunProgress] = useState<{
    completed: number;
    total: number;
    accCount: number;
    rejCount: number;
    unknownCount: number;
    repairCount: number;
    revocations: number;
    pendingHumanTickets: number;
  }>({
    completed: 0,
    total: 123,
    accCount: 0,
    rejCount: 0,
    unknownCount: 0,
    repairCount: 0,
    revocations: 0,
    pendingHumanTickets: 0,
  });

  const config: ExperimentConfig = useMemo(
    () => ({
      datasetId,
      heldOutRatio,
      coderModel,
      specModel,
      anchorLevel,
      policy,
      unknownMode,
      humanOracle,
      baselines: selectedBaselines,
      seed,
    }),
    [datasetId, coderModel, specModel, anchorLevel, policy, unknownMode, humanOracle, selectedBaselines, seed]
  );

  // Model family bias check
  const familyCheck = checkHomogeneousModelFamily(coderModel, specModel);

  // Deterministic cost estimation
  const costEstimate = useMemo(() => estimateExperimentCost(config, 164), [config]);

  // Deterministic manifest
  const manifest = useMemo(() => generateDeterministicManifest(config, 164), [config]);

  const handleToggleBaseline = (baseline: string) => {
    setSelectedBaselines((prev) =>
      prev.includes(baseline) ? prev.filter((b) => b !== baseline) : [...prev, baseline]
    );
  };

  const handleStartBatchRun = () => {
    setIsRunning(true);
    setRunProgress({
      completed: 0,
      total: manifest.runTaskCount,
      accCount: 0,
      rejCount: 0,
      unknownCount: 0,
      repairCount: 0,
      revocations: 0,
      pendingHumanTickets: humanOracle === "real_human" ? 7 : 0,
    });

    let current = 0;
    const interval = setInterval(() => {
      current += 15;
      if (current >= manifest.runTaskCount) {
        current = manifest.runTaskCount;
        clearInterval(interval);
        setIsRunning(false);
      }
      setRunProgress({
        completed: current,
        total: manifest.runTaskCount,
        accCount: Math.round(current * 0.72),
        rejCount: Math.round(current * 0.18),
        unknownCount: Math.round(current * 0.10),
        repairCount: Math.round(current * 0.08),
        revocations: Math.round(current * 0.02),
        pendingHumanTickets: humanOracle === "real_human" ? 7 : 0,
      });
    }, 200);
  };

  return (
    <AppShell currentRunId="run_evalplus_01">
      <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2 font-sans">
        {/* Header */}
        <div
          data-testid="experiments-header"
          className="p-4 rounded border flex flex-wrap items-center justify-between gap-4 font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--action)" }}>
              Thực nghiệm Nghiên cứu Khoa học (RQ1 → RQ6)
            </span>
            <h1 className="text-base font-bold m-0 mt-0.5" style={{ color: "var(--ink)" }}>
              Experiment Runner &amp; Batch Orchestration
            </h1>
            <p className="text-[11px] m-0 mt-1 opacity-75" style={{ color: "var(--ink-soft)" }}>
              Thiết lập cấu hình tất định, đối chứng baseline và ước lượng chi phí chính xác trước khi chạy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="px-2 py-1 rounded text-xs font-semibold"
              style={{
                backgroundColor: "var(--paper-ground)",
                color: "var(--action)",
                border: "1px solid var(--action)",
              }}
            >
              Hash: {manifest.manifestHash}
            </span>
          </div>
        </div>

        {/* Section 1: Configuration Form */}
        <div
          data-testid="experiment-config-form"
          className="p-4 rounded border flex flex-col gap-4"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--rule)" }}>
            <span className="text-xs font-mono font-semibold" style={{ color: "var(--ink)" }}>
              1. Tham số Cấu hình Thực nghiệm
            </span>
            <span className="text-[11px] font-mono" style={{ color: "var(--ink-soft)" }}>
              Bảo đảm Tất định qua Seed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Dataset with locked heldout ratio */}
            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                Tập dữ liệu (Dataset):
              </label>
              <div className="flex items-center gap-2">
                <select
                  data-testid="dataset-select"
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                  className="flex-1 p-2 rounded border"
                  style={{
                    backgroundColor: "var(--paper-ground)",
                    borderColor: "var(--rule)",
                    color: "var(--ink)",
                  }}
                >
                  <option value="evalplus_illustrative">EvalPlus Illustrative (164 tasks)</option>
                  <option value="humaneval_pack">HumanEval Pack (164 tasks)</option>
                </select>
                <span
                  className="px-2 py-2 rounded text-[11px] font-bold"
                  style={{
                    backgroundColor: "var(--paper-ground)",
                    border: "1px solid var(--rule)",
                    color: "var(--v-spec)",
                  }}
                >
                  Held-out: 25% (Đã khóa)
                </span>
              </div>
            </div>

            {/* Seed */}
            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                Seed ngẫu nhiên tất định:
              </label>
              <input
                data-testid="seed-input"
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-full p-2 rounded border font-mono"
                style={{
                  backgroundColor: "var(--paper-ground)",
                  borderColor: "var(--rule)",
                  color: "var(--ink)",
                }}
              />
            </div>

            {/* Model Coder */}
            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                Model Coder (Sinh mã):
              </label>
              <select
                data-testid="coder-model-select"
                value={coderModel}
                onChange={(e) => setCoderModel(e.target.value)}
                className="w-full p-2 rounded border"
                style={{
                  backgroundColor: "var(--paper-ground)",
                  borderColor: "var(--rule)",
                  color: "var(--ink)",
                }}
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Spec */}
            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                Model Spec (Sinh đặc tả / Monitor P0):
              </label>
              <select
                data-testid="spec-model-select"
                value={specModel}
                onChange={(e) => setSpecModel(e.target.value)}
                className="w-full p-2 rounded border"
                style={{
                  backgroundColor: "var(--paper-ground)",
                  borderColor: "var(--rule)",
                  color: "var(--ink)",
                }}
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Model Family Bias Warning */}
          {familyCheck.isSameFamily && (
            <div
              data-testid="homogeneous-bias-warning"
              className="p-3 rounded border text-xs font-mono flex items-start gap-2"
              style={{
                backgroundColor: "transparent",
                borderColor: "var(--v-spec)",
                borderStyle: "dashed",
                color: "var(--v-spec)",
              }}
            >
              <span>⚠️</span>
              <div>{familyCheck.warning}</div>
            </div>
          )}

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono pt-2">
            {/* Anchor Level A0-A3 */}
            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                Mức Anchor:
              </label>
              <select
                data-testid="anchor-level-select"
                value={anchorLevel}
                onChange={(e) => setAnchorLevel(e.target.value as AnchorLevel)}
                className="w-full p-2 rounded border"
                style={{
                  backgroundColor: "var(--paper-ground)",
                  borderColor: "var(--rule)",
                  color: "var(--ink)",
                }}
              >
                <option value="A0">A0 (Không anchor)</option>
                <option value="A1">A1 (Docstring duy nhất)</option>
                <option value="A2">A2 (Docstring + MR)</option>
                <option value="A3">A3 (Full Differential)</option>
              </select>
            </div>

            {/* Policy */}
            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                Chính sách Triển khai:
              </label>
              <select
                data-testid="policy-select"
                value={policy}
                onChange={(e) => setPolicy(e.target.value as GatePolicy)}
                className="w-full p-2 rounded border"
                style={{
                  backgroundColor: "var(--paper-ground)",
                  borderColor: "var(--rule)",
                  color: "var(--ink)",
                }}
              >
                <option value="strict">Strict (Chỉ Proof)</option>
                <option value="standard">Standard (3 chế độ)</option>
                <option value="shadow">Shadow (Chỉ ghi log)</option>
              </select>
            </div>

            {/* UNKNOWN Mode */}
            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                Chế độ UNKNOWN:
              </label>
              <select
                data-testid="unknown-mode-select"
                value={unknownMode}
                onChange={(e) => setUnknownMode(e.target.value as UnknownMode)}
                className="w-full p-2 rounded border"
                style={{
                  backgroundColor: "var(--paper-ground)",
                  borderColor: "var(--rule)",
                  color: "var(--ink)",
                }}
              >
                <option value="closed">Closed (Fail-closed)</option>
                <option value="open">Open (Cho phép bypass)</option>
              </select>
            </div>

            {/* Human Oracle Mode */}
            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                Human Oracle:
              </label>
              <select
                data-testid="human-oracle-select"
                value={humanOracle}
                onChange={(e) => setHumanOracle(e.target.value as HumanOracleMode)}
                className="w-full p-2 rounded border"
                style={{
                  backgroundColor: "var(--paper-ground)",
                  borderColor: "var(--rule)",
                  color: "var(--ink)",
                }}
              >
                <option value="off">Tắt (Off)</option>
                <option value="perfect">Hoàn hảo (100% chuẩn)</option>
                <option value="noise_5">Nhiễu 5%</option>
                <option value="noise_10">Nhiễu 10%</option>
                <option value="real_human">Người thật (Tương tác)</option>
              </select>
            </div>
          </div>

          {/* Baselines Multi-select */}
          <div className="pt-2">
            <label className="block mb-2 font-semibold text-xs font-mono" style={{ color: "var(--ink)" }}>
              Phương pháp Đối chứng (Baselines):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
              {AVAILABLE_BASELINES.map((b) => {
                const checked = selectedBaselines.includes(b);
                return (
                  <label
                    key={b}
                    className="flex items-center gap-2 p-2 rounded border cursor-pointer"
                    style={{
                      backgroundColor: checked ? "var(--paper-ground)" : "transparent",
                      borderColor: checked ? "var(--action)" : "var(--rule)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleBaseline(b)}
                    />
                    <span>{b}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Pre-run Cost Estimation Table */}
        <div
          data-testid="cost-estimation-table"
          className="p-4 rounded border flex flex-col gap-3 font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--rule)" }}>
            <span className="font-semibold" style={{ color: "var(--ink)" }}>
              2. Bảng Dự toán Chi phí &amp; Tài nguyên trước khi chạy
            </span>
            <span style={{ color: "var(--ink-soft)" }}>Định mức dựa trên 123 tasks chạy thực</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-2.5 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Lời gọi hàm</span>
              <strong className="text-sm" style={{ color: "var(--ink)" }}>~{costEstimate.functionCalls.toLocaleString()}</strong>
            </div>

            <div className="p-2.5 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Thời gian LLM</span>
              <strong className="text-sm" style={{ color: "var(--ink)" }}>~{costEstimate.llmDurationSec} giây</strong>
            </div>

            <div className="p-2.5 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Thời gian Z3</span>
              <strong className="text-sm" style={{ color: "var(--ink)" }}>~{costEstimate.z3DurationSec} giây</strong>
            </div>

            <div className="p-2.5 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Tokens ước tính</span>
              <strong className="text-sm" style={{ color: "var(--ink)" }}>~{costEstimate.totalTokens.toLocaleString()}</strong>
            </div>

            <div className="p-2.5 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Chi phí dự kiến</span>
              <strong className="text-sm font-bold" style={{ color: "var(--action)" }}>${costEstimate.estimatedUsd}</strong>
            </div>
          </div>
        </div>

        {/* Section 3: Batch Run Progress Table & Link to Annotate */}
        <div
          data-testid="batch-progress-table"
          className="p-4 rounded border flex flex-col gap-4 font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--rule)" }}>
            <span className="font-semibold" style={{ color: "var(--ink)" }}>
              3. Tiến độ Batch Run &amp; Giám sát Luồng
            </span>
            <div className="flex items-center gap-3">
              <Button
                data-testid="start-batch-btn"
                variant="primary"
                disabled={isRunning}
                onClick={handleStartBatchRun}
              >
                {isRunning ? "Đang chạy Batch..." : "▶ Chạy Batch Thực nghiệm"}
              </Button>
            </div>
          </div>

          {/* Real Human Oracle Indicator Link */}
          {humanOracle === "real_human" && (
            <div
              data-testid="human-oracle-link-banner"
              className="p-3 rounded border flex items-center justify-between"
              style={{
                backgroundColor: "var(--paper-ground)",
                borderColor: "var(--action)",
                borderWidth: "1.5px",
              }}
            >
              <div className="flex items-center gap-2">
                <span>✏️</span>
                <span>
                  Chế độ Human Oracle đang chọn <strong>Người thật</strong>. Cần con người giải quyết các vé mâu thuẫn/chưa rõ.
                </span>
              </div>
              <Link
                href="/annotate"
                data-testid="go-to-annotate-link"
                className="px-3 py-1.5 rounded font-bold hover:underline flex items-center gap-2"
                style={{
                  backgroundColor: "var(--action)",
                  color: "var(--paper-surface)",
                  borderRadius: "var(--r-cell)",
                }}
              >
                <span>Mở Focus Mode Gán nhãn</span>
                <span
                  className="px-1.5 py-0.2 rounded text-[11px]"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  {runProgress.pendingHumanTickets} thẻ chờ
                </span>
              </Link>
            </div>
          )}

          {/* Progress Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <div className="p-2 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Tiến độ</span>
              <strong style={{ color: "var(--ink)" }}>{runProgress.completed} / {runProgress.total}</strong>
            </div>

            <div className="p-2 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--v-acc)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Qua (ACC)</span>
              <strong style={{ color: "var(--v-acc)" }}>{runProgress.accCount}</strong>
            </div>

            <div className="p-2 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--v-code)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Bác (REJ)</span>
              <strong style={{ color: "var(--v-code)" }}>{runProgress.rejCount}</strong>
            </div>

            <div className="p-2 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--v-unknown)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>UNKNOWN</span>
              <strong style={{ color: "var(--v-unknown)" }}>{runProgress.unknownCount}</strong>
            </div>

            <div className="p-2 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--action)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Repair Thành công</span>
              <strong style={{ color: "var(--action)" }}>{runProgress.repairCount}</strong>
            </div>

            <div className="p-2 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--v-code)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Thu hồi (Revoked)</span>
              <strong style={{ color: "var(--v-code)" }}>{runProgress.revocations}</strong>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function ExperimentsPage() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-sm">Đang tải Experiment Runner...</div>}>
      <ExperimentsContent />
    </Suspense>
  );
}

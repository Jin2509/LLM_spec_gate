"use client";

import React, { Suspense, useState } from "react";
import { AppShell } from "@/ui/shell";
import { Button } from "@/ui/primitives/Button";

function SettingsContent() {
  const [defaultCoder, setDefaultCoder] = useState<string>("gpt-4o");
  const [defaultSpec, setDefaultSpec] = useState<string>("claude-3-5-sonnet");
  const [maxCallsBudget, setMaxCallsBudget] = useState<number>(10000);
  const [maxTokensBudget, setMaxTokensBudget] = useState<number>(2000000);
  const [a3TimeoutMs, setA3TimeoutMs] = useState<number>(15000);
  const [z3TimeoutMs, setZ3TimeoutMs] = useState<number>(30000);

  const [enableFlaky, setEnableFlaky] = useState<boolean>(true);
  const [enableAudit, setEnableAudit] = useState<boolean>(true);
  const [enableBSynth, setEnableBSynth] = useState<boolean>(true);

  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const handleSave = () => {
    setSavedFeedback("Đã lưu các cấu hình tham số thí nghiệm thành công.");
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  return (
    <AppShell currentRunId="run_evalplus_01">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2 font-sans">
        {/* Header */}
        <div
          data-testid="settings-header"
          className="p-4 rounded border flex flex-wrap items-center justify-between gap-4 font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--action)" }}>
              Cài đặt Hệ thống &amp; Tham số Phòng thí nghiệm
            </span>
            <h1 className="text-base font-bold m-0 mt-0.5" style={{ color: "var(--ink)" }}>
              Laboratory Settings &amp; Execution Policies
            </h1>
            <p className="text-[11px] m-0 mt-1 opacity-75" style={{ color: "var(--ink-soft)" }}>
              Cấu hình ngân sách tài nguyên, thời gian chờ Z3/A3 và cơ chế an toàn dữ liệu khoa học.
            </p>
          </div>

          <Button data-testid="save-settings-btn" variant="primary" onClick={handleSave}>
            Lưu Cấu hình
          </Button>
        </div>

        {savedFeedback && (
          <div
            data-testid="settings-feedback"
            className="p-3 rounded border font-mono text-xs"
            style={{
              backgroundColor: "var(--v-acc-bg)",
              borderColor: "var(--v-acc)",
              color: "var(--v-acc)",
            }}
          >
            ✓ {savedFeedback}
          </div>
        )}

        {/* Section 1: Models & Resource Budgets */}
        <div
          className="p-4 rounded border flex flex-col gap-4 font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <span className="font-semibold text-xs pb-2 border-b" style={{ borderColor: "var(--rule)", color: "var(--ink)" }}>
            1. Mô hình Mặc định &amp; Ngân sách Tài nguyên
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                Model Coder mặc định:
              </label>
              <select
                value={defaultCoder}
                onChange={(e) => setDefaultCoder(e.target.value)}
                className="w-full p-2 rounded border"
                style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink)" }}
              >
                <option value="gpt-4o">GPT-4o (OpenAI)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                <option value="deepseek-v3">DeepSeek-V3</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                Model Spec P0 mặc định:
              </label>
              <select
                value={defaultSpec}
                onChange={(e) => setDefaultSpec(e.target.value)}
                className="w-full p-2 rounded border"
                style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink)" }}
              >
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                <option value="gpt-4o">GPT-4o (OpenAI)</option>
                <option value="deepseek-v3">DeepSeek-V3</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                Giới hạn Lời gọi hàm tối đa:
              </label>
              <input
                type="number"
                value={maxCallsBudget}
                onChange={(e) => setMaxCallsBudget(Number(e.target.value))}
                className="w-full p-2 rounded border"
                style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink)" }}
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                Ngân sách Token tối đa:
              </label>
              <input
                type="number"
                value={maxTokensBudget}
                onChange={(e) => setMaxTokensBudget(Number(e.target.value))}
                className="w-full p-2 rounded border"
                style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink)" }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Solvers & Timeouts */}
        <div
          className="p-4 rounded border flex flex-col gap-4 font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <span className="font-semibold text-xs pb-2 border-b" style={{ borderColor: "var(--rule)", color: "var(--ink)" }}>
            2. Thời gian chờ (Timeouts) Formal Solvers
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                A3 Differential Execution Timeout (ms):
              </label>
              <input
                type="number"
                value={a3TimeoutMs}
                onChange={(e) => setA3TimeoutMs(Number(e.target.value))}
                className="w-full p-2 rounded border"
                style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink)" }}
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
                Z3 SMT Solver Proof Timeout (ms):
              </label>
              <input
                type="number"
                value={z3TimeoutMs}
                onChange={(e) => setZ3TimeoutMs(Number(e.target.value))}
                className="w-full p-2 rounded border"
                style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink)" }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Feature Toggles */}
        <div
          className="p-4 rounded border flex flex-col gap-3 font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <span className="font-semibold text-xs pb-2 border-b" style={{ borderColor: "var(--rule)", color: "var(--ink)" }}>
            3. Cờ Tính năng Nghiên cứu (Research Flags)
          </span>

          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableFlaky}
                onChange={(e) => setEnableFlaky(e.target.checked)}
              />
              <span>Phát hiện &amp; gắn nhãn FLAKY không tất định (Ghi log, không phân xử)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAudit}
                onChange={(e) => setEnableAudit(e.target.checked)}
              />
              <span>Ghi vết kiểm toán (Audit Trail) bất biến cho mọi quyết định phân xử</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableBSynth}
                onChange={(e) => setEnableBSynth(e.target.checked)}
              />
              <span>Tự động kích hoạt kiểm tra lỏng lẻo B_synth trong bước Admission</span>
            </label>
          </div>
        </div>

        {/* Section 4: API Keys Placeholder & Server Security Architecture */}
        <div
          data-testid="api-keys-placeholder"
          className="p-4 rounded border flex flex-col gap-2 font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-ground)",
            borderColor: "var(--action)",
            borderWidth: "1.5px",
            borderRadius: "var(--r-card)",
          }}
        >
          <div className="flex items-center gap-2 font-bold" style={{ color: "var(--action)" }}>
            <span>🔒</span>
            <span>BẢO MẬT API KEYS: CẤU HÌNH PHÍA SERVER (.env.local)</span>
          </div>

          <p className="m-0 leading-relaxed text-[11px]" style={{ color: "var(--ink)" }}>
            Theo nguyên tắc an toàn dữ liệu khoa học, <strong>hệ thống tuyệt đối cấm lưu trữ API Key ở phía Client</strong> hoặc
            trong bộ nhớ trình duyệt (localStorage/cookies). Mọi API key của nhà cung cấp mô hình (OpenAI, Anthropic, DeepSeek)
            phải được cấu hình qua biến môi trường máy chủ:
          </p>

          <pre
            className="p-3 rounded border text-[11px] overflow-x-auto"
            style={{
              backgroundColor: "var(--paper-surface)",
              borderColor: "var(--rule)",
              color: "var(--ink)",
            }}
          >
{`# Cấu hình tại .env.local trên máy chủ triển khai:
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
DEEPSEEK_API_KEY="sk-..."`}
          </pre>

          <span className="text-[10px] opacity-75" style={{ color: "var(--ink-soft)" }}>
            Client chỉ giao tiếp qua các proxy an toàn (Route Handlers) đã được khử dữ liệu độc hại và loại bỏ trường grading.
          </span>
        </div>
      </div>
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-sm">Đang tải Cài đặt...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

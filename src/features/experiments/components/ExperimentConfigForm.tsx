"use client";

import { TriangleAlert } from "lucide-react";
import React from "react";
import type { AnchorLevel, ExperimentConfig, HumanOracleMode, UnknownMode } from "@/core/experiment";
import type { GatePolicy } from "@/core/repair";
import type { ExperimentOptionsResponse } from "@/lib/api";
import { Notice, Panel } from "@/ui/layout";

export type EditableExperimentConfig = Omit<ExperimentConfig, "baselines"> & { baselines: string[] };

const fieldStyle: React.CSSProperties = { backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink)" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Select<T extends string>({
  testId,
  value,
  onChange,
  options,
}: {
  testId: string;
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <select data-testid={testId} value={value} onChange={(e) => onChange(e.target.value as T)} className="w-full p-2 rounded border" style={fieldStyle}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export interface ExperimentConfigFormProps {
  config: EditableExperimentConfig;
  options: ExperimentOptionsResponse;
  familyWarning?: string;
  onChange: (config: EditableExperimentConfig) => void;
}

export function ExperimentConfigForm({ config, options, familyWarning, onChange }: ExperimentConfigFormProps) {
  const set = <K extends keyof EditableExperimentConfig>(key: K, value: EditableExperimentConfig[K]) => onChange({ ...config, [key]: value });
  const models = options.models.map((m) => ({ value: m.id, label: m.name }));
  const dataset = options.datasets.find((d) => d.id === config.datasetId);

  const toggleBaseline = (baseline: string) =>
    set("baselines", config.baselines.includes(baseline) ? config.baselines.filter((b) => b !== baseline) : [...config.baselines, baseline]);

  return (
    <Panel testId="experiment-config-form" title="1. Tham số Cấu hình Thực nghiệm" aside="Bảo đảm Tất định qua Seed">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tập dữ liệu (Dataset):">
          <div className="flex items-center gap-2">
            <Select
              testId="dataset-select"
              value={config.datasetId}
              onChange={(v) => set("datasetId", v)}
              options={options.datasets.map((d) => ({ value: d.id, label: d.name }))}
            />
            {dataset && (
              <span className="px-2 py-2 rounded text-[11px] font-bold shrink-0" style={{ ...fieldStyle, border: "1px solid var(--rule)", color: "var(--v-spec)" }}>
                Held-out: {Math.round(dataset.heldOutRatio * 100)}% {dataset.isHeldOutLocked ? "(Đã khóa)" : ""}
              </span>
            )}
          </div>
        </Field>
        <Field label="Seed ngẫu nhiên tất định:">
          <input data-testid="seed-input" type="text" value={config.seed} onChange={(e) => set("seed", e.target.value)} className="w-full p-2 rounded border font-mono" style={fieldStyle} />
        </Field>
        <Field label="Model Coder (Sinh mã):">
          <Select testId="coder-model-select" value={config.coderModel} onChange={(v) => set("coderModel", v)} options={models} />
        </Field>
        <Field label="Model Spec (Sinh đặc tả / Monitor P0):">
          <Select testId="spec-model-select" value={config.specModel} onChange={(v) => set("specModel", v)} options={models} />
        </Field>
      </div>

      {familyWarning && (
        <Notice tone="warning" dashed testId="homogeneous-bias-warning">
          <TriangleAlert size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> {familyWarning}
        </Notice>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
        <Field label="Mức Anchor:">
          <Select<AnchorLevel>
            testId="anchor-level-select"
            value={config.anchorLevel}
            onChange={(v) => set("anchorLevel", v)}
            options={[
              { value: "A0", label: "A0 (Không anchor)" },
              { value: "A1", label: "A1 (Docstring duy nhất)" },
              { value: "A2", label: "A2 (Docstring + MR)" },
              { value: "A3", label: "A3 (Full Differential)" },
            ].filter((o) => options.anchorLevels.includes(o.value as AnchorLevel))}
          />
        </Field>
        <Field label="Chính sách Triển khai:">
          <Select<GatePolicy>
            testId="policy-select"
            value={config.policy}
            onChange={(v) => set("policy", v)}
            options={[
              { value: "strict", label: "Strict (Chỉ Proof)" },
              { value: "standard", label: "Standard (3 chế độ)" },
              { value: "shadow", label: "Shadow (Chỉ ghi log)" },
            ]}
          />
        </Field>
        <Field label="Chế độ UNKNOWN:">
          <Select<UnknownMode>
            testId="unknown-mode-select"
            value={config.unknownMode}
            onChange={(v) => set("unknownMode", v)}
            options={[
              { value: "closed", label: "Closed (Fail-closed)" },
              { value: "open", label: "Open (Cho phép bypass)" },
            ]}
          />
        </Field>
        <Field label="Human Oracle:">
          <Select<HumanOracleMode>
            testId="human-oracle-select"
            value={config.humanOracle}
            onChange={(v) => set("humanOracle", v)}
            options={[
              { value: "off", label: "Tắt (Off)" },
              { value: "perfect", label: "Hoàn hảo (100% chuẩn)" },
              { value: "noise_5", label: "Nhiễu 5%" },
              { value: "noise_10", label: "Nhiễu 10%" },
              { value: "real_human", label: "Người thật (Tương tác)" },
            ]}
          />
        </Field>
      </div>

      <fieldset className="pt-2">
        <legend className="block mb-2 font-semibold" style={{ color: "var(--ink)" }}>
          Phương pháp Đối chứng (Baselines):
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {options.baselines.map((b) => {
            const checked = config.baselines.includes(b);
            return (
              <label
                key={b}
                className="flex items-center gap-2 p-2 rounded border cursor-pointer"
                style={{ backgroundColor: checked ? "var(--paper-ground)" : "transparent", borderColor: checked ? "var(--action)" : "var(--rule)" }}
              >
                <input type="checkbox" checked={checked} onChange={() => toggleBaseline(b)} />
                <span>{b}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </Panel>
  );
}

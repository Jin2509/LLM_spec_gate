"use client";

import { TriangleAlert } from "lucide-react";
import React from "react";
import type { AnchorLevel, ExperimentConfig, GatePolicy, HumanOracleMode, UnknownMode } from "@/core/experiment";
import type { ExperimentOptionsResponse } from "@/lib/api";
import { Notice, Panel } from "@/ui/layout";
import { Field, inputClass } from "@/ui/primitives/Field";

export type EditableExperimentConfig = Omit<ExperimentConfig, "baselines"> & { baselines: string[] };

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
    <select data-testid={testId} value={value} onChange={(e) => onChange(e.target.value as T)} className={inputClass}>
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
    <Panel testId="experiment-config-form" title="Cấu hình" aside="Cùng cấu hình và seed cho cùng kết quả">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Tập dữ liệu"
          hint={dataset ? `Giữ lại ${Math.round(dataset.heldOutRatio * 100)}% tác vụ để đánh giá cuối${dataset.isHeldOutLocked ? " (đã khoá)" : ""}` : undefined}
        >
          <Select
            testId="dataset-select"
            value={config.datasetId}
            onChange={(v) => set("datasetId", v)}
            options={options.datasets.map((d) => ({ value: d.id, label: d.name }))}
          />
        </Field>
        <Field label="Seed">
          <input data-testid="seed-input" type="text" value={config.seed} onChange={(e) => set("seed", e.target.value)} className={`${inputClass} font-mono`} />
        </Field>
        <Field label="Mô hình sinh code">
          <Select testId="coder-model-select" value={config.coderModel} onChange={(v) => set("coderModel", v)} options={models} />
        </Field>
        <Field label="Mô hình sinh đặc tả">
          <Select testId="spec-model-select" value={config.specModel} onChange={(v) => set("specModel", v)} options={models} />
        </Field>
      </div>

      {familyWarning && (
        <Notice tone="warning" testId="homogeneous-bias-warning">
          <TriangleAlert size={14} className="inline-block align-[-2px] mr-1.5" aria-hidden="true" />
          {familyWarning}
        </Notice>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Field label="Mức nguồn tham chiếu">
          <Select<AnchorLevel>
            testId="anchor-level-select"
            value={config.anchorLevel}
            onChange={(v) => set("anchorLevel", v)}
            options={[
              { value: "A0", label: "A0 · Không có" },
              { value: "A1", label: "A1 · Docstring và MR" },
              { value: "A2", label: "A2 · Thêm ràng buộc hình thức" },
              { value: "A3", label: "A3 · Thêm bản tham chiếu" },
            ].filter((o) => options.anchorLevels.includes(o.value as AnchorLevel))}
          />
        </Field>
        <Field label="Chính sách triển khai bản sửa">
          <Select<GatePolicy>
            testId="policy-select"
            value={config.policy}
            onChange={(v) => set("policy", v)}
            options={[
              { value: "standard", label: "Tiêu chuẩn" },
              { value: "strict", label: "Nghiêm ngặt (chỉ bản đã chứng minh)" },
              { value: "shadow", label: "Chạy ngầm (chỉ ghi nhận)" },
            ]}
          />
        </Field>
        <Field label="Khi chưa kết luận được">
          <Select<UnknownMode>
            testId="unknown-mode-select"
            value={config.unknownMode}
            onChange={(v) => set("unknownMode", v)}
            options={[
              { value: "closed", label: "Chặn lời gọi (an toàn)" },
              { value: "open", label: "Cho qua kèm cảnh báo" },
            ]}
          />
        </Field>
        <Field label="Người trả lời câu hỏi">
          <Select<HumanOracleMode>
            testId="human-oracle-select"
            value={config.humanOracle}
            onChange={(v) => set("humanOracle", v)}
            options={[
              { value: "off", label: "Không hỏi" },
              { value: "perfect", label: "Giả lập, luôn đúng" },
              { value: "noise_5", label: "Giả lập, sai 5%" },
              { value: "noise_10", label: "Giả lập, sai 10%" },
              { value: "real_human", label: "Người thật" },
            ]}
          />
        </Field>
      </div>

      {options.baselines.length > 0 && (
        <fieldset className="m-0 p-0 border-0 flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
            Phương pháp đối chứng
          </legend>
          <div className="flex flex-wrap gap-2">
            {options.baselines.map((b) => {
              const checked = config.baselines.includes(b);
              return (
                <label
                  key={b}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-[var(--radius-sm)] border cursor-pointer text-[13px]"
                  style={{ backgroundColor: checked ? "var(--accent-soft)" : "var(--bg-elevated)", borderColor: checked ? "var(--accent-line)" : "var(--border-default)" }}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleBaseline(b)} className="size-4 accent-[var(--accent)]" />
                  <span className="font-mono">{b}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </Panel>
  );
}

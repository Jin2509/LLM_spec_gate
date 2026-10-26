"use client";

import React from "react";
import type { LabSettings, ModelOption } from "@/lib/api";
import { Panel } from "@/ui/layout";
import { Field, inputClass } from "@/ui/primitives/Field";

export interface SettingsSectionProps {
  settings: LabSettings;
  onChange: <K extends keyof LabSettings>(key: K, value: LabSettings[K]) => void;
}

function NumberField({ label, hint, value, onChange }: { label: string; hint?: string; value: number; onChange: (value: number) => void }) {
  return (
    <Field label={label} hint={hint}>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className={`${inputClass} tabular-nums`} />
    </Field>
  );
}

function ModelField({ label, value, models, onChange }: { label: string; value: string; models: readonly ModelOption[]; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function ModelBudgetSection({ settings, onChange, models }: SettingsSectionProps & { models: readonly ModelOption[] }) {
  return (
    <Panel title="Mô hình mặc định và ngân sách">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModelField label="Mô hình sinh code" value={settings.defaultCoderModel} models={models} onChange={(v) => onChange("defaultCoderModel", v)} />
        <ModelField label="Mô hình sinh đặc tả" value={settings.defaultSpecModel} models={models} onChange={(v) => onChange("defaultSpecModel", v)} />
        <NumberField label="Số lời gọi LLM tối đa" value={settings.maxCallsBudget} onChange={(v) => onChange("maxCallsBudget", v)} />
        <NumberField label="Số token tối đa" value={settings.maxTokensBudget} onChange={(v) => onChange("maxTokensBudget", v)} />
      </div>
    </Panel>
  );
}

export function SolverTimeoutSection({ settings, onChange }: SettingsSectionProps) {
  return (
    <Panel title="Thời gian chờ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NumberField
          label="Chạy bản tham chiếu (ms)"
          hint="Quá thời gian thì coi như không có kết quả tham chiếu (A3)."
          value={settings.a3TimeoutMs}
          onChange={(v) => onChange("a3TimeoutMs", v)}
        />
        <NumberField
          label="Chứng minh hình thức (ms)"
          hint="Giới hạn cho bộ giải Z3."
          value={settings.z3TimeoutMs}
          onChange={(v) => onChange("z3TimeoutMs", v)}
        />
      </div>
    </Panel>
  );
}

const FLAGS: ReadonlyArray<{ key: "enableFlaky" | "enableAudit" | "enableBSynth"; label: string; hint: string }> = [
  { key: "enableFlaky", label: "Phát hiện kết quả chập chờn", hint: "Chạy lại code tại đầu vào lỗi; nếu kết quả dao động thì chỉ ghi nhật ký, không phân xử." },
  { key: "enableAudit", label: "Kiểm toán ngẫu nhiên", hint: "Đối chiếu thêm một phần nhỏ lời gọi đã được cho qua để tìm lỗi im lặng." },
  { key: "enableBSynth", label: "Đo độ lỏng của đặc tả", hint: "Sinh đột biến sai (B_synth) ở bước kiểm nạp để đo đặc tả có quá lỏng không." },
];

export function ResearchFlagsSection({ settings, onChange }: SettingsSectionProps) {
  return (
    <Panel title="Tính năng">
      <div className="flex flex-col divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {FLAGS.map((flag) => {
          const checked = settings[flag.key];
          return (
            <label key={flag.key} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 cursor-pointer">
              <span className="flex flex-col gap-0.5">
                <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                  {flag.label}
                </span>
                <span className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>
                  {flag.hint}
                </span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={checked}
                onChange={(e) => onChange(flag.key, e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--focus-ring)]"
                style={{ backgroundColor: checked ? "var(--accent)" : "var(--border-default)" }}
              >
                <span
                  className="absolute top-0.5 size-4 rounded-full transition-[left]"
                  style={{ left: checked ? 18 : 2, backgroundColor: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)" }}
                />
              </span>
            </label>
          );
        })}
      </div>
    </Panel>
  );
}

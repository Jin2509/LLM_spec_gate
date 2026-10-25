"use client";

import React from "react";
import type { LabSettings, ModelOption } from "@/lib/api";
import { Panel } from "@/ui/layout";

const fieldStyle: React.CSSProperties = { backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink)" };

export interface SettingsSectionProps {
  settings: LabSettings;
  onChange: <K extends keyof LabSettings>(key: K, value: LabSettings[K]) => void;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
        {label}
      </span>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full p-2 rounded border" style={fieldStyle} />
    </label>
  );
}

function ModelField({ label, value, models, onChange }: { label: string; value: string; models: readonly ModelOption[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="block mb-1 font-semibold" style={{ color: "var(--ink)" }}>
        {label}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-2 rounded border" style={fieldStyle}>
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ModelBudgetSection({ settings, onChange, models }: SettingsSectionProps & { models: readonly ModelOption[] }) {
  return (
    <Panel title={<>1. Mô hình Mặc định &amp; Ngân sách Tài nguyên</>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModelField label="Model Coder mặc định:" value={settings.defaultCoderModel} models={models} onChange={(v) => onChange("defaultCoderModel", v)} />
        <ModelField label="Model Spec P0 mặc định:" value={settings.defaultSpecModel} models={models} onChange={(v) => onChange("defaultSpecModel", v)} />
        <NumberField label="Giới hạn Lời gọi hàm tối đa:" value={settings.maxCallsBudget} onChange={(v) => onChange("maxCallsBudget", v)} />
        <NumberField label="Ngân sách Token tối đa:" value={settings.maxTokensBudget} onChange={(v) => onChange("maxTokensBudget", v)} />
      </div>
    </Panel>
  );
}

export function SolverTimeoutSection({ settings, onChange }: SettingsSectionProps) {
  return (
    <Panel title="2. Thời gian chờ (Timeouts) Formal Solvers">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NumberField label="A3 Differential Execution Timeout (ms):" value={settings.a3TimeoutMs} onChange={(v) => onChange("a3TimeoutMs", v)} />
        <NumberField label="Z3 SMT Solver Proof Timeout (ms):" value={settings.z3TimeoutMs} onChange={(v) => onChange("z3TimeoutMs", v)} />
      </div>
    </Panel>
  );
}

const FLAGS: ReadonlyArray<{ key: "enableFlaky" | "enableAudit" | "enableBSynth"; label: string }> = [
  { key: "enableFlaky", label: "Phát hiện & gắn nhãn FLAKY không tất định (Ghi log, không phân xử)" },
  { key: "enableAudit", label: "Ghi vết kiểm toán (Audit Trail) bất biến cho mọi quyết định phân xử" },
  { key: "enableBSynth", label: "Tự động kích hoạt kiểm tra lỏng lẻo B_synth trong bước Admission" },
];

export function ResearchFlagsSection({ settings, onChange }: SettingsSectionProps) {
  return (
    <Panel title="3. Cờ Tính năng Nghiên cứu (Research Flags)">
      <div className="flex flex-col gap-2.5">
        {FLAGS.map((flag) => (
          <label key={flag.key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings[flag.key]} onChange={(e) => onChange(flag.key, e.target.checked)} />
            <span>{flag.label}</span>
          </label>
        ))}
      </div>
    </Panel>
  );
}

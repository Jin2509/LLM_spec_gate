/**
 * Ô nhập cấu hình 2 LLM: nhà cung cấp, mô hình, API key.
 * Khi đã nhập đủ thì thu gọn thành một dòng tóm tắt để trang hỏi đáp gọn gàng.
 */
"use client";

import { Check, ChevronDown, Eye, EyeOff, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import React, { useId, useState } from "react";
import type { LlmConfig, LlmProvider } from "@/lib/api";
import { i18n } from "@/i18n/vi";
import { Field, inputClass } from "@/ui/primitives/Field";
import { Badge } from "@/ui/layout";
import { LLM_ROLES, MODEL_SUGGESTIONS, isConfigured, useLlmConfig, type LlmRole } from "../llm-config";

const t = i18n.llm;
const PROVIDERS: ReadonlyArray<{ value: LlmProvider; label: string }> = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
];

function LlmCard({ role, config, onChange }: { role: LlmRole; config: LlmConfig; onChange: (patch: Partial<LlmConfig>) => void }) {
  const [showKey, setShowKey] = useState(false);
  const id = useId();
  const ready = isConfigured(config);

  return (
    <fieldset
      data-testid={`llm-card-${role}`}
      className="m-0 min-w-0 flex flex-col gap-3 p-4 rounded-[var(--radius-md)] border"
      style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }}
    >
      <legend className="sr-only">{t[role].title}</legend>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
            {t[role].title}
          </div>
          <div className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>
            {t[role].hint}
          </div>
        </div>
        <Badge tone={ready ? "success" : "neutral"}>{ready ? t.ready : t.missing}</Badge>
      </div>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2">
        <Field label={t.provider}>
          <select
            value={config.provider}
            onChange={(e) => {
              const provider = e.target.value as LlmProvider;
              onChange({ provider, model: MODEL_SUGGESTIONS[provider][0] });
            }}
            className={inputClass}
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.model}>
          <input
            value={config.model}
            onChange={(e) => onChange({ model: e.target.value })}
            list={`${id}-models`}
            className={`${inputClass} font-mono`}
            spellCheck={false}
          />
          <datalist id={`${id}-models`}>
            {MODEL_SUGGESTIONS[config.provider].map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field label={t.apiKey}>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={config.apiKey}
            onChange={(e) => onChange({ apiKey: e.target.value })}
            placeholder={config.provider === "openai" ? "sk-..." : "sk-ant-..."}
            autoComplete="off"
            spellCheck={false}
            data-testid={`llm-key-${role}`}
            className={`${inputClass} pr-10 font-mono`}
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            aria-label={showKey ? t.hideKey : t.showKey}
            title={showKey ? t.hideKey : t.showKey}
            className="absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center size-7 rounded-[var(--radius-sm)] cursor-pointer hover:bg-[var(--bg-hover)]"
            style={{ color: "var(--ink-soft)" }}
          >
            {showKey ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          </button>
        </div>
      </Field>
    </fieldset>
  );
}

export function LlmConfigPanel({ defaultOpen }: { defaultOpen?: boolean }) {
  const { configs, update, clearKeys, ready } = useLlmConfig();
  const hasKey = LLM_ROLES.some((role) => configs[role].apiKey !== "");
  const [open, setOpen] = useState(defaultOpen ?? !ready);

  return (
    <section
      aria-label={t.title}
      data-testid="llm-config"
      className="rounded-[var(--radius-lg)] border"
      style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-subtle)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 h-11 text-left cursor-pointer rounded-[var(--radius-lg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        <KeyRound size={16} aria-hidden="true" style={{ color: "var(--accent)" }} />
        <span className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
          {t.title}
        </span>
        <span className="flex-1 min-w-0 flex items-center gap-3 text-[12.5px] truncate" style={{ color: "var(--ink-soft)" }}>
          {LLM_ROLES.map((role) => (
            <span key={role} className="hidden sm:inline-flex items-center gap-1 truncate">
              {isConfigured(configs[role]) && <Check size={13} aria-hidden="true" style={{ color: "var(--v-acc)" }} />}
              <span className="font-mono truncate">{configs[role].model || "—"}</span>
            </span>
          ))}
        </span>
        <span className="text-[12.5px] font-medium" style={{ color: "var(--accent)" }}>
          {open ? t.hide : t.edit}
        </span>
        <ChevronDown size={15} aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--ink-soft)" }} />
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            {LLM_ROLES.map((role) => (
              <LlmCard key={role} role={role} config={configs[role]} onChange={(patch) => update(role, patch)} />
            ))}
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="m-0 flex-1 min-w-0 flex gap-2 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }} data-testid="llm-privacy">
              <ShieldCheck size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
              {t.privacy}
            </p>
            {hasKey && (
              <button
                type="button"
                onClick={clearKeys}
                data-testid="llm-clear-keys"
                className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-[var(--radius-sm)] text-[12.5px] font-medium cursor-pointer hover:bg-[var(--bg-hover)]"
                style={{ color: "var(--v-code)" }}
              >
                <Trash2 size={14} aria-hidden="true" />
                {t.clearKeys}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

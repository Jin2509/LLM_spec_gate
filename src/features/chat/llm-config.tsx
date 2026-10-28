/**
 * src/features/chat/llm-config.tsx — Cấu hình 2 LLM (sinh đặc tả, sinh code) do người dùng nhập.
 *
 * Key nằm trong sessionStorage của tab: tải lại trang (F5) vẫn còn, đóng tab là mất. Không ghi
 * localStorage/IndexedDB, không log. Khi trình duyệt chặn sessionStorage thì giữ trong bộ nhớ của tab
 * (tải lại là mất). Provider đặt ở root layout để key còn nguyên khi chuyển trang.
 */
"use client";

import React, { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { LlmConfig, LlmProvider } from "@/lib/api";

export type LlmRole = "spec" | "code";

export const LLM_ROLES: readonly LlmRole[] = ["spec", "code"];

/** Gợi ý mô hình theo nhà cung cấp; ô mô hình vẫn cho gõ tên bất kỳ. */
export const MODEL_SUGGESTIONS: Record<LlmConfig["provider"], readonly string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1"],
  anthropic: ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"],
};

type LlmConfigs = Record<LlmRole, LlmConfig>;

const DEFAULTS: LlmConfigs = {
  spec: { provider: "openai", model: MODEL_SUGGESTIONS.openai[0]!, apiKey: "" },
  code: { provider: "anthropic", model: MODEL_SUGGESTIONS.anthropic[0]!, apiKey: "" },
};

const LLM_CONFIG_STORAGE_KEY = "specgate-llm-config";
const CHANGE_EVENT = "specgate-llm-config-change";

// ── Kho lưu: sessionStorage, dự phòng bằng bộ nhớ khi sessionStorage không dùng được ──────────
let memoryRaw: string | null = null;
let useMemory = false;

function readRaw(): string | null {
  if (useMemory) return memoryRaw;
  try {
    return sessionStorage.getItem(LLM_CONFIG_STORAGE_KEY);
  } catch {
    return memoryRaw;
  }
}

function writeRaw(raw: string | null) {
  memoryRaw = raw;
  try {
    if (raw === null) sessionStorage.removeItem(LLM_CONFIG_STORAGE_KEY);
    else sessionStorage.setItem(LLM_CONFIG_STORAGE_KEY, raw);
    useMemory = false;
  } catch {
    useMemory = true;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const PROVIDERS: readonly LlmProvider[] = ["openai", "anthropic"];

function parse(raw: string | null): LlmConfigs {
  if (!raw) return DEFAULTS;
  try {
    const data = JSON.parse(raw) as Partial<Record<LlmRole, Partial<LlmConfig>>>;
    const out = { ...DEFAULTS };
    for (const role of LLM_ROLES) {
      const c = data?.[role];
      if (c && PROVIDERS.includes(c.provider as LlmProvider) && typeof c.model === "string" && typeof c.apiKey === "string") {
        out[role] = { provider: c.provider as LlmProvider, model: c.model, apiKey: c.apiKey };
      }
    }
    return out;
  } catch {
    return DEFAULTS;
  }
}

// useSyncExternalStore cần snapshot giữ nguyên tham chiếu khi dữ liệu không đổi.
let cachedRaw: string | null | undefined;
let cachedValue: LlmConfigs = DEFAULTS;

function getSnapshot(): LlmConfigs {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
  }
  return cachedValue;
}

const getServerSnapshot = () => DEFAULTS;

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// ── Context ───────────────────────────────────────────────────────────────────────────────────
interface LlmConfigContextValue {
  configs: LlmConfigs;
  update: (role: LlmRole, patch: Partial<LlmConfig>) => void;
  /** Xoá key của cả hai LLM khỏi tab (giữ nhà cung cấp và mô hình). */
  clearKeys: () => void;
  /** Đủ nhà cung cấp, mô hình và key cho cả hai LLM. */
  ready: boolean;
}

const LlmConfigContext = createContext<LlmConfigContextValue | null>(null);

export function isConfigured(config: LlmConfig): boolean {
  return config.model.trim() !== "" && config.apiKey.trim() !== "";
}

export function LlmConfigProvider({ children }: { children: React.ReactNode }) {
  const configs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<LlmConfigContextValue>(
    () => ({
      configs,
      update: (role, patch) => {
        const current = getSnapshot();
        writeRaw(JSON.stringify({ ...current, [role]: { ...current[role], ...patch } }));
      },
      clearKeys: () => {
        const current = getSnapshot();
        const next = Object.fromEntries(LLM_ROLES.map((role) => [role, { ...current[role], apiKey: "" }]));
        writeRaw(JSON.stringify(next));
      },
      ready: LLM_ROLES.every((role) => isConfigured(configs[role])),
    }),
    [configs],
  );

  return <LlmConfigContext.Provider value={value}>{children}</LlmConfigContext.Provider>;
}

export function useLlmConfig(): LlmConfigContextValue {
  const value = useContext(LlmConfigContext);
  if (!value) throw new Error("useLlmConfig phải nằm trong <LlmConfigProvider>.");
  return value;
}

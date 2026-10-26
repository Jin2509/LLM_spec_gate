/**
 * src/features/chat/llm-config.tsx — Cấu hình 2 LLM (sinh đặc tả, sinh code) do người dùng nhập.
 *
 * Key CHỈ nằm trong state React của tab: không ghi localStorage/sessionStorage/IndexedDB, không log.
 * Provider đặt ở root layout để key còn nguyên khi chuyển trang trong cùng tab; tải lại trang là mất.
 */
"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { LlmConfig } from "@/lib/api";

export type LlmRole = "spec" | "code";

export const LLM_ROLES: readonly LlmRole[] = ["spec", "code"];

/** Gợi ý mô hình theo nhà cung cấp; ô mô hình vẫn cho gõ tên bất kỳ. */
export const MODEL_SUGGESTIONS: Record<LlmConfig["provider"], readonly string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1"],
  anthropic: ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"],
};

const DEFAULTS: Record<LlmRole, LlmConfig> = {
  spec: { provider: "openai", model: MODEL_SUGGESTIONS.openai[0]!, apiKey: "" },
  code: { provider: "anthropic", model: MODEL_SUGGESTIONS.anthropic[0]!, apiKey: "" },
};

interface LlmConfigContextValue {
  configs: Record<LlmRole, LlmConfig>;
  update: (role: LlmRole, patch: Partial<LlmConfig>) => void;
  /** Đủ nhà cung cấp, mô hình và key cho cả hai LLM. */
  ready: boolean;
}

const LlmConfigContext = createContext<LlmConfigContextValue | null>(null);

export function isConfigured(config: LlmConfig): boolean {
  return config.model.trim() !== "" && config.apiKey.trim() !== "";
}

export function LlmConfigProvider({ children }: { children: React.ReactNode }) {
  const [configs, setConfigs] = useState(DEFAULTS);

  const value = useMemo<LlmConfigContextValue>(
    () => ({
      configs,
      update: (role, patch) => setConfigs((prev) => ({ ...prev, [role]: { ...prev[role], ...patch } })),
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

"use client";

import { Zap } from "lucide-react";
import React, { useState } from "react";
import type { BadTraceItem } from "@/core/revocation";
import { Button } from "@/ui/primitives/Button";
import { Panel } from "@/ui/layout";

const fieldStyle: React.CSSProperties = { backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink)" };

function parseJson(label: string, raw: string): { value?: unknown; error?: string } {
  try {
    return { value: JSON.parse(raw) };
  } catch {
    return { error: `${label} phải là JSON hợp lệ.` };
  }
}

export interface BadTraceFormProps {
  isSubmitting: boolean;
  onSubmit: (trace: BadTraceItem) => void;
}

/** Form tiêm một vết xấu t vào B (witness w và đầu ra quan sát được). */
export function BadTraceForm({ isSubmitting, onSubmit }: BadTraceFormProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [inGuard, setInGuard] = useState(true);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedInput = parseJson("Input w", input);
    const parsedOutput = parseJson("Output", output);
    const firstError = parsedInput.error ?? parsedOutput.error;
    if (firstError) {
      setError(firstError);
      return;
    }
    setError(null);
    onSubmit({
      id: `bad_trace_${Date.now()}`,
      input: parsedInput.value,
      output: parsedOutput.value,
      inGuard,
      description: description.trim() || undefined,
      injectedAt: new Date().toISOString(),
    });
  };

  return (
    <Panel testId="bad-trace-form" title="Tiêm vết xấu t vào B">
      <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={submit}>
        <label className="flex flex-col gap-1">
          <span style={{ color: "var(--ink-soft)" }}>Input w (JSON)</span>
          <input data-testid="bad-trace-input" value={input} onChange={(e) => setInput(e.target.value)} className="p-2 rounded border" style={fieldStyle} />
        </label>
        <label className="flex flex-col gap-1">
          <span style={{ color: "var(--ink-soft)" }}>Output quan sát được (JSON)</span>
          <input data-testid="bad-trace-output" value={output} onChange={(e) => setOutput(e.target.value)} className="p-2 rounded border" style={fieldStyle} />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span style={{ color: "var(--ink-soft)" }}>Mô tả (tuỳ chọn)</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="p-2 rounded border" style={fieldStyle} />
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={inGuard} onChange={(e) => setInGuard(e.target.checked)} />
          <span>Vết nằm trong vùng guard g của monitor hiện hành</span>
        </label>
        <div className="flex items-center justify-end gap-3">
          {error && (
            <span role="alert" style={{ color: "var(--v-code)" }}>
              {error}
            </span>
          )}
          <Button data-testid="inject-bad-trace-btn" type="submit" variant="danger" disabled={isSubmitting || !input.trim() || !output.trim()}>
            {isSubmitting ? "Đang tiêm..." : <><Zap size={14} className="inline-block shrink-0 align-[-2px]" aria-hidden="true" /> Tiêm vết xấu vào B</>}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

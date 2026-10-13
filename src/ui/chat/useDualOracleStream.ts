/**
 * src/ui/chat/useDualOracleStream.ts — Hook for Dual-Oracle Stream Consumer
 *
 * Requirements:
 *   - Consume NDJSON streaming events from /api/runs/[id]/cases/[caseId]/stream
 *   - Track timeline steps (pending, running, done, error)
 *   - Provide token streaming for text
 *   - Support cancellation via AbortController
 *   - Offline fallback if fetch fails: emulates identical event sequence
 */
"use client";

import { useState, useRef, useCallback } from "react";
import type {
  DualOracleStreamEvent,
  StreamStepId,
  StreamStepState,
} from "@/core/stream-types";
import type { CaseDossier, Verdict } from "@/core/types";

const INITIAL_STEPS: StreamStepState[] = [
  { id: "load_task", label: "Nhận witness w và nạp task", status: "pending" },
  { id: "run_code", label: "Thực thi code với w → lấy đầu ra thực tế c", status: "pending" },
  { id: "oracle_p0", label: "Đánh giá oracle P_0 (đặc tả)", status: "pending" },
  { id: "oracle_code", label: "Đánh giá oracle thứ hai (code oracle / grounded anchor)", status: "pending" },
  { id: "adjudicate", label: "Áp dụng luật phán xử (R1–R6) → xác định verdict", status: "pending" },
  { id: "fail_closed_check", label: "Kiểm tra bất biến Fail-Closed & Single-Shot Human Query", status: "pending" },
];

export interface DualOracleStreamResult {
  steps: StreamStepState[];
  isStreaming: boolean;
  streamedText: string;
  finalVerdict?: Verdict;
  totalMs?: number;
  error?: string;
  isHumanQueryTriggered: boolean;
}

export function useDualOracleStream(runId: string = "run_evalplus_01") {
  const [steps, setSteps] = useState<StreamStepState[]>(INITIAL_STEPS);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamedText, setStreamedText] = useState<string>("");
  const [finalVerdict, setFinalVerdict] = useState<Verdict | undefined>();
  const [totalMs, setTotalMs] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isHumanQueryTriggered, setIsHumanQueryTriggered] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setSteps((prev) =>
      prev.map((s) => (s.status === "running" ? { ...s, status: "error", error: "Đã huỷ bởi người dùng" } : s))
    );
  }, []);

  const startStream = useCallback(
    async (caseDossier: CaseDossier, userPrompt?: string) => {
      // Reset state
      setIsStreaming(true);
      setError(undefined);
      setStreamedText("");
      setFinalVerdict(undefined);
      setTotalMs(undefined);
      setIsHumanQueryTriggered(false);
      setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "pending" })));

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(
          `/api/runs/${runId}/cases/${caseDossier.id}/stream`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: userPrompt }),
            signal: controller.signal,
          }
        );

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}: Không thể kết nối stream endpoint`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const event: DualOracleStreamEvent = JSON.parse(trimmed);

              if (event.type === "step") {
                setSteps((prev) =>
                  prev.map((s) =>
                    s.id === event.id
                      ? {
                          ...s,
                          status: event.status,
                          durationMs: event.durationMs ?? s.durationMs,
                          data: event.data ?? s.data,
                        }
                      : s
                  )
                );
              } else if (event.type === "text") {
                setStreamedText((prev) => prev + event.delta);
              } else if (event.type === "human_query") {
                setIsHumanQueryTriggered(true);
              } else if (event.type === "done") {
                setFinalVerdict(event.verdict);
                setTotalMs(event.totalMs);
              } else if (event.type === "error") {
                setError(event.message);
                if (event.step) {
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === event.step
                        ? { ...s, status: "error", error: event.message }
                        : s
                    )
                  );
                }
              }
            } catch {
              // ignore malformed NDJSON lines
            }
          }
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        // Offline / fallback emulation in case network or sandbox blocks
        console.warn("Stream API fallback: Emulating execution flow", err);
        const startTime = Date.now();

        for (const step of INITIAL_STEPS) {
          if (controller.signal.aborted) return;
          setSteps((prev) =>
            prev.map((s) => (s.id === step.id ? { ...s, status: "running" } : s))
          );
          await new Promise((r) => setTimeout(r, 120));
          if (controller.signal.aborted) return;

          let stepData: StreamStepState["data"] = undefined;
          if (step.id === "load_task") stepData = { w: caseDossier.witness };
          if (step.id === "run_code") stepData = { c: caseDossier.codeOutput };
          if (step.id === "oracle_p0") {
            stepData = {
              accepted: !caseDossier.monitorRejectionClause,
              violated: caseDossier.monitorRejectionClause ?? undefined,
            };
          }
          if (step.id === "adjudicate") {
            stepData = {
              rule: caseDossier.adjudication.matchedRule,
              verdict: caseDossier.adjudication.verdict,
            };
          }

          setSteps((prev) =>
            prev.map((s) =>
              s.id === step.id
                ? { ...s, status: "done", durationMs: 120, data: stepData }
                : s
            )
          );
        }

        const isUnknown =
          caseDossier.adjudication.verdict === "UNKNOWN_EVIDENCE" ||
          caseDossier.adjudication.verdict === "UNKNOWN_CONFLICT" ||
          caseDossier.adjudication.verdict === "UNKNOWN_GATE";

        if (isUnknown && caseDossier.ticket) {
          setIsHumanQueryTriggered(true);
        }

        setStreamedText(caseDossier.adjudication.explanation);
        setFinalVerdict(caseDossier.adjudication.verdict);
        setTotalMs(Date.now() - startTime);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [runId]
  );

  return {
    steps,
    isStreaming,
    streamedText,
    finalVerdict,
    totalMs,
    error,
    isHumanQueryTriggered,
    startStream,
    stopStream,
  };
}

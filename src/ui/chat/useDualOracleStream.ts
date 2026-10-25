/**
 * src/ui/chat/useDualOracleStream.ts — Hook for Dual-Oracle Stream Consumer
 *
 * Requirements:
 *   - Consume NDJSON streaming events from /api/runs/[id]/cases/[caseId]/stream
 *   - Track timeline steps (pending, running, done, error)
 *   - Provide token streaming for text
 *   - Support cancellation via AbortController
 *   - Lỗi mạng/API được trả về qua `error` (không giả lập kết quả phía client)
 */
"use client";

import { useState, useRef, useCallback } from "react";
import type {
  DualOracleStreamEvent,
  StreamStepId,
  StreamStepState,
} from "@/core/stream-types";
import type { CaseDossier, Verdict } from "@/core/types";
import { api } from "@/lib/api/endpoints";
import { errorMessage, readNdjson } from "@/lib/api/client";

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

export function useDualOracleStream(runId: string) {
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
        const response = await api.cases.stream(runId, caseDossier.id, userPrompt, controller.signal);
        if (!response.ok || !response.body) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          const prefix = response.status === 501 ? "Chức năng chưa khả dụng" : `HTTP ${response.status}`;
          throw new Error(`${prefix}: ${body.error ?? "Không thể kết nối luồng phân xử."}`);
        }

        for await (const event of readNdjson<DualOracleStreamEvent>(response)) {
          if (event.type === "step") {
            setSteps((prev) =>
              prev.map((s) =>
                s.id === event.id
                  ? { ...s, status: event.status, durationMs: event.durationMs ?? s.durationMs, data: event.data ?? s.data }
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
              setSteps((prev) => prev.map((s) => (s.id === event.step ? { ...s, status: "error", error: event.message } : s)));
            }
          }
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        // Không giả lập kết quả phía client: lỗi mạng/API được báo trung thực cho người dùng.
        setError(errorMessage(err, "Mất kết nối tới luồng phân xử."));
        setSteps((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "error" } : s)));
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

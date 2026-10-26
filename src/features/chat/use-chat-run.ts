/**
 * src/features/chat/use-chat-run.ts — Một lượt hỏi đáp trên một tác vụ của dataset.
 *
 * Vòng 1: POST /api/run → các bước (đặc tả, code, đối chiếu) và kết luận.
 * Nếu backend kèm `question` (kết luận "unknown") thì hỏi người dùng ĐÚNG MỘT lần; câu trả lời đi qua
 * POST /api/run/followup và kết luận của vòng này là cuối cùng. Hook chỉ gom sự kiện SSE thành state để
 * hiển thị; hỏi hay không, hỏi gì và kết luận ra sao đều do backend quyết định.
 */
"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  api,
  errorMessage,
  type ChatEvent,
  type ChatRequest,
  type ChatStepId,
  type ChatVerdict,
  type LlmConfig,
} from "@/lib/api";

export interface ChatStep {
  id: ChatStepId;
  status: "running" | "done" | "error";
  output?: string;
  durationMs?: number;
}

export interface ChatRound {
  steps: ChatStep[];
  verdict?: { verdict: ChatVerdict; reason: string; question?: string };
}

/** Tác vụ đang chạy, để hiển thị lại cho người dùng. */
export interface ChatTask {
  datasetId: string;
  taskId: string;
  title: string;
  intent: string;
}

export interface ChatRunState {
  /** "asking": backend đang chờ câu trả lời duy nhất của người dùng. */
  phase: "idle" | "running" | "asking" | "done" | "error" | "stopped";
  task?: ChatTask;
  first: ChatRound;
  /** Câu trả lời người dùng gửi ở lượt hỏi lại (có thì vòng hiện tại là `followup`). */
  answer?: string;
  followup?: ChatRound;
  error?: string;
}

type Action =
  | { type: "start"; task: ChatTask }
  | { type: "answer"; answer: string }
  | { type: "event"; event: ChatEvent }
  | { type: "fail"; message: string }
  | { type: "stop" }
  | { type: "finish" }
  | { type: "reset" };

const INITIAL: ChatRunState = { phase: "idle", first: { steps: [] } };

function upsertStep(steps: ChatStep[], step: ChatStep): ChatStep[] {
  const index = steps.findIndex((s) => s.id === step.id);
  return index === -1 ? [...steps, step] : steps.map((s, i) => (i === index ? { ...s, ...step } : s));
}

function applyEvent(round: ChatRound, event: ChatEvent): ChatRound {
  if (event.event === "step") {
    const { step, ...rest } = event.data;
    return { ...round, steps: upsertStep(round.steps, { id: step, ...rest }) };
  }
  if (event.event === "verdict") return { ...round, verdict: event.data };
  return event.data.step ? { ...round, steps: upsertStep(round.steps, { id: event.data.step, status: "error" }) } : round;
}

function reducer(state: ChatRunState, action: Action): ChatRunState {
  switch (action.type) {
    case "start":
      return { ...INITIAL, phase: "running", task: action.task };
    case "answer":
      return { ...state, phase: "running", answer: action.answer, followup: { steps: [] } };
    case "event": {
      const { event } = action;
      const inFollowup = state.followup !== undefined;
      const round = applyEvent(inFollowup ? state.followup! : state.first, event);
      const next = inFollowup ? { ...state, followup: round } : { ...state, first: round };
      if (event.event === "error") return { ...next, phase: "error", error: event.data.message };
      if (event.event === "verdict") {
        // Chỉ hỏi lại ở vòng đầu và chỉ khi backend gửi câu hỏi; vòng hỏi lại luôn là kết luận cuối.
        return { ...next, phase: !inFollowup && event.data.question ? "asking" : "done" };
      }
      return next;
    }
    case "fail":
      return { ...state, phase: "error", error: action.message };
    case "stop":
      return state.phase === "running" ? { ...state, phase: "stopped" } : state;
    case "finish":
      // Luồng đóng mà không có verdict/error: coi là lỗi để người dùng biết.
      return state.phase === "running" ? { ...state, phase: "error", error: "Backend đóng kết nối trước khi trả kết luận." } : state;
    case "reset":
      return INITIAL;
  }
}

function outputOf(round: ChatRound, id: ChatStepId): string {
  return round.steps.find((s) => s.id === id)?.output ?? "";
}

export function useChatRun() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const consume = useCallback(async (open: (signal: AbortSignal) => AsyncGenerator<ChatEvent>) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      for await (const event of open(controller.signal)) dispatch({ type: "event", event });
      dispatch({ type: "finish" });
    } catch (error) {
      if (!controller.signal.aborted) dispatch({ type: "fail", message: errorMessage(error) });
    }
  }, []);

  const start = useCallback(
    (request: ChatRequest, task: ChatTask) => {
      dispatch({ type: "start", task });
      return consume((signal) => api.chat.run(request, signal));
    },
    [consume],
  );

  /** Lượt hỏi lại duy nhất: chỉ gửi được khi backend đang hỏi (phase "asking"). */
  const answer = useCallback(
    (text: string, llmSpec: LlmConfig) => {
      if (state.phase !== "asking" || !state.task) return Promise.resolve();
      const { datasetId, taskId } = state.task;
      const body = { llmSpec, datasetId, taskId, spec: outputOf(state.first, "spec"), code: outputOf(state.first, "code"), answer: text };
      dispatch({ type: "answer", answer: text });
      return consume((signal) => api.chat.followup(body, signal));
    },
    [consume, state.phase, state.task, state.first],
  );

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    dispatch({ type: "stop" });
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    dispatch({ type: "reset" });
  }, []);

  return { state, start, answer, stop, reset };
}

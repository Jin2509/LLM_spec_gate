/**
 * src/features/chat/use-chat-run.ts — Một lượt hỏi đáp: gửi yêu cầu một lần, nhận các bước và kết luận.
 *
 * Chỉ gom sự kiện SSE của POST /api/run thành state để hiển thị; mọi quyết định do backend đưa ra.
 */
"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { api, errorMessage, type ChatEvent, type ChatRequest, type ChatStepId, type ChatVerdict } from "@/lib/api";

export interface ChatStep {
  id: ChatStepId;
  status: "running" | "done" | "error";
  output?: string;
  durationMs?: number;
}

export interface ChatRunState {
  phase: "idle" | "running" | "done" | "error" | "stopped";
  intent?: string;
  steps: ChatStep[];
  verdict?: { verdict: ChatVerdict; reason: string };
  error?: string;
}

type Action =
  | { type: "start"; intent: string }
  | { type: "event"; event: ChatEvent }
  | { type: "fail"; message: string }
  | { type: "stop" }
  | { type: "finish" }
  | { type: "reset" };

const INITIAL: ChatRunState = { phase: "idle", steps: [] };

function upsertStep(steps: ChatStep[], step: ChatStep): ChatStep[] {
  const index = steps.findIndex((s) => s.id === step.id);
  return index === -1 ? [...steps, step] : steps.map((s, i) => (i === index ? { ...s, ...step } : s));
}

function reducer(state: ChatRunState, action: Action): ChatRunState {
  switch (action.type) {
    case "start":
      return { phase: "running", intent: action.intent, steps: [] };
    case "event": {
      const { event } = action;
      if (event.event === "step") {
        const { step, ...rest } = event.data;
        return { ...state, steps: upsertStep(state.steps, { id: step, ...rest }) };
      }
      if (event.event === "verdict") return { ...state, phase: "done", verdict: event.data };
      return {
        ...state,
        phase: "error",
        error: event.data.message,
        steps: event.data.step ? upsertStep(state.steps, { id: event.data.step, status: "error" }) : state.steps,
      };
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

export function useChatRun() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const send = useCallback(async (request: ChatRequest) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    dispatch({ type: "start", intent: request.intent });
    try {
      for await (const event of api.chat.run(request, controller.signal)) dispatch({ type: "event", event });
      dispatch({ type: "finish" });
    } catch (error) {
      if (!controller.signal.aborted) dispatch({ type: "fail", message: errorMessage(error) });
    }
  }, []);

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    dispatch({ type: "stop" });
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    dispatch({ type: "reset" });
  }, []);

  return { state, send, stop, reset };
}

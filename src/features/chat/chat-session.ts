/** Máy trạng thái hội thoại kiểm thử: 1 lượt hỏi + tối đa 1 lượt bổ sung khi UNKNOWN. */
import type { Verdict } from "@/core/types";

export type Phase = "idle" | "asking" | "answered" | "unknown_followup" | "final";
export type ChatTurn = { id: string; role: "user" | "system"; text: string; verdict?: Verdict; ms?: number };
export type ChatState = { phase: Phase; turns: ChatTurn[]; followupUsed: boolean; error?: string };
export type ChatAction =
  | { type: "send"; text: string; id: string }
  | { type: "result"; text: string; verdict: Verdict; ms?: number }
  | { type: "followup"; text: string; id: string }
  | { type: "resolved"; text: string; verdict: Verdict }
  | { type: "error"; text: string }
  | { type: "retry" }
  | { type: "reset" };

export const INITIAL_CHAT_STATE: ChatState = { phase: "idle", turns: [], followupUsed: false };

export const isUnknownVerdict = (v: Verdict) => v.startsWith("UNKNOWN");

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "send":
      return { ...state, phase: "asking", error: undefined, turns: [...state.turns, { id: action.id, role: "user", text: action.text }] };
    case "result":
      return {
        ...state,
        phase: isUnknownVerdict(action.verdict) ? "unknown_followup" : "final",
        turns: [...state.turns, { id: `r-${Date.now()}`, role: "system", text: action.text, verdict: action.verdict, ms: action.ms }],
      };
    case "followup":
      return { ...state, phase: "asking", followupUsed: true, error: undefined, turns: [...state.turns, { id: action.id, role: "user", text: action.text }] };
    case "resolved":
      return { ...state, phase: "final", turns: [...state.turns, { id: `r-${Date.now()}`, role: "system", text: action.text, verdict: action.verdict }] };
    case "error":
      return { ...state, phase: "answered", error: action.text };
    case "retry":
      return { ...state, phase: "idle", error: undefined };
    case "reset":
      return INITIAL_CHAT_STATE;
  }
}

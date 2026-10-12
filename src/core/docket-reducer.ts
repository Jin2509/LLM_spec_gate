/**
 * src/core/docket-reducer.ts — Two-Phase Docket State Machine Reducer
 *
 * Requirements:
 *   - evalId concurrency control to eliminate race conditions.
 *   - Ignores actions where action.evalId < state.currentEvalId.
 *   - Converges to state of maximum evalId.
 *   - Pure, deterministic, zero framework/React dependencies.
 */
import type { StageId, StageStatus, StageInfo } from "./types";

export interface DocketState {
  caseId: string;
  currentEvalId: number;
  stages: StageInfo[];
  phase1Completed: boolean;
  phase2Completed: boolean;
  hasTimeoutError: boolean;
  errorMessage?: string;
  remedySuggestion?: string;
}

export type DocketAction =
  | {
      type: "INIT_EVAL";
      evalId: number;
      caseId: string;
      initialStages?: StageInfo[];
    }
  | {
      type: "UPDATE_STAGE";
      evalId: number;
      stageId: StageId;
      status: StageStatus;
      summary?: string;
      engine?: string;
      errorReason?: string;
      remedySuggestion?: string;
    }
  | {
      type: "TIMEOUT_STAGE";
      evalId: number;
      stageId: StageId;
      errorReason: string;
      remedySuggestion: string;
    }
  | {
      type: "CANCEL_STAGE";
      evalId: number;
      stageId: StageId;
    };

export const DEFAULT_INITIAL_STAGES: readonly StageInfo[] = [
  { id: 1, name: "1. Bằng chứng", status: "done", summary: "Bằng chứng đã thu thập" },
  { id: 2, name: "2. Trạng thái c", status: "done", summary: "c bị bác bỏ bởi P0" },
  { id: 3, name: "3. Luật (R1–R6)", status: "done", summary: "Khớp R2 (SPEC_FAULT)" },
  { id: 4, name: "4. Hành động", status: "done", summary: "Kích hoạt sửa đặc tả (Repair)" },
  { id: 5, name: "5. Sửa (Repair)", status: "idle", summary: "Chờ bộ sinh ứng viên" },
  { id: 6, name: "6. Cổng (Gate)", status: "idle", summary: "Chờ kiểm tra 5 tiêu chuẩn" },
];

export function createInitialDocketState(caseId: string, evalId = 1): DocketState {
  return {
    caseId,
    currentEvalId: evalId,
    stages: [...DEFAULT_INITIAL_STAGES],
    phase1Completed: true,
    phase2Completed: false,
    hasTimeoutError: false,
  };
}

export function docketReducer(state: DocketState, action: DocketAction): DocketState {
  // ── Concurrency Check: Ignore any action belonging to an older evalId ──────
  if (action.evalId < state.currentEvalId) {
    // Stale action discarded to prevent race condition
    return state;
  }

  switch (action.type) {
    case "INIT_EVAL": {
      return {
        caseId: action.caseId,
        currentEvalId: action.evalId,
        stages: action.initialStages ? [...action.initialStages] : [...DEFAULT_INITIAL_STAGES],
        phase1Completed: true,
        phase2Completed: false,
        hasTimeoutError: false,
        errorMessage: undefined,
        remedySuggestion: undefined,
      };
    }

    case "UPDATE_STAGE": {
      const nextStages = state.stages.map((stage) => {
        if (stage.id !== action.stageId) return stage;
        return {
          ...stage,
          status: action.status,
          summary: action.summary ?? stage.summary,
          engine: action.engine ?? stage.engine,
          errorReason: action.errorReason ?? stage.errorReason,
        };
      });

      const phase2Done = nextStages
        .filter((s) => s.id === 5 || s.id === 6)
        .every((s) => s.status === "done" || s.status === "skipped");

      return {
        ...state,
        currentEvalId: action.evalId,
        stages: nextStages,
        phase2Completed: phase2Done,
        errorMessage: action.errorReason,
        remedySuggestion: action.remedySuggestion,
      };
    }

    case "TIMEOUT_STAGE": {
      const nextStages = state.stages.map((stage) => {
        if (stage.id !== action.stageId) return stage;
        return {
          ...stage,
          status: "error" as StageStatus,
          errorReason: action.errorReason,
        };
      });

      return {
        ...state,
        currentEvalId: action.evalId,
        stages: nextStages,
        hasTimeoutError: true,
        errorMessage: action.errorReason,
        remedySuggestion: action.remedySuggestion,
      };
    }

    case "CANCEL_STAGE": {
      const nextStages = state.stages.map((stage) => {
        if (stage.id !== action.stageId) return stage;
        return {
          ...stage,
          status: "cancelled" as StageStatus,
          summary: "Đã hủy theo yêu cầu của người kiểm định",
        };
      });

      return {
        ...state,
        currentEvalId: action.evalId,
        stages: nextStages,
      };
    }

    default:
      return state;
  }
}

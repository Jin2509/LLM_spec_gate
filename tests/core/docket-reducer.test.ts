/**
 * tests/core/docket-reducer.test.ts — Verification of Docket Strip 2-Phase Reducer
 *
 * Acceptance Criteria:
 *   - Reducer của Docket Strip luôn hội tụ về trạng thái của evalId lớn nhất.
 *   - Loại bỏ hoàn toàn race condition từ các tác vụ bất đồng bộ cũ.
 */
import { describe, it, expect } from "vitest";
import {
  createInitialDocketState,
  docketReducer,
  type DocketState,
} from "@/core/docket-reducer";

describe("Docket Strip 2-Phase Reducer (evalId Concurrency)", () => {
  it("initializes with evalId and default 6-stage pipeline", () => {
    const state = createInitialDocketState("case_spec_fault", 1);
    expect(state.currentEvalId).toBe(1);
    expect(state.stages).toHaveLength(6);
    expect(state.phase1Completed).toBe(true);
    expect(state.phase2Completed).toBe(false);
  });

  it("CONCURRENCY INVARIANT: Ignores stale actions where action.evalId < state.currentEvalId", () => {
    // Current evaluation is evalId: 5
    const state: DocketState = {
      ...createInitialDocketState("case_spec_fault", 5),
    };

    // An asynchronous event from old evaluation evalId: 3 returns
    const staleAction = {
      type: "UPDATE_STAGE" as const,
      evalId: 3,
      stageId: 5 as const,
      status: "done" as const,
      summary: "Stale repair finished from old run",
    };

    const nextState = docketReducer(state, staleAction);

    // Must be completely ignored! Stage 5 remains in current state
    expect(nextState.currentEvalId).toBe(5);
    const stage5 = nextState.stages.find((s) => s.id === 5);
    expect(stage5?.status).toBe("idle");
    expect(stage5?.summary).not.toContain("Stale repair");
  });

  it("CONVERGENCE: Accepts actions with equal or higher evalId and updates stage status", () => {
    let state = createInitialDocketState("case_spec_fault", 1);

    // Update with evalId: 1
    state = docketReducer(state, {
      type: "UPDATE_STAGE",
      evalId: 1,
      stageId: 5,
      status: "running",
      summary: "Z3 đang sinh ứng viên sửa đặc tả...",
      engine: "Z3 QF_LIA",
    });

    const stage5Running = state.stages.find((s) => s.id === 5);
    expect(stage5Running?.status).toBe("running");
    expect(stage5Running?.engine).toBe("Z3 QF_LIA");

    // Higher evalId: 2 arrives (new user re-evaluation triggered)
    state = docketReducer(state, {
      type: "INIT_EVAL",
      evalId: 2,
      caseId: "case_spec_fault",
    });
    expect(state.currentEvalId).toBe(2);

    // Old evalId: 1 finishes now -> MUST be discarded
    state = docketReducer(state, {
      type: "UPDATE_STAGE",
      evalId: 1,
      stageId: 5,
      status: "done",
      summary: "Old eval completed late",
    });
    const stage5AfterOldFinish = state.stages.find((s) => s.id === 5);
    expect(stage5AfterOldFinish?.status).toBe("idle"); // Not overwritten by evalId: 1!

    // Current evalId: 2 finishes -> accepted
    state = docketReducer(state, {
      type: "UPDATE_STAGE",
      evalId: 2,
      stageId: 5,
      status: "done",
      summary: "New eval candidate found",
    });
    const stage5AfterNewFinish = state.stages.find((s) => s.id === 5);
    expect(stage5AfterNewFinish?.status).toBe("done");
  });

  it("handles TIMEOUT_STAGE with explicit remedy without silent retry", () => {
    let state = createInitialDocketState("case_spec_fault", 1);

    state = docketReducer(state, {
      type: "TIMEOUT_STAGE",
      evalId: 1,
      stageId: 6,
      errorReason: "Z3 solver vượt quá ngưỡng 30.000ms khi chứng minh G5",
      remedySuggestion: "Hãy nới lỏng repair family hoặc chuyển sang chính sách Standard thay vì Strict.",
    });

    expect(state.hasTimeoutError).toBe(true);
    expect(state.errorMessage).toContain("vượt quá ngưỡng 30.000ms");
    expect(state.remedySuggestion).toContain("nới lỏng repair family");

    const stage6 = state.stages.find((s) => s.id === 6);
    expect(stage6?.status).toBe("error");
  });

  it("handles CANCEL_STAGE upon human user interruption", () => {
    let state = createInitialDocketState("case_spec_fault", 1);

    state = docketReducer(state, {
      type: "CANCEL_STAGE",
      evalId: 1,
      stageId: 5,
    });

    const stage5 = state.stages.find((s) => s.id === 5);
    expect(stage5?.status).toBe("cancelled");
    expect(stage5?.summary).toContain("Đã hủy theo yêu cầu");
  });
});

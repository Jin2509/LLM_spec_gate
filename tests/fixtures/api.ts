/**
 * tests/fixtures/api.ts — Response mẫu theo hợp đồng api.md, CHỈ dùng trong test.
 *
 * App không import file này: dữ liệu thật luôn đến từ backend qua /api/*.
 */
import type {
  EvidenceStoreResponse,
  FaultInjectionStateResponse,
  RQResultResponse,
  RunSummary,
  SettingsResponse,
} from "@/lib/api/types";

export const RUN_ID = "run_test_01";
export const RUN_SUMMARY: RunSummary = {
  runId: RUN_ID,
  datasetName: "EvalPlus Custom",
  anchorLevel: "A2",
  monitorVersion: "P_1",
  isHeldOutLocked: true,
  isDisjointGB: true,
  ticketsSpent: 0,
  ticketsTotal: 3,
  rejectedWritesCount: 0,
};

export const EVIDENCE_STORE: EvidenceStoreResponse = {
  runId: RUN_ID,
  good: [
    { id: "g_01", taskId: "task_01", kind: "expected_output", source: "docstring_anchor", input: [1], output: [1], verdict: "ACC", timestamp: "2026-10-12T00:00:00Z" },
  ],
  bad: [
    { id: "b_01", taskId: "task_01", kind: "rejection", source: "docstring_anchor", input: [2], output: [3], verdict: "REJ", timestamp: "2026-10-12T00:00:00Z" },
  ],
  bSynth: [
    { id: "bs_01", taskId: "task_01", mutationType: "boundary_shift", input: [0], mutantOutput: [1], isCaughtByP0: true, timestamp: "2026-10-12T00:00:00Z" },
  ],
  metamorphicTree: { id: "anchor_root_01", taskId: "task_01", input: [1], expectedOutput: [1], origin: "gốc", children: [] },
  specDebt: [
    {
      id: "debt_01",
      taskId: "task_04",
      witness: [1],
      debtType: "missing_a2_anchor",
      title: "Thiếu anchor A2",
      description: "Cần bổ sung MR.",
      severity: "high",
      recordedAt: "2026-10-12T00:00:00Z",
    },
  ],
  invariant: { holds: true, intersectionCount: 0, violatingKeys: [] },
};

export const RQ1_RESULT: RQResultResponse = {
  runId: RUN_ID,
  rq: "rq1",
  title: "RQ1: Hiệu quả Phân rã và Lọc Lỗi Đặc tả P0",
  description: "So sánh trước/sau bộ lọc.",
  sampleSize: 40,
  table: {
    headers: ["Nhóm Lỗi", "Trước Lọc", "Sau Lọc", "Tỷ lệ Giảm"],
    rows: [["Đặc tả quá chặt (Over-constraint)", 10, 2, "-80%"]],
  },
  data: {
    rq: "rq1",
    categories: [
      {
        category: "Đặc tả quá chặt (Over-constraint)",
        beforeCount: 10,
        afterCount: 2,
        reductionRatio: 80,
        witnesses: [{ caseId: "case_spec_fault", taskId: "task_01", witnessPreview: "[5, 3, 2, 8]", verdict: "SPEC_FAULT" }],
      },
    ],
  },
};

export const FAULT_INJECTION_STATE: FaultInjectionStateResponse = {
  options: {
    specFaults: [{ value: "over_tight", label: "Đặc tả quá chặt" }],
    codeFaults: [{ value: "off_by_one", label: "Off-by-one" }],
    trustedFaults: [{ value: "mr_corrupt", label: "Đột biến sai MR" }],
  },
  defaults: { specFault: "over_tight", codeFault: "off_by_one", trustedFault: "mr_corrupt" },
  metrics: { misattributionRate: 2.4, faultyPatchSlipRate: 0, gateBlockedCount: 48, totalInjections: 50 },
};

export const SETTINGS: SettingsResponse = {
  settings: {
    defaultCoderModel: "model-a",
    defaultSpecModel: "model-b",
    maxCallsBudget: 100,
    maxTokensBudget: 1000,
    a3TimeoutMs: 1000,
    z3TimeoutMs: 1000,
    enableFlaky: true,
    enableAudit: true,
    enableBSynth: true,
  },
  models: [
    { id: "model-a", name: "Model A", family: "a" },
    { id: "model-b", name: "Model B", family: "b" },
  ],
};

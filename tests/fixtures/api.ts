/**
 * tests/fixtures/api.ts — Response mẫu theo hợp đồng api.md, CHỈ dùng trong test.
 *
 * App không import file này: dữ liệu thật luôn đến từ backend qua /api/*.
 */
import type { CaseDossier, GateResult } from "@/core/types";
import type {
  AdmissionReport,
  AnnotationQueueResponse,
  EvidenceStoreResponse,
  FaultInjectionStateResponse,
  RQResultResponse,
  RepairCandidateEvaluation,
  RunSummary,
  SettingsResponse,
} from "@/lib/api/types";

export const RUN_ID = "run_test_01";

const PASSING_GATE: GateResult = {
  passed: true,
  checks: {
    g1_accept_grounded: true,
    g2_reject_b: true,
    g3_locality: true,
    g4_preserve_g_a2: true,
    g5_in_repair_space_and_bsynth: true,
  },
  guaranteeNature: "structural",
  message: "Vượt qua Gate fail-closed.",
};

export const SPEC_FAULT_CASE: CaseDossier = {
  id: "case_spec_fault",
  taskId: "task_01",
  witness: [5, 3, 2, 8],
  codeOutput: [2, 3, 5, 8],
  specP0: "def monitor(w, ret):\n    assert ret == sorted(w)",
  monitorRejectionClause: "ret == sorted(w)",
  currentMonitorVersion: "P_0",
  groundedEvidence: [],
  advisoryEvidence: [],
  adjudication: {
    verdict: "SPEC_FAULT",
    matchedRule: "R2",
    skippedRules: [],
    expectedOutput: [2, 3, 5, 8],
    explanation: "Code trả về đúng e(w), nhưng monitor P0 bác bỏ e(w).",
  },
  gateResult: PASSING_GATE,
};

export const UNKNOWN_CASE: CaseDossier = {
  ...SPEC_FAULT_CASE,
  id: "case_und_evidence",
  adjudication: { ...SPEC_FAULT_CASE.adjudication, verdict: "UNKNOWN_EVIDENCE", matchedRule: "R6" },
  ticket: {
    id: "ticket_und_ev_1",
    caseId: "case_und_evidence",
    witness: [5, 3, 2, 8],
    codeOutput: [2, 3, 5, 8],
    status: "open",
    questionType: "expected-output",
    promptText: "Đầu ra kỳ vọng e(w) là gì?",
  },
};

export const ANNOTATION_QUEUE: AnnotationQueueResponse = {
  runId: RUN_ID,
  seed: "annotation_seed",
  total: 1,
  items: [{ ...UNKNOWN_CASE, ticket: UNKNOWN_CASE.ticket!, isUniqueOutput: true }],
};

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

export const ADMISSION_REPORT: AdmissionReport = {
  runId: RUN_ID,
  ranAt: "2026-10-12T00:00:00Z",
  steps: [
    { index: 1, key: "static_checker", title: "1. Static checker", description: "AST", status: "passed" },
    { index: 2, key: "contract_runner", title: "2. Chạy contract", description: "pre/post", status: "passed" },
    {
      index: 3,
      key: "anchor_cross_check",
      title: "3. Kiểm chéo A2/A3 với anchor closure",
      description: "cross-check",
      status: "warning",
      hasViolation: true,
      violatedTaskId: "task_04",
    },
    { index: 4, key: "silent_fault_replay", title: "4. Replay đo SILENT_FAULT", description: "replay", status: "passed", silentFaultsCount: 2 },
    { index: 5, key: "z3_property_verifier", title: "5. Z3 kiểm tra A2", description: "z3", status: "passed" },
    { index: 6, key: "bsynth_slack_measurement", title: "6. Đo lỏng P0 qua B_synth", description: "bsynth", status: "passed", slackRatio: 16.7 },
  ],
  summary: {
    slackRatio: 16.7,
    slackCases: 2,
    totalTasks: 12,
    silentFaultCases: ["case_a", "case_b"],
    admittedTasks: 11,
    excludedTasks: 1,
  },
  reviewedTaskIds: [],
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

export function repairCandidate(
  overrides: Partial<RepairCandidateEvaluation> & Pick<RepairCandidateEvaluation, "id">,
): RepairCandidateEvaluation {
  return {
    family: "case_exception",
    guard: "len(w) == 4",
    replacement: "ret[0] <= ret[2]",
    targetExpectedOutput: [1, 2],
    rank: 1,
    diffPreview: "",
    complexity: 25,
    breadth: 5,
    passMode: "PASS_PROOF",
    isProofVerified: true,
    hasA2Anchor: true,
    gateResult: PASSING_GATE,
    isBEmptyInGuard: false,
    ...overrides,
  };
}

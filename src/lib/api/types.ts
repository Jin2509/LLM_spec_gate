/**
 * src/lib/api/types.ts — Hợp đồng dữ liệu (DTO) giữa front-end và backend.
 *
 * Mọi kiểu ở đây được mô tả lại trong api.md để backend triển khai.
 */
import type {
  AcademicTask,
  AdvisorySource,
  CaseDossier,
  GateResult,
  HumanQueryTicket,
  ProvenanceSource,
  RepairCandidate,
  Verdict,
} from "@/core/types";
import type { Metrics, Run, EvalVerdict, Turn } from "@/core/evaluation-types";
import type { MonitorVersionRecord, BadTraceItem } from "@/core/revocation";
import type { AnchorLevel, CostEstimate, ExperimentConfig, ExperimentManifest } from "@/core/experiment";
import type { GatePolicy, RankedRepairCandidate } from "@/core/repair";
import type {
  AblationCell,
  ConfusionMatrixRow,
  ModelCorrelationCell,
  RQ1Category,
  RQ2MethodData,
  RQ5Metric,
  RQ6Strategy,
  UnknownGateDecomposition,
} from "@/reporting/results-data";

// ── Run manifest & sự kiện SSE ──────────────────────────────────────────────
export interface RunManifest {
  id: string;
  datasetId: string;
  seed: string;
  heldOutRatio: number;
  totalTasks: number;
  runTaskIds: string[];
  heldOutTaskIds: string[];
  isHeldOutLocked: boolean;
  activeMonitorVersion: string;
  createdAt: string;
}
export interface CurrentRunResponse {
  runId: string;
}
/** Bối cảnh run hiển thị trên Topbar (badge + thanh bất biến). */
export interface RunSummary {
  runId: string;
  datasetName: string;
  anchorLevel: AnchorLevel;
  monitorVersion: string;
  isHeldOutLocked: boolean;
  isDisjointGB: boolean;
  ticketsSpent: number;
  ticketsTotal: number;
  rejectedWritesCount: number;
}
export interface RunEvent {
  seq: number;
  event:
    | "run_created"
    | "admission_step"
    | "admission_completed"
    | "verdict"
    | "heldout_locked"
    | "repair_deployed"
    | "patch_revoked";
  data: Record<string, unknown>;
  timestamp: string;
}

// ── Evidence records ────────────────────────────────────────────────────────
export interface EvidenceRecord {
  readonly id: string;
  readonly taskId: string;
  readonly kind: "expected_output" | "property" | "rejection";
  readonly source: ProvenanceSource | AdvisorySource;
  readonly input: unknown;
  readonly output: unknown;
  readonly verdict: "ACC" | "REJ";
  readonly timestamp: string;
  readonly notes?: string;
}
export interface BSynthRecord {
  readonly id: string;
  readonly taskId: string;
  readonly mutationType: "boundary_shift" | "type_perturbation" | "extreme_value" | "null_injection";
  readonly input: unknown;
  readonly mutantOutput: unknown;
  readonly isCaughtByP0: boolean;
  readonly timestamp: string;
}
export interface MetamorphicAnchorNode {
  readonly id: string;
  readonly taskId: string;
  readonly input: unknown;
  readonly expectedOutput: unknown;
  readonly origin: "gốc" | "dẫn xuất";
  readonly parentId?: string;
  readonly metamorphicRelation?: string; // e.g. "MR_permutation", "MR_shift"
  readonly children: ReadonlyArray<MetamorphicAnchorNode>;
}
export interface SpecDebtItem {
  readonly id: string;
  readonly taskId: string;
  readonly witness: unknown;
  readonly debtType: "unresolved_advisory" | "missing_a2_anchor" | "weak_precondition" | "open_ticket";
  readonly title: string;
  readonly description: string;
  readonly severity: "high" | "medium" | "low";
  readonly recordedAt: string;
}

// ── Datasets ────────────────────────────────────────────────────────────────
export interface DatasetSummary {
  id: string;
  name: string;
  version: string;
  taskCount: number;
}
export interface DatasetListResponse {
  datasets: Array<DatasetSummary & { tasks: AcademicTask[] }>;
}
export interface DatasetTasksResponse {
  datasetId: string;
  taskCount: number;
  tasks: AcademicTask[];
}
export interface DatasetUploadResponse {
  success: boolean;
  message?: string;
  taskCount?: number;
  tasks?: AcademicTask[];
  errors?: Array<{ line: number; message: string; field?: string }>;
}

// ── Evaluation runs (lịch sử / thống kê) ────────────────────────────────────
export interface RunFilters {
  page?: number;
  pageSize?: number;
  verdict?: string;
  problem?: string;
  dataset?: string;
  from?: string;
  to?: string;
}
export interface RunListResponse {
  total: number;
  page: number;
  pageSize: number;
  runs: Run[];
}
export interface RunResponse {
  run: Run;
}
export interface CreateEvaluationRunRequest {
  mode: "evaluation";
  datasetId: string;
  datasetVersion: string;
  problemId: string;
  problem: string;
}
export interface PatchRunRequest {
  patch?: Partial<Pick<Run, "status" | "confidence" | "gold_label">>;
  turn?: Omit<Turn, "id" | "at">;
  verdict?: EvalVerdict;
  latency?: Record<string, number>;
  log?: string;
  level?: "info" | "warn" | "error";
}
export interface StatsFilters {
  dataset?: string;
  verdict?: string;
  from?: string;
  to?: string;
}
export interface StatsResponse {
  metrics: Metrics;
  runs: Run[];
}
export type ExportFormat = "csv" | "json" | "stats";

// ── Held-out partition ──────────────────────────────────────────────────────
export interface LockHeldOutRequest {
  seed?: string;
  heldOutRatio?: number;
}
export interface LockHeldOutResponse {
  success: boolean;
  message: string;
  manifest: RunManifest;
}

// ── Cases / Repair ──────────────────────────────────────────────────────────
export interface CaseListResponse {
  cases: CaseDossier[];
}
/** Ứng viên sửa đặc tả kèm đánh giá Gate G1–G5 và kiểm tra B ∪ B_synth trong guard g. */
export type RepairCandidateEvaluation = RankedRepairCandidate & {
  gateResult: GateResult;
  isBEmptyInGuard: boolean;
};
export interface RepairCandidatesResponse {
  caseId: string;
  candidates: RepairCandidateEvaluation[];
}
export interface DeployRepairRequest {
  repairCandidate?: RepairCandidate;
  policy: GatePolicy;
  isProofVerified?: boolean;
  hasA2Anchor?: boolean;
}
export interface DeployRepairResponse {
  success: boolean;
  caseId: string;
  policy: GatePolicy;
  passMode?: string;
  policyDecision: { canDeploy: boolean; reason?: string; [key: string]: unknown };
  isShadowOnly: boolean;
  gateResult: GateResult;
  previousMonitorVersion: string;
  activeMonitorVersion: string;
}

// ── Tickets / Annotation ────────────────────────────────────────────────────
export interface TicketAnswerRequest {
  answer?: unknown;
  isUncertain?: boolean;
  durationMs?: number;
}
export interface TicketAnswerResponse {
  success: boolean;
  ticket: HumanQueryTicket;
  message: string;
  /** Verdict cuối sau khi áp dụng câu trả lời của người (bắt buộc với lượt bổ sung trong chat). */
  resolvedVerdict?: Verdict;
  /** Lời giải thích cho verdict cuối. */
  explanation?: string;
}
export interface TicketDeferResponse {
  success: boolean;
  ticketId: string;
  status: "open";
  message: string;
}
/** Một thẻ trong hàng đợi gán nhãn: hồ sơ case + thuộc tính task cần cho QueryTicket. */
export type AnnotationQueueItem = CaseDossier & { ticket: HumanQueryTicket; isUniqueOutput: boolean };
export interface AnnotationQueueResponse {
  runId: string;
  seed: string;
  total: number;
  items: AnnotationQueueItem[];
}

// ── Admission ───────────────────────────────────────────────────────────────
export type AdmissionStepStatus = "idle" | "running" | "passed" | "warning" | "error";
export interface AdmissionStep {
  index: number;
  key: string;
  title: string;
  description: string;
  status: AdmissionStepStatus;
  details?: string;
  hasViolation?: boolean;
  violatedTaskId?: string;
  silentFaultsCount?: number;
  silentFaultCases?: string[];
  slackRatio?: number;
}
export interface AdmissionReport {
  runId: string;
  ranAt: string;
  steps: AdmissionStep[];
  summary: {
    slackRatio: number;
    slackCases: number;
    totalTasks: number;
    silentFaultCases: string[];
    admittedTasks: number;
    excludedTasks: number;
  };
  reviewedTaskIds: string[];
}
export interface AdmissionReviewResponse {
  runId: string;
  reviewedTaskIds: string[];
}

// ── Evidence store ──────────────────────────────────────────────────────────
export interface EvidenceStoreResponse {
  runId: string;
  good: EvidenceRecord[];
  bad: EvidenceRecord[];
  bSynth: BSynthRecord[];
  metamorphicTree: MetamorphicAnchorNode;
  specDebt: SpecDebtItem[];
  invariant: { holds: boolean; intersectionCount: number; violatingKeys: string[] };
}

// ── Revocation ──────────────────────────────────────────────────────────────
export interface RevocationHistoryResponse {
  runId: string;
  monitorHistory: MonitorVersionRecord[];
}
export interface InjectBadTraceResponse {
  success: boolean;
  revocationResult: {
    revoked: boolean;
    violatingTrace?: BadTraceItem;
    reason?: string;
    newActiveVersion?: string;
  };
  currentHistory: MonitorVersionRecord[];
}

// ── Results RQ1–RQ6 ─────────────────────────────────────────────────────────
export type RQId = "rq1" | "rq2" | "rq3" | "rq4" | "rq5" | "rq6";
export const RQ_IDS: readonly RQId[] = ["rq1", "rq2", "rq3", "rq4", "rq5", "rq6"];

export type RQData =
  | { rq: "rq1"; categories: RQ1Category[] }
  | { rq: "rq2"; methods: RQ2MethodData[]; confusionMatrix: ConfusionMatrixRow[] }
  | { rq: "rq3"; cells: AblationCell[] }
  | { rq: "rq4"; cells: ModelCorrelationCell[] }
  | { rq: "rq5"; suite: RQ5Metric[]; unknownGateBreakdown: UnknownGateDecomposition[] }
  | { rq: "rq6"; strategies: RQ6Strategy[] };

export interface RQResultResponse {
  runId: string;
  rq: RQId;
  title: string;
  description: string;
  sampleSize: number;
  table: { headers: string[]; rows: Array<Array<string | number>> };
  data: RQData;
}

// ── Experiments ─────────────────────────────────────────────────────────────
export interface ModelOption {
  id: string;
  name: string;
  family: string;
}
export interface ExperimentOptionsResponse {
  datasets: Array<{ id: string; name: string; taskCount: number; heldOutRatio: number; isHeldOutLocked: boolean }>;
  models: ModelOption[];
  baselines: string[];
  anchorLevels: AnchorLevel[];
  /** Cấu hình khởi tạo form (backend chọn theo settings hiện hành). */
  defaults: ExperimentConfig;
}
export interface ExperimentPlanResponse {
  familyCheck: { isSameFamily: boolean; warning?: string };
  costEstimate: CostEstimate;
  manifest: ExperimentManifest;
}
export interface ExperimentProgress {
  completed: number;
  total: number;
  accCount: number;
  rejCount: number;
  unknownCount: number;
  repairCount: number;
  revocations: number;
  pendingHumanTickets: number;
}
export interface ExperimentStatusResponse {
  experimentId: string;
  status: "running" | "completed";
  config: ExperimentConfig;
  manifestHash: string;
  progress: ExperimentProgress;
}

// ── Fault injection ─────────────────────────────────────────────────────────
export interface FaultInjectionProfile {
  specFault: string;
  codeFault: string;
  trustedFault: string;
}
export interface FaultInjectionOption {
  value: string;
  label: string;
}
export interface FaultInjectionMetrics {
  misattributionRate: number;
  faultyPatchSlipRate: number;
  gateBlockedCount: number;
  totalInjections: number;
}
export interface FaultInjectionStateResponse {
  options: {
    specFaults: FaultInjectionOption[];
    codeFaults: FaultInjectionOption[];
    trustedFaults: FaultInjectionOption[];
  };
  defaults: FaultInjectionProfile;
  metrics: FaultInjectionMetrics;
}
export interface FaultInjectionRunResponse {
  profile: FaultInjectionProfile;
  metrics: FaultInjectionMetrics;
  ranAt: string;
}

// ── Settings ────────────────────────────────────────────────────────────────
export interface LabSettings {
  defaultCoderModel: string;
  defaultSpecModel: string;
  maxCallsBudget: number;
  maxTokensBudget: number;
  a3TimeoutMs: number;
  z3TimeoutMs: number;
  enableFlaky: boolean;
  enableAudit: boolean;
  enableBSynth: boolean;
}
export interface SettingsResponse {
  settings: LabSettings;
  models: ModelOption[];
  updatedAt?: string;
}

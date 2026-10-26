/**
 * src/lib/api/types.ts — Hợp đồng dữ liệu (DTO) giữa front-end và backend.
 *
 * Mọi kiểu ở đây được mô tả lại trong api.md để backend triển khai.
 */
import type { AcademicTask, AdvisorySource, ProvenanceSource } from "@/core/types";
import type { Metrics, Run } from "@/core/evaluation-types";
import type { AnchorLevel, CostEstimate, ExperimentConfig, ExperimentManifest } from "@/core/experiment";
import type {
  AblationCell,
  ConfusionMatrixRow,
  ModelCorrelationCell,
  RQ1Category,
  RQ2MethodData,
  RQ5Metric,
  RQ6Strategy,
  UnknownGateDecomposition,
} from "@/core/results";

// ── Run manifest & sự kiện SSE ──────────────────────────────────────────────
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
export interface DatasetUploadResponse {
  success: boolean;
  message?: string;
  taskCount?: number;
  errors?: Array<{ line: number; message: string; field?: string }>;
}

// ── Hỏi đáp: POST /api/run, /api/run/followup (SSE) ─────────────────────────
export type LlmProvider = "openai" | "anthropic";
/** Một LLM do người dùng chọn. `apiKey` chỉ đi trong body request, không lưu ở client hay server. */
export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  apiKey: string;
}
/** Chạy một tác vụ của dataset: backend sinh đặc tả, sinh code rồi đối chiếu. */
export interface ChatRequest {
  llmSpec: LlmConfig;
  llmCode: LlmConfig;
  datasetId: string;
  taskId: string;
}
/** Lượt hỏi lại duy nhất khi kết luận là "unknown": gửi câu trả lời của người dùng cùng đặc tả/code vòng đầu. */
export interface ChatFollowupRequest {
  llmSpec: LlmConfig;
  datasetId: string;
  taskId: string;
  spec: string;
  code: string;
  answer: string;
}
export type ChatStepId = "spec" | "code" | "check";
/** Kết luận do backend quyết định; UI chỉ ánh xạ sang nhãn và màu. */
export type ChatVerdict = "consistent" | "spec_fault" | "code_fault" | "unknown";
export type ChatEvent =
  | { event: "step"; data: { step: ChatStepId; status: "running" } }
  | { event: "step"; data: { step: ChatStepId; status: "done"; output: string; durationMs: number } }
  /** `question` chỉ có khi backend cần hỏi lại người dùng (một lần). */
  | { event: "verdict"; data: { verdict: ChatVerdict; reason: string; question?: string } }
  | { event: "error"; data: { message: string; step?: ChatStepId } };

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

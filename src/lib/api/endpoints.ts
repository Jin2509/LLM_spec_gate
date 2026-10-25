/**
 * src/lib/api/endpoints.ts — Danh mục endpoint có kiểu, nhóm theo tài nguyên.
 *
 * Component KHÔNG gọi fetch trực tiếp; luôn đi qua `api.*` để hợp đồng
 * front-end ↔ back-end tập trung một chỗ (đối chiếu với api.md).
 */
import { apiRequest, apiRequestText, withQuery } from "./client";
import type {
  AdmissionReport,
  AdmissionReviewResponse,
  AnnotationQueueResponse,
  CaseListResponse,
  CreateEvaluationRunRequest,
  CurrentRunResponse,
  DatasetListResponse,
  DatasetTasksResponse,
  DatasetUploadResponse,
  DeployRepairRequest,
  DeployRepairResponse,
  EvidenceStoreResponse,
  ExperimentOptionsResponse,
  ExperimentPlanResponse,
  ExperimentStatusResponse,
  ExportFormat,
  FaultInjectionProfile,
  FaultInjectionRunResponse,
  FaultInjectionStateResponse,
  InjectBadTraceResponse,
  LabSettings,
  LockHeldOutRequest,
  LockHeldOutResponse,
  PatchRunRequest,
  RQId,
  RQResultResponse,
  RepairCandidatesResponse,
  RevocationHistoryResponse,
  RunFilters,
  RunListResponse,
  RunManifest,
  RunResponse,
  RunSummary,
  SettingsResponse,
  StatsFilters,
  StatsResponse,
  TicketAnswerRequest,
  TicketAnswerResponse,
  TicketDeferResponse,
} from "./types";
import type { CaseDossier } from "@/core/types";
import type { BadTraceItem } from "@/core/revocation";
import type { ExperimentConfig } from "@/core/experiment";

const enc = encodeURIComponent;

export const datasetsApi = {
  list: (signal?: AbortSignal) => apiRequest<DatasetListResponse>("/api/datasets", { signal }),
  tasks: (datasetId: string, signal?: AbortSignal) =>
    apiRequest<DatasetTasksResponse>(`/api/datasets/${enc(datasetId)}/tasks`, { signal }),
  uploadJsonl: (jsonl: string) => apiRequestText<DatasetUploadResponse>("/api/datasets", jsonl),
};

export const runsApi = {
  list: (filters: RunFilters, signal?: AbortSignal) =>
    apiRequest<RunListResponse>(withQuery("/api/runs", { ...filters }), { signal }),
  clear: (confirmation: string) =>
    apiRequest<{ deleted: boolean }>("/api/runs", { method: "DELETE", body: { confirmation } }),
  createEvaluation: (body: CreateEvaluationRunRequest) =>
    apiRequest<RunResponse>("/api/runs", { method: "POST", body }),
  /** Run đang hoạt động — dùng cho các route không có [runId] trong URL. */
  current: (signal?: AbortSignal) => apiRequest<CurrentRunResponse>("/api/runs/current", { signal }),
  summary: (runId: string, signal?: AbortSignal) =>
    apiRequest<RunSummary>(`/api/runs/${enc(runId)}/summary`, { signal }),
  get: (runId: string, signal?: AbortSignal) => apiRequest<RunResponse>(`/api/runs/${enc(runId)}`, { signal }),
  patch: (runId: string, body: PatchRunRequest) =>
    apiRequest<RunResponse>(`/api/runs/${enc(runId)}`, { method: "PATCH", body }),
  review: (runId: string, body: { agree: boolean; note: string }) =>
    apiRequest<RunResponse>(`/api/runs/${enc(runId)}/review`, { method: "PATCH", body }),
  followup: (runId: string, content: string) =>
    apiRequest<RunResponse>(`/api/runs/${enc(runId)}/followup`, { method: "POST", body: { content } }),
  exportUrl: (format: ExportFormat) => withQuery("/api/runs/export", { format }),
  logStreamUrl: (runId: string) => withQuery("/api/logs/stream", { runId }),
  eventsUrl: (runId: string, lastEventId: number) =>
    withQuery(`/api/runs/${enc(runId)}/events`, { lastEventId }),
  manifest: (runId: string, signal?: AbortSignal) =>
    apiRequest<RunManifest>(`/api/runs/${enc(runId)}/manifest`, { signal }),
  lockHeldOut: (runId: string, body: LockHeldOutRequest) =>
    apiRequest<LockHeldOutResponse>(`/api/runs/${enc(runId)}/lock-heldout`, { method: "POST", body }),
};

export const statsApi = {
  get: (filters: StatsFilters, signal?: AbortSignal) =>
    apiRequest<StatsResponse>(withQuery("/api/stats", { ...filters }), { signal }),
};

export const casesApi = {
  list: (filters: { runId?: string; hasTicket?: boolean } = {}, signal?: AbortSignal) =>
    apiRequest<CaseListResponse>(withQuery("/api/cases", filters), { signal }),
  repairCandidates: (runId: string, caseId: string, signal?: AbortSignal) =>
    apiRequest<RepairCandidatesResponse>(`/api/runs/${enc(runId)}/cases/${enc(caseId)}/repair-candidates`, { signal }),
  get: (caseId: string, signal?: AbortSignal) => apiRequest<CaseDossier>(`/api/cases/${enc(caseId)}`, { signal }),
  deployRepair: (caseId: string, body: DeployRepairRequest) =>
    apiRequest<DeployRepairResponse>(`/api/cases/${enc(caseId)}/repair/deploy`, { method: "POST", body }),
  /** Trả về Response thô để đọc luồng NDJSON (xem readNdjson). */
  stream: (runId: string, caseId: string, prompt: string | undefined, signal: AbortSignal) =>
    fetch(`/api/runs/${enc(runId)}/cases/${enc(caseId)}/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal,
    }),
};

export const ticketsApi = {
  answer: (ticketId: string, body: TicketAnswerRequest) =>
    apiRequest<TicketAnswerResponse>(`/api/tickets/${enc(ticketId)}/answer`, { method: "POST", body }),
  defer: (ticketId: string) =>
    apiRequest<TicketDeferResponse>(`/api/tickets/${enc(ticketId)}/defer`, { method: "POST" }),
  queue: (runId: string, signal?: AbortSignal) =>
    apiRequest<AnnotationQueueResponse>(`/api/runs/${enc(runId)}/annotation-queue`, { signal }),
};

export const admissionApi = {
  get: (runId: string, signal?: AbortSignal) =>
    apiRequest<AdmissionReport>(`/api/runs/${enc(runId)}/admission`, { signal }),
  run: (runId: string) => apiRequest<AdmissionReport>(`/api/runs/${enc(runId)}/admission`, { method: "POST" }),
  markForReview: (runId: string, taskId: string) =>
    apiRequest<AdmissionReviewResponse>(`/api/runs/${enc(runId)}/admission/review`, {
      method: "POST",
      body: { taskId },
    }),
};

export const evidenceApi = {
  get: (runId: string, signal?: AbortSignal) =>
    apiRequest<EvidenceStoreResponse>(`/api/runs/${enc(runId)}/evidence`, { signal }),
};

export const revocationApi = {
  history: (runId: string, signal?: AbortSignal) =>
    apiRequest<RevocationHistoryResponse>(`/api/runs/${enc(runId)}/revocation`, { signal }),
  injectBadTrace: (runId: string, trace: BadTraceItem) =>
    apiRequest<InjectBadTraceResponse>(`/api/runs/${enc(runId)}/revocation`, { method: "POST", body: { trace } }),
};

export const resultsApi = {
  get: (runId: string, rq: RQId, signal?: AbortSignal) =>
    apiRequest<RQResultResponse>(`/api/runs/${enc(runId)}/results/${rq}`, { signal }),
};

export const experimentsApi = {
  options: (signal?: AbortSignal) => apiRequest<ExperimentOptionsResponse>("/api/experiments/options", { signal }),
  plan: (config: ExperimentConfig, signal?: AbortSignal) =>
    apiRequest<ExperimentPlanResponse>("/api/experiments/plan", { method: "POST", body: { config }, signal }),
  start: (config: ExperimentConfig) =>
    apiRequest<ExperimentStatusResponse>("/api/experiments", { method: "POST", body: { config } }),
  status: (experimentId: string, signal?: AbortSignal) =>
    apiRequest<ExperimentStatusResponse>(`/api/experiments/${enc(experimentId)}`, { signal }),
};

export const faultInjectionApi = {
  get: (signal?: AbortSignal) => apiRequest<FaultInjectionStateResponse>("/api/fault-injection", { signal }),
  run: (profile: FaultInjectionProfile) =>
    apiRequest<FaultInjectionRunResponse>("/api/fault-injection", { method: "POST", body: profile }),
};

export const settingsApi = {
  get: (signal?: AbortSignal) => apiRequest<SettingsResponse>("/api/settings", { signal }),
  update: (settings: LabSettings) => apiRequest<SettingsResponse>("/api/settings", { method: "PUT", body: settings }),
};

export const api = {
  datasets: datasetsApi,
  runs: runsApi,
  stats: statsApi,
  cases: casesApi,
  tickets: ticketsApi,
  admission: admissionApi,
  evidence: evidenceApi,
  revocation: revocationApi,
  results: resultsApi,
  experiments: experimentsApi,
  faultInjection: faultInjectionApi,
  settings: settingsApi,
};

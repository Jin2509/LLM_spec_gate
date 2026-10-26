/**
 * src/lib/api/endpoints.ts — Danh mục endpoint có kiểu, nhóm theo tài nguyên.
 *
 * Component KHÔNG gọi fetch trực tiếp; luôn đi qua `api.*` để hợp đồng
 * front-end ↔ back-end tập trung một chỗ (đối chiếu với api.md).
 */
import { apiRequest, apiRequestText, readSse, withQuery } from "./client";
import type {
  ChatEvent,
  ChatFollowupRequest,
  ChatRequest,
  DatasetListResponse,
  DatasetUploadResponse,
  CurrentRunResponse,
  EvidenceStoreResponse,
  ExperimentOptionsResponse,
  ExperimentPlanResponse,
  ExperimentStatusResponse,
  ExportFormat,
  FaultInjectionProfile,
  FaultInjectionRunResponse,
  FaultInjectionStateResponse,
  LabSettings,
  RQId,
  RQResultResponse,
  RunFilters,
  RunListResponse,
  RunResponse,
  RunSummary,
  SettingsResponse,
  StatsFilters,
  StatsResponse,
} from "./types";
import type { ExperimentConfig } from "@/core/experiment";

const enc = encodeURIComponent;

export const runsApi = {
  list: (filters: RunFilters, signal?: AbortSignal) =>
    apiRequest<RunListResponse>(withQuery("/api/runs", { ...filters }), { signal }),
  clear: (confirmation: string) =>
    apiRequest<{ deleted: boolean }>("/api/runs", { method: "DELETE", body: { confirmation } }),
  /** Run đang hoạt động — dùng cho các route không có [runId] trong URL. */
  current: (signal?: AbortSignal) => apiRequest<CurrentRunResponse>("/api/runs/current", { signal }),
  summary: (runId: string, signal?: AbortSignal) =>
    apiRequest<RunSummary>(`/api/runs/${enc(runId)}/summary`, { signal }),
  get: (runId: string, signal?: AbortSignal) => apiRequest<RunResponse>(`/api/runs/${enc(runId)}`, { signal }),
  review: (runId: string, body: { agree: boolean; note: string }) =>
    apiRequest<RunResponse>(`/api/runs/${enc(runId)}/review`, { method: "PATCH", body }),
  exportUrl: (format: ExportFormat) => withQuery("/api/runs/export", { format }),
  eventsUrl: (runId: string, lastEventId: number) =>
    withQuery(`/api/runs/${enc(runId)}/events`, { lastEventId }),
};

export const statsApi = {
  get: (filters: StatsFilters, signal?: AbortSignal) =>
    apiRequest<StatsResponse>(withQuery("/api/stats", { ...filters }), { signal }),
};

export const evidenceApi = {
  get: (runId: string, signal?: AbortSignal) =>
    apiRequest<EvidenceStoreResponse>(`/api/runs/${enc(runId)}/evidence`, { signal }),
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

export const datasetsApi = {
  list: (signal?: AbortSignal) => apiRequest<DatasetListResponse>("/api/datasets", { signal }),
  uploadJsonl: (jsonl: string) => apiRequestText<DatasetUploadResponse>("/api/datasets", jsonl),
};

function postSse(path: string, body: unknown, signal: AbortSignal) {
  return readSse<ChatEvent>(
    fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal }),
  );
}

/** Hỏi đáp (SSE). Key đi trong body, không lưu ở đâu. */
export const chatApi = {
  /** Chạy một tác vụ của dataset → đặc tả, code, kết luận. */
  run: (body: ChatRequest, signal: AbortSignal) => postSse("/api/run", body, signal),
  /** Lượt hỏi lại duy nhất sau kết luận "unknown"; kết luận trả về là cuối cùng. */
  followup: (body: ChatFollowupRequest, signal: AbortSignal) => postSse("/api/run/followup", body, signal),
};

export const api = {
  chat: chatApi,
  datasets: datasetsApi,
  runs: runsApi,
  stats: statsApi,
  evidence: evidenceApi,
  results: resultsApi,
  experiments: experimentsApi,
  faultInjection: faultInjectionApi,
  settings: settingsApi,
};

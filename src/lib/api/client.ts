/**
 * src/lib/api/client.ts — HTTP client dùng chung cho mọi component phía client.
 *
 * - Chuẩn hoá lỗi thành ApiError (status + code + message tiếng Việt từ server).
 * - Mọi endpoint được liệt kê trong api.md ở thư mục gốc.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type QueryValue = string | number | boolean | null | undefined;

export function withQuery(path: string, params: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

export interface ApiRequestInit {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function errorFrom(status: number, body: unknown): ApiError {
  const record = (body ?? {}) as { error?: unknown; code?: unknown };
  const message = typeof record.error === "string" ? record.error : `Yêu cầu thất bại (HTTP ${status}).`;
  return new ApiError(message, status, typeof record.code === "string" ? record.code : undefined, body);
}

/** Gửi request JSON và trả về body đã parse; ném ApiError khi status không 2xx. */
export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { method = "GET", body, signal } = init;
  const response = await fetch(path, {
    method,
    signal,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const data = await readJson(response);
  if (!response.ok) throw errorFrom(response.status, data);
  return data as T;
}

/** Gửi body dạng text thô (ví dụ: tệp JSONL). */
export async function apiRequestText<T>(path: string, text: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/x-ndjson" },
    body: text,
    signal,
  });
  const data = await readJson(response);
  if (!response.ok) throw errorFrom(response.status, data);
  return data as T;
}

/** Đọc luồng NDJSON (mỗi dòng một JSON) từ response. */
export async function* readNdjson<T>(response: Response): AsyncGenerator<T> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        yield JSON.parse(trimmed) as T;
      } catch {
        // Bỏ qua dòng hỏng, giữ luồng tiếp tục.
      }
    }
  }
  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer.trim()) as T;
    } catch {
      // Dòng cuối không hợp lệ.
    }
  }
}

/** HTTP status của lỗi API (nếu có) — 501 nghĩa là backend chưa có engine cho chức năng này. */
export function errorStatus(error: unknown): number | undefined {
  return error instanceof ApiError ? error.status : undefined;
}

export function errorMessage(error: unknown, fallback = "Đã xảy ra lỗi không xác định."): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Lỗi đã chuẩn hoá để hiển thị bằng <ErrorState {...error} />. */
export interface DisplayError {
  message: string;
  status?: number;
}

export function toDisplayError(error: unknown, fallback?: string): DisplayError {
  return { message: errorMessage(error, fallback), status: errorStatus(error) };
}

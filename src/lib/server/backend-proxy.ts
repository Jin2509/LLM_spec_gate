/**
 * src/lib/server/backend-proxy.ts — Chuyển tiếp request /api/* sang backend thật.
 *
 * - Backend cấu hình qua biến môi trường máy chủ BACKEND_URL (ví dụ http://localhost:8000).
 *   Path giữ nguyên: /api/runs?page=1 → ${BACKEND_URL}/api/runs?page=1
 * - Không lưu dữ liệu, không có logic nghiệp vụ trong app Next.js.
 * - Luồng SSE / NDJSON / file tải về được truyền thẳng (stream) về client.
 * - JSON trả về vẫn đi qua stripGrading() để bảo đảm không rò trường grading.
 * - Chỉ được import từ Route Handler (chạy phía server); đọc BACKEND_URL từ process.env.
 */
import { stripGrading } from "@/guard/grading-proxy";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "te",
  "trailer",
  "upgrade",
  "host",
  "content-length",
  "accept-encoding",
]);

function jsonError(status: number, error: string, code: string) {
  return Response.json({ error, code }, { status });
}

export function backendBaseUrl(): string | undefined {
  const raw = process.env.BACKEND_URL?.trim();
  return raw ? raw.replace(/\/+$/, "") : undefined;
}

function forwardHeaders(source: Headers): Headers {
  const headers = new Headers();
  source.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  return headers;
}

export async function proxyToBackend(request: Request): Promise<Response> {
  const base = backendBaseUrl();
  if (!base) {
    return jsonError(503, "Chưa cấu hình BACKEND_URL trên máy chủ nên không thể gọi backend.", "BACKEND_NOT_CONFIGURED");
  }

  const incoming = new URL(request.url);
  const target = `${base}${incoming.pathname}${incoming.search}`;
  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: forwardHeaders(request.headers),
      body: hasBody ? await request.arrayBuffer() : undefined,
      signal: request.signal,
      cache: "no-store",
      redirect: "manual",
    });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    return jsonError(502, `Không kết nối được backend (${(error as Error).message}).`, "BACKEND_UNREACHABLE");
  }

  const headers = forwardHeaders(upstream.headers);
  const contentType = upstream.headers.get("content-type") ?? "";
  const isAttachment = (upstream.headers.get("content-disposition") ?? "").includes("attachment");

  // JSON thường: đọc toàn bộ để lọc grading. Stream/file: truyền thẳng.
  if (contentType.includes("application/json") && !isAttachment) {
    const text = await upstream.text();
    if (!text) return new Response(null, { status: upstream.status, headers });
    try {
      return Response.json(stripGrading(JSON.parse(text)), { status: upstream.status, headers });
    } catch {
      return new Response(text, { status: upstream.status, headers });
    }
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}

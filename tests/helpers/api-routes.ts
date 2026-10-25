/**
 * tests/helpers/api-routes.ts — Giả lập backend ở tầng `fetch` cho test UI.
 *
 * Khai báo response theo "METHOD /đường/dẫn/:param" (giống api.md):
 *
 *   const fetchMock = mockApi({
 *     "GET /api/runs/:id/evidence": EVIDENCE_STORE,
 *     "POST /api/fault-injection": ({ body }) => ({ metrics: ... }),
 *     "GET /api/runs/current": { status: 501, body: { error: "chưa có" } },
 *   });
 */
import { vi } from "vitest";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
interface RequestInfoForMock {
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
}
interface Reply {
  status: number;
  body: unknown;
}
type Handler = ((request: RequestInfoForMock) => unknown) | Reply | Response | object | string | number | boolean | null;

function isReply(value: unknown): value is Reply {
  return typeof value === "object" && value !== null && "status" in value && "body" in value && Object.keys(value).length === 2;
}

export function mockApi(routes: Record<string, Handler>) {
  const compiled = Object.entries(routes).map(([key, handler]) => {
    const [method, pattern] = key.split(" ") as [Method, string];
    const keys: string[] = [];
    const source = pattern.replace(/:(\w+)/g, (_, name: string) => {
      keys.push(name);
      return "([^/]+)";
    });
    return { method, regex: new RegExp(`^${source}$`), keys, handler };
  });

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost:3000");
    const method = (init?.method ?? "GET").toUpperCase();
    for (const route of compiled) {
      const match = url.pathname.match(route.regex);
      if (!match || route.method !== method) continue;
      const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1]!)]));
      const body = typeof init?.body === "string" && init.body ? JSON.parse(init.body) : undefined;
      const value = typeof route.handler === "function" ? route.handler({ params, query: url.searchParams, body }) : route.handler;
      if (value instanceof Response) return value; // luồng NDJSON / SSE tự dựng
      const reply = isReply(value) ? value : { status: 200, body: value };
      return Response.json(reply.body, { status: reply.status });
    }
    return Response.json({ error: `Chưa mock ${method} ${url.pathname}` }, { status: 404 });
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Dựng response NDJSON (mỗi phần tử một dòng JSON) như luồng phân xử của backend. */
export function ndjson(events: unknown[]): Response {
  return new Response(events.map((e) => JSON.stringify(e)).join("\n") + "\n", {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}

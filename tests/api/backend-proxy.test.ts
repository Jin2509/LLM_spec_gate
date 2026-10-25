/**
 * tests/api/backend-proxy.test.ts — Route /api/[...path] chỉ chuyển tiếp sang BACKEND_URL.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { GET, POST } from "@/app/api/[...path]/route";

describe("Backend proxy /api/*", () => {
  const upstream = vi.fn();

  beforeEach(() => {
    vi.stubEnv("BACKEND_URL", "http://backend.test/");
    vi.stubGlobal("fetch", upstream);
    upstream.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns 503 when BACKEND_URL is not configured (no local fallback data)", async () => {
    vi.stubEnv("BACKEND_URL", "");
    const res = await GET(new Request("http://localhost:3000/api/runs"));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("BACKEND_NOT_CONFIGURED");
    expect(upstream).not.toHaveBeenCalled();
  });

  it("forwards method, path, query and body to the backend", async () => {
    upstream.mockResolvedValue(Response.json({ run: { run_id: "r1" } }, { status: 201 }));
    const res = await POST(
      new Request("http://localhost:3000/api/runs?x=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "evaluation" }),
      }),
    );

    expect(res.status).toBe(201);
    const [target, init] = upstream.mock.calls[0]!;
    expect(target).toBe("http://backend.test/api/runs?x=1");
    expect(init.method).toBe("POST");
    expect(new TextDecoder().decode(init.body)).toBe('{"mode":"evaluation"}');
  });

  it("passes backend 501 through unchanged so the UI can show 'unavailable'", async () => {
    upstream.mockResolvedValue(Response.json({ error: "Engine chưa cấu hình", code: "ENGINE_NOT_CONFIGURED" }, { status: 501 }));
    const res = await GET(new Request("http://localhost:3000/api/runs/r1/evidence"));
    expect(res.status).toBe(501);
    expect((await res.json()).error).toBe("Engine chưa cấu hình");
  });

  it("strips grading fields from JSON responses", async () => {
    upstream.mockResolvedValue(Response.json({ tasks: [{ id: "t1", grading: { secret: true } }] }));
    const res = await GET(new Request("http://localhost:3000/api/datasets/d1/tasks"));
    const body = await res.json();
    expect(body.tasks[0].id).toBe("t1");
    expect("grading" in body.tasks[0]).toBe(false);
  });

  it("streams NDJSON responses without buffering into JSON", async () => {
    upstream.mockResolvedValue(new Response('{"type":"done"}\n', { headers: { "Content-Type": "application/x-ndjson" } }));
    const res = await POST(new Request("http://localhost:3000/api/runs/r1/cases/c1/stream", { method: "POST", body: "{}" }));
    expect(res.headers.get("content-type")).toContain("application/x-ndjson");
    expect(await res.text()).toBe('{"type":"done"}\n');
  });

  it("returns 502 when the backend is unreachable", async () => {
    upstream.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await GET(new Request("http://localhost:3000/api/stats"));
    expect(res.status).toBe(502);
  });
});

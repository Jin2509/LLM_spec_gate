import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChatScreen, LlmConfigProvider } from "@/features/chat";
import { mockApi } from "../helpers/api-routes";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function sse(events: Array<[string, unknown]>): Response {
  const text = events.map(([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join("");
  return new Response(text, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

const SUCCESS: Array<[string, unknown]> = [
  ["step", { step: "spec", status: "running" }],
  ["step", { step: "spec", status: "done", output: "median(xs) trả về trung vị.", durationMs: 1200 }],
  ["step", { step: "code", status: "running" }],
  ["step", { step: "code", status: "done", output: "def median(xs): ...", durationMs: 900 }],
  ["step", { step: "check", status: "running" }],
  ["step", { step: "check", status: "done", output: '{"verdict":"code_fault"}', durationMs: 400 }],
  ["verdict", { verdict: "code_fault", reason: "Code không xử lý danh sách rỗng." }],
];

function renderChat() {
  return render(
    <LlmConfigProvider>
      <ChatScreen />
    </LlmConfigProvider>,
  );
}

function enterKeys() {
  fireEvent.change(screen.getByTestId("llm-key-spec"), { target: { value: "sk-spec-secret" } });
  fireEvent.change(screen.getByTestId("llm-key-code"), { target: { value: "sk-ant-code-secret" } });
}

describe("Chat page — one request, two LLMs", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("asks for both API keys before sending and never stores them in the browser", () => {
    mockApi({});
    renderChat();

    expect(screen.getByTestId("llm-card-spec").textContent).toContain("LLM sinh đặc tả");
    expect(screen.getByTestId("llm-card-code").textContent).toContain("LLM sinh code");
    expect(screen.getByTestId("llm-key-spec").getAttribute("type")).toBe("password");
    expect(screen.getByTestId("llm-privacy").textContent).toContain("Không lưu vào trình duyệt");

    fireEvent.change(screen.getByLabelText("Mô tả yêu cầu"), { target: { value: "Viết hàm median" } });
    expect((screen.getByTestId("chat-send") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Nhập API key cho cả hai LLM để gửi yêu cầu.")).toBeDefined();

    enterKeys();
    expect((screen.getByTestId("chat-send") as HTMLButtonElement).disabled).toBe(false);

    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    expect(stored).not.toContain("secret");
  });

  it("sends the request once and shows spec, code and the backend's conclusion", async () => {
    let sent: Record<string, unknown> | undefined;
    mockApi({
      "POST /api/run": ({ body }) => {
        sent = body as Record<string, unknown>;
        return sse(SUCCESS);
      },
    });
    renderChat();
    enterKeys();

    const input = screen.getByLabelText("Mô tả yêu cầu");
    fireEvent.change(input, { target: { value: "Viết hàm median(xs)" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(await screen.findByTestId("chat-verdict")).toBeDefined();
    expect(sent).toEqual({
      intent: "Viết hàm median(xs)",
      llmSpec: { provider: "openai", model: "gpt-4o-mini", apiKey: "sk-spec-secret" },
      llmCode: { provider: "anthropic", model: "claude-sonnet-5-5", apiKey: "sk-ant-code-secret" },
    });

    expect(screen.getByTestId("chat-intent").textContent).toBe("Viết hàm median(xs)");
    expect(screen.getByTestId("chat-step-spec").textContent).toContain("median(xs) trả về trung vị.");
    expect(screen.getByTestId("chat-step-code").textContent).toContain("def median(xs): ...");
    const verdict = screen.getByTestId("chat-verdict");
    expect(verdict.dataset.verdict).toBe("code_fault");
    expect(verdict.textContent).toContain("Lỗi nằm ở code");
    expect(verdict.textContent).toContain("Code không xử lý danh sách rỗng.");

    // Một lượt duy nhất: ô nhập biến mất, chỉ còn "Yêu cầu mới".
    expect(screen.queryByLabelText("Mô tả yêu cầu")).toBeNull();
    fireEvent.click(screen.getByTestId("chat-new"));
    expect(screen.getByLabelText("Mô tả yêu cầu")).toBeDefined();
    expect(screen.queryByTestId("chat-verdict")).toBeNull();
  });

  it("shows the backend's error message when a step fails", async () => {
    mockApi({
      "POST /api/run": () =>
        sse([
          ["step", { step: "spec", status: "running" }],
          ["error", { step: "spec", message: "API key bị nhà cung cấp từ chối" }],
        ]),
    });
    renderChat();
    enterKeys();
    fireEvent.change(screen.getByLabelText("Mô tả yêu cầu"), { target: { value: "x" } });
    fireEvent.click(screen.getByTestId("chat-send"));

    await waitFor(() => expect(screen.getByTestId("chat-error").textContent).toContain("API key bị nhà cung cấp từ chối"));
    expect(screen.getByTestId("chat-step-spec").dataset.status).toBe("error");
  });
});

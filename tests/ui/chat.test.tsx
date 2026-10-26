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

const TASK = {
  id: "t_median",
  name: "median",
  intentDocstring: "median(xs) trả về trung vị; danh sách rỗng báo ValueError.",
  outputType: "float",
  isUniqueOutput: true,
  assignedBy: "expert_annotator_1",
  anchorOrigin: "gốc",
  hasA2: true,
  hasA3: false,
  anchorLevel: "A2",
  isBSynthSupported: false,
};
const DATASETS = { datasets: [{ id: "ds1", name: "Demo", version: "1", taskCount: 1, tasks: [TASK] }] };

function firstRound(verdict: Record<string, unknown>): Array<[string, unknown]> {
  return [
    ["step", { step: "spec", status: "running" }],
    ["step", { step: "spec", status: "done", output: "SPEC: trung vị của xs.", durationMs: 1200 }],
    ["step", { step: "code", status: "running" }],
    ["step", { step: "code", status: "done", output: "```python\ndef median(xs): ...\n```", durationMs: 900 }],
    ["step", { step: "check", status: "running" }],
    ["step", { step: "check", status: "done", output: "{}", durationMs: 400 }],
    ["verdict", verdict],
  ];
}

function renderChat() {
  return render(
    <LlmConfigProvider>
      <ChatScreen />
    </LlmConfigProvider>,
  );
}

async function prepare() {
  renderChat();
  fireEvent.change(screen.getByTestId("llm-key-spec"), { target: { value: "sk-spec-secret" } });
  fireEvent.change(screen.getByTestId("llm-key-code"), { target: { value: "sk-ant-code-secret" } });
  fireEvent.change(await screen.findByTestId("task-select"), { target: { value: "t_median" } });
}

describe("Chat page — dataset task, two LLMs, one question only on UNKNOWN", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("needs both API keys and a dataset task before running, and never stores keys in the browser", async () => {
    mockApi({ "GET /api/datasets": DATASETS });
    renderChat();

    expect(screen.getByTestId("llm-card-spec").textContent).toContain("LLM sinh đặc tả");
    expect(screen.getByTestId("llm-card-code").textContent).toContain("LLM sinh code");
    expect(screen.getByTestId("llm-key-spec").getAttribute("type")).toBe("password");
    // Không có ô gõ yêu cầu ngay từ đầu: chỉ chọn dataset rồi chạy.
    expect(screen.queryByLabelText("Câu trả lời của bạn")).toBeNull();
    expect((screen.getByTestId("chat-run") as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByTestId("llm-key-spec"), { target: { value: "sk-spec-secret" } });
    fireEvent.change(screen.getByTestId("llm-key-code"), { target: { value: "sk-ant-code-secret" } });
    expect(screen.getByText("Chọn dataset và tác vụ để chạy.")).toBeDefined();

    fireEvent.change(await screen.findByTestId("task-select"), { target: { value: "t_median" } });
    expect(screen.getByTestId("task-intent").textContent).toContain("median(xs)");
    expect((screen.getByTestId("chat-run") as HTMLButtonElement).disabled).toBe(false);

    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    expect(stored).not.toContain("secret");
  });

  it("runs the task and shows the conclusion without asking when the backend is sure", async () => {
    let sent: Record<string, unknown> | undefined;
    mockApi({
      "GET /api/datasets": DATASETS,
      "POST /api/run": ({ body }) => {
        sent = body as Record<string, unknown>;
        return sse(firstRound({ verdict: "code_fault", reason: "Code không xử lý danh sách rỗng." }));
      },
    });
    await prepare();
    await act(async () => {
      fireEvent.click(screen.getByTestId("chat-run"));
    });

    const verdict = await screen.findByTestId("chat-step-verdict");
    expect(sent).toEqual({
      datasetId: "ds1",
      taskId: "t_median",
      llmSpec: { provider: "openai", model: "gpt-4o-mini", apiKey: "sk-spec-secret" },
      llmCode: { provider: "anthropic", model: "claude-sonnet-5-5", apiKey: "sk-ant-code-secret" },
    });
    expect(screen.getByTestId("chat-task").textContent).toContain("median");
    expect(screen.getByTestId("chat-step-spec").textContent).toContain("SPEC: trung vị của xs.");
    expect(screen.getByTestId("chat-step-code").textContent).toContain("def median(xs): ...");
    expect(screen.getByTestId("chat-step-code").textContent).not.toContain("```");
    expect(verdict.dataset.verdict).toBe("code_fault");
    expect(verdict.textContent).toContain("Lỗi nằm ở code");

    expect(screen.queryByTestId("chat-question")).toBeNull();
    expect(screen.queryByLabelText("Câu trả lời của bạn")).toBeNull();
    fireEvent.click(screen.getByTestId("chat-new"));
    expect(screen.getByTestId("chat-run")).toBeDefined();
  });

  it("asks exactly once on UNKNOWN and shows the final conclusion of the follow-up", async () => {
    let followup: Record<string, unknown> | undefined;
    mockApi({
      "GET /api/datasets": DATASETS,
      "POST /api/run": () => sse(firstRound({ verdict: "unknown", reason: "Mơ hồ khi n chẵn.", question: "Kết quả đúng khi n chẵn là gì?" })),
      "POST /api/run/followup": ({ body }) => {
        followup = body as Record<string, unknown>;
        return sse([
          ["step", { step: "check", status: "running" }],
          ["step", { step: "check", status: "done", output: "{}", durationMs: 300 }],
          ["verdict", { verdict: "code_fault", reason: "Phải trả trung bình hai phần tử giữa." }],
        ]);
      },
    });
    await prepare();
    await act(async () => {
      fireEvent.click(screen.getByTestId("chat-run"));
    });

    expect((await screen.findByTestId("chat-question")).textContent).toContain("Kết quả đúng khi n chẵn là gì?");
    const input = screen.getByLabelText("Câu trả lời của bạn");
    fireEvent.change(input, { target: { value: "median([1,2,3,4]) = 2.5" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect((await screen.findByTestId("chat-followup-verdict")).dataset.verdict).toBe("code_fault");
    expect(followup).toEqual({
      llmSpec: { provider: "openai", model: "gpt-4o-mini", apiKey: "sk-spec-secret" },
      datasetId: "ds1",
      taskId: "t_median",
      spec: "SPEC: trung vị của xs.",
      code: "```python\ndef median(xs): ...\n```",
      answer: "median([1,2,3,4]) = 2.5",
    });
    expect(screen.getByTestId("chat-answer").textContent).toBe("median([1,2,3,4]) = 2.5");
    // Chỉ một lần: ô trả lời biến mất sau khi gửi.
    expect(screen.queryByLabelText("Câu trả lời của bạn")).toBeNull();
    expect(screen.getByTestId("chat-new")).toBeDefined();
  });

  it("shows the backend's error message when a step fails", async () => {
    mockApi({
      "GET /api/datasets": DATASETS,
      "POST /api/run": () =>
        sse([
          ["step", { step: "spec", status: "running" }],
          ["error", { step: "spec", message: "API key bị nhà cung cấp từ chối" }],
        ]),
    });
    await prepare();
    fireEvent.click(screen.getByTestId("chat-run"));

    await waitFor(() => expect(screen.getByTestId("chat-error").textContent).toContain("API key bị nhà cung cấp từ chối"));
    expect(screen.getByTestId("chat-step-spec").dataset.status).toBe("error");
  });

  it("offers a JSONL upload when there is no dataset yet", async () => {
    mockApi({ "GET /api/datasets": { datasets: [] } });
    renderChat();
    expect(await screen.findByText(/Chưa có dataset nào/)).toBeDefined();
    expect(screen.getByText("Tải dataset (JSONL)")).toBeDefined();
  });
});

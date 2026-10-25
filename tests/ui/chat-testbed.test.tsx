import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ChatTestbed } from "@/features/chat";
import { mockApi, ndjson } from "../helpers/api-routes";
import { RUN_ID, SPEC_FAULT_CASE } from "../fixtures/api";

const DATASETS = {
  datasets: [
    {
      id: "ds_1",
      name: "Dataset thật",
      version: "v1",
      taskCount: 1,
      tasks: [
        {
          id: "task_01",
          name: "sort_even",
          intentDocstring: "Sắp xếp phần tử ở chỉ số chẵn.",
          outputType: "list",
          isUniqueOutput: true,
          assignedBy: "expert",
          anchorOrigin: "gốc",
          hasA2: true,
          hasA3: false,
          anchorLevel: "A2",
          isBSynthSupported: true,
        },
      ],
    },
  ],
};

async function send(text: string) {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Gửi" }));
  });
}

describe("ChatTestbed — dữ liệu từ backend", () => {
  beforeEach(() => {
    mockApi({
      "GET /api/datasets": DATASETS,
      "GET /api/cases": { cases: [SPEC_FAULT_CASE] },
      "POST /api/runs": { status: 201, body: { run: { run_id: "eval_1" } } },
      "PATCH /api/runs/:id": { run: { run_id: "eval_1" } },
      [`POST /api/runs/${RUN_ID}/cases/${SPEC_FAULT_CASE.id}/stream`]: () =>
        ndjson([
          { type: "step", id: "load_task", status: "done", label: "load" },
          { type: "text", delta: "Monitor quá chặt tại w." },
          { type: "done", verdict: "SPEC_FAULT", totalMs: 12 },
        ]),
    });
    // EventSource không có trong jsdom
    (globalThis as { EventSource?: unknown }).EventSource = class {
      onmessage = null;
      close() {}
    };
  });

  it("hiển thị dataset và case lấy từ API", async () => {
    render(<ChatTestbed runId={RUN_ID} />);

    expect((await screen.findAllByText(/Dataset thật · v1/)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/sort_even · case_spec_fault/)).toBeDefined();
  });

  it("chạy luồng phân xử NDJSON và hiển thị verdict do backend trả về", async () => {
    render(<ChatTestbed runId={RUN_ID} />);
    await screen.findByText(/sort_even · case_spec_fault/);

    await send("Kiểm tra mẫu này");

    expect(await screen.findByText("Monitor quá chặt tại w.")).toBeDefined();
    expect(screen.getAllByText("SPEC_FAULT").length).toBeGreaterThan(0);
  });

  it("báo lỗi rõ ràng khi backend trả 501, không giả lập kết quả", async () => {
    mockApi({
      "GET /api/datasets": DATASETS,
      "GET /api/cases": { cases: [SPEC_FAULT_CASE] },
      "POST /api/runs": { status: 201, body: { run: { run_id: "eval_1" } } },
      [`POST /api/runs/${RUN_ID}/cases/${SPEC_FAULT_CASE.id}/stream`]: {
        status: 501,
        body: { error: "Engine phân xử chưa được cấu hình." },
      },
    });
    render(<ChatTestbed runId={RUN_ID} />);
    await screen.findByText(/sort_even · case_spec_fault/);

    await send("Kiểm tra mẫu này");

    const alert = await screen.findByText(/Chức năng chưa khả dụng: Engine phân xử chưa được cấu hình\./);
    expect(alert).toBeDefined();
    expect(screen.queryByText("SPEC_FAULT")).toBeNull();
  });
});

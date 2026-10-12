import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { AppShell } from "@/ui/shell/AppShell";
import { Sidebar } from "@/ui/shell/Sidebar";
import { Topbar } from "@/ui/shell/Topbar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/library",
}));

describe("App Shell & Responsive Navigation", () => {
  it("renders Sidebar with all 10 core research navigation items", () => {
    render(<Sidebar currentRunId="run_test_01" />);

    expect(screen.getAllByText("Thư viện dữ liệu")[0]).toBeDefined();
    expect(screen.getAllByText("Kiểm nạp")[0]).toBeDefined();
    expect(screen.getAllByText("Bàn làm việc")[0]).toBeDefined();
    expect(screen.getAllByText("Gán nhãn")[0]).toBeDefined();
    expect(screen.getAllByText("Bằng chứng")[0]).toBeDefined();
    expect(screen.getAllByText("Thu hồi")[0]).toBeDefined();
    expect(screen.getAllByText("Thử nghiệm")[0]).toBeDefined();
    expect(screen.getAllByText("Kết quả")[0]).toBeDefined();
    expect(screen.getAllByText("Tiêm lỗi")[0]).toBeDefined();
    expect(screen.getAllByText("Thiết lập")[0]).toBeDefined();
  });

  it("renders Topbar with research context and InvariantBar", () => {
    render(
      <Topbar
        runId="run_custom_88"
        datasetName="EvalPlus Custom"
        anchorLevel="A2"
        monitorVersion="P_1"
        isHeldOutLocked={true}
      />
    );

    expect(screen.getByText("run_custom_88")).toBeDefined();
    expect(screen.getByText("EvalPlus Custom")).toBeDefined();
    expect(screen.getByText("ANCHOR: A2")).toBeDefined();
    expect(screen.getByText("MONITOR: P_1")).toBeDefined();
  });

  it("renders full AppShell container wrapping children without horizontal overflow", () => {
    const { container } = render(
      <AppShell currentRunId="run_test_01">
        <div data-testid="page-content">Nội dung trang thử nghiệm</div>
      </AppShell>
    );

    expect(screen.getByTestId("page-content")).toBeDefined();
    // Verify overflow-x-hidden class exists on top level wrapper
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).toContain("overflow-x-hidden");
  });
});

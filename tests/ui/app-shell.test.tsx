import { describe, it, expect, vi } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { AppShell } from "@/ui/shell/AppShell";
import { Sidebar } from "@/ui/shell/Sidebar";
import { Topbar } from "@/ui/shell/Topbar";
import { mockApi } from "../helpers/api-routes";
import { RUN_ID, RUN_SUMMARY } from "../fixtures/api";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("App Shell & Responsive Navigation", () => {
  it("renders one chat page instead of separate lifecycle pages", () => {
    render(<Sidebar currentRunId="run_test_01" />);

    for (const label of ["Hỏi đáp", "Bằng chứng", "Lịch sử", "Thống kê", "Chạy thực nghiệm", "Kết quả RQ", "Tiêm lỗi", "Cài đặt"]) {
      expect(screen.getAllByText(label)[0]).toBeDefined();
    }
    for (const removed of ["Vòng đời", "Kiểm nạp", "Hỏi người", "Sửa đặc tả", "Duy trì"]) {
      expect(screen.queryByText(removed)).toBeNull();
    }
    expect(screen.getByRole("link", { name: "Hỏi đáp" }).getAttribute("aria-current")).toBe("page");
  });

  it("collapses and expands the sidebar, remembering the choice", () => {
    mockApi({});
    localStorage.clear();
    render(
      <AppShell>
        <div />
      </AppShell>,
    );
    const aside = document.querySelector("aside")!;
    expect(aside.dataset.collapsed).toBe("false");

    fireEvent.click(screen.getByTestId("sidebar-toggle"));
    expect(aside.dataset.collapsed).toBe("true");
    expect(localStorage.getItem("specgate-sidebar-collapsed")).toBe("1");
    expect(screen.getByRole("button", { name: "Mở rộng thanh bên" })).toBeDefined();

    fireEvent.click(screen.getByTestId("sidebar-toggle"));
    expect(aside.dataset.collapsed).toBe("false");
  });

  it("renders Topbar with research context and InvariantBar from the run summary API", async () => {
    mockApi({ [`GET /api/runs/${RUN_ID}/summary`]: RUN_SUMMARY });
    render(<Topbar runId={RUN_ID} />);

    expect(screen.getByText(RUN_ID)).toBeDefined();
    expect(await screen.findByText("EvalPlus Custom")).toBeDefined();
    expect(screen.getByText("Mức neo A2")).toBeDefined();
    expect(screen.getByText("Monitor P_1")).toBeDefined();
    expect(screen.getByTestId("invariant-bar")).toBeDefined();
  });

  it("renders full AppShell container wrapping children without horizontal overflow", () => {
    mockApi({});
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

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ResultsPage from "@/app/runs/[runId]/results/[rq]/page";

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    }),
    useParams: () => ({
      runId: "run_evalplus_01",
      rq: "rq1",
    }),
    usePathname: () => "/results/rq1",
  };
});

describe("Results Dashboard & Witness Interactivity UI", () => {
  it("renders RQ1 stacked bar chart and toggles between chart and table view", () => {
    render(<ResultsPage />);

    expect(screen.getByTestId("chart-container-rq1")).toBeDefined();
    expect(screen.getByTestId("rq1-chart")).toBeDefined();

    // Toggle to Table view
    const toggleBtn = screen.getByTestId("toggle-view-mode-btn");
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId("table-view")).toBeDefined();
    expect(screen.getByText("Đặc tả quá chặt (Over-constraint)")).toBeDefined();
  });

  it("opens witness drawer with 'Mở Docket' link when a chart element is clicked", () => {
    render(<ResultsPage />);

    // Click bar 0 in RQ1 chart
    const bar0 = screen.getByTestId("rq1-bar-0");
    fireEvent.click(bar0);

    // Witness drawer should open
    const drawer = screen.getByTestId("witness-drawer");
    expect(drawer).toBeDefined();

    // Contains case_spec_fault and 'Mở Docket' link
    expect(screen.getByTestId("witness-item-case_spec_fault")).toBeDefined();
    const openDocketLink = screen.getByTestId("open-docket-btn-case_spec_fault");
    expect(openDocketLink.getAttribute("href")).toContain("/runs/run_evalplus_01/workbench?caseId=case_spec_fault");
  });

  it("renders mandatory scientific disclaimer in chart footer", () => {
    render(<ResultsPage />);

    const disclaimer = screen.getByTestId("operational-ground-truth-disclaimer");
    expect(disclaimer.textContent).toBe("Nhãn trên EvalPlus là nhãn vận hành, không phải chứng minh ngữ nghĩa.");
  });
});

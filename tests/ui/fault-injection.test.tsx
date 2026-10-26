import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FaultInjectionPage from "@/app/fault-injection/page";
import { mockApi } from "../helpers/api-routes";
import { FAULT_INJECTION_STATE } from "../fixtures/api";

describe("Fault Injection Dashboard UI", () => {
  it("renders all 3 injection zones and theoretical limit caveat", async () => {
    mockApi({ "GET /api/fault-injection": FAULT_INJECTION_STATE });
    render(<FaultInjectionPage />);

    expect(await screen.findByTestId("fault-zone-1")).toBeDefined();
    expect(screen.getByTestId("fault-zone-2")).toBeDefined();
    expect(screen.getByTestId("fault-zone-3")).toBeDefined();

    const caveat = screen.getByTestId("theoretical-limit-caveat");
    expect(caveat.textContent).toContain("Giới hạn của nguồn tin cậy.");
  });

  it("sends the selected profile and renders metrics returned by the API", async () => {
    let sentProfile: unknown;
    mockApi({
      "GET /api/fault-injection": FAULT_INJECTION_STATE,
      "POST /api/fault-injection": ({ body }) => {
        sentProfile = body;
        return {
          profile: body,
          metrics: { misattributionRate: 14.8, faultyPatchSlipRate: 1.2, gateBlockedCount: 49, totalInjections: 50 },
          ranAt: "2026-10-12T00:00:00Z",
        };
      },
    });
    render(<FaultInjectionPage />);

    expect((await screen.findByTestId("metric-misattribution-rate")).textContent).toBe("2.4%");
    fireEvent.click(screen.getByTestId("run-injection-btn"));

    await screen.findByText("14.8%");
    expect(screen.getByTestId("metric-patch-slip-rate").textContent).toBe("1.2%");
    expect(sentProfile).toEqual(FAULT_INJECTION_STATE.defaults);
  });

  it("reports 501 as an unavailable engine instead of fabricating metrics", async () => {
    mockApi({
      "GET /api/fault-injection": FAULT_INJECTION_STATE,
      "POST /api/fault-injection": { status: 501, body: { error: "Engine tiêm lỗi chưa được cấu hình." } },
    });
    render(<FaultInjectionPage />);
    await screen.findByTestId("fault-zone-1");

    fireEvent.click(screen.getByTestId("run-injection-btn"));

    expect((await screen.findByTestId("feature-unavailable")).textContent).toContain("Engine tiêm lỗi chưa được cấu hình.");
    expect(screen.getByTestId("metric-misattribution-rate").textContent).toBe("2.4%");
  });
});

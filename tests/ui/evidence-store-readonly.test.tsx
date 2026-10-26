import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EvidencePage from "@/app/runs/[runId]/evidence/page";
import { mockApi } from "../helpers/api-routes";
import { EVIDENCE_STORE, RUN_ID } from "../fixtures/api";

async function renderLoaded() {
  render(<EvidencePage />);
  await screen.findByTestId("evidence-tab-G");
}

describe("Evidence Store Read-Only & Invariant Verification UI", () => {
  beforeEach(() => {
    mockApi({
      "GET /api/runs/current": { runId: RUN_ID },
      "GET /api/runs/:id/evidence": EVIDENCE_STORE,
    });
  });

  it("renders topbar invariant check badge showing G ∩ B = ∅ holds", async () => {
    render(<EvidencePage />);

    const badge = await screen.findByTestId("disjointness-invariant-badge");
    expect(badge.textContent).toContain("Kho G và B tách biệt");
  });

  it("STRICT INVARIANT: Tab G has zero input elements or edit buttons", async () => {
    await renderLoaded();
    fireEvent.click(screen.getByTestId("evidence-tab-G"));

    const tabGContent = screen.getByTestId("tab-content-G");
    expect(tabGContent.querySelectorAll("input, textarea, [contenteditable='true']").length).toBe(0);
    expect(tabGContent.querySelectorAll("button").length).toBe(0);
  });

  it("STRICT INVARIANT: Tab B has zero input elements or edit buttons", async () => {
    await renderLoaded();
    fireEvent.click(screen.getByTestId("evidence-tab-B"));

    const tabBContent = screen.getByTestId("tab-content-B");
    expect(tabBContent.querySelectorAll("input, textarea, [contenteditable='true']").length).toBe(0);
    expect(tabBContent.querySelectorAll("button").length).toBe(0);
  });

  it("renders Metamorphic Relations ProvenanceTree in Anchor & Bao đóng tab", async () => {
    await renderLoaded();
    fireEvent.click(screen.getByTestId("evidence-tab-anchor_closure"));

    expect(screen.getByTestId("provenance-tree")).toBeDefined();
    expect(screen.getByTestId("provenance-node-anchor_root_01")).toBeDefined();
  });

  it("renders Spec Debt tab with debt items and severity badges", async () => {
    await renderLoaded();
    fireEvent.click(screen.getByTestId("evidence-tab-spec_debt"));

    expect(screen.getByTestId("tab-content-spec_debt")).toBeDefined();
    expect(screen.getByTestId("debt-row-debt_01")).toBeDefined();
  });

  it("shows an explicit 'unavailable' state when backend answers 501", async () => {
    mockApi({
      "GET /api/runs/current": { runId: RUN_ID },
      "GET /api/runs/:id/evidence": { status: 501, body: { error: "Engine bằng chứng chưa được cấu hình.", code: "ENGINE_NOT_CONFIGURED" } },
    });
    render(<EvidencePage />);

    const unavailable = await screen.findByTestId("feature-unavailable");
    expect(unavailable.textContent).toContain("Chức năng chưa khả dụng");
    expect(screen.queryByTestId("evidence-tab-G")).toBeNull();
  });
});

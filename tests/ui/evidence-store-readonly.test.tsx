import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EvidencePage from "@/app/runs/[runId]/evidence/page";

describe("Evidence Store Read-Only & Invariant Verification UI", () => {
  it("renders topbar invariant check badge showing G ∩ B = ∅ holds", () => {
    render(<EvidencePage />);

    const badge = screen.getByTestId("disjointness-invariant-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toContain("BẤT BIẾN G ∩ B = ∅: HỢP LỆ");
  });

  it("STRICT INVARIANT: Tab G has zero input elements or edit buttons", () => {
    render(<EvidencePage />);

    // Click Tab G
    const tabG = screen.getByTestId("evidence-tab-G");
    fireEvent.click(tabG);

    const tabGContent = screen.getByTestId("tab-content-G");

    // Must have NO input or textarea elements
    const inputs = tabGContent.querySelectorAll("input, textarea, [contenteditable='true']");
    expect(inputs.length).toBe(0);

    // Must have NO buttons for manual mutation inside Tab G
    const buttons = tabGContent.querySelectorAll("button");
    expect(buttons.length).toBe(0);
  });

  it("STRICT INVARIANT: Tab B has zero input elements or edit buttons", () => {
    render(<EvidencePage />);

    // Click Tab B
    const tabB = screen.getByTestId("evidence-tab-B");
    fireEvent.click(tabB);

    const tabBContent = screen.getByTestId("tab-content-B");

    // Must have NO input or textarea elements
    const inputs = tabBContent.querySelectorAll("input, textarea, [contenteditable='true']");
    expect(inputs.length).toBe(0);

    // Must have NO buttons for manual mutation inside Tab B
    const buttons = tabBContent.querySelectorAll("button");
    expect(buttons.length).toBe(0);
  });

  it("renders Metamorphic Relations ProvenanceTree in Anchor & Bao đóng tab", () => {
    render(<EvidencePage />);

    const tabAnchor = screen.getByTestId("evidence-tab-anchor_closure");
    fireEvent.click(tabAnchor);

    const tree = screen.getByTestId("provenance-tree");
    expect(tree).toBeDefined();
    expect(screen.getByTestId("provenance-node-anchor_root_01")).toBeDefined();
  });

  it("renders Spec Debt tab with debt items and severity badges", () => {
    render(<EvidencePage />);

    const tabDebt = screen.getByTestId("evidence-tab-spec_debt");
    fireEvent.click(tabDebt);

    const debtContent = screen.getByTestId("tab-content-spec_debt");
    expect(debtContent).toBeDefined();
    expect(screen.getByTestId("debt-row-debt_01")).toBeDefined();
  });
});

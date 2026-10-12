import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { RepairGatePanel } from "@/ui/domain/RepairGatePanel";
import { SAMPLE_CASES } from "@/mock/fixtures/sample-cases";
import type { RankedRepairCandidate } from "@/core/repair";

describe("RepairGatePanel & Policy Enforcement UI", () => {
  const mockCandidates: RankedRepairCandidate[] = [
    {
      id: "cand_proof",
      family: "case_exception",
      guard: "len(w) == 4",
      replacement: "ret[0] <= ret[2]",
      targetExpectedOutput: [1, 2],
      rank: 1,
      diffPreview: "",
      complexity: 25,
      breadth: 5,
      passMode: "PASS_PROOF",
      isProofVerified: true,
      hasA2Anchor: true,
    },
    {
      id: "cand_sampled",
      family: "point_patch",
      guard: "w == [1, 2]",
      replacement: "ret == [1, 2]",
      targetExpectedOutput: [1, 2],
      rank: 2,
      diffPreview: "",
      complexity: 30,
      breadth: 5,
      passMode: "PASS_SAMPLED",
      isProofVerified: false,
      hasA2Anchor: true,
    },
  ];

  it("enforces Strict policy: disables deploy for PASS_SAMPLED and enables for PASS_PROOF", async () => {
    render(
      <RepairGatePanel
        caseDossier={SAMPLE_CASES.case_spec_fault!}
        initialCandidates={mockCandidates}
      />
    );

    // Switch to Strict policy
    const strictBtn = screen.getByTestId("policy-btn-strict");
    fireEvent.click(strictBtn);

    // Default candidate 1 is PASS_PROOF -> deploy button is ENABLED
    const deployBtn = screen.getByTestId("deploy-repair-button");
    expect(deployBtn.hasAttribute("disabled")).toBe(false);
    expect(deployBtn.textContent).toContain("Strict Proof");

    // Click candidate 2 (cand_sampled, which has passMode: PASS_SAMPLED)
    const cardSampled = screen.getByTestId("candidate-card-cand_sampled");
    fireEvent.click(cardSampled);

    // In Strict policy, PASS_SAMPLED MUST BE DISABLED
    expect(deployBtn.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/Chính sách Strict từ chối triển khai/)).toBeDefined();
  });

  it("enforces Standard policy: enables deploy for PASS_SAMPLED", async () => {
    render(
      <RepairGatePanel
        caseDossier={SAMPLE_CASES.case_spec_fault!}
        initialCandidates={mockCandidates}
      />
    );

    // Switch to Standard policy
    const standardBtn = screen.getByTestId("policy-btn-standard");
    fireEvent.click(standardBtn);

    // Select candidate 2 (cand_sampled)
    const cardSampled = screen.getByTestId("candidate-card-cand_sampled");
    fireEvent.click(cardSampled);

    const deployBtn = screen.getByTestId("deploy-repair-button");
    expect(deployBtn.hasAttribute("disabled")).toBe(false);
    expect(deployBtn.textContent).toContain("Triển khai Monitor P'");
  });

  it("enforces Shadow policy: switches label to 'Ghi nhận Shadow'", async () => {
    render(
      <RepairGatePanel
        caseDossier={SAMPLE_CASES.case_spec_fault!}
        initialCandidates={mockCandidates}
      />
    );

    const shadowBtn = screen.getByTestId("policy-btn-shadow");
    fireEvent.click(shadowBtn);

    const deployBtn = screen.getByTestId("deploy-repair-button");
    expect(deployBtn.hasAttribute("disabled")).toBe(false);
    expect(deployBtn.textContent).toBe("Ghi nhận Shadow");
  });

  it("renders fixed box 'Các giới hạn không được bảo đảm' and strictly avoids plain 'an toàn'", () => {
    render(
      <RepairGatePanel
        caseDossier={SAMPLE_CASES.case_spec_fault!}
        initialCandidates={mockCandidates}
      />
    );

    const boundsBox = screen.getByTestId("unguaranteed-bounds-box");
    expect(boundsBox).toBeDefined();

    // Verify it NEVER uses plain unconditioned "an toàn"
    const textContent = boundsBox.textContent || "";
    expect(textContent.toLowerCase()).not.toContain("an toàn");
  });
});

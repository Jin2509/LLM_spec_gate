import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { RepairGatePanel } from "@/ui/domain/RepairGatePanel";
import { SPEC_FAULT_CASE, repairCandidate } from "../fixtures/api";

describe("RepairGatePanel & Policy Enforcement UI", () => {
  const candidates = [
    repairCandidate({ id: "cand_proof" }),
    repairCandidate({
      id: "cand_sampled",
      family: "point_patch",
      guard: "w == [1, 2]",
      replacement: "ret == [1, 2]",
      rank: 2,
      complexity: 30,
      passMode: "PASS_SAMPLED",
      isProofVerified: false,
    }),
  ];

  it("enforces Strict policy: disables deploy for PASS_SAMPLED and enables for PASS_PROOF", async () => {
    render(<RepairGatePanel caseDossier={SPEC_FAULT_CASE} candidates={candidates} />);

    fireEvent.click(screen.getByTestId("policy-btn-strict"));

    const deployBtn = screen.getByTestId("deploy-repair-button");
    expect(deployBtn.hasAttribute("disabled")).toBe(false);
    expect(deployBtn.textContent).toContain("Strict Proof");

    fireEvent.click(screen.getByTestId("candidate-card-cand_sampled"));

    expect(deployBtn.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/Chính sách Strict từ chối triển khai/)).toBeDefined();
  });

  it("enforces Standard policy: enables deploy for PASS_SAMPLED", async () => {
    render(<RepairGatePanel caseDossier={SPEC_FAULT_CASE} candidates={candidates} />);

    fireEvent.click(screen.getByTestId("policy-btn-standard"));
    fireEvent.click(screen.getByTestId("candidate-card-cand_sampled"));

    const deployBtn = screen.getByTestId("deploy-repair-button");
    expect(deployBtn.hasAttribute("disabled")).toBe(false);
    expect(deployBtn.textContent).toContain("Triển khai Monitor P'");
  });

  it("enforces Shadow policy: switches label to 'Ghi nhận Shadow'", async () => {
    render(<RepairGatePanel caseDossier={SPEC_FAULT_CASE} candidates={candidates} />);

    fireEvent.click(screen.getByTestId("policy-btn-shadow"));

    const deployBtn = screen.getByTestId("deploy-repair-button");
    expect(deployBtn.hasAttribute("disabled")).toBe(false);
    expect(deployBtn.textContent).toBe("Ghi nhận Shadow");
  });

  it("renders fixed box 'Các giới hạn không được bảo đảm' and strictly avoids plain 'an toàn'", () => {
    render(<RepairGatePanel caseDossier={SPEC_FAULT_CASE} candidates={candidates} />);

    const boundsBox = screen.getByTestId("unguaranteed-bounds-box");
    expect((boundsBox.textContent || "").toLowerCase()).not.toContain("an toàn");
  });

  it("uses the backend gate result per candidate (fail-closed, no assumed pass)", () => {
    const failing = repairCandidate({
      id: "cand_fail",
      gateResult: {
        passed: false,
        checks: {
          g1_accept_grounded: true,
          g2_reject_b: false,
          g3_locality: true,
          g4_preserve_g_a2: true,
          g5_in_repair_space_and_bsynth: true,
        },
        guaranteeNature: "structural",
        message: "G2 thất bại.",
      },
      isBEmptyInGuard: true,
    });
    render(<RepairGatePanel caseDossier={SPEC_FAULT_CASE} candidates={[failing]} />);

    expect(screen.getByTestId("gate-check-G2").textContent).toContain("✗");
    expect(screen.getByTestId("empty-b-warning")).toBeDefined();
    expect(screen.getByTestId("deploy-repair-button").hasAttribute("disabled")).toBe(true);
  });

  it("shows an empty state when backend returns no candidates", () => {
    render(<RepairGatePanel caseDossier={SPEC_FAULT_CASE} candidates={[]} />);
    expect(screen.getByTestId("repair-gate-panel").textContent).toContain("chưa sinh ứng viên");
  });
});

"use client";

import React, { useState } from "react";
import type { CaseDossier, GateResult } from "@/core/types";
import {
  type GatePolicy,
  type PassMode,
  type RankedRepairCandidate,
  rankCandidates,
  calculateComplexity,
  calculateGuardBreadth,
  isBOrBSynthEmptyInGuard,
  evaluateGatePolicy,
  determinePassMode,
} from "@/core/repair";
import { Button } from "@/ui/primitives/Button";

export interface RepairGatePanelProps {
  caseDossier: CaseDossier;
  initialCandidates?: RankedRepairCandidate[];
  onDeploySuccess?: (result: {
    nextVersion: string;
    isShadow: boolean;
    policy: GatePolicy;
  }) => void;
}

export function RepairGatePanel({
  caseDossier,
  initialCandidates,
  onDeploySuccess,
}: RepairGatePanelProps) {
  // Build initial candidates from case dossier
  const rawCandidates: RankedRepairCandidate[] = initialCandidates ?? [
    caseDossier.repairCandidate
      ? {
          ...caseDossier.repairCandidate,
          complexity: calculateComplexity(caseDossier.repairCandidate),
          breadth: calculateGuardBreadth(caseDossier.repairCandidate.guard),
          passMode: "PASS_PROOF",
          isProofVerified: true,
          hasA2Anchor: true,
        }
      : {
          id: "rep_fallback_01",
          family: "case_exception",
          guard: "len(w) == 4",
          replacement: "ret[0] <= ret[2] and ret[1] == w[1]",
          targetExpectedOutput: [2, 3, 5, 8],
          rank: 1,
          diffPreview: "sorted(w) -> (ret[0] <= ret[2])",
          complexity: 42,
          breadth: 5,
          passMode: "PASS_PROOF",
          isProofVerified: true,
          hasA2Anchor: true,
        },
    {
      id: "rep_point_02",
      family: "point_patch",
      guard: "w == [5, 3, 2, 8]",
      replacement: "ret == [2, 3, 5, 8]",
      targetExpectedOutput: [2, 3, 5, 8],
      rank: 2,
      diffPreview: "sorted(w) -> (ret == [2, 3, 5, 8])",
      complexity: 38,
      breadth: 3,
      passMode: "PASS_SAMPLED",
      isProofVerified: false,
      hasA2Anchor: true,
    },
    {
      id: "rep_broaden_03",
      family: "broaden_bounds",
      guard: "len(w) >= 2",
      replacement: "all(ret[i] <= ret[i+2] for i in range(0, len(ret)-2, 2))",
      targetExpectedOutput: [2, 3, 5, 8],
      rank: 3,
      diffPreview: "sorted(w) -> generalized even sort",
      complexity: 75,
      breadth: 20,
      passMode: "PASS_NO_A2",
      isProofVerified: false,
      hasA2Anchor: false,
    },
  ];

  const sortedCandidates = rankCandidates(rawCandidates);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    sortedCandidates[0]?.id ?? ""
  );
  const [policy, setPolicy] = useState<GatePolicy>("standard");
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployFeedback, setDeployFeedback] = useState<string | null>(null);

  const selectedCandidate =
    sortedCandidates.find((c) => c.id === selectedCandidateId) ?? sortedCandidates[0];

  // Evaluate gate for selected candidate
  const currentGateResult: GateResult = caseDossier.gateResult ?? {
    passed: true,
    checks: {
      g1_accept_grounded: true,
      g2_reject_b: true,
      g3_locality: true,
      g4_preserve_g_a2: true,
      g5_in_repair_space_and_bsynth: true,
    },
    guaranteeNature: selectedCandidate?.isProofVerified ? "proof" : "structural",
    message: "Vượt qua Gate fail-closed.",
  };

  const passMode: PassMode | undefined = selectedCandidate
    ? selectedCandidate.passMode ??
      determinePassMode(currentGateResult, {
        isProofVerified: selectedCandidate.isProofVerified,
        hasA2Anchor: selectedCandidate.hasA2Anchor,
      })
    : undefined;

  const policyDecision = evaluateGatePolicy(policy, currentGateResult, passMode);

  // Check if B ∪ B_synth is empty in guard g
  const isBEmptyInG = isBOrBSynthEmptyInGuard(
    [
      { input: [24, 18], inGuard: false },
      { input: [1, 5, 11, 5], inGuard: false },
    ],
    [{ input: [1000000, -999999], inGuard: false }]
  );

  const handleDeploy = async () => {
    if (!policyDecision.canDeploy || !selectedCandidate) return;

    setIsDeploying(true);
    setDeployFeedback(null);
    try {
      const res = await fetch(`/api/cases/${caseDossier.id}/repair/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repairCandidate: selectedCandidate,
          policy,
          isProofVerified: selectedCandidate.isProofVerified,
          hasA2Anchor: selectedCandidate.hasA2Anchor,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDeployFeedback(
          policy === "shadow"
            ? "Đã ghi nhận ứng viên vào danh sách Shadow (không hoán đổi monitor hoạt động)."
            : `Đã triển khai thành công! Monitor nâng cấp lên: ${data.activeMonitorVersion}`
        );
        if (onDeploySuccess) {
          onDeploySuccess({
            nextVersion: data.activeMonitorVersion,
            isShadow: policy === "shadow",
            policy,
          });
        }
      } else {
        setDeployFeedback(`Triển khai thất bại: ${data.policyDecision?.reason ?? "Chính sách từ chối"}`);
      }
    } catch {
      setDeployFeedback("Lỗi kết nối khi gửi yêu cầu triển khai.");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div
      data-testid="repair-gate-panel"
      className="flex flex-col gap-5 p-4 rounded border font-sans"
      style={{
        backgroundColor: "var(--paper-surface)",
        borderColor: "var(--rule)",
        borderRadius: "var(--r-card)",
      }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b" style={{ borderColor: "var(--rule)" }}>
        <div>
          <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--action)" }}>
            Không gian sửa đổi & Cổng kiểm soát · C ∨ (g ∧ D)
          </span>
          <h2 className="text-base font-semibold mt-0.5" style={{ color: "var(--ink)" }}>
            Repair & Gate Pipeline
          </h2>
        </div>

        {/* Policy Selector */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span style={{ color: "var(--ink-soft)" }}>Chính sách:</span>
          {(["strict", "standard", "shadow"] as const).map((p) => {
            const isSelected = policy === p;
            return (
              <button
                key={p}
                data-testid={`policy-btn-${p}`}
                onClick={() => setPolicy(p)}
                className="px-2.5 py-1 rounded transition-colors uppercase cursor-pointer"
                style={{
                  backgroundColor: isSelected ? "var(--action)" : "var(--paper-ground)",
                  color: isSelected ? "var(--paper-surface)" : "var(--ink)",
                  border: `1px solid ${isSelected ? "var(--action)" : "var(--rule)"}`,
                  borderRadius: "var(--r-cell)",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Warning Banner: B ∪ B_synth empty in g */}
      {isBEmptyInG && (
        <div
          data-testid="empty-b-warning"
          className="p-3 rounded border text-xs font-mono flex items-start gap-2.5"
          style={{
            backgroundColor: "transparent",
            borderColor: "var(--v-spec)",
            borderStyle: "dashed",
            color: "var(--v-spec)",
          }}
        >
          <span className="text-sm shrink-0">⚠️</span>
          <div>
            <strong>Cảnh báo Tiên đề:</strong> Tập <code>B ∪ B_synth</code> rỗng trong vùng điều kiện <code>g</code>.
            Nguy cơ bản vá rỗng (vacuous patch) hoặc chấp nhận ngầm các lỗi chưa được kiểm định!
          </div>
        </div>
      )}

      {/* Section 1: Ranked Candidates List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-semibold" style={{ color: "var(--ink)" }}>
            1. Danh sách Ứng viên Xếp hạng Tất định (C ∨ (g ∧ D))
          </span>
          <span className="text-[11px] font-mono" style={{ color: "var(--ink-soft)" }}>
            Tiêu chí: Họ luật &gt; Độ phức tạp &gt; Độ rộng guard
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {sortedCandidates.map((cand, idx) => {
            const isSelected = cand.id === selectedCandidateId;
            return (
              <div
                key={cand.id}
                data-testid={`candidate-card-${cand.id}`}
                onClick={() => setSelectedCandidateId(cand.id)}
                className="p-3 rounded border cursor-pointer transition-all flex flex-col gap-1.5"
                style={{
                  backgroundColor: isSelected ? "var(--paper-ground)" : "var(--paper-surface)",
                  borderColor: isSelected ? "var(--action)" : "var(--rule)",
                  borderWidth: isSelected ? "1.5px" : "1px",
                  borderRadius: "var(--r-card)",
                }}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-1.5 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: "var(--paper-ground)",
                        color: isSelected ? "var(--action)" : "var(--ink-soft)",
                        border: "1px solid var(--rule)",
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <span className="font-semibold" style={{ color: "var(--ink)" }}>
                      {cand.id}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[11px]"
                      style={{
                        backgroundColor: "var(--paper-ground)",
                        color: "var(--ink-soft)",
                        border: "1px solid var(--rule)",
                      }}
                    >
                      Họ: {cand.family}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--ink-soft)" }}>
                    <span>Độ phức tạp AST: {cand.complexity}</span>
                    <span>Độ rộng g: {cand.breadth}</span>
                    {cand.passMode && (
                      <span
                        className="px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          backgroundColor:
                            cand.passMode === "PASS_PROOF"
                              ? "var(--v-acc-bg)"
                              : cand.passMode === "PASS_NO_A2"
                              ? "var(--v-spec-bg)"
                              : "var(--v-neutral-bg)",
                          color:
                            cand.passMode === "PASS_PROOF"
                              ? "var(--v-acc)"
                              : cand.passMode === "PASS_NO_A2"
                              ? "var(--v-spec)"
                              : "var(--ink)",
                          border: `1px solid ${
                            cand.passMode === "PASS_PROOF" ? "var(--v-acc)" : "var(--rule)"
                          }`,
                        }}
                      >
                        {cand.passMode}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs font-mono" style={{ color: "var(--ink)" }}>
                  <span style={{ color: "var(--ink-soft)" }}>g: </span>
                  <code>{cand.guard}</code>
                  <span className="mx-2" style={{ color: "var(--ink-soft)" }}>→</span>
                  <span style={{ color: "var(--ink-soft)" }}>C&apos;: </span>
                  <code>{cand.replacement}</code>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Spec Diff Pk -> P' */}
      {selectedCandidate && (
        <div
          className="p-3 rounded border font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-ground)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold" style={{ color: "var(--ink)" }}>
              2. So sánh Đặc tả (Spec Diff P_k → P&apos;)
            </span>
            <span style={{ color: "var(--ink-soft)" }}>Ứng viên: {selectedCandidate.id}</span>
          </div>

          <div className="p-2 rounded bg-white/40 flex flex-col gap-1 border" style={{ borderColor: "var(--rule)" }}>
            <div className="text-red-700 font-mono">
              - P_k (Hiện tại): {caseDossier.specP0.split("\n")[1] ?? caseDossier.specP0}
            </div>
            <div className="text-green-700 font-mono">
              + P&apos; (Sửa đổi): C ∨ ({selectedCandidate.guard} ∧ {selectedCandidate.replacement})
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Fail-Fast Gate Pipeline G1 -> G5 */}
      <div
        className="p-3 rounded border flex flex-col gap-2.5"
        style={{
          backgroundColor: "var(--paper-surface)",
          borderColor: "var(--rule)",
          borderRadius: "var(--r-card)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold" style={{ color: "var(--ink)" }}>
            3. Pipeline Fail-Fast Gate (G1 → G5)
          </span>
          <span
            className="text-xs font-mono font-bold px-2 py-0.5 rounded"
            style={{
              backgroundColor: currentGateResult.passed ? "var(--v-acc-bg)" : "var(--v-code-bg)",
              color: currentGateResult.passed ? "var(--v-acc)" : "var(--v-code)",
              border: `1px solid ${currentGateResult.passed ? "var(--v-acc)" : "var(--v-code)"}`,
            }}
          >
            {currentGateResult.passed ? (passMode ?? "PASS_SAMPLED") : "UNKNOWN_GATE"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs font-mono">
          {[
            { id: "G1", name: "Accept-grounded", ok: currentGateResult.checks.g1_accept_grounded, note: "P'(w, e(w))" },
            { id: "G2", name: "Reject-B", ok: currentGateResult.checks.g2_reject_b, note: "Bác bỏ vết xấu" },
            { id: "G3", name: "Locality", ok: currentGateResult.checks.g3_locality, note: "Ngoài g: P'=P0" },
            { id: "G4", name: "Preserve-G/A2", ok: currentGateResult.checks.g4_preserve_g_a2, note: "Bảo toàn G & A2" },
            { id: "G5", name: "Repair-space", ok: currentGateResult.checks.g5_in_repair_space_and_bsynth, note: "Bác bỏ B_synth" },
          ].map((check) => (
            <div
              key={check.id}
              data-testid={`gate-check-${check.id}`}
              className="p-2 rounded border flex flex-col gap-1"
              style={{
                backgroundColor: check.ok ? "var(--paper-ground)" : "var(--paper-surface)",
                borderColor: check.ok ? "var(--v-acc)" : "var(--v-code)",
                borderStyle: check.ok ? "solid" : "dashed",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{check.id}</span>
                <span>{check.ok ? "✓" : "✗"}</span>
              </div>
              <div className="text-[11px] font-semibold">{check.name}</div>
              <div className="text-[10px]" style={{ color: "var(--ink-soft)" }}>{check.note}</div>
            </div>
          ))}
        </div>

        {/* UNKNOWN_GATE cause decomposition / G4 note */}
        {!currentGateResult.checks.g4_preserve_g_a2 && (
          <div
            data-testid="g4-warning"
            className="p-2.5 rounded border text-xs font-mono"
            style={{
              backgroundColor: "transparent",
              borderColor: "var(--v-spec)",
              borderStyle: "dashed",
              color: "var(--v-spec)",
            }}
          >
            <strong>Phân rã G4:</strong> Nguy cơ false negative — P&apos; có thể vi phạm tính bảo toàn trên tập G/A2
            hoặc do bộ quan hệ biến đổi A2 chưa đủ bao phủ. Cần thẩm định thủ công hoặc bổ sung mẫu A2.
          </div>
        )}
      </div>

      {/* Section 4: Fixed Box - Các giới hạn không được bảo đảm (FORBIDDEN: PLAIN "AN TOÀN") */}
      <div
        data-testid="unguaranteed-bounds-box"
        className="p-3 rounded border font-mono text-xs flex flex-col gap-1.5"
        style={{
          backgroundColor: "var(--paper-ground)",
          borderColor: "var(--rule)",
          borderRadius: "var(--r-card)",
        }}
      >
        <div className="flex items-center gap-2 font-bold" style={{ color: "var(--ink)" }}>
          <span>⚖️</span>
          <span>CÁC GIỚI HẠN KHÔNG ĐƯỢC BẢO ĐẢM (Unguaranteed Bounds)</span>
        </div>
        <p className="m-0 leading-relaxed text-[11px]" style={{ color: "var(--ink-soft)" }}>
          Bảo đảm hình thức của Monitor P&apos; chỉ có hiệu lực cục bộ trên miền điều kiện <code>g</code> đối với tập vết
          đã kiểm chứng <code>G ∪ A2 ∪ (B ∪ B_synth)</code>. Hệ thống không bảo đảm toàn cục ngoài phạm vi <code>g</code>,
          và không bảo đảm tính đúng tuyệt đối của mã nguồn thực thi. Mọi kết quả tuân thủ tiên đề phân xử cục bộ v1.4.
        </p>
      </div>

      {/* Section 5: Deploy Action Area */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t" style={{ borderColor: "var(--rule)" }}>
        <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
          Chính sách hiện tại: <strong>{policy.toUpperCase()}</strong> · {policyDecision.reason}
        </div>

        <div className="flex items-center gap-3">
          <Button
            data-testid="deploy-repair-button"
            variant="primary"
            disabled={!policyDecision.canDeploy || isDeploying}
            onClick={handleDeploy}
          >
            {isDeploying ? "Đang xử lý..." : policyDecision.actionLabel}
          </Button>
        </div>
      </div>

      {deployFeedback && (
        <div
          data-testid="deploy-feedback"
          className="p-2.5 rounded text-xs font-mono"
          style={{
            backgroundColor: "var(--paper-ground)",
            border: "1px solid var(--action)",
            color: "var(--action)",
          }}
        >
          {deployFeedback}
        </div>
      )}
    </div>
  );
}

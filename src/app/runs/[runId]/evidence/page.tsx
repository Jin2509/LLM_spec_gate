"use client";

import React, { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/ui/shell";
import {
  MOCK_GOOD_EVIDENCE,
  MOCK_BAD_EVIDENCE,
  MOCK_BSYNTH_EVIDENCE,
  MOCK_METAMORPHIC_TREE,
  MOCK_SPEC_DEBT,
  checkEvidenceDisjointness,
} from "@/mock/fixtures/evidence-store";
import { ProvenanceTree } from "@/ui/domain/ProvenanceTree";
import { ProvenanceTag } from "@/ui/domain/ProvenanceTag";

type EvidenceTab = "G" | "B" | "B_synth" | "anchor_closure" | "spec_debt";

function EvidenceContent() {
  const params = useParams();
  const runId = (params?.runId as string) || "run_evalplus_01";

  const [activeTab, setActiveTab] = useState<EvidenceTab>("G");

  // Invariant verification: G ∩ B = ∅
  const invariantResult = checkEvidenceDisjointness(MOCK_GOOD_EVIDENCE, MOCK_BAD_EVIDENCE);

  return (
    <AppShell currentRunId={runId}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
        {/* Top Header & Invariant Status Bar */}
        <div
          data-testid="evidence-topbar"
          className="p-4 rounded border flex flex-wrap items-center justify-between gap-4 font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--action)" }}>
              Kho Bằng chứng Hình thức (Evidence Store)
            </span>
            <h1 className="text-base font-bold m-0 mt-0.5" style={{ color: "var(--ink)" }}>
              Formal Evidence Archive &amp; Invariant Monitor
            </h1>
            <p className="text-[11px] m-0 mt-1 opacity-75" style={{ color: "var(--ink-soft)" }}>
              Dữ liệu bằng chứng là bất biến hình thức (Read-only formal archive). Cấm sửa tay dữ liệu G/B.
            </p>
          </div>

          {/* Invariant Badge G ∩ B = ∅ */}
          <div
            data-testid="disjointness-invariant-badge"
            className="flex items-center gap-2 px-3 py-2 rounded border font-mono text-xs font-semibold"
            style={{
              backgroundColor: invariantResult.holds ? "var(--v-acc-bg)" : "var(--v-code-bg)",
              color: invariantResult.holds ? "var(--v-acc)" : "var(--v-code)",
              borderColor: invariantResult.holds ? "var(--v-acc)" : "var(--v-code)",
            }}
          >
            <span>{invariantResult.holds ? "🛡️" : "⚠️"}</span>
            <span>
              BẤT BIẾN G ∩ B = ∅: {invariantResult.holds ? "HỢP LỆ (Giao rỗng)" : "VI PHẠM XUNG ĐỘT"}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b pb-1 font-mono text-xs" style={{ borderColor: "var(--rule)" }}>
          {[
            { key: "G", label: `Tập G - Chấp nhận (${MOCK_GOOD_EVIDENCE.length})` },
            { key: "B", label: `Tập B - Bác bỏ (${MOCK_BAD_EVIDENCE.length})` },
            { key: "B_synth", label: `Tập B_synth - Đột biến (${MOCK_BSYNTH_EVIDENCE.length})` },
            { key: "anchor_closure", label: "Anchor & Bao đóng MR" },
            { key: "spec_debt", label: `Nợ đặc tả (${MOCK_SPEC_DEBT.length})` },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                data-testid={`evidence-tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key as EvidenceTab)}
                className="px-3 py-2 rounded-t font-semibold cursor-pointer transition-colors relative"
                style={{
                  backgroundColor: isActive ? "var(--paper-surface)" : "transparent",
                  color: isActive ? "var(--action)" : "var(--ink-soft)",
                  borderBottom: isActive ? "2px solid var(--action)" : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content: G (Good Traces) */}
        {activeTab === "G" && (
          <div data-testid="tab-content-G" className="flex flex-col gap-3">
            <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
              Tập G: Các vết kiểm định được chấp nhận (Grounded expected outputs &amp; properties). Không có nút chỉnh sửa.
            </div>

            <div className="flex flex-col gap-2">
              {MOCK_GOOD_EVIDENCE.map((item) => (
                <div
                  key={item.id}
                  data-testid={`evidence-row-${item.id}`}
                  className="p-3 rounded border font-mono text-xs flex flex-col gap-1.5"
                  style={{
                    backgroundColor: "var(--paper-surface)",
                    borderColor: "var(--rule)",
                    borderRadius: "var(--r-card)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: "var(--ink)" }}>{item.id}</span>
                      <span style={{ color: "var(--ink-soft)" }}>({item.taskId})</span>
                      <ProvenanceTag isGrounded={true} source={item.source} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded font-bold"
                        style={{
                          backgroundColor: "var(--v-acc-bg)",
                          color: "var(--v-acc)",
                          border: "1px solid var(--v-acc)",
                        }}
                      >
                        {item.verdict}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--ink-soft)" }}>
                        {item.timestamp}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
                    <div>
                      <span style={{ color: "var(--ink-soft)" }}>Input w: </span>
                      <code>{JSON.stringify(item.input)}</code>
                    </div>
                    <div>
                      <span style={{ color: "var(--ink-soft)" }}>Output e(w): </span>
                      <code>{JSON.stringify(item.output)}</code>
                    </div>
                  </div>
                  {item.notes && (
                    <div className="text-[11px] opacity-75" style={{ color: "var(--ink-soft)" }}>
                      {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: B (Bad Traces) */}
        {activeTab === "B" && (
          <div data-testid="tab-content-B" className="flex flex-col gap-3">
            <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
              Tập B: Các vết bị bác bỏ vi phạm đặc tả (Rejections). Bất biến hình thức, cấm sửa tay.
            </div>

            <div className="flex flex-col gap-2">
              {MOCK_BAD_EVIDENCE.map((item) => (
                <div
                  key={item.id}
                  data-testid={`evidence-row-${item.id}`}
                  className="p-3 rounded border font-mono text-xs flex flex-col gap-1.5"
                  style={{
                    backgroundColor: "var(--paper-surface)",
                    borderColor: "var(--rule)",
                    borderRadius: "var(--r-card)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: "var(--ink)" }}>{item.id}</span>
                      <span style={{ color: "var(--ink-soft)" }}>({item.taskId})</span>
                      <ProvenanceTag isGrounded={true} source={item.source} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded font-bold"
                        style={{
                          backgroundColor: "var(--v-code-bg)",
                          color: "var(--v-code)",
                          border: "1px solid var(--v-code)",
                        }}
                      >
                        {item.verdict}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--ink-soft)" }}>
                        {item.timestamp}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
                    <div>
                      <span style={{ color: "var(--ink-soft)" }}>Input w: </span>
                      <code>{JSON.stringify(item.input)}</code>
                    </div>
                    <div>
                      <span style={{ color: "var(--ink-soft)" }}>Output: </span>
                      <code>{JSON.stringify(item.output)}</code>
                    </div>
                  </div>
                  {item.notes && (
                    <div className="text-[11px] opacity-75" style={{ color: "var(--ink-soft)" }}>
                      {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: B_synth (Mutants) */}
        {activeTab === "B_synth" && (
          <div data-testid="tab-content-B_synth" className="flex flex-col gap-3">
            <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
              Tập B_synth: Vết đột biến sinh tự động dùng để đo độ lỏng của monitor P0 qua kiểm định Fuzzing.
            </div>

            <div className="flex flex-col gap-2">
              {MOCK_BSYNTH_EVIDENCE.map((item) => (
                <div
                  key={item.id}
                  data-testid={`evidence-row-${item.id}`}
                  className="p-3 rounded border font-mono text-xs flex flex-col gap-1.5"
                  style={{
                    backgroundColor: "var(--paper-surface)",
                    borderColor: "var(--rule)",
                    borderRadius: "var(--r-card)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: "var(--ink)" }}>{item.id}</span>
                      <span style={{ color: "var(--ink-soft)" }}>({item.taskId})</span>
                      <span
                        className="px-2 py-0.5 rounded text-[11px]"
                        style={{
                          backgroundColor: "var(--paper-ground)",
                          color: "var(--ink-soft)",
                          border: "1px solid var(--rule)",
                        }}
                      >
                        Loại: {item.mutationType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded font-bold text-[11px]"
                        style={{
                          backgroundColor: item.isCaughtByP0 ? "var(--v-acc-bg)" : "var(--v-spec-bg)",
                          color: item.isCaughtByP0 ? "var(--v-acc)" : "var(--v-spec)",
                          border: `1px solid ${item.isCaughtByP0 ? "var(--v-acc)" : "var(--v-spec)"}`,
                        }}
                      >
                        {item.isCaughtByP0 ? "P0 Bác bỏ" : "P0 Bị lọt (Slack)"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
                    <div>
                      <span style={{ color: "var(--ink-soft)" }}>Input: </span>
                      <code>{JSON.stringify(item.input)}</code>
                    </div>
                    <div>
                      <span style={{ color: "var(--ink-soft)" }}>Mutant: </span>
                      <code>{JSON.stringify(item.mutantOutput)}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Anchor & Bao đóng MR */}
        {activeTab === "anchor_closure" && (
          <div data-testid="tab-content-anchor_closure">
            <ProvenanceTree rootNode={MOCK_METAMORPHIC_TREE} />
          </div>
        )}

        {/* Tab Content: Nợ spec */}
        {activeTab === "spec_debt" && (
          <div data-testid="tab-content-spec_debt" className="flex flex-col gap-3">
            <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
              Nợ Đặc tả (Spec Debt): Các ca tồn đọng cần bổ sung quan hệ biến đổi MR, mở rộng tiên đề hoặc gán nhãn người.
            </div>

            <div className="flex flex-col gap-2">
              {MOCK_SPEC_DEBT.map((item) => (
                <div
                  key={item.id}
                  data-testid={`debt-row-${item.id}`}
                  className="p-3 rounded border font-mono text-xs flex flex-col gap-1.5"
                  style={{
                    backgroundColor: "var(--paper-surface)",
                    borderColor: "var(--rule)",
                    borderRadius: "var(--r-card)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: "var(--ink)" }}>{item.id}</span>
                      <span style={{ color: "var(--ink-soft)" }}>({item.taskId})</span>
                      <span className="font-semibold" style={{ color: "var(--action)" }}>
                        {item.title}
                      </span>
                    </div>

                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-bold uppercase"
                      style={{
                        backgroundColor:
                          item.severity === "high"
                            ? "var(--v-code-bg)"
                            : item.severity === "medium"
                            ? "var(--v-spec-bg)"
                            : "var(--v-neutral-bg)",
                        color:
                          item.severity === "high"
                            ? "var(--v-code)"
                            : item.severity === "medium"
                            ? "var(--v-spec)"
                            : "var(--ink)",
                        border: `1px solid ${
                          item.severity === "high" ? "var(--v-code)" : "var(--rule)"
                        }`,
                      }}
                    >
                      Mức: {item.severity}
                    </span>
                  </div>

                  <p className="text-[11px] m-0 leading-relaxed opacity-80" style={{ color: "var(--ink)" }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function EvidencePage() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-sm">Đang tải Kho Bằng chứng...</div>}>
      <EvidenceContent />
    </Suspense>
  );
}

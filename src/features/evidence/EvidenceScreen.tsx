"use client";

import React, { useState } from "react";
import { AppShell } from "@/ui/shell";
import { PageHeader, QueryBoundary } from "@/ui/layout";
import { ProvenanceTree } from "@/ui/domain/ProvenanceTree";
import { api, useApiQuery } from "@/lib/api";
import { InvariantBadge } from "./components/InvariantBadge";
import { EvidenceTabs, type EvidenceTab } from "./components/EvidenceTabs";
import { BSynthList, EvidenceRecordList, SpecDebtList } from "./components/EvidenceLists";
import { RunGate } from "@/features/runs/RunGate";

export function EvidenceScreen() {
  return <RunGate>{(runId) => <EvidenceContent runId={runId} />}</RunGate>;
}

function EvidenceContent({ runId }: { runId: string }) {
  const [activeTab, setActiveTab] = useState<EvidenceTab>("G");
  const store = useApiQuery(`evidence:${runId}`, (signal) => api.evidence.get(runId, signal));

  return (
    <AppShell currentRunId={runId}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2">
        <PageHeader
          testId="evidence-topbar"
          eyebrow="Kho Bằng chứng Hình thức (Evidence Store)"
          title={<>Formal Evidence Archive &amp; Invariant Monitor</>}
          description="Dữ liệu bằng chứng là bất biến hình thức (Read-only formal archive). Cấm sửa tay dữ liệu G/B."
          actions={store.data && <InvariantBadge holds={store.data.invariant.holds} />}
        />

        <QueryBoundary query={store} loadingLabel="Đang tải Kho Bằng chứng...">
          {(data) => (
            <>
              <EvidenceTabs
                active={activeTab}
                onChange={setActiveTab}
                counts={{ G: data.good.length, B: data.bad.length, B_synth: data.bSynth.length, spec_debt: data.specDebt.length }}
              />
              {activeTab === "G" && (
                <EvidenceRecordList
                  testId="tab-content-G"
                  intro="Tập G: Các vết kiểm định được chấp nhận (Grounded expected outputs & properties). Không có nút chỉnh sửa."
                  records={data.good}
                  verdictTone="success"
                  outputLabel="Output e(w)"
                />
              )}
              {activeTab === "B" && (
                <EvidenceRecordList
                  testId="tab-content-B"
                  intro="Tập B: Các vết bị bác bỏ vi phạm đặc tả (Rejections). Bất biến hình thức, cấm sửa tay."
                  records={data.bad}
                  verdictTone="danger"
                  outputLabel="Output"
                />
              )}
              {activeTab === "B_synth" && <BSynthList records={data.bSynth} />}
              {activeTab === "anchor_closure" && (
                <div data-testid="tab-content-anchor_closure">
                  <ProvenanceTree rootNode={data.metamorphicTree} />
                </div>
              )}
              {activeTab === "spec_debt" && <SpecDebtList items={data.specDebt} />}
            </>
          )}
        </QueryBoundary>
      </div>
    </AppShell>
  );
}

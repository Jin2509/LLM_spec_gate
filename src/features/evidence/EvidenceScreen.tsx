"use client";

import React, { useState } from "react";
import { AppShell } from "@/ui/shell";
import { PageHeader, QueryBoundary } from "@/ui/layout";
import { ProvenanceTree } from "@/features/evidence/components/ProvenanceTree";
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
      <div className="flex flex-col gap-6">
        <PageHeader
          testId="evidence-topbar"
          eyebrow="Dữ liệu"
          title="Kho bằng chứng"
          description="Các cặp (đầu vào, đầu ra) đã được phân xử và nguồn gốc của chúng. Chỉ đọc: kho chỉ thay đổi qua phán quyết của hệ thống hoặc câu trả lời của người."
          actions={store.data && <InvariantBadge holds={store.data.invariant.holds} />}
        />

        <QueryBoundary query={store} loadingLabel="Đang tải kho bằng chứng...">
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
                  intro="Các cặp được xác định là đúng, kèm nguồn bằng chứng độc lập với LLM sinh code và đặc tả."
                  records={data.good}
                  verdictTone="success"
                  outputLabel="Đầu ra đúng"
                />
              )}
              {activeTab === "B" && (
                <EvidenceRecordList
                  testId="tab-content-B"
                  intro="Các cặp được xác định là sai. Một bản sửa đặc tả không được phép chấp nhận bất kỳ cặp nào ở đây."
                  records={data.bad}
                  verdictTone="danger"
                  outputLabel="Đầu ra sai"
                />
              )}
              {activeTab === "B_synth" && <BSynthList records={data.bSynth} />}
              {activeTab === "anchor_closure" && (
                <div data-testid="tab-content-anchor_closure" className="flex flex-col gap-3">
                  <p className="m-0 text-[13px]" style={{ color: "var(--ink-soft)" }}>
                    Điểm neo gốc (ví dụ trong docstring) và các ca kiểm thử dẫn xuất từ chúng qua quan hệ biến đổi (MR).
                  </p>
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

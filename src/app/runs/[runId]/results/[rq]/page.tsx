"use client";

import React, { Suspense, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/ui/shell";
import { ChartContainer } from "@/ui/reporting/ChartContainer";
import {
  RQ1Chart,
  RQ2Chart,
  RQ3Chart,
  RQ4Chart,
  RQ5Chart,
  RQ6Chart,
} from "@/ui/reporting/RQCharts";
import {
  type LinkedWitness,
  RQ1_DATA,
  RQ2_CONFUSION_MATRIX,
  RQ3_ABLATION_DATA,
  RQ4_CORRELATION_DATA,
  RQ5_SUITE,
  RQ6_STRATEGIES,
} from "@/reporting/results-data";

type RQId = "rq1" | "rq2" | "rq3" | "rq4" | "rq5" | "rq6";

function ResultsContent() {
  const params = useParams();
  const router = useRouter();

  const runId = (params?.runId as string) || "run_evalplus_01";
  const rawRq = (params?.rq as string)?.toLowerCase() || "rq1";
  const activeRq: RQId = ["rq1", "rq2", "rq3", "rq4", "rq5", "rq6"].includes(rawRq)
    ? (rawRq as RQId)
    : "rq1";

  const [selectedWitnesses, setSelectedWitnesses] = useState<ReadonlyArray<LinkedWitness> | null>(null);

  const handleSelectWitnesses = (witnesses: ReadonlyArray<LinkedWitness>) => {
    setSelectedWitnesses(witnesses);
  };

  const handleTabChange = (rq: RQId) => {
    setSelectedWitnesses(null);
    router.push(`/runs/${runId}/results/${rq}`);
  };

  return (
    <AppShell currentRunId={runId}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2 font-sans">
        {/* Navigation Tabs RQ1 -> RQ6 */}
        <div
          data-testid="results-rq-tabs"
          className="flex flex-wrap items-center gap-1 p-1 rounded border font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          {[
            { id: "rq1", label: "RQ1: Lọc Lỗi Spec" },
            { id: "rq2", label: "RQ2: Risk-Coverage" },
            { id: "rq3", label: "RQ3: Ablation A0–A3" },
            { id: "rq4", label: "RQ4: Tương quan Model" },
            { id: "rq5", label: "RQ5: Bộ tứ Repair" },
            { id: "rq6", label: "RQ6: Human Query" },
          ].map((tab) => {
            const isSelected = activeRq === tab.id;
            return (
              <button
                key={tab.id}
                data-testid={`rq-tab-${tab.id}`}
                onClick={() => handleTabChange(tab.id as RQId)}
                className="px-3 py-1.5 rounded font-semibold cursor-pointer transition-colors"
                style={{
                  backgroundColor: isSelected ? "var(--action)" : "transparent",
                  color: isSelected ? "var(--paper-surface)" : "var(--ink-soft)",
                  borderRadius: "var(--r-cell)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* RQ1 Render */}
        {activeRq === "rq1" && (
          <ChartContainer
            rqId="rq1"
            title="RQ1: Hiệu quả Phân rã và Lọc Lỗi Đặc tả P0"
            sampleSize={164}
            description="So sánh số lượng ca lỗi đặc tả phân loại theo 3 nhóm chính trước và sau khi áp dụng bộ lọc Adjudicator."
            tableHeaders={["Nhóm Lỗi", "Trước Lọc", "Sau Lọc", "Tỷ lệ Giảm"]}
            tableRows={RQ1_DATA.map((d) => [d.category, d.beforeCount, d.afterCount, `-${d.reductionRatio}%`])}
            rawData={RQ1_DATA}
            selectedWitnesses={selectedWitnesses}
            onClearWitnesses={() => setSelectedWitnesses(null)}
          >
            <RQ1Chart onSelectWitnesses={handleSelectWitnesses} />
          </ChartContainer>
        )}

        {/* RQ2 Render */}
        {activeRq === "rq2" && (
          <ChartContainer
            rqId="rq2"
            title="RQ2: Đường cong Risk-Coverage Pareto & Ma trận Nhầm lẫn 4 Lớp"
            sampleSize={164}
            description="Đánh giá trade-off giữa tỷ lệ bao phủ và rủi ro tồn dư; so sánh chế độ Fail-Closed với Fail-Open và các baselines."
            tableHeaders={["Thực tế", "Dự đoán ACC", "SPEC_FAULT", "CODE_FAULT", "DUAL_FAULT"]}
            tableRows={RQ2_CONFUSION_MATRIX.map((r) => [r.trueClass, r.predAcc, r.predSpec, r.predCode, r.predDual])}
            rawData={RQ2_CONFUSION_MATRIX}
            selectedWitnesses={selectedWitnesses}
            onClearWitnesses={() => setSelectedWitnesses(null)}
          >
            <RQ2Chart onSelectWitnesses={handleSelectWitnesses} />
          </ChartContainer>
        )}

        {/* RQ3 Render */}
        {activeRq === "rq3" && (
          <ChartContainer
            rqId="rq3"
            title="RQ3: Ma trận Ablation Heatmap (Mức Anchor A0–A3 × Nguồn Chứng cứ)"
            sampleSize={164}
            description="Khảo sát đóng góp từng mức anchor từ A0 (không anchor) đến A3 (full differential) trên các nguồn chứng cứ."
            tableHeaders={["Mức Anchor", "Docstring Anchor", "Differential A3", "Verified MR", "Formal A2"]}
            tableRows={[
              ["A0", "54.2%", "48.0%", "51.5%", "56.1%"],
              ["A1", "78.4%", "69.2%", "72.8%", "75.3%"],
              ["A2", "89.1%", "84.7%", "91.6%", "93.0%"],
              ["A3", "95.8%", "97.4%", "96.2%", "98.1%"],
            ]}
            rawData={RQ3_ABLATION_DATA}
            selectedWitnesses={selectedWitnesses}
            onClearWitnesses={() => setSelectedWitnesses(null)}
          >
            <RQ3Chart onSelectWitnesses={handleSelectWitnesses} />
          </ChartContainer>
        )}

        {/* RQ4 Render */}
        {activeRq === "rq4" && (
          <ChartContainer
            rqId="rq4"
            title="RQ4: Tương quan Thiên kiến Coder × Spec trên Lỗi Âm thầm (SILENT_FAULT)"
            sampleSize={164}
            description="Đo lường tỷ lệ lỗi âm thầm khi cặp mô hình sinh mã và sinh đặc tả thuộc cùng một họ (Homogeneous Bias)."
            tableHeaders={["Coder \\ Spec", "GPT-4o", "Claude-3.5-S", "DeepSeek-V3", "Qwen-2.5-C"]}
            tableRows={[
              ["GPT-4o", "18.2% *", "3.4%", "4.1%", "5.0%"],
              ["Claude-3.5-S", "3.8%", "14.6% *", "4.4%", "4.9%"],
              ["DeepSeek-V3", "4.7%", "4.2%", "16.9% *", "6.2%"],
              ["Qwen-2.5-C", "5.6%", "5.1%", "6.8%", "19.4% *"],
            ]}
            rawData={RQ4_CORRELATION_DATA}
            selectedWitnesses={selectedWitnesses}
            onClearWitnesses={() => setSelectedWitnesses(null)}
          >
            <RQ4Chart onSelectWitnesses={handleSelectWitnesses} />
          </ChartContainer>
        )}

        {/* RQ5 Render */}
        {activeRq === "rq5" && (
          <ChartContainer
            rqId="rq5"
            title="RQ5: Bộ tứ Chỉ số Sửa đổi (5a–5d) & Phân rã Nguyên nhân UNKNOWN_GATE"
            sampleSize={164}
            description="Theo dõi tỷ lệ OverRelaxation, tỷ lệ thu hồi, số patch tích lũy, chi phí tương đối và phân rã các bước Gate G1–G5."
            tableHeaders={["Chỉ số", "Tên", "Giá trị", "Ý nghĩa"]}
            tableRows={RQ5_SUITE.map((s) => [s.key, s.title, s.value, s.interpretation])}
            rawData={RQ5_SUITE}
            selectedWitnesses={selectedWitnesses}
            onClearWitnesses={() => setSelectedWitnesses(null)}
          >
            <RQ5Chart onSelectWitnesses={handleSelectWitnesses} />
          </ChartContainer>
        )}

        {/* RQ6 Render */}
        {activeRq === "rq6" && (
          <ChartContainer
            rqId="rq6"
            title="RQ6: Pareto Risk-Coverage-Query trong Tương tác Hỏi Người"
            sampleSize={164}
            description="Đo lường hiệu quả giảm thiểu rủi ro của cơ chế hỏi chủ động (Active Query) so với hỏi ngẫu nhiên và hỏi toàn bộ."
            tableHeaders={["Chiến lược", "0 câu hỏi", "5 câu hỏi", "10 câu hỏi", "15 câu hỏi", "20 câu hỏi"]}
            tableRows={RQ6_STRATEGIES.map((s) => [
              s.name,
              `${s.points[0]?.residualRisk}% risk`,
              `${s.points[1]?.residualRisk}% risk`,
              `${s.points[2]?.residualRisk}% risk`,
              `${s.points[3]?.residualRisk}% risk`,
              `${s.points[4]?.residualRisk}% risk`,
            ])}
            rawData={RQ6_STRATEGIES}
            selectedWitnesses={selectedWitnesses}
            onClearWitnesses={() => setSelectedWitnesses(null)}
          >
            <RQ6Chart onSelectWitnesses={handleSelectWitnesses} />
          </ChartContainer>
        )}
      </div>
    </AppShell>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-sm">Đang tải Báo cáo Khoa học...</div>}>
      <ResultsContent />
    </Suspense>
  );
}

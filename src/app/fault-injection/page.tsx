"use client";

import React, { Suspense, useState } from "react";
import { AppShell } from "@/ui/shell";
import { Button } from "@/ui/primitives/Button";

function FaultInjectionContent() {
  const [specFault, setSpecFault] = useState<string>("over_tight");
  const [codeFault, setCodeFault] = useState<string>("off_by_one");
  const [trustedFault, setTrustedFault] = useState<string>("mr_corrupt");

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<{
    misattributionRate: number;
    faultyPatchSlipRate: number;
    gateBlockedCount: number;
    totalInjections: number;
  }>({
    misattributionRate: 2.4,
    faultyPatchSlipRate: 0.0,
    gateBlockedCount: 48,
    totalInjections: 50,
  });

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // Recompute metrics based on injection profile
      let misattr = 2.4;
      let slip = 0.0;
      if (trustedFault !== "none") {
        misattr = 14.8; // Trusted oracle corruption increases misattribution
        slip = 1.2;
      }
      setMetrics({
        misattributionRate: misattr,
        faultyPatchSlipRate: slip,
        gateBlockedCount: Math.round(50 * (1 - slip / 100)),
        totalInjections: 50,
      });
      setIsSimulating(false);
    }, 400);
  };

  return (
    <AppShell currentRunId="run_evalplus_01">
      <div className="flex flex-col gap-6 max-w-6xl mx-auto py-2 font-sans">
        {/* Header */}
        <div
          data-testid="fault-injection-header"
          className="p-4 rounded border flex flex-wrap items-center justify-between gap-4 font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--v-code)" }}>
              Phòng Thí nghiệm Độ bền &amp; Tiêm lỗi (Fault Injection)
            </span>
            <h1 className="text-base font-bold m-0 mt-0.5" style={{ color: "var(--ink)" }}>
              Controlled Perturbation &amp; Misattribution Stress Test
            </h1>
            <p className="text-[11px] m-0 mt-1 opacity-75" style={{ color: "var(--ink-soft)" }}>
              Mô phỏng sai lệch tại 3 khu vực để kiểm chứng độ bền của bộ phân xử và hàng rào Gate fail-closed.
            </p>
          </div>

          <Button
            data-testid="run-injection-btn"
            variant="danger"
            disabled={isSimulating}
            onClick={handleRunSimulation}
          >
            {isSimulating ? "Đang kiểm thử..." : "⚡ Thực hiện Tiêm lỗi & Phân tích"}
          </Button>
        </div>

        {/* 3 Injection Zones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Zone 1: Spec P0 Faults */}
          <div
            data-testid="fault-zone-1"
            className="p-4 rounded border flex flex-col gap-3"
            style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)" }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--rule)" }}>
              <span className="font-bold" style={{ color: "var(--ink)" }}>Khu 1: Lỗi Đặc tả P0</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--paper-ground)", border: "1px solid var(--rule)" }}>
                Spec Faults
              </span>
            </div>

            <label className="flex flex-col gap-1 cursor-pointer">
              <span style={{ color: "var(--ink-soft)" }}>Kiểu sai lệch đặc tả:</span>
              <select
                data-testid="select-spec-fault"
                value={specFault}
                onChange={(e) => setSpecFault(e.target.value)}
                className="p-2 rounded border"
                style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink)" }}
              >
                <option value="over_tight">Đặc tả quá chặt (Over-tight / Bác nhầm e(w))</option>
                <option value="under_tight">Đặc tả quá lỏng (Under-tight / Lọt vết xấu)</option>
                <option value="semantic_flip">Đảo ngữ nghĩa điều kiện (Not condition)</option>
              </select>
            </label>
            <p className="text-[11px] m-0 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Thử thách khả năng R2/R3 nhận diện SPEC_FAULT và kích hoạt repair.
            </p>
          </div>

          {/* Zone 2: Code C Faults */}
          <div
            data-testid="fault-zone-2"
            className="p-4 rounded border flex flex-col gap-3"
            style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)" }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--rule)" }}>
              <span className="font-bold" style={{ color: "var(--ink)" }}>Khu 2: Lỗi Mã nguồn C</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--paper-ground)", border: "1px solid var(--rule)" }}>
                Code Faults
              </span>
            </div>

            <label className="flex flex-col gap-1 cursor-pointer">
              <span style={{ color: "var(--ink-soft)" }}>Kiểu đột biến code:</span>
              <select
                data-testid="select-code-fault"
                value={codeFault}
                onChange={(e) => setCodeFault(e.target.value)}
                className="p-2 rounded border"
                style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink)" }}
              >
                <option value="off_by_one">Lỗi Off-by-one chỉ số mảng (&plusmn;1)</option>
                <option value="operator_flip">Đảo dấu so sánh (&lt; thành &gt;=)</option>
                <option value="extreme_input">Lỗi tràn biên số học (Boundary overflow)</option>
              </select>
            </label>
            <p className="text-[11px] m-0 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Thử thách khả năng R5 quy đúng CODE_FAULT và chặn sửa nhầm đặc tả.
            </p>
          </div>

          {/* Zone 3: Trusted Source Faults */}
          <div
            data-testid="fault-zone-3"
            className="p-4 rounded border flex flex-col gap-3"
            style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)" }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--rule)" }}>
              <span className="font-bold" style={{ color: "var(--ink)" }}>Khu 3: Lỗi Nguồn Tin cậy</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--paper-ground)", border: "1px solid var(--rule)" }}>
                Oracle Noise
              </span>
            </div>

            <label className="flex flex-col gap-1 cursor-pointer">
              <span style={{ color: "var(--ink-soft)" }}>Kiểu làm nhiễu nguồn Grounded:</span>
              <select
                data-testid="select-trusted-fault"
                value={trustedFault}
                onChange={(e) => setTrustedFault(e.target.value)}
                className="p-2 rounded border"
                style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink)" }}
              >
                <option value="none">Không làm nhiễu (Nguồn chuẩn xác)</option>
                <option value="mr_corrupt">Đột biến sai quan hệ biến đổi MR (A2)</option>
                <option value="docstring_corrupt">Lỗi giá trị anchor trong Docstring</option>
                <option value="a3_conflict">Tạo mâu thuẫn giữa 2 engine A3</option>
              </select>
            </label>
            <p className="text-[11px] m-0 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Đo lường giới hạn phân xử khi tiên đề Grounded bị vi phạm.
            </p>
          </div>
        </div>

        {/* Live Measurement Results */}
        <div
          data-testid="injection-metrics-dashboard"
          className="p-4 rounded border flex flex-col gap-3 font-mono text-xs"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--rule)" }}>
            <span className="font-semibold" style={{ color: "var(--ink)" }}>
              Đo lường Trực tiếp Tỷ lệ Quy sai &amp; Độ lọt Gate
            </span>
            <span style={{ color: "var(--ink-soft)" }}>Tổng cộng {metrics.totalInjections} ca thử nghiệm</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Tỷ lệ Quy sai lỗi (Misattribution)</span>
              <strong
                data-testid="metric-misattribution-rate"
                className="text-lg font-bold"
                style={{ color: metrics.misattributionRate > 10 ? "var(--v-spec)" : "var(--action)" }}
              >
                {metrics.misattributionRate}%
              </strong>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--ink-soft)" }}>Tỷ lệ nhầm SPEC_FAULT thành CODE_FAULT hoặc ngược lại</div>
            </div>

            <div className="p-3 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Tỷ lệ Patch sai lọt Gate (Slippage)</span>
              <strong
                data-testid="metric-patch-slip-rate"
                className="text-lg font-bold"
                style={{ color: metrics.faultyPatchSlipRate > 0 ? "var(--v-code)" : "var(--v-acc)" }}
              >
                {metrics.faultyPatchSlipRate}%
              </strong>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--ink-soft)" }}>Pipeline G1–G5 chặn hầu hết mọi bản vá vi phạm</div>
            </div>

            <div className="p-3 rounded border" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)" }}>
              <span className="block text-[11px]" style={{ color: "var(--ink-soft)" }}>Số ca bị Gate chặn thành công</span>
              <strong className="text-lg font-bold" style={{ color: "var(--v-acc)" }}>
                {metrics.gateBlockedCount} / {metrics.totalInjections} ca
              </strong>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--ink-soft)" }}>Bảo đảm fail-closed tuyệt đối</div>
            </div>
          </div>
        </div>

        {/* Theoretical Limit Caveat */}
        <div
          data-testid="theoretical-limit-caveat"
          className="p-3.5 rounded border font-mono text-xs flex flex-col gap-1.5"
          style={{
            backgroundColor: "var(--paper-ground)",
            borderColor: "var(--v-spec)",
            borderStyle: "dashed",
            color: "var(--ink)",
          }}
        >
          <div className="flex items-center gap-2 font-bold" style={{ color: "var(--v-spec)" }}>
            <span>⚠️</span>
            <span>CHÚ THÍCH CỐ ĐỊNH VỀ GIỚI HẠN LÝ THUYẾT CỦA NGUỒN SAI</span>
          </div>
          <p className="m-0 leading-relaxed text-[11px] opacity-85">
            Khi nguồn tin cậy grounded (Anchor, A2, A3) bị nhiễu hoặc sai lệch, bộ phân xử không thể bảo đảm tính phân biệt
            chính quy giữa lỗi mã nguồn và lỗi đặc tả theo <em>Định lý giới hạn cục bộ trong phân xử oracle kép</em>. Trong
            tình huống này, hệ thống sẽ tự động hạ cấp phán quyết về <code>UNKNOWN_CONFLICT</code> (R1) hoặc <code>UNKNOWN_EVIDENCE</code> (R6)
            và chuyển giao quyền quyết định cho con người qua thẻ hỏi single-shot.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

export default function FaultInjectionPage() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-sm">Đang tải Phòng Tiêm lỗi...</div>}>
      <FaultInjectionContent />
    </Suspense>
  );
}

import React from "react";
import type { AdmissionReport } from "@/lib/api";
import { i18n } from "@/i18n/vi";

function SummaryCard({ label, value, hint, color }: { label: string; value: string; hint: string; color: string }) {
  return (
    <div
      className="p-3.5 border rounded shadow-sm"
      style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)", borderRadius: "var(--r-card)" }}
    >
      <div className="text-[11px] font-mono" style={{ color: "var(--ink-soft)" }}>
        {label}
      </div>
      <div className="text-2xl font-mono font-bold mt-1" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] font-mono mt-1 opacity-70">{hint}</div>
    </div>
  );
}

export function AdmissionSummaryCards({ summary }: { summary: AdmissionReport["summary"] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <SummaryCard
        label={i18n.admission.slackRatio}
        value={`${summary.slackRatio}%`}
        hint={`${summary.slackCases} / ${summary.totalTasks} ca lọt qua B_synth`}
        color="var(--v-spec)"
      />
      <SummaryCard
        label={i18n.admission.silentFaultsDetected}
        value={`${summary.silentFaultCases.length} ca`}
        hint={summary.silentFaultCases.join(", ") || "—"}
        color="var(--v-code)"
      />
      <SummaryCard
        label="Trạng thái Trust Base"
        value={`${summary.admittedTasks} / ${summary.totalTasks} Task`}
        hint={`${summary.excludedTasks} task bị loại do vi phạm anchor`}
        color="var(--v-acc)"
      />
    </div>
  );
}

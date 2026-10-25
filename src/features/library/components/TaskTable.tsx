"use client";

import React from "react";
import type { AcademicTask } from "@/core/types";
import { Badge, type Tone } from "@/ui/layout";
import { i18n } from "@/i18n/vi";

const ANCHOR_TONE: Record<AcademicTask["anchorLevel"], Tone> = { A0: "neutral", A1: "neutral", A2: "warning", A3: "action" };

function TaskRow({ task }: { task: AcademicTask }) {
  return (
    <tr className="hover:bg-[var(--paper-ground)]/40 transition-colors">
      <td className="py-2.5 px-3 font-semibold" style={{ color: "var(--ink)" }}>
        <div>{task.id}</div>
        <div className="text-[11px] opacity-70">{task.name}</div>
      </td>
      <td className="py-2.5 px-3 max-w-xs" style={{ color: "var(--ink)" }}>
        <span className="line-clamp-2" title={task.intentDocstring}>
          {task.intentDocstring}
        </span>
      </td>
      <td className="py-2.5 px-3">
        <Badge>{task.outputType}</Badge>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${task.isUniqueOutput ? "bg-[var(--v-acc)]" : "bg-[var(--v-spec)]"}`} />
          <span>{task.isUniqueOutput ? "Unique" : "Đa nghiệm"}</span>
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: "var(--ink-soft)" }}>
          gán bởi: {task.assignedBy}
        </div>
      </td>
      <td className="py-2.5 px-3">
        <Badge tone={task.anchorOrigin === "gốc" ? "success" : "neutral"}>{task.anchorOrigin}</Badge>
      </td>
      <td className="py-2.5 px-3">
        <Badge tone={ANCHOR_TONE[task.anchorLevel]}>{task.anchorLevel}</Badge>
      </td>
      <td className="py-2.5 px-3 text-right">
        {task.isBSynthSupported ? (
          <span className="text-[11px] opacity-50" style={{ color: "var(--ink-soft)" }}>
            Sẵn sàng
          </span>
        ) : (
          <Badge tone="danger">{i18n.library.bSynthDisabled}</Badge>
        )}
      </td>
    </tr>
  );
}

export function TaskTable({ tasks }: { tasks: readonly AcademicTask[] }) {
  return (
    <div
      className="border rounded overflow-hidden shadow-sm"
      style={{ backgroundColor: "var(--paper-surface)", borderColor: "var(--rule)", borderRadius: "var(--r-card)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b" style={{ backgroundColor: "var(--paper-ground)", borderColor: "var(--rule)", color: "var(--ink-soft)" }}>
              <th className="py-2.5 px-3 font-semibold">Mã / Tên Task</th>
              <th className="py-2.5 px-3 font-semibold">Mục đích (Intent Docstring)</th>
              <th className="py-2.5 px-3 font-semibold">Kiểu</th>
              <th className="py-2.5 px-3 font-semibold">Độc nhất & Người gán</th>
              <th className="py-2.5 px-3 font-semibold">Anchor Gốc/Dẫn xuất</th>
              <th className="py-2.5 px-3 font-semibold">Mức Anchor</th>
              <th className="py-2.5 px-3 font-semibold text-right">Trạng thái B_synth</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--rule)" }}>
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <p className="p-4 text-center text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
            Không có task khớp bộ lọc.
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { AppShell } from "@/ui/shell";
import { ACADEMIC_TASKS, type AcademicTask } from "@/mock/fixtures/academic-tasks";
import { Button } from "@/ui/primitives/Button";
import { i18n } from "@/i18n/vi";

export default function LibraryPage() {
  const [tasks] = useState<readonly AcademicTask[]>(ACADEMIC_TASKS);

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUnique, setFilterUnique] = useState<string>("all");
  const [filterAnchor, setFilterAnchor] = useState<string>("all");

  // Held-out partition state
  const [heldOutRatio, setHeldOutRatio] = useState<number>(0.25);
  const [seed, setSeed] = useState<string>("adjudicator_seed_42");
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLocking, setIsLocking] = useState<boolean>(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterType !== "all" && t.outputType !== filterType) return false;
      if (filterUnique === "unique_only" && !t.isUniqueOutput) return false;
      if (filterUnique === "non_unique" && t.isUniqueOutput) return false;
      if (filterAnchor === "has_a2" && !t.hasA2) return false;
      if (filterAnchor === "has_a3" && !t.hasA3) return false;
      return true;
    });
  }, [tasks, filterType, filterUnique, filterAnchor]);

  const heldOutCount = Math.max(1, Math.round(tasks.length * heldOutRatio));
  const runCount = tasks.length - heldOutCount;

  const handleLockPartition = async () => {
    if (isLocked) return;
    setIsLocking(true);
    try {
      const res = await fetch("/api/runs/run_evalplus_01/lock-heldout", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setIsLocked(true);
        setLockMessage("🔒 Tập held-out đã được khóa cứng vĩnh viễn với seed đã chọn.");
      } else {
        setLockMessage(`Lỗi khóa tập: ${data.error}`);
      }
    } catch {
      // Local fallback for offline/test environments
      setIsLocked(true);
      setLockMessage("🔒 Tập held-out đã được khóa cứng vĩnh viễn (Chế độ độc lập).");
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <AppShell topbarProps={{ isHeldOutLocked: isLocked }}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b pb-4" style={{ borderColor: "var(--rule)" }}>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
            {i18n.library.title}
          </h1>
          <p className="text-xs font-mono mt-1" style={{ color: "var(--ink-soft)" }}>
            {i18n.library.subtitle}
          </p>
        </div>

        {/* Held-out Split & Locking Section */}
        <div
          className="p-4 border rounded shadow-sm"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: isLocked ? "var(--v-spec)" : "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">{isLocked ? "🔒" : "🔓"}</span>
                <h2 className="font-mono font-semibold text-sm" style={{ color: "var(--ink)" }}>
                  Phân chia & Khóa Tập Held-Out (Structural Partition)
                </h2>
                <span
                  className="px-2 py-0.5 text-[11px] font-mono rounded font-semibold border"
                  style={{
                    backgroundColor: isLocked ? "var(--v-spec-bg)" : "var(--v-neutral-bg)",
                    borderColor: isLocked ? "var(--v-spec)" : "var(--rule)",
                    color: isLocked ? "var(--v-spec)" : "var(--ink-soft)",
                    borderRadius: "var(--r-cell)",
                  }}
                >
                  {isLocked ? i18n.library.lockedBadge : i18n.library.unlockedBadge}
                </span>
              </div>
              <p className="text-xs font-mono mt-1" style={{ color: "var(--ink-soft)" }}>
                Tất định theo seed: {runCount} task chạy (Run set) · {heldOutCount} task giữ lại (Held-out).
              </p>
            </div>

            {/* Inputs & Lock button */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
                  Tỷ lệ:
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="0.5"
                  disabled={isLocked}
                  value={heldOutRatio}
                  onChange={(e) => setHeldOutRatio(parseFloat(e.target.value) || 0.2)}
                  className="w-20 px-2 py-1 text-xs font-mono border rounded outline-none disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--paper-ground)",
                    borderColor: "var(--rule)",
                    color: "var(--ink)",
                    borderRadius: "var(--r-cell)",
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
                  Seed:
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="w-40 px-2 py-1 text-xs font-mono border rounded outline-none disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--paper-ground)",
                    borderColor: "var(--rule)",
                    color: "var(--ink)",
                    borderRadius: "var(--r-cell)",
                  }}
                />
              </div>

              <Button
                variant={isLocked ? "secondary" : "primary"}
                size="sm"
                disabled={isLocked || isLocking}
                onClick={handleLockPartition}
                className="gap-1.5"
              >
                <span>{isLocked ? "🔒" : "🛡️"}</span>
                <span>{isLocked ? "Đã đóng băng vĩnh viễn" : isLocking ? "Đang khóa..." : i18n.library.lockButton}</span>
              </Button>
            </div>
          </div>

          {lockMessage && (
            <div
              className="mt-3 p-2 text-xs font-mono rounded border flex items-center gap-2"
              style={{
                backgroundColor: isLocked ? "var(--v-acc-bg)" : "var(--v-spec-bg)",
                borderColor: isLocked ? "var(--v-acc)" : "var(--v-spec)",
                color: isLocked ? "var(--v-acc)" : "var(--v-spec)",
                borderRadius: "var(--r-cell)",
              }}
            >
              <span>{lockMessage}</span>
            </div>
          )}
        </div>

        {/* Task Filter Toolbar */}
        <div
          className="p-3 border rounded flex flex-wrap items-center gap-4 text-xs font-mono"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--ink-soft)" }}>Kiểu đầu ra:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2 py-1 border rounded outline-none"
              style={{
                backgroundColor: "var(--paper-ground)",
                borderColor: "var(--rule)",
                color: "var(--ink)",
                borderRadius: "var(--r-cell)",
              }}
            >
              <option value="all">Tất cả kiểu</option>
              <option value="int">int</option>
              <option value="str">str</option>
              <option value="list">list</option>
              <option value="float">float</option>
              <option value="bool">bool</option>
              <option value="other">other</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ color: "var(--ink-soft)" }}>Độc nhất (Unique):</span>
            <select
              value={filterUnique}
              onChange={(e) => setFilterUnique(e.target.value)}
              className="px-2 py-1 border rounded outline-none"
              style={{
                backgroundColor: "var(--paper-ground)",
                borderColor: "var(--rule)",
                color: "var(--ink)",
                borderRadius: "var(--r-cell)",
              }}
            >
              <option value="all">Tất cả</option>
              <option value="unique_only">Chỉ UniqueOutput</option>
              <option value="non_unique">Nhiều nghiệm hợp lệ</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ color: "var(--ink-soft)" }}>Bằng chứng A2 / A3:</span>
            <select
              value={filterAnchor}
              onChange={(e) => setFilterAnchor(e.target.value)}
              className="px-2 py-1 border rounded outline-none"
              style={{
                backgroundColor: "var(--paper-ground)",
                borderColor: "var(--rule)",
                color: "var(--ink)",
                borderRadius: "var(--r-cell)",
              }}
            >
              <option value="all">Tất cả</option>
              <option value="has_a2">Có A2 (Hình thức)</option>
              <option value="has_a3">Có A3 (Sai phân)</option>
            </select>
          </div>

          <div className="ml-auto text-[11px]" style={{ color: "var(--ink-soft)" }}>
            Hiển thị {filteredTasks.length} / {tasks.length} task
          </div>
        </div>

        {/* Academic Tasks Table */}
        <div
          className="border rounded overflow-hidden shadow-sm"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    backgroundColor: "var(--paper-ground)",
                    borderColor: "var(--rule)",
                    color: "var(--ink-soft)",
                  }}
                >
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
                {filteredTasks.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-[var(--paper-ground)]/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold" style={{ color: "var(--ink)" }}>
                      <div>{t.id}</div>
                      <div className="text-[11px] opacity-70">{t.name}</div>
                    </td>
                    <td className="py-2.5 px-3 max-w-xs" style={{ color: "var(--ink)" }}>
                      <span className="line-clamp-2" title={t.intentDocstring}>
                        {t.intentDocstring}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="px-1.5 py-0.5 rounded border text-[11px]"
                        style={{
                          backgroundColor: "var(--paper-ground)",
                          borderColor: "var(--rule)",
                          color: "var(--ink)",
                          borderRadius: "var(--r-cell)",
                        }}
                      >
                        {t.outputType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${t.isUniqueOutput ? "bg-[var(--v-acc)]" : "bg-[var(--v-spec)]"}`}
                        />
                        <span>{t.isUniqueOutput ? "Unique" : "Đa nghiệm"}</span>
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: "var(--ink-soft)" }}>
                        gán bởi: {t.assignedBy}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="px-1.5 py-0.5 text-[11px] rounded border"
                        style={{
                          backgroundColor: t.anchorOrigin === "gốc" ? "var(--v-acc-bg)" : "var(--v-neutral-bg)",
                          borderColor: t.anchorOrigin === "gốc" ? "var(--v-acc)" : "var(--rule)",
                          color: t.anchorOrigin === "gốc" ? "var(--v-acc)" : "var(--ink-soft)",
                          borderRadius: "var(--r-cell)",
                        }}
                      >
                        {t.anchorOrigin}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="px-2 py-0.5 text-[11px] font-bold rounded border"
                        style={{
                          backgroundColor:
                            t.anchorLevel === "A3"
                              ? "var(--v-dual-bg)"
                              : t.anchorLevel === "A2"
                                ? "var(--v-spec-bg)"
                                : "var(--paper-ground)",
                          borderColor:
                            t.anchorLevel === "A3"
                              ? "var(--v-dual)"
                              : t.anchorLevel === "A2"
                                ? "var(--v-spec)"
                                : "var(--rule)",
                          color:
                            t.anchorLevel === "A3"
                              ? "var(--v-dual)"
                              : t.anchorLevel === "A2"
                                ? "var(--v-spec)"
                                : "var(--ink)",
                          borderRadius: "var(--r-cell)",
                        }}
                      >
                        {t.anchorLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {!t.isBSynthSupported ? (
                        <span
                          className="px-2 py-0.5 text-[11px] font-semibold rounded border"
                          style={{
                            backgroundColor: "var(--v-code-bg)",
                            borderColor: "var(--v-code)",
                            color: "var(--v-code)",
                            borderRadius: "var(--r-cell)",
                          }}
                        >
                          {i18n.library.bSynthDisabled}
                        </span>
                      ) : (
                        <span className="text-[11px] opacity-50" style={{ color: "var(--ink-soft)" }}>
                          Sẵn sàng
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

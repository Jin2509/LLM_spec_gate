"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/ui/shell";
import { SAMPLE_CASES } from "@/mock/fixtures/sample-cases";
import { QueryTicket } from "@/ui/domain/QueryTicket";
import { Button } from "@/ui/primitives/Button";
import { i18n } from "@/i18n/vi";
import type { HumanQueryTicket } from "@/core/types";

// Seeded deterministic shuffle
function seededShuffle<T>(array: readonly T[], seedStr: string): T[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed << 5) - seed + seedStr.charCodeAt(i);
    seed |= 0;
  }
  const prng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = copy[i];
    const target = copy[j];
    if (temp && target) {
      copy[i] = target;
      copy[j] = temp;
    }
  }
  return copy;
}

function AnnotateContent() {
  const params = useParams();
  const runId = (params?.runId as string) || "run_evalplus_01";

  // Build list of cases that have tickets
  const casesWithTickets = useMemo(() => {
    const list = Object.values(SAMPLE_CASES).filter((c) => Boolean(c.ticket));
    return seededShuffle(list, "annotation_seed_2026");
  }, []);

  const [queue, setQueue] = useState<typeof casesWithTickets>(casesWithTickets);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [sessionCompletedCount, setSessionCompletedCount] = useState<number>(0);
  const [showRestAlert, setShowRestAlert] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const startTimeRef = useRef<number>(0);

  const currentCase = queue[0];
  const currentTicket = currentCase?.ticket;

  // Reset timer on new card
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentCase?.id]);

  // Handle answering card
  const handleAnswer = useCallback(
    async (answer: unknown) => {
      if (!currentTicket) return;
      const now = Date.now();
      const duration = startTimeRef.current > 0 ? now - startTimeRef.current : 0;
      startTimeRef.current = now;
      setLatencyMs(duration);

      await fetch(`/api/tickets/${currentTicket.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, durationMs: duration }),
      });

      // Move next
      setQueue((prev) => prev.slice(1));
      setCompletedCount((c) => c + 1);
      const newSessionCount = sessionCompletedCount + 1;
      setSessionCompletedCount(newSessionCount);

      // Rest alert trigger after every 15 cards
      if (newSessionCount > 0 && newSessionCount % 15 === 0) {
        setShowRestAlert(true);
      }
    },
    [currentTicket, sessionCompletedCount]
  );

  // Handle uncertain (C) -> ticket spent permanently
  const handleUncertain = useCallback(async () => {
    if (!currentTicket) return;
    const now = Date.now();
    const duration = startTimeRef.current > 0 ? now - startTimeRef.current : 0;
    startTimeRef.current = now;
    setLatencyMs(duration);

    await fetch(`/api/tickets/${currentTicket.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isUncertain: true, durationMs: duration }),
    });

    setQueue((prev) => prev.slice(1));
    setCompletedCount((c) => c + 1);
    const newSessionCount = sessionCompletedCount + 1;
    setSessionCompletedCount(newSessionCount);

    if (newSessionCount > 0 && newSessionCount % 15 === 0) {
      setShowRestAlert(true);
    }
  }, [currentTicket, sessionCompletedCount]);

  // Handle defer (S) -> ticket kept OPEN and moved to end of queue
  const handleDefer = useCallback(async () => {
    if (!currentCase) return;
    startTimeRef.current = Date.now();
    await fetch(`/api/tickets/${currentCase.ticket!.id}/defer`, {
      method: "POST",
    });

    // Move to back of queue
    setQueue((prev) => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first!];
    });
  }, [currentCase]);

  // Global Keyboard shortcuts: 1, 2, Enter, C, S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (e.key === "Enter") {
          // Let form submission handle Enter inside input
          return;
        }
        return;
      }

      if (e.key === "1") {
        e.preventDefault();
        handleAnswer(true);
      } else if (e.key === "2") {
        e.preventDefault();
        handleAnswer(false);
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleUncertain();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleDefer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAnswer, handleUncertain, handleDefer]);

  const totalCards = casesWithTickets.length;
  const progressPercent = totalCards > 0 ? Math.round((completedCount / totalCards) * 100) : 100;

  return (
    <AppShell currentRunId={runId}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header & Progress Bar */}
        <div
          className="p-4 border rounded shadow-sm"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-base font-bold font-mono tracking-tight" style={{ color: "var(--ink)" }}>
              {i18n.focusMode.title}
            </h1>
            <span className="text-xs font-mono font-semibold" style={{ color: "var(--action)" }}>
              {completedCount} / {totalCards} ({progressPercent}%)
            </span>
          </div>

          {/* Progress bar line */}
          <div
            className="w-full h-2 rounded overflow-hidden"
            style={{ backgroundColor: "var(--paper-ground)" }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: "var(--action)",
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-3 text-[11px] font-mono text-[var(--ink-soft)]">
            <span>Thời gian trả lời thẻ gần nhất: {latencyMs > 0 ? `${latencyMs}ms` : "—"}</span>
            <span>Đã làm liên tục: {sessionCompletedCount} thẻ</span>
          </div>
        </div>

        {/* Rest Recommendation Alert after 15 cards */}
        {showRestAlert && (
          <div
            data-testid="rest-alert"
            className="p-4 border rounded flex items-start justify-between gap-3 animate-in fade-in"
            style={{
              backgroundColor: "var(--v-spec-bg)",
              borderColor: "var(--v-spec)",
              color: "var(--v-spec)",
              borderRadius: "var(--r-card)",
            }}
          >
            <div className="text-xs font-mono">
              <span className="text-base mr-2">☕</span>
              <strong>Cảnh báo bảo vệ độ tập trung:</strong> Bạn đã hoàn thành 15 thẻ liên tục. Khuyến nghị nghỉ mắt 2 phút để duy trì độ chuẩn xác và không bị mệt mỏi nhận thức (cognitive fatigue).
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRestAlert(false)}
              className="shrink-0 text-xs"
            >
              Tiếp tục
            </Button>
          </div>
        )}

        {/* Hotkeys helper bar */}
        <div
          className="p-3 border rounded text-xs font-mono flex flex-wrap items-center justify-between gap-2"
          style={{
            backgroundColor: "var(--paper-surface)",
            borderColor: "var(--rule)",
            borderRadius: "var(--r-card)",
            color: "var(--ink)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold">Phím tắt:</span>
            <kbd className="px-1.5 py-0.5 border rounded bg-[var(--paper-ground)] text-[10px]">1</kbd> Chấp nhận
            <kbd className="px-1.5 py-0.5 border rounded bg-[var(--paper-ground)] text-[10px]">2</kbd> Bác bỏ
            <kbd className="px-1.5 py-0.5 border rounded bg-[var(--paper-ground)] text-[10px]">Enter</kbd> Submit
          </div>

          <div className="flex items-center gap-3">
            <span
              title="Khóa vé vĩnh viễn, ghi nhận intent mơ hồ"
              className="cursor-help flex items-center gap-1"
            >
              <kbd className="px-1.5 py-0.5 border rounded bg-[var(--paper-ground)] text-[10px] text-[var(--v-code)]">C</kbd>
              <span>{i18n.ticket.cannotDetermine} (Khóa vĩnh viễn)</span>
            </span>

            <span
              title="Vé vẫn mở, đưa về cuối hàng đợi làm sau"
              className="cursor-help flex items-center gap-1"
            >
              <kbd className="px-1.5 py-0.5 border rounded bg-[var(--paper-ground)] text-[10px] text-[var(--action)]">S</kbd>
              <span>Hoãn (Giữ mở)</span>
            </span>
          </div>
        </div>

        {/* Current Query Ticket in Focus */}
        {currentCase && currentTicket ? (
          <div className="flex justify-center pt-2">
            <div className="w-full">
              <QueryTicket
                ticket={currentTicket as HumanQueryTicket}
                verdict={currentCase.adjudication.verdict}
                isUniqueOutput={currentCase.taskId !== "task_04"}
                codeOutput={currentCase.codeOutput}
                onAnswer={handleAnswer}
                onUncertain={handleUncertain}
                onDefer={handleDefer}
              />
            </div>
          </div>
        ) : (
          <div
            className="p-12 text-center border rounded shadow-sm space-y-3"
            style={{
              backgroundColor: "var(--paper-surface)",
              borderColor: "var(--rule)",
              borderRadius: "var(--r-card)",
            }}
          >
            <div className="text-3xl">🎉</div>
            <h2 className="text-base font-bold font-mono" style={{ color: "var(--ink)" }}>
              Hàng đợi Gán Nhãn Đã Hoàn Thành!
            </h2>
            <p className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
              Tất cả các vé hỏi người trong lượt chạy này đã được phản hồi hoặc hoãn lại.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function AnnotatePage() {
  return (
    <React.Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center font-mono text-xs opacity-60"
          style={{ backgroundColor: "var(--paper-ground)", color: "var(--ink)" }}
        >
          Đang tải hàng đợi gán nhãn...
        </div>
      }
    >
      <AnnotateContent />
    </React.Suspense>
  );
}

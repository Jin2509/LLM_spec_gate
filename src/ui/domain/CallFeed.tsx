"use client";

import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export type CallStatus =
  | "ACC"
  | "REJ"
  | "UNKNOWN"
  | "PRE_VIOLATION"
  | "CONTRACT_ERROR"
  | "FLAKY";

export interface CallTraceItem {
  id: string;
  caseId: string;
  callIndex: number;
  functionName: string;
  inputPreview: string;
  status: CallStatus;
  timestamp: string;
}

export interface CallFeedProps {
  items: readonly CallTraceItem[];
  selectedCallId?: string;
  onSelectCall: (callId: string, caseId: string) => void;
}

export function CallFeed({
  items,
  selectedCallId,
  onSelectCall,
}: CallFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      role="feed"
      aria-label="Feed lời gọi hàm ảo hóa"
      data-testid="call-feed"
      className="h-full overflow-y-auto select-none border-r"
      style={{
        backgroundColor: "var(--paper-surface)",
        borderColor: "var(--rule)",
      }}
    >
      <div
        className="w-full relative"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          if (!item) return null;

          const isSelected = item.id === selectedCallId;
          const isNeutral =
            item.status === "PRE_VIOLATION" ||
            item.status === "CONTRACT_ERROR" ||
            item.status === "FLAKY";

          let statusBadgeText: string = item.status;
          let badgeBg = "var(--v-neutral-bg)";
          let badgeColor = "var(--v-neutral)";
          let badgeBorder = "1px solid var(--rule)";
          let badgeTooltip = "";

          if (item.status === "ACC") {
            statusBadgeText = "Qua (ACC)";
            badgeBg = "var(--v-acc-bg)";
            badgeColor = "var(--v-acc)";
            badgeBorder = "1px solid var(--v-acc)";
          } else if (item.status === "REJ") {
            statusBadgeText = "Bác (REJ)";
            badgeBg = "var(--v-code-bg)";
            badgeColor = "var(--v-code)";
            badgeBorder = "1px solid var(--v-code)";
          } else if (item.status === "UNKNOWN") {
            statusBadgeText = "Chưa rõ (UND)";
            badgeBg = "transparent";
            badgeColor = "var(--v-unknown)";
            badgeBorder = "1px dashed var(--v-unknown)";
          } else if (isNeutral) {
            badgeTooltip = "Ghi log, không phân xử";
          }

          return (
            <div
              key={item.id}
              onClick={() => onSelectCall(item.id, item.caseId)}
              data-testid={`call-item-${item.id}`}
              className={`absolute top-0 left-0 w-full px-3 py-2 cursor-pointer border-b flex items-center justify-between text-xs font-mono transition-colors ${
                isSelected ? "font-semibold" : "hover:bg-[var(--paper-ground)]/50"
              }`}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                borderColor: "var(--rule)",
                backgroundColor: isSelected ? "var(--paper-ground)" : "transparent",
                borderLeft: isSelected ? "3px solid var(--action)" : "3px solid transparent",
              }}
            >
              <div className="flex flex-col truncate pr-2">
                <span style={{ color: "var(--ink)" }} className="truncate">
                  #{item.callIndex} · {item.functionName}
                </span>
                <span
                  style={{ color: "var(--ink-soft)" }}
                  className="text-[10px] truncate"
                >
                  w: {item.inputPreview}
                </span>
              </div>

              <span
                data-testid={`status-badge-${item.status}`}
                title={badgeTooltip}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0"
                style={{
                  background: badgeBg,
                  color: badgeColor,
                  border: badgeBorder,
                  borderRadius: "var(--r-cell)",
                }}
              >
                {statusBadgeText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

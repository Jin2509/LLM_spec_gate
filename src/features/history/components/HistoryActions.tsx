"use client";

import React from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export function HistoryActions({ onClear }: { onClear: () => void }) {
  return (
    <div className="eval-actions">
      <Link className="eval-button" href={api.runs.exportUrl("csv")}>
        Xuất CSV
      </Link>
      <Link className="eval-button" href={api.runs.exportUrl("json")}>
        Xuất JSON
      </Link>
      <Link className="eval-button" href={api.runs.exportUrl("stats")}>
        Xuất thống kê
      </Link>
      <button className="eval-button" onClick={onClear}>
        Xóa lịch sử
      </button>
    </div>
  );
}

"use client";

import React from "react";
import type { RQData } from "@/lib/api";
import type { LinkedWitness } from "@/reporting/results-data";
import { RQ1Chart, RQ2Chart, RQ3Chart, RQ4Chart, RQ5Chart, RQ6Chart } from "@/ui/reporting/RQCharts";

type OnSelect = (witnesses: ReadonlyArray<LinkedWitness>) => void;

/** Chọn biểu đồ phù hợp theo discriminant `rq` của payload API. */
export function RQChart({ data, onSelectWitnesses }: { data: RQData; onSelectWitnesses: OnSelect }) {
  switch (data.rq) {
    case "rq1":
      return <RQ1Chart data={data} onSelectWitnesses={onSelectWitnesses} />;
    case "rq2":
      return <RQ2Chart data={data} onSelectWitnesses={onSelectWitnesses} />;
    case "rq3":
      return <RQ3Chart data={data} onSelectWitnesses={onSelectWitnesses} />;
    case "rq4":
      return <RQ4Chart data={data} onSelectWitnesses={onSelectWitnesses} />;
    case "rq5":
      return <RQ5Chart data={data} onSelectWitnesses={onSelectWitnesses} />;
    case "rq6":
      return <RQ6Chart data={data} onSelectWitnesses={onSelectWitnesses} />;
  }
}

/** Dữ liệu thô dùng cho xuất JSON/CSV/LaTeX trong ChartContainer. */
export function rawDataOf(data: RQData): unknown {
  switch (data.rq) {
    case "rq1":
      return data.categories;
    case "rq2":
      return data.confusionMatrix;
    case "rq3":
    case "rq4":
      return data.cells;
    case "rq5":
      return data.suite;
    case "rq6":
      return data.strategies;
  }
}

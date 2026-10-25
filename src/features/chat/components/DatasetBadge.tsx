import React from "react";
import type { DatasetSummary } from "@/lib/api";

export function DatasetBadge({ dataset }: { dataset?: Pick<DatasetSummary, "name" | "version"> }) {
  if (!dataset) return <span className="dataset-badge">—</span>;
  return (
    <span className="dataset-badge">
      {dataset.name} · {dataset.version}
    </span>
  );
}

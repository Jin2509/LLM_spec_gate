"use client";

import React, { useEffect } from "react";
import type { DatasetSummary } from "@/lib/api";
import { i18n } from "@/i18n/vi";

export interface AdvancedDrawerProps {
  open: boolean;
  datasets: readonly DatasetSummary[];
  datasetId?: string;
  onDataset: (id: string) => void;
  onClose: () => void;
}

export function AdvancedDrawer({ open, datasets, datasetId, onDataset, onClose }: AdvancedDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <section className="advanced-drawer" role="dialog" aria-modal="true" aria-label={i18n.chat.advanced} onMouseDown={(e) => e.stopPropagation()}>
        <div className="panel-heading">
          <h2>{i18n.chat.advanced}</h2>
          <button className="text-button" onClick={onClose}>
            {i18n.chat.close}
          </button>
        </div>
        <label className="field-label" htmlFor="advanced-dataset">
          {i18n.chat.dataset}
        </label>
        <select id="advanced-dataset" value={datasetId ?? ""} onChange={(e) => onDataset(e.target.value)}>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} · {d.version}
            </option>
          ))}
        </select>
        <p className="warning-note">{i18n.chat.datasetWarning}</p>
      </section>
    </div>
  );
}

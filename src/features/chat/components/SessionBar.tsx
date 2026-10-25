"use client";

import React from "react";
import { i18n } from "@/i18n/vi";
import Link from "next/link";
import type { DatasetSummary } from "@/lib/api";
import { DatasetBadge } from "./DatasetBadge";

export interface SessionBarProps {
  dataset?: DatasetSummary;
  runId: string;
  finished: boolean;
  activeStep: number;
  showResult: boolean;
  onAdvanced: () => void;
  onNew: () => void;
  onShowResult: () => void;
}

export function SessionBar({ dataset, runId, finished, activeStep, showResult, onAdvanced, onNew, onShowResult }: SessionBarProps) {
  return (
    <header className="session-bar">
      <div>
        <strong>{i18n.chat.title}</strong>
        <div className="session-meta">
          <DatasetBadge dataset={dataset} />
          <span className="mono">{runId}</span>
        </div>
        <ol className="flow-steps" aria-label={i18n.chat.flowLabel}>
          {i18n.chat.flowSteps.map((step, index) => (
            <li key={`step-${index}`} aria-current={index + 1 === activeStep ? "step" : undefined}>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <nav className="session-actions">
        <Link className="text-button" href="/">
          {i18n.chat.navCheck}
        </Link>
        <Link className="text-button" href="/history">
          {i18n.chat.navHistory}
        </Link>
        <Link className="text-button" href="/stats">
          {i18n.chat.navStats}
        </Link>
        {!showResult && (
          <button className="text-button" onClick={onShowResult}>
            {i18n.chat.showResult}
          </button>
        )}
        <button className="text-button" onClick={onAdvanced}>
          {i18n.chat.advanced}
        </button>
        {finished && (
          <button className="primary-button" onClick={onNew}>
            {i18n.chat.newSession}
          </button>
        )}
      </nav>
    </header>
  );
}

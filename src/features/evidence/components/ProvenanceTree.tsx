"use client";

import React from "react";
import type { MetamorphicAnchorNode } from "@/lib/api/types";
import { formatValue } from "@/features/evidence/format";

export interface ProvenanceTreeProps {
  rootNode: MetamorphicAnchorNode;
}

function RenderNode({ node, level = 0 }: { node: MetamorphicAnchorNode; level?: number }) {
  return (
    <div className="flex flex-col gap-2 relative">
      <div
        data-testid={`provenance-node-${node.id}`}
        className="p-3 rounded-[var(--radius-sm)] border text-[13px] flex flex-col gap-1 transition-shadow"
        style={{
          marginLeft: `${level * 24}px`,
          backgroundColor: node.origin === "gốc" ? "var(--bg-elevated)" : "var(--bg-sunken)",
          borderColor: node.origin === "gốc" ? "var(--accent-line)" : "var(--border-subtle)",
          borderWidth: node.origin === "gốc" ? "1.5px" : "1px",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
              style={{
                backgroundColor: node.origin === "gốc" ? "var(--accent)" : "var(--bg-elevated)",
                color: node.origin === "gốc" ? "var(--on-accent)" : "var(--ink-soft)",
                border: "1px solid var(--rule)",
              }}
            >
              {node.origin}
            </span>
            <span className="font-semibold" style={{ color: "var(--ink)" }}>
              {node.id}
            </span>
          </div>

          {node.metamorphicRelation && (
            <span
              className="text-[11px] px-2 py-0.5 rounded font-mono"
              style={{
                backgroundColor: "var(--v-neutral-bg)",
                color: "var(--v-neutral)",
                border: "1px dashed var(--rule)",
              }}
            >
              {node.metamorphicRelation}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] mt-1" style={{ color: "var(--ink)" }}>
          <div>
            <span style={{ color: "var(--ink-soft)" }}>Đầu vào: </span>
            <code>{formatValue(node.input)}</code>
          </div>
          <div>
            <span style={{ color: "var(--ink-soft)" }}>Đầu ra đúng: </span>
            <code>{formatValue(node.expectedOutput)}</code>
          </div>
        </div>
      </div>

      {node.children && node.children.length > 0 && (
        <div className="flex flex-col gap-2 pl-4 border-l ml-6" style={{ borderColor: "var(--rule)" }}>
          {node.children.map((child) => (
            <RenderNode key={child.id} node={child} level={0} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProvenanceTree({ rootNode }: ProvenanceTreeProps) {
  return (
    <div
      data-testid="provenance-tree"
      className="p-5 rounded-[var(--radius-md)] border flex flex-col gap-3"
      style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}
    >
      <RenderNode node={rootNode} level={0} />
    </div>
  );
}

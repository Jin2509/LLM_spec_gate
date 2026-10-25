"use client";

import React from "react";
import type { MetamorphicAnchorNode } from "@/lib/api/types";

export interface ProvenanceTreeProps {
  rootNode: MetamorphicAnchorNode;
}

function RenderNode({ node, level = 0 }: { node: MetamorphicAnchorNode; level?: number }) {
  return (
    <div className="flex flex-col gap-2 relative">
      <div
        data-testid={`provenance-node-${node.id}`}
        className="p-3 rounded border font-mono text-xs flex flex-col gap-1 transition-shadow"
        style={{
          marginLeft: `${level * 24}px`,
          backgroundColor: node.origin === "gốc" ? "var(--paper-surface)" : "var(--paper-ground)",
          borderColor: node.origin === "gốc" ? "var(--action)" : "var(--rule)",
          borderWidth: node.origin === "gốc" ? "1.5px" : "1px",
          borderRadius: "var(--r-cell)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
              style={{
                backgroundColor: node.origin === "gốc" ? "var(--action)" : "var(--paper-ground)",
                color: node.origin === "gốc" ? "var(--paper-surface)" : "var(--ink-soft)",
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
            <span style={{ color: "var(--ink-soft)" }}>Input w: </span>
            <code>{JSON.stringify(node.input)}</code>
          </div>
          <div>
            <span style={{ color: "var(--ink-soft)" }}>Output e(w): </span>
            <code>{JSON.stringify(node.expectedOutput)}</code>
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
      className="p-4 rounded border flex flex-col gap-3 font-sans"
      style={{
        backgroundColor: "var(--paper-surface)",
        borderColor: "var(--rule)",
        borderRadius: "var(--r-card)",
      }}
    >
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--rule)" }}>
        <div>
          <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--action)" }}>
            Cây phả hệ Bằng chứng Hình thức
          </span>
          <h3 className="text-sm font-semibold m-0" style={{ color: "var(--ink)" }}>
            Metamorphic Relations (MR) Anchor Closure
          </h3>
        </div>
        <span className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
          Bao đóng qua quan hệ biến đổi
        </span>
      </div>

      <div className="pt-2">
        <RenderNode node={rootNode} level={0} />
      </div>
    </div>
  );
}

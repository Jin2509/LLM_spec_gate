/**
 * src/mock/fixtures/evidence-store.ts — Formal Evidence Store Fixtures
 *
 * Provides data records for the 4 core tabs:
 *   - G (Grounded Good Traces)
 *   - B (Grounded Bad Traces)
 *   - B_synth (Mutant Traces)
 *   - Anchor & Metamorphic Closure (MR trees)
 * Plus the "Nợ spec" (Spec Debt) tab.
 * Invariant Checker: G ∩ B = ∅
 */
import type { ProvenanceSource, AdvisorySource } from "@/core/types";

export interface EvidenceRecord {
  readonly id: string;
  readonly taskId: string;
  readonly kind: "expected_output" | "property" | "rejection";
  readonly source: ProvenanceSource | AdvisorySource;
  readonly input: unknown;
  readonly output: unknown;
  readonly verdict: "ACC" | "REJ";
  readonly timestamp: string;
  readonly notes?: string;
}

export interface BSynthRecord {
  readonly id: string;
  readonly taskId: string;
  readonly mutationType: "boundary_shift" | "type_perturbation" | "extreme_value" | "null_injection";
  readonly input: unknown;
  readonly mutantOutput: unknown;
  readonly isCaughtByP0: boolean;
  readonly timestamp: string;
}

export interface MetamorphicAnchorNode {
  readonly id: string;
  readonly taskId: string;
  readonly input: unknown;
  readonly expectedOutput: unknown;
  readonly origin: "gốc" | "dẫn xuất";
  readonly parentId?: string;
  readonly metamorphicRelation?: string; // e.g. "MR_permutation", "MR_shift"
  readonly children: ReadonlyArray<MetamorphicAnchorNode>;
}

export interface SpecDebtItem {
  readonly id: string;
  readonly taskId: string;
  readonly witness: unknown;
  readonly debtType: "unresolved_advisory" | "missing_a2_anchor" | "weak_precondition" | "open_ticket";
  readonly title: string;
  readonly description: string;
  readonly severity: "high" | "medium" | "low";
  readonly recordedAt: string;
}

// ── 1. Good Traces (G) ───────────────────────────────────────────────────────
export const MOCK_GOOD_EVIDENCE: ReadonlyArray<EvidenceRecord> = [
  {
    id: "g_ev_01",
    taskId: "task_01",
    kind: "expected_output",
    source: "docstring_anchor",
    input: [5, 3, 2, 8],
    output: [2, 3, 5, 8],
    verdict: "ACC",
    timestamp: "2026-10-12T10:14:02Z",
    notes: "Anchor docstring gốc: sắp xếp mảng các phần tử tại vị trí chẵn.",
  },
  {
    id: "g_ev_02",
    taskId: "task_01",
    kind: "expected_output",
    source: "differential_a3",
    input: [10, 4, 1, 9],
    output: [1, 4, 10, 9],
    verdict: "ACC",
    timestamp: "2026-10-12T10:14:15Z",
    notes: "Đồng thuận từ 3 engine đối chứng độc lập.",
  },
  {
    id: "g_ev_03",
    taskId: "task_04",
    kind: "property",
    source: "verified_mr",
    input: [1, 5, 11, 5],
    output: [[1, 5, 5], [11]],
    verdict: "ACC",
    timestamp: "2026-10-12T10:15:30Z",
    notes: "Phân chia tập hợp thỏa mãn tổng 2 tập con bằng nhau.",
  },
  {
    id: "g_ev_04",
    taskId: "task_12",
    kind: "expected_output",
    source: "differential_a3",
    input: [24, 18],
    output: 6,
    verdict: "ACC",
    timestamp: "2026-10-12T10:16:45Z",
    notes: "Ước chung lớn nhất gcd(24, 18) = 6.",
  },
];

// ── 2. Bad Traces (B) ────────────────────────────────────────────────────────
export const MOCK_BAD_EVIDENCE: ReadonlyArray<EvidenceRecord> = [
  {
    id: "b_ev_01",
    taskId: "task_12",
    kind: "rejection",
    source: "differential_a3",
    input: [24, 18],
    output: 12,
    verdict: "REJ",
    timestamp: "2026-10-12T10:17:10Z",
    notes: "12 không phải ước chung lớn nhất (18 % 12 != 0).",
  },
  {
    id: "b_ev_02",
    taskId: "task_01",
    kind: "rejection",
    source: "unverified_pbt",
    input: [5, 3, 2, 8],
    output: [8, 5, 3, 2],
    verdict: "REJ",
    timestamp: "2026-10-12T10:18:20Z",
    notes: "Đầu ra đảo ngược sai hoàn toàn đặc tả.",
  },
  {
    id: "b_ev_03",
    taskId: "task_04",
    kind: "rejection",
    source: "verified_mr",
    input: [1, 5, 11, 5],
    output: [[1, 5], [11, 5]],
    verdict: "REJ",
    timestamp: "2026-10-12T10:19:00Z",
    notes: "Tổng 6 != 16, phân chia vi phạm bất đẳng thức.",
  },
];

// ── 3. Synthesized Mutants (B_synth) ─────────────────────────────────────────
export const MOCK_BSYNTH_EVIDENCE: ReadonlyArray<BSynthRecord> = [
  {
    id: "bsynth_01",
    taskId: "task_01",
    mutationType: "extreme_value",
    input: [1000000, -999999],
    mutantOutput: [0, 0],
    isCaughtByP0: true,
    timestamp: "2026-10-12T10:20:00Z",
  },
  {
    id: "bsynth_02",
    taskId: "task_01",
    mutationType: "boundary_shift",
    input: [0, 0, 0, 0],
    mutantOutput: [0, 1, 0, 0],
    isCaughtByP0: false, // 1 ca lọt qua P0 (slack)
    timestamp: "2026-10-12T10:20:12Z",
  },
  {
    id: "bsynth_03",
    taskId: "task_12",
    mutationType: "type_perturbation",
    input: [100, 25],
    mutantOutput: 50,
    isCaughtByP0: true,
    timestamp: "2026-10-12T10:21:40Z",
  },
];

// ── 4. Metamorphic Relations Tree & Closure ──────────────────────────────────
export const MOCK_METAMORPHIC_TREE: MetamorphicAnchorNode = {
  id: "anchor_root_01",
  taskId: "task_01",
  input: [5, 3, 2, 8],
  expectedOutput: [2, 3, 5, 8],
  origin: "gốc",
  children: [
    {
      id: "anchor_mr_shift",
      taskId: "task_01",
      input: [15, 3, 12, 8], // Cộng 10 vào phần tử vị trí chẵn
      expectedOutput: [12, 3, 15, 8],
      origin: "dẫn xuất",
      parentId: "anchor_root_01",
      metamorphicRelation: "MR_even_shift (+10)",
      children: [
        {
          id: "anchor_mr_scale",
          taskId: "task_01",
          input: [30, 3, 24, 8], // Nhân đôi phần tử vị trí chẵn
          expectedOutput: [24, 3, 30, 8],
          origin: "dẫn xuất",
          parentId: "anchor_mr_shift",
          metamorphicRelation: "MR_even_scale (*2)",
          children: [],
        },
      ],
    },
    {
      id: "anchor_mr_odd_permute",
      taskId: "task_01",
      input: [5, 8, 2, 3], // Đảo các phần tử vị trí lẻ
      expectedOutput: [2, 8, 5, 3],
      origin: "dẫn xuất",
      parentId: "anchor_root_01",
      metamorphicRelation: "MR_odd_invariance (giữ nguyên vị trí chẵn)",
      children: [],
    },
  ],
};

// ── 5. Spec Debt ("Nợ spec") ────────────────────────────────────────────────
export const MOCK_SPEC_DEBT: ReadonlyArray<SpecDebtItem> = [
  {
    id: "debt_01",
    taskId: "task_01",
    witness: [9, 1, 4, 2],
    debtType: "weak_precondition",
    title: "Monitor P0 quá chặt với dãy có độ dài chẵn",
    description: "Đặc tả P0 giả định toàn bộ mảng được sắp xếp, vi phạm với bài toán chỉ sắp xếp các chỉ số chẵn.",
    severity: "high",
    recordedAt: "2026-10-12T10:22:00Z",
  },
  {
    id: "debt_02",
    taskId: "task_04",
    witness: [1, 5, 11, 5],
    debtType: "missing_a2_anchor",
    title: "Thiếu quan hệ biến đổi MR cho thứ tự tập con",
    description: "Chưa có quy tắc chính quy hóa tính giao hoán giữa 2 tập con trong bài toán chia mảng.",
    severity: "medium",
    recordedAt: "2026-10-12T10:22:30Z",
  },
  {
    id: "debt_03",
    taskId: "task_08",
    witness: "None",
    debtType: "unresolved_advisory",
    title: "Chỉ có bằng chứng advisory từ LLM, chưa được grounding",
    description: "LLM phát hiện tiềm ẩn lỗi tràn số nhưng chưa có witness cụ thể kiểm chứng qua formal solver.",
    severity: "low",
    recordedAt: "2026-10-12T10:23:10Z",
  },
];

// ── Invariant Checker: G ∩ B = ∅ ─────────────────────────────────────────────
export function checkEvidenceDisjointness(
  gList: ReadonlyArray<EvidenceRecord>,
  bList: ReadonlyArray<EvidenceRecord>
): {
  readonly holds: boolean;
  readonly intersectionCount: number;
  readonly violatingKeys: ReadonlyArray<string>;
} {
  const gKeys = new Set(
    gList.map((g) => `${g.taskId}:${JSON.stringify(g.input)}->${JSON.stringify(g.output)}`)
  );

  const violations: string[] = [];
  for (const b of bList) {
    const key = `${b.taskId}:${JSON.stringify(b.input)}->${JSON.stringify(b.output)}`;
    if (gKeys.has(key)) {
      violations.push(key);
    }
  }

  return {
    holds: violations.length === 0,
    intersectionCount: violations.length,
    violatingKeys: violations,
  };
}

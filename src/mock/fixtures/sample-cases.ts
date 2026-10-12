/**
 * src/mock/fixtures/sample-cases.ts — Deterministic Sample Cases
 *
 * Full case dossiers covering every paper verdict:
 *   - SPEC_FAULT (R2)
 *   - CODE_FAULT (R5)
 *   - DUAL_FAULT (R3)
 *   - UNKNOWN_EVIDENCE (R6)
 *   - UNKNOWN_CONFLICT (R1)
 *   - UNKNOWN_GATE
 */
import type { CaseDossier } from "@/core/types";

export const SAMPLE_CASES: Record<string, CaseDossier> = {
  case_spec_fault: {
    id: "case_spec_fault",
    taskId: "task_01",
    witness: [5, 3, 2, 8],
    codeOutput: [2, 3, 5, 8],
    specP0: "def monitor(w, ret):\n    assert ret == sorted(w)  # BUG: monitor assumes ALL elements sorted, not just even indices!",
    monitorRejectionClause: "ret == sorted(w)",
    currentMonitorVersion: "P_0",
    groundedEvidence: [
      {
        id: "ev_doc_1",
        isGrounded: true,
        kind: "expected_output",
        source: "docstring_anchor",
        input: [5, 3, 2, 8],
        expected: [2, 3, 5, 8],
      },
    ],
    advisoryEvidence: [
      {
        id: "ev_llm_1",
        isGrounded: false,
        source: "llm_interpreter",
        note: "không vào aggregator",
        content: "LLM suggests monitor P0 is over-constraining the odd index elements.",
      },
    ],
    adjudication: {
      verdict: "SPEC_FAULT",
      matchedRule: "R2",
      skippedRules: [
        { rule: "R1", reason: "Chỉ có 1 nguồn grounded, không có mâu thuẫn" },
      ],
      expectedOutput: [2, 3, 5, 8],
      explanation: "Code trả về đúng e(w), nhưng monitor P0 bác bỏ e(w). Đặc tả quá chặt tại w.",
    },
    repairCandidate: {
      id: "rep_spec_1",
      family: "case_exception",
      guard: "len(w) == 4",
      replacement: "ret[0] <= ret[2] and ret[1] == w[1] and ret[3] == w[3]",
      targetExpectedOutput: [2, 3, 5, 8],
      rank: 1,
      diffPreview: "sorted(w) -> (ret[0] <= ret[2])",
    },
    gateResult: {
      passed: true,
      checks: {
        g1_accept_grounded: true,
        g2_reject_b: true,
        g3_locality: true,
        g4_preserve_g_a2: true,
        g5_in_repair_space_and_bsynth: true,
      },
      guaranteeNature: "structural",
      message: "Vượt qua Gate fail-closed (SAMPLED). Đủ điều kiện thay monitor.",
    },
  },

  case_code_fault: {
    id: "case_code_fault",
    taskId: "task_12",
    witness: [24, 18],
    codeOutput: 12, // Bug in code! gcd(24, 18) is 6, not 12
    specP0: "def monitor(w, ret):\n    a, b = w\n    assert a % ret == 0 and b % ret == 0 and is_greatest(ret, a, b)",
    currentMonitorVersion: "P_0",
    groundedEvidence: [
      {
        id: "ev_a3_gcd",
        isGrounded: true,
        kind: "expected_output",
        source: "differential_a3",
        input: [24, 18],
        expected: 6,
      },
    ],
    advisoryEvidence: [],
    adjudication: {
      verdict: "CODE_FAULT",
      matchedRule: "R5",
      skippedRules: [
        { rule: "R1", reason: "Không có mâu thuẫn grounded" },
        { rule: "R2", reason: "Code không khớp e(w) (12 ≠ 6)" },
        { rule: "R3", reason: "P0 không bác bỏ e(w)=6" },
      ],
      expectedOutput: 6,
      explanation: "Code trả về 12 thay vì 6. Monitor P0 chấp nhận e(w)=6. Lỗi thuộc về code.",
    },
  },

  case_dual_fault: {
    id: "case_dual_fault",
    taskId: "task_02",
    witness: 100,
    codeOutput: 2.718, // Code mistakenly computed Euler's number instead of Pi
    specP0: "def monitor(w, ret):\n    assert ret > 3.5  # Spec mistakenly demanded > 3.5 instead of ~3.14",
    currentMonitorVersion: "P_0",
    groundedEvidence: [
      {
        id: "ev_doc_pi",
        isGrounded: true,
        kind: "expected_output",
        source: "docstring_anchor",
        input: 100,
        expected: 3.13159,
        epsilon: 1e-2,
      },
    ],
    advisoryEvidence: [],
    adjudication: {
      verdict: "DUAL_FAULT",
      matchedRule: "R3",
      skippedRules: [
        { rule: "R1", reason: "Không có mâu thuẫn grounded" },
        { rule: "R2", reason: "Code trả về 2.718 không khớp Pi" },
      ],
      expectedOutput: 3.13159,
      explanation: "Cả hai cùng sai: code trả về sai (2.718) và spec P0 cũng bác bỏ giá trị đúng của Pi.",
    },
  },

  case_und_evidence: {
    id: "case_und_evidence",
    taskId: "task_10",
    witness: [1.2, 4.5, 7.8],
    codeOutput: [[1.2], [4.5, 7.8]],
    specP0: "def monitor(w, ret):\n    assert sum(len(c) for c in ret) == len(w)",
    currentMonitorVersion: "P_0",
    groundedEvidence: [], // No grounded evidence!
    advisoryEvidence: [
      {
        id: "ev_adv_1",
        isGrounded: false,
        source: "llm_interpreter",
        note: "không vào aggregator",
        content: "LLM heuristic cluster appears plausible.",
      },
    ],
    adjudication: {
      verdict: "UNKNOWN_EVIDENCE",
      matchedRule: "R6",
      skippedRules: [
        { rule: "R1", reason: "Không có bằng chứng để mâu thuẫn" },
      ],
      explanation: "Không có bằng chứng grounded nào tại witness w. Hệ thống đứng ngoài thay vì đoán.",
    },
    ticket: {
      id: "ticket_und_ev_1",
      caseId: "case_und_evidence",
      witness: [1.2, 4.5, 7.8],
      codeOutput: [[1.2], [4.5, 7.8]],
      status: "open",
      questionType: "acceptability",
      promptText: "Phân cụm [[1.2], [4.5, 7.8]] có chấp nhận được cho dữ liệu [1.2, 4.5, 7.8] không?",
    },
  },

  case_und_conflict: {
    id: "case_und_conflict",
    taskId: "task_04",
    witness: [1, 5, 11, 5],
    codeOutput: [[1, 5, 5], [11]],
    specP0: "def monitor(w, ret):\n    assert sum(ret[0]) == sum(ret[1])",
    currentMonitorVersion: "P_0",
    groundedEvidence: [
      {
        id: "ev_a3_part1",
        isGrounded: true,
        kind: "expected_output",
        source: "differential_a3",
        input: [1, 5, 11, 5],
        expected: [[1, 5, 5], [11]], // sum 11 == 11
      },
      {
        id: "ev_verified_mr",
        isGrounded: true,
        kind: "expected_output",
        source: "verified_mr",
        input: [1, 5, 11, 5],
        expected: [[11], [1, 5, 5]], // inverted subset order
      },
    ],
    advisoryEvidence: [],
    adjudication: {
      verdict: "UNKNOWN_CONFLICT",
      matchedRule: "R1",
      skippedRules: [],
      explanation: "Hai nguồn grounded (A3 và verified MR) đưa ra hai biểu diễn tập hợp khác nhau về thứ tự.",
    },
    ticket: {
      id: "ticket_conflict_1",
      caseId: "case_und_conflict",
      witness: [1, 5, 11, 5],
      codeOutput: [[1, 5, 5], [11]],
      status: "open",
      questionType: "acceptability",
      promptText: "Mâu thuẫn nguồn: Kết quả phân chia [[1, 5, 5], [11]] có hợp lệ không?",
    },
  },

  case_und_gate: {
    id: "case_und_gate",
    taskId: "task_01",
    witness: [9, 1, 4, 2],
    codeOutput: [4, 1, 9, 2],
    specP0: "def monitor(w, ret):\n    assert ret == sorted(w)",
    currentMonitorVersion: "P_0",
    groundedEvidence: [
      {
        id: "ev_doc_gate",
        isGrounded: true,
        kind: "expected_output",
        source: "docstring_anchor",
        input: [9, 1, 4, 2],
        expected: [4, 1, 9, 2],
      },
    ],
    advisoryEvidence: [],
    adjudication: {
      verdict: "UNKNOWN_GATE",
      matchedRule: "R2",
      skippedRules: [],
      expectedOutput: [4, 1, 9, 2],
      explanation: "Quy tắc R2 xác định SPEC_FAULT nhưng ứng viên repair bị Gate chặn vì vi phạm Locality.",
    },
    gateResult: {
      passed: false,
      checks: {
        g1_accept_grounded: true,
        g2_reject_b: true,
        g3_locality: false, // Locality failed!
        g4_preserve_g_a2: false,
        g5_in_repair_space_and_bsynth: false,
      },
      firstFailedCheck: "G3: Locality",
      unknownGateReason: "rejected_by_gate",
      guaranteeNature: "structural",
      message: "Cổng Gate chặn: Ứng viên sửa đổi làm thay đổi hành vi ngoài vùng điều kiện g.",
    },
  },
};

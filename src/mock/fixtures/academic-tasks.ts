/**
 * src/mock/fixtures/academic-tasks.ts — 12 Illustrative Academic Tasks
 *
 * Requirements (Playbook S3):
 *   12 deterministic tasks covering:
 *   - unique output vs non-unique output (kèm người gán assignedBy)
 *   - anchor gốc / dẫn xuất (anchorOrigin)
 *   - float with epsilon tolerance
 *   - nested list / matrix
 *   - multiline string
 *   - other type (custom repr)
 *   - task with A2 formalization
 *   - task with A3 differential reference
 *   - task with A0 (no anchor)
 *   - badge "B_synth tắt" when isBSynthSupported === false
 */
import type { AcademicTask } from "@/core/types";

export type { AcademicTask };

export const ACADEMIC_TASKS: readonly AcademicTask[] = [
  {
    id: "task_01",
    name: "sort_even_indices",
    intentDocstring: "Sort only elements at even indices in list, leaving odd indices unchanged.",
    outputType: "list",
    isUniqueOutput: true,
    assignedBy: "ann_mai_01",
    anchorOrigin: "gốc",
    hasA2: false,
    hasA3: true,
    anchorLevel: "A3",
    isBSynthSupported: true,
  },
  {
    id: "task_02",
    name: "approximate_pi_leibniz",
    intentDocstring: "Calculate approximation of Pi using n iterations of Leibniz series.",
    outputType: "float",
    isUniqueOutput: true,
    assignedBy: "ann_jin_02",
    anchorOrigin: "gốc",
    epsilon: 1e-4,
    hasA2: false,
    hasA3: true,
    anchorLevel: "A1",
    isBSynthSupported: true,
  },
  {
    id: "task_03",
    name: "format_markdown_table",
    intentDocstring: "Formats header and rows into aligned multiline markdown table string.",
    outputType: "str",
    isUniqueOutput: true,
    assignedBy: "ann_mai_01",
    anchorOrigin: "gốc",
    hasA2: false,
    hasA3: false,
    anchorLevel: "A1",
    isBSynthSupported: true,
  },
  {
    id: "task_04",
    name: "find_valid_partition",
    intentDocstring: "Find any valid partition of numbers into two subsets with equal sum.",
    outputType: "list",
    isUniqueOutput: false, // Non-unique output: multiple valid partitions exist
    assignedBy: "ann_expert_03",
    anchorOrigin: "dẫn xuất",
    hasA2: true,
    hasA3: false,
    anchorLevel: "A2",
    isBSynthSupported: true,
  },
  {
    id: "task_05",
    name: "matrix_determinant_3x3",
    intentDocstring: "Computes determinant of a 3x3 nested list matrix.",
    outputType: "float",
    isUniqueOutput: true,
    assignedBy: "ann_jin_02",
    anchorOrigin: "gốc",
    epsilon: 1e-6,
    hasA2: true,
    hasA3: true,
    anchorLevel: "A3",
    isBSynthSupported: true,
  },
  {
    id: "task_06",
    name: "parse_custom_ast_node",
    intentDocstring: "Parses expression into custom AST TreeNode structure.",
    outputType: "other", // Unsupported for B_synth
    isUniqueOutput: true,
    assignedBy: "ann_expert_03",
    anchorOrigin: "dẫn xuất",
    hasA2: false,
    hasA3: false,
    anchorLevel: "A1",
    isBSynthSupported: false, // Badge "B_synth tắt"
  },
  {
    id: "task_07",
    name: "prime_factorization",
    intentDocstring: "Return sorted list of prime factors for positive integer n.",
    outputType: "list",
    isUniqueOutput: true,
    assignedBy: "ann_mai_01",
    anchorOrigin: "gốc",
    hasA2: true,
    hasA3: true,
    anchorLevel: "A2",
    isBSynthSupported: true,
  },
  {
    id: "task_08",
    name: "is_valid_utf8_sequence",
    intentDocstring: "Validates whether byte array represents valid UTF-8 sequence.",
    outputType: "bool",
    isUniqueOutput: true,
    assignedBy: "ann_expert_03",
    anchorOrigin: "gốc",
    hasA2: true,
    hasA3: false,
    anchorLevel: "A2",
    isBSynthSupported: true,
  },
  {
    id: "task_09",
    name: "find_any_hamiltonian_path",
    intentDocstring: "Find any Hamiltonian path in graph if one exists, else None.",
    outputType: "list",
    isUniqueOutput: false, // Non-unique output
    assignedBy: "ann_jin_02",
    anchorOrigin: "dẫn xuất",
    hasA2: true,
    hasA3: true,
    anchorLevel: "A3",
    isBSynthSupported: true,
  },
  {
    id: "task_10",
    name: "parse_raw_byte_stream",
    intentDocstring: "Parses binary protocol frame from low-level buffer.",
    outputType: "other",
    isUniqueOutput: true,
    assignedBy: "ann_expert_03",
    anchorOrigin: "gốc",
    hasA2: false,
    hasA3: false,
    anchorLevel: "A0", // No anchor
    isBSynthSupported: false, // Badge "B_synth tắt"
  },
  {
    id: "task_11",
    name: "longest_common_subsequence",
    intentDocstring: "Find any longest common subsequence string between two input strings.",
    outputType: "str",
    isUniqueOutput: false, // Non-unique (multiple LCS strings can have same max length)
    assignedBy: "ann_mai_01",
    anchorOrigin: "gốc",
    hasA2: true,
    hasA3: true,
    anchorLevel: "A2",
    isBSynthSupported: true,
  },
  {
    id: "task_12",
    name: "calculate_running_variance",
    intentDocstring: "Calculates numerically stable running variance using Welford algorithm.",
    outputType: "float",
    isUniqueOutput: true,
    assignedBy: "ann_jin_02",
    anchorOrigin: "gốc",
    epsilon: 1e-5,
    hasA2: false,
    hasA3: true,
    anchorLevel: "A3",
    isBSynthSupported: true,
  },
];

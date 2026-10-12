/**
 * src/mock/fixtures/academic-tasks.ts — 12 Illustrative Academic Tasks
 *
 * Requirements (Playbook S3):
 *   12 deterministic tasks covering:
 *   - unique output vs non-unique output
 *   - float with epsilon tolerance
 *   - nested list / matrix
 *   - multiline string
 *   - other type (custom repr)
 *   - task with A2 formalization
 *   - task with A3 differential reference
 *   - task with A0 (no anchor)
 */

export interface AcademicTask {
  id: string;
  name: string;
  intentDocstring: string;
  outputType: "int" | "bool" | "str" | "float" | "list" | "tuple" | "other";
  isUniqueOutput: boolean;
  epsilon?: number;
  hasA2: boolean;
  hasA3: boolean;
  anchorLevel: "A0" | "A1" | "A2" | "A3";
  isBSynthSupported: boolean;
}

export const ACADEMIC_TASKS: readonly AcademicTask[] = [
  {
    id: "task_01",
    name: "sort_even_indices",
    intentDocstring: "Sort only elements at even indices in list, leaving odd indices unchanged.",
    outputType: "list",
    isUniqueOutput: true,
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
    hasA2: false,
    hasA3: false,
    anchorLevel: "A1",
    isBSynthSupported: false,
  },
  {
    id: "task_07",
    name: "prime_factorization",
    intentDocstring: "Return sorted list of prime factors for positive integer n.",
    outputType: "list",
    isUniqueOutput: true,
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
    hasA2: true,
    hasA3: false,
    anchorLevel: "A2",
    isBSynthSupported: true,
  },
  {
    id: "task_09",
    name: "word_frequency_tuple",
    intentDocstring: "Count top frequent words, returning tuple of (word, count) pairs.",
    outputType: "tuple",
    isUniqueOutput: true,
    hasA2: false,
    hasA3: true,
    anchorLevel: "A3",
    isBSynthSupported: true,
  },
  {
    id: "task_10",
    name: "unanchored_heuristic_cluster",
    intentDocstring: "Clusters 1D points based on nearest distance with no ground-truth docstring anchor.",
    outputType: "list",
    isUniqueOutput: false,
    hasA2: false,
    hasA3: false,
    anchorLevel: "A0", // No anchors at all
    isBSynthSupported: true,
  },
  {
    id: "task_11",
    name: "shortest_path_dijkstra",
    intentDocstring: "Returns any valid shortest path between source and target.",
    outputType: "list",
    isUniqueOutput: false, // multiple shortest paths possible
    hasA2: true,
    hasA3: true,
    anchorLevel: "A3",
    isBSynthSupported: true,
  },
  {
    id: "task_12",
    name: "euclidean_gcd",
    intentDocstring: "Calculate greatest common divisor of two integers a and b.",
    outputType: "int",
    isUniqueOutput: true,
    hasA2: true,
    hasA3: true,
    anchorLevel: "A2",
    isBSynthSupported: true,
  },
] as const;

/**
 * src/core/schema.ts — Zod schema cho dữ liệu backend trả về mà UI còn dùng:
 * nhãn phán quyết, nguồn bằng chứng (trang Bằng chứng) và tác vụ của dataset (trang Hỏi đáp).
 */
import { z } from "zod";

// ── Verdict & nguồn bằng chứng ────────────────────────────────────────────
export const VerdictSchema = z.enum([
  "ACC",
  "SPEC_FAULT",
  "CODE_FAULT",
  "DUAL_FAULT",
  "UNKNOWN_EVIDENCE",
  "UNKNOWN_CONFLICT",
  "UNKNOWN_GATE",
  "NEUTRAL",
]);

export const ProvenanceSourceSchema = z.enum([
  "docstring_anchor",
  "differential_a3",
  "verified_mr",
  "formal_a2",
  "human_query",
]);

export const AdvisorySourceSchema = z.enum([
  "llm_interpreter",
  "unverified_pbt",
  "llm_mr",
  "z3_trace",
]);

// ── Tác vụ của dataset ────────────────────────────────────────────────────
export const TaskOutputTypeSchema = z.enum([
  "int",
  "bool",
  "str",
  "float",
  "list",
  "tuple",
  "other",
]);

export const AnchorOriginSchema = z.enum(["gốc", "dẫn xuất"]);

export const AcademicTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  intentDocstring: z.string(),
  outputType: TaskOutputTypeSchema,
  isUniqueOutput: z.boolean(),
  assignedBy: z.string().default("expert_annotator_1"),
  anchorOrigin: AnchorOriginSchema.default("gốc"),
  epsilon: z.number().optional(),
  hasA2: z.boolean(),
  hasA3: z.boolean(),
  anchorLevel: z.enum(["A0", "A1", "A2", "A3"]),
  isBSynthSupported: z.boolean(),
});

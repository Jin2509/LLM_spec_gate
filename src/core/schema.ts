/**
 * src/core/schema.ts — Zod Schemas for Module A
 *
 * Strict validation and types for:
 *   - Verdicts
 *   - Grounded vs Advisory Evidence (disjoint types)
 *   - Human Query Ticket (unused -> open -> spent)
 *   - Repair Candidates & Gate Results
 *   - Task & Case dossier
 */
import { z } from "zod";

// ── Verdict & Rule enums ──────────────────────────────────────────────────
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

export const RuleIdSchema = z.enum([
  "R1", // Conflict between grounded sources -> UNKNOWN_CONFLICT
  "R2", // Grounded e(w), c == e(w), P0 rejects e(w) -> SPEC_FAULT
  "R3", // Grounded e(w), c != e(w), P0 rejects e(w) -> DUAL_FAULT (target e(w))
  "R4", // Grounded property phi, c violates phi, P0 violates phi -> DUAL_FAULT (no target)
  "R5", // Grounded e(w) or phi violated by c, but P0 accepts -> CODE_FAULT
  "R6", // No grounded evidence -> UNKNOWN_EVIDENCE
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

// ── Grounded Evidence (Sole input to aggregate) ───────────────────────────
export const GroundedExpectedOutputEvidenceSchema = z.object({
  id: z.string(),
  isGrounded: z.literal(true),
  kind: z.literal("expected_output"),
  source: ProvenanceSourceSchema,
  input: z.unknown(),
  expected: z.unknown(),
  epsilon: z.number().optional(),
  label: z.string().optional(),
});

export const GroundedPropertyEvidenceSchema = z.object({
  id: z.string(),
  isGrounded: z.literal(true),
  kind: z.literal("property"),
  source: ProvenanceSourceSchema,
  propertyId: z.string(),
  description: z.string(),
  testOutput: z.function({
    input: z.tuple([z.unknown()]),
    output: z.boolean(),
  }),
});

export const GroundedEvidenceSchema = z.discriminatedUnion("kind", [
  GroundedExpectedOutputEvidenceSchema,
  GroundedPropertyEvidenceSchema,
]);

// ── Advisory Evidence (Never enters aggregate) ────────────────────────────
export const AdvisoryEvidenceSchema = z.object({
  id: z.string(),
  isGrounded: z.literal(false),
  source: AdvisorySourceSchema,
  note: z.literal("không vào aggregator"),
  content: z.unknown(),
});

// ── Human Query Ticket ────────────────────────────────────────────────────
export const TicketStatusSchema = z.enum(["unused", "open", "spent"]);
export const QuestionTypeSchema = z.enum(["expected-output", "acceptability"]);

export const HumanQueryTicketSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  witness: z.unknown(),
  codeOutput: z.unknown(),
  status: TicketStatusSchema,
  questionType: QuestionTypeSchema,
  promptText: z.string(),
  answer: z.unknown().optional(),
  isUncertain: z.boolean().optional(), // "Không xác định được"
  answeredAt: z.string().optional(),
  responseDurationMs: z.number().optional(),
});

// ── Repair Candidate & Gate ───────────────────────────────────────────────
export const RepairFamilySchema = z.enum([
  "broaden_bounds",
  "replace_predicate",
  "case_exception",
  "point_patch",
]);

export const RepairCandidateSchema = z.object({
  id: z.string(),
  family: RepairFamilySchema,
  guard: z.string(), // g
  replacement: z.string(), // C'
  targetExpectedOutput: z.unknown(),
  rank: z.number(),
  diffPreview: z.string(),
});

export const GateChecksSchema = z.object({
  g1_accept_grounded: z.boolean(),
  g2_reject_b: z.boolean(),
  g3_locality: z.boolean(),
  g4_preserve_g_a2: z.boolean(),
  g5_in_repair_space_and_bsynth: z.boolean(),
});

export const GuaranteeNatureSchema = z.enum([
  "structural",
  "finite-set",
  "proof",
  "n/a",
]);

export const GateResultSchema = z.object({
  passed: z.boolean(),
  checks: GateChecksSchema,
  firstFailedCheck: z.string().optional(),
  guaranteeNature: GuaranteeNatureSchema,
  unknownGateReason: z.enum(["no_candidate_in_grammar", "rejected_by_gate"]).optional(),
  message: z.string(),
});

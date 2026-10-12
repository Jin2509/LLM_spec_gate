/**
 * src/core/types.ts — TypeScript Types for Module A
 *
 * Exported pure types derived from schema.ts.
 * ZERO framework/React dependencies.
 */
import { z } from "zod";
import {
  VerdictSchema,
  RuleIdSchema,
  ProvenanceSourceSchema,
  AdvisorySourceSchema,
  GroundedExpectedOutputEvidenceSchema,
  GroundedPropertyEvidenceSchema,
  GroundedEvidenceSchema,
  AdvisoryEvidenceSchema,
  TicketStatusSchema,
  QuestionTypeSchema,
  HumanQueryTicketSchema,
  RepairFamilySchema,
  RepairCandidateSchema,
  GateChecksSchema,
  GuaranteeNatureSchema,
  GateResultSchema,
  TaskOutputTypeSchema,
  AnchorOriginSchema,
  AcademicTaskSchema,
} from "./schema";

export type Verdict = z.infer<typeof VerdictSchema>;
export type RuleId = z.infer<typeof RuleIdSchema>;
export type ProvenanceSource = z.infer<typeof ProvenanceSourceSchema>;
export type AdvisorySource = z.infer<typeof AdvisorySourceSchema>;

export type GroundedExpectedOutputEvidence = z.infer<
  typeof GroundedExpectedOutputEvidenceSchema
>;
export type GroundedPropertyEvidence = z.infer<
  typeof GroundedPropertyEvidenceSchema
>;
export type GroundedEvidence = z.infer<typeof GroundedEvidenceSchema>;

export type AdvisoryEvidence = z.infer<typeof AdvisoryEvidenceSchema>;

export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type HumanQueryTicket = z.infer<typeof HumanQueryTicketSchema>;

export type RepairFamily = z.infer<typeof RepairFamilySchema>;
export type RepairCandidate = z.infer<typeof RepairCandidateSchema>;
export type GateChecks = z.infer<typeof GateChecksSchema>;
export type GuaranteeNature = z.infer<typeof GuaranteeNatureSchema>;
export type GateResult = z.infer<typeof GateResultSchema>;

/**
 * Adjudication outcome produced by aggregate()
 */
export interface AdjudicationResult {
  readonly verdict: Verdict;
  readonly matchedRule: RuleId;
  readonly skippedRules: ReadonlyArray<{
    readonly rule: RuleId;
    readonly reason: string;
  }>;
  readonly expectedOutput?: unknown;
  readonly explanation: string;
}

/**
 * Single evaluation case dossier
 */
export interface CaseDossier {
  readonly id: string;
  readonly taskId: string;
  readonly witness: unknown;
  readonly codeOutput: unknown;
  readonly specP0: string;
  readonly monitorRejectionClause?: string;
  readonly isFlaky?: boolean;
  readonly groundedEvidence: ReadonlyArray<GroundedEvidence>;
  readonly advisoryEvidence: ReadonlyArray<AdvisoryEvidence>;
  readonly adjudication: AdjudicationResult;
  readonly ticket?: HumanQueryTicket;
  readonly repairCandidate?: RepairCandidate;
  readonly gateResult?: GateResult;
  readonly currentMonitorVersion: string;
}

export type TaskOutputType = z.infer<typeof TaskOutputTypeSchema>;
export type AnchorOrigin = z.infer<typeof AnchorOriginSchema>;
export type AcademicTask = z.infer<typeof AcademicTaskSchema>;

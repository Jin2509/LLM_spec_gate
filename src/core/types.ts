/**
 * src/core/types.ts — TypeScript Types for Module A
 *
 * Exported pure types derived from schema.ts.
 * ZERO framework/React dependencies.
 */
import { z } from "zod";
import {
  VerdictSchema,
  ProvenanceSourceSchema,
  AdvisorySourceSchema,
  AcademicTaskSchema,
} from "./schema";

export type Verdict = z.infer<typeof VerdictSchema>;
export type ProvenanceSource = z.infer<typeof ProvenanceSourceSchema>;
export type AdvisorySource = z.infer<typeof AdvisorySourceSchema>;

export type AcademicTask = z.infer<typeof AcademicTaskSchema>;

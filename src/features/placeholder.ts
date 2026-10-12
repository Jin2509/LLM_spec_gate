/**
 * Module C — Features (src/features/)
 *
 * PURPOSE: Feature-scoped UI logic; bridges core formal logic with UI components.
 *          Each sub-folder = one product feature area.
 *
 * PLANNED FEATURE AREAS (implemented S3–S10):
 *   - docket/             — Case Docket: violation hồ sơ, chip trạng thái c, ValueCompare
 *   - rule-inspector/     — Rule Inspector: mô phỏng R1–R6, hiển thị khớp/trượt
 *   - human-query/        — Human Query ticket: unused→open→spent, HTTP 409 on reuse
 *   - annotate/           — Annotation queue + Focus Mode (phím tắt, chống thiên kiến)
 *   - admission/          — 6-step admission checklist, SILENT_FAULT, B_synth
 *   - anchor-closure/     — Anchor tree, MR chains
 *   - fault-injection/    — Tiêm lỗi nguồn tin cậy (A2, A3, anchor, UniqueOutput)
 *   - repair-gate/        — Repair grammar C∨(g∧D), Gate G1–G5 pipeline
 *   - results/            — Risk–coverage curves, bootstrap CI, RQ1–RQ6
 *   - run-config/         — Run configuration: fail-closed/open, seed, manifest
 *
 * DEPENDENCY RULES:
 *   ✓ May import from: core/, guard/, ui/, i18n/, mock/ (test only)
 *   ✗ Must NOT import from other feature sub-folders (use events/store instead)
 */

export {}; // Placeholder

/**
 * src/app/dev/kit/page.tsx — Developer Kitchen Sink
 *
 * Visual regression page showing ALL design tokens:
 *   - Color palette (light + dark swatches with contrast ratios)
 *   - Type scale (12/14/16/19/23/28px in UI and Mono fonts)
 *   - Spacing grid
 *   - Verdict chip variants (ACC/SPEC/CODE/DUAL/UNKNOWN/NEUTRAL)
 *   - Theme toggle
 *
 * WCAG AA requirements:
 *   - Normal text (< 18px): contrast ≥ 4.5:1
 *   - Large text (≥ 18px or ≥ 14px bold): contrast ≥ 3:1
 */
"use client";

import { useTheme } from "@/features/theme/use-theme";
import {
  SURFACE_INK_TOKENS,
  VERDICT_COLOR_TOKENS,
  type ColorTokenMeta,
} from "@/styles/tokens-data";
import {
  VerdictChip,
  ProvenanceTag,
  CStateChip,
  GuaranteeBadge,
  InvariantBar,
  RuleLadder,
  ValueCompare,
  QueryTicket,
  DocketStrip,
} from "@/ui/domain";

/* ── Contrast calculation (WCAG 2.1 relative luminance) ──────────────────── */
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function linearize(c: number): number {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(hex1: string, hex2: string): number | null {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function ContrastBadge({ ratio }: { ratio: number | null }) {
  if (ratio === null) return null;
  const formatted = ratio.toFixed(2);
  const aa = ratio >= 4.5;
  const aaLarge = ratio >= 3.0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 6px",
        borderRadius: "var(--r-cell)",
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        background: aa ? "var(--v-acc-bg)" : aaLarge ? "var(--v-spec-bg)" : "var(--v-code-bg)",
        color: aa ? "var(--v-acc)" : aaLarge ? "var(--v-spec)" : "var(--v-code)",
        border: aa ? "1px solid var(--v-acc)" : aaLarge ? "1px solid var(--v-spec)" : "1px solid var(--v-code)",
        whiteSpace: "nowrap",
      }}
    >
      {formatted}:1 {aa ? "✓ AA" : aaLarge ? "△ AA Large" : "✗ Fail"}
    </span>
  );
}

/* ── Color swatch ─────────────────────────────────────────────────────────── */
interface SwatchProps {
  token: ColorTokenMeta;
  isDark: boolean;
}

function Swatch({ token, isDark }: SwatchProps) {
  const fgHex = isDark ? token.hexDark : token.hexLight;
  const bgHex = isDark ? token.bgHexDark : token.bgHexLight;
  const ratio = contrastRatio(fgHex, bgHex);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
        padding: "var(--s-2) var(--s-3)",
        borderRadius: "var(--r-card)",
        border: "1px solid var(--rule)",
        background: "var(--paper-surface)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--r-cell)",
          background: `var(${token.cssVar})`,
          flexShrink: 0,
          border: "1px solid var(--rule)",
        }}
        aria-hidden="true"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--ink)",
            fontFamily: "var(--font-ui)",
          }}
        >
          {token.label}
        </div>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--ink-soft)",
            marginTop: "2px",
          }}
        >
          {token.cssVar} · {fgHex}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <ContrastBadge ratio={ratio} />
      </div>
    </div>
  );
}

/* ── Type scale row ───────────────────────────────────────────────────────── */
function TypeScaleRow({
  size,
  pxSize,
}: {
  size: string;
  pxSize: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr 1fr",
        gap: "var(--s-4)",
        alignItems: "baseline",
        padding: "var(--s-2) 0",
        borderBottom: "1px solid var(--rule)",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          color: "var(--ink-soft)",
        }}
      >
        {pxSize}px / {size}
      </span>
      <span
        style={{
          fontSize: `${pxSize}px`,
          fontFamily: "var(--font-ui)",
          color: "var(--ink)",
          lineHeight: 1.5,
        }}
      >
        Bộ mẫu thử nghiệm · SpecGate
      </span>
      <span
        style={{
          fontSize: `${pxSize}px`,
          fontFamily: "var(--font-mono)",
          color: "var(--ink)",
          fontVariantLigatures: "none",
          lineHeight: 1.5,
        }}
      >
        R1→ACC: ε=0.001
      </span>
    </div>
  );
}



/* ── Section header ─────────────────────────────────────────────────────── */
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: "var(--s-4)" }}>
      <h2
        style={{
          margin: 0,
          fontSize: "19px",
          fontWeight: 600,
          color: "var(--ink)",
          fontFamily: "var(--font-ui)",
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            margin: "var(--s-1) 0 0",
            fontSize: "14px",
            color: "var(--ink-soft)",
            fontFamily: "var(--font-ui)",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DevKitPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--paper-ground)",
        color: "var(--ink)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--s-4) var(--s-6)",
          borderBottom: "2px solid var(--rule)",
          background: "var(--paper-surface)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>
            SpecGate — Dev Kit
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }}>
            Design token visual regression · S1
          </p>
        </div>
        <button
          onClick={toggleTheme}
          aria-label={`Chuyển sang chế độ ${isDark ? "sáng" : "tối"}`}
          style={{
            padding: "var(--s-2) var(--s-4)",
            borderRadius: "var(--r-card)",
            border: "1.5px solid var(--rule)",
            background: "var(--paper-ground)",
            color: "var(--ink)",
            fontFamily: "var(--font-ui)",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            transition: `border-color var(--motion-quick) ease, background var(--motion-quick) ease`,
          }}
        >
          {isDark ? "☀ Sáng" : "◑ Tối"}
        </button>
      </header>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "var(--s-6)" }}>

        {/* ═══ SECTION 1: Verdict Chips ════════════════════════════════════ */}
        <section style={{ marginBottom: "var(--s-10)" }}>
          <SectionHeader
            title="Verdict Chips"
            sub="Chip trạng thái theo phán quyết. UNKNOWN: viền nét đứt, nền trong suốt."
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-3)" }}>
            <VerdictChip verdict="ACC" />
            <VerdictChip verdict="SPEC_FAULT" />
            <VerdictChip verdict="CODE_FAULT" />
            <VerdictChip verdict="DUAL_FAULT" />
            <VerdictChip verdict="UNKNOWN_EVIDENCE" />
            <VerdictChip verdict="UNKNOWN_CONFLICT" />
            <VerdictChip verdict="UNKNOWN_GATE" />
            <VerdictChip verdict="NEUTRAL" />
          </div>
        </section>

        {/* ═══ SECTION 2: Color Palette ════════════════════════════════════ */}
        <section style={{ marginBottom: "var(--s-10)" }}>
          <SectionHeader
            title="Color Palette — Contrast Ratios"
            sub={`Chế độ: ${isDark ? "Tối (dark)" : "Sáng (light)"}. Tất cả cặp văn bản/nền phải đạt WCAG AA (≥ 4.5:1).`}
          />

          {/* Surface & Ink */}
          <div style={{ marginBottom: "var(--s-4)" }}>
            <h3 style={{ margin: "0 0 var(--s-2)", fontSize: "13px", fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Surfaces &amp; Ink
            </h3>
            <div style={{ display: "grid", gap: "var(--s-2)" }}>
              {SURFACE_INK_TOKENS.map((token) => (
                <Swatch key={token.label} token={token} isDark={isDark} />
              ))}
            </div>
          </div>

          {/* Verdict colors */}
          <div>
            <h3 style={{ margin: "0 0 var(--s-2)", fontSize: "13px", fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Verdicts (foreground on verdict-bg)
            </h3>
            <div style={{ display: "grid", gap: "var(--s-2)" }}>
              {VERDICT_COLOR_TOKENS.map((token) => (
                <Swatch key={token.label} token={token} isDark={isDark} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 3: Type Scale ═══════════════════════════════════════ */}
        <section style={{ marginBottom: "var(--s-10)" }}>
          <SectionHeader
            title="Type Scale"
            sub="Cột trái: Schibsted Grotesk (UI). Cột phải: JetBrains Mono (code, ligatures off). Kiểm tra tiếng Việt đầy đủ dấu thanh."
          />
          <div
            style={{
              padding: "var(--s-4)",
              borderRadius: "var(--r-card)",
              border: "1px solid var(--rule)",
              background: "var(--paper-surface)",
            }}
          >
            {/* Vietnamese diacritic test */}
            <div
              style={{
                padding: "var(--s-3)",
                marginBottom: "var(--s-4)",
                borderRadius: "var(--r-cell)",
                background: "var(--v-acc-bg)",
                border: "1px solid var(--v-acc)",
                fontSize: "13px",
                color: "var(--v-acc)",
                fontFamily: "var(--font-ui)",
              }}
            >
              Kiểm tra Unicode tiếng Việt: à á â ã ả ạ ă ắ ặ ằ ẳ ẵ â ấ ậ ầ ẩ ẫ
              đ è é ê ề ế ệ ề ể ễ ì í ị ỉ ĩ ò ó ô ố ộ ồ ổ ỗ ơ ớ ợ ờ ở ỡ
              ù ú ụ ủ ũ ư ứ ự ừ ử ữ ỳ ý ỵ ỷ ỹ
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: "var(--s-4)", marginBottom: "var(--s-2)" }}>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-soft)", fontWeight: 600 }}>SIZE</span>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-soft)", fontWeight: 600 }}>SCHIBSTED GROTESK (UI)</span>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-soft)", fontWeight: 600 }}>JETBRAINS MONO (CODE)</span>
            </div>
            <TypeScaleRow size="scale-xs" pxSize={12} />
            <TypeScaleRow size="scale-sm" pxSize={14} />
            <TypeScaleRow size="scale-base" pxSize={16} />
            <TypeScaleRow size="scale-md" pxSize={19} />
            <TypeScaleRow size="scale-lg" pxSize={23} />
            <TypeScaleRow size="scale-xl" pxSize={28} />
          </div>
        </section>

        {/* ═══ SECTION 4: Spacing Grid ══════════════════════════════════════ */}
        <section style={{ marginBottom: "var(--s-10)" }}>
          <SectionHeader title="Spacing Grid" sub="4px base unit. All layout uses these tokens." />
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {[
              { token: "--s-1", value: "4px" },
              { token: "--s-2", value: "8px" },
              { token: "--s-3", value: "12px" },
              { token: "--s-4", value: "16px" },
              { token: "--s-6", value: "24px" },
              { token: "--s-10", value: "40px" },
            ].map(({ token, value }) => (
              <div key={token} style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                <span style={{ width: 100, fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}>
                  {token}
                </span>
                <div
                  style={{
                    height: "var(--s-4)",
                    width: `var(${token})`,
                    background: "var(--action)",
                    borderRadius: "var(--r-cell)",
                    minWidth: 4,
                  }}
                  aria-label={value}
                />
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ SECTION 5: Border Radius ════════════════════════════════════ */}
        <section style={{ marginBottom: "var(--s-10)" }}>
          <SectionHeader title="Border Radius Hierarchy" sub="2px chip → 6px card → 12px ticket" />
          <div style={{ display: "flex", gap: "var(--s-4)", alignItems: "flex-end" }}>
            {[
              { token: "--r-cell", value: "2px", label: "Cell / Chip" },
              { token: "--r-card", value: "6px", label: "Card / Panel" },
              { token: "--r-ticket", value: "12px", label: "Ticket / Drawer" },
            ].map(({ token, value, label }) => (
              <div key={token} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: `var(${token})`,
                    border: "2px solid var(--action)",
                    background: "var(--paper-surface)",
                    margin: "0 auto var(--s-2)",
                  }}
                  aria-label={`${label}: border-radius ${value}`}
                />
                <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink)" }}>{value}</div>
                <div style={{ fontSize: "11px", color: "var(--ink-soft)" }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ SECTION 7: Domain Components Showcase ══════════════════════ */}
        <section style={{ marginBottom: "var(--s-10)" }}>
          <SectionHeader
            title="Domain Components (Mô-đun A & C)"
            sub="Các thành phần miền chuyên dụng cho bài báo: VerdictChip, ProvenanceTag, GuaranteeBadge, InvariantBar, RuleLadder, ValueCompare, QueryTicket, DocketStrip."
          />

          {/* 1. VerdictChip Variants */}
          <div style={{ marginBottom: "var(--s-6)" }}>
            <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)" }}>
              VERDICT CHIP (UNKNOWN BẮT BUỘC VIỀN NÉT ĐỨT, NỀN TRONG SUỐT):
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
              <VerdictChip verdict="ACC" showFullLabel />
              <VerdictChip verdict="SPEC_FAULT" showFullLabel />
              <VerdictChip verdict="CODE_FAULT" showFullLabel />
              <VerdictChip verdict="DUAL_FAULT" showFullLabel />
              <VerdictChip verdict="UNKNOWN_EVIDENCE" showFullLabel />
              <VerdictChip verdict="UNKNOWN_CONFLICT" showFullLabel />
              <VerdictChip verdict="UNKNOWN_GATE" showFullLabel />
            </div>
          </div>

          {/* 2. ProvenanceTag */}
          <div style={{ marginBottom: "var(--s-6)" }}>
            <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)" }}>
              PROVENANCE TAG (GROUNDED VIỀN LIỀN VS ADVISORY VIỀN ĐỨT KÈM CHÚ THÍCH):
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
              <ProvenanceTag isGrounded={true} source="docstring_anchor" />
              <ProvenanceTag isGrounded={true} source="differential_a3" />
              <ProvenanceTag isGrounded={true} source="verified_mr" />
              <ProvenanceTag isGrounded={true} source="formal_a2" />
              <ProvenanceTag isGrounded={true} source="human_query" />
              <ProvenanceTag isGrounded={false} source="llm_interpreter" />
              <ProvenanceTag isGrounded={false} source="unverified_pbt" />
            </div>
          </div>

          {/* 3. CState & Guarantee */}
          <div style={{ marginBottom: "var(--s-6)" }}>
            <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)" }}>
              C-STATE &amp; GUARANTEE BADGES (KHÔNG BAO GIỜ DÙNG CHỮ &apos;AN TOÀN&apos; TRƠN):
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-3)", alignItems: "center" }}>
              <CStateChip state="ACC" reason="Khớp với e(w)" />
              <CStateChip state="REJ" reason="P0 bác bỏ" />
              <CStateChip state="UND" reason="Chưa có bằng chứng" />
              <GuaranteeBadge id="S1" nature="structural" claimLabel="Locality" />
              <GuaranteeBadge id="S3" nature="finite-set" claimLabel="Reject-B" />
              <GuaranteeBadge id="S4" nature="proof" claimLabel="Preserve-G" />
            </div>
          </div>

          {/* 4. InvariantBar */}
          <div style={{ marginBottom: "var(--s-6)" }}>
            <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)" }}>
              INVARIANT BAR:
            </h4>
            <InvariantBar
              isDisjointGB={true}
              isHeldOutLocked={true}
              ticketsSpent={14}
              ticketsTotal={45}
              rejectedWritesCount={0}
            />
          </div>

          {/* 5. RuleLadder */}
          <div style={{ marginBottom: "var(--s-6)" }}>
            <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)" }}>
              RULE LADDER (R1–R6):
            </h4>
            <RuleLadder
              matchedRule="R2"
              skippedRules={[
                { rule: "R1", reason: "Các nguồn grounded không mâu thuẫn" },
              ]}
            />
          </div>

          {/* 6. ValueCompare */}
          <div style={{ marginBottom: "var(--s-6)" }}>
            <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)" }}>
              VALUE COMPARE (≃):
            </h4>
            <ValueCompare
              expected={[2, 3, 5, 8]}
              actual={[2, 3, 5, 8]}
              isUniqueOutput={true}
            />
          </div>

          {/* 7. QueryTicket */}
          <div style={{ marginBottom: "var(--s-6)" }}>
            <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)" }}>
              QUERY TICKET (SINGLE-SHOT):
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-4)" }}>
              <QueryTicket
                ticket={{
                  id: "t_demo_open",
                  caseId: "c_01",
                  witness: [1, 2],
                  codeOutput: 3,
                  status: "open",
                  questionType: "expected-output",
                  promptText: "Giá trị đầu ra mong đợi tại witness [1, 2]?",
                }}
                onAnswer={async () => {}}
                onUncertain={async () => {}}
              />
              <QueryTicket
                ticket={{
                  id: "t_demo_spent",
                  caseId: "c_02",
                  witness: [4],
                  codeOutput: 16,
                  status: "spent",
                  questionType: "expected-output",
                  promptText: "Đầu ra mong đợi tại w=[4]?",
                  answer: 16,
                  answeredAt: "2026-10-12 21:00",
                }}
                onAnswer={async () => {}}
                onUncertain={async () => {}}
              />
            </div>
          </div>

          {/* 8. DocketStrip */}
          <div style={{ marginBottom: "var(--s-6)" }}>
            <h4 style={{ margin: "0 0 var(--s-2)", fontSize: "12px", color: "var(--ink-soft)" }}>
              DOCKET STRIP (2-PHA):
            </h4>
            <DocketStrip
              caseId="case_spec_fault"
              evalId={1}
              stages={[
                { id: 1, name: "Bằng chứng", status: "done", summary: "Docstring anchor" },
                { id: 2, name: "Trạng thái c", status: "done", summary: "c = e(w)" },
                { id: 3, name: "Luật R1-R6", status: "done", summary: "Khớp R2 (SPEC_FAULT)" },
                { id: 4, name: "Hành động", status: "done", summary: "Sinh P' & đưa qua Gate" },
                { id: 5, name: "Sửa (Repair)", status: "done", summary: "Ứng viên #1 (Case exception)" },
                { id: 6, name: "Cổng (Gate)", status: "done", summary: "Đạt G1-G5 (SAMPLED)" },
              ]}
            />
          </div>
        </section>

      </main>
    </div>
  );
}

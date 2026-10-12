/**
 * src/app/page.tsx — Adjudicator Lab Home
 *
 * Direct entry point to Lab Workbench and Dev Kit.
 * Zero hardcoded HEX colors.
 */
import Link from "next/link";
import { i18n } from "@/i18n/vi";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--paper-ground)",
        color: "var(--ink)",
        fontFamily: "var(--font-ui)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--s-6)",
      }}
    >
      <main
        style={{
          maxWidth: "680px",
          width: "100%",
          background: "var(--paper-surface)",
          border: "1.5px solid var(--rule)",
          borderRadius: "var(--r-card)",
          padding: "var(--s-10)",
        }}
      >
        <div style={{ marginBottom: "var(--s-6)" }}>
          <span
            style={{
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              color: "var(--action)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Adjudicated Dual-Oracle Monitoring v1.4
          </span>
          <h1
            style={{
              margin: "var(--s-2) 0",
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
            }}
          >
            {i18n.app.title}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "var(--ink-soft)",
              lineHeight: 1.6,
            }}
          >
            {i18n.app.tagline}. Môi trường thực nghiệm tương tác kiểm chứng các quy tắc R1–R6,
            Fail-Closed Repair Gate (G1–G5) và Single-Shot Human Query.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--s-4)",
            marginBottom: "var(--s-6)",
          }}
        >
          <Link
            href="/lab"
            style={{
              display: "block",
              padding: "var(--s-4)",
              background: "var(--paper-ground)",
              border: "1.5px solid var(--action)",
              borderRadius: "var(--r-card)",
              textDecoration: "none",
              color: "var(--ink)",
              transition: "transform var(--motion-quick) ease",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--action)",
                marginBottom: "4px",
              }}
            >
              Vào Lab Workbench →
            </div>
            <div style={{ fontSize: "12px", color: "var(--ink-soft)", lineHeight: 1.5 }}>
              Khám phá 6 kịch bản vụ việc, Docket Strip 2-pha, RuleLadder và vé hỏi tương tác 1 lần.
            </div>
          </Link>

          <Link
            href="/dev/kit"
            style={{
              display: "block",
              padding: "var(--s-4)",
              background: "var(--paper-ground)",
              border: "1px solid var(--rule)",
              borderRadius: "var(--r-card)",
              textDecoration: "none",
              color: "var(--ink)",
              transition: "transform var(--motion-quick) ease",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--ink)",
                marginBottom: "4px",
              }}
            >
              Kho linh kiện (Dev Kit) →
            </div>
            <div style={{ fontSize: "12px", color: "var(--ink-soft)", lineHeight: 1.5 }}>
              Kiểm tra trực quan toàn bộ design token, độ tương phản WCAG AA và thành phần miền.
            </div>
          </Link>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--rule)",
            paddingTop: "var(--s-3)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--ink-soft)",
          }}
        >
          <span>Next.js App Router · TypeScript Strict</span>
          <span>Zero HEX colors · Fail-Closed</span>
        </div>
      </main>
    </div>
  );
}

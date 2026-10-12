/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      // ── All colors reference CSS Variables — ZERO hardcoded hex ────────────
      colors: {
        // Surfaces & ink
        "paper-ground":  "var(--paper-ground)",
        "paper-surface": "var(--paper-surface)",
        ink:             "var(--ink)",
        "ink-soft":      "var(--ink-soft)",
        rule:            "var(--rule)",
        action:          "var(--action)",

        // Verdicts
        "v-acc":     "var(--v-acc)",
        "v-spec":    "var(--v-spec)",
        "v-code":    "var(--v-code)",
        "v-dual":    "var(--v-dual)",
        "v-unknown": "var(--v-unknown)",
        "v-neutral": "var(--v-neutral)",

        // Verdict backgrounds (10% opacity semantic variants)
        "v-acc-bg":  "var(--v-acc-bg)",
        "v-spec-bg": "var(--v-spec-bg)",
        "v-code-bg": "var(--v-code-bg)",
        "v-dual-bg": "var(--v-dual-bg)",
      },

      // ── Spacing grid (4px base) ────────────────────────────────────────────
      spacing: {
        "s-1":  "var(--s-1)",   // 4px
        "s-2":  "var(--s-2)",   // 8px
        "s-3":  "var(--s-3)",   // 12px
        "s-4":  "var(--s-4)",   // 16px
        "s-6":  "var(--s-6)",   // 24px
        "s-10": "var(--s-10)",  // 40px
      },

      // ── Border radius hierarchy ────────────────────────────────────────────
      borderRadius: {
        cell:   "var(--r-cell)",   // 2px — data cells, chips
        card:   "var(--r-card)",   // 6px — content cards
        ticket: "var(--r-ticket)", // 12px — human query tickets
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        ui:   "var(--font-ui)",
        mono: "var(--font-mono)",
      },

      // ── Type scale (paper sizes) ───────────────────────────────────────────
      fontSize: {
        "scale-xs":  ["12px", { lineHeight: "1.4" }],
        "scale-sm":  ["14px", { lineHeight: "1.5" }],
        "scale-base":["16px", { lineHeight: "1.6" }],
        "scale-md":  ["19px", { lineHeight: "1.5" }],
        "scale-lg":  ["23px", { lineHeight: "1.4" }],
        "scale-xl":  ["28px", { lineHeight: "1.3" }],
      },

      // ── Transitions ────────────────────────────────────────────────────────
      transitionDuration: {
        quick:  "var(--motion-quick)",   // 140ms
        settle: "var(--motion-settle)",  // 320ms
      },
    },
  },
  plugins: [],
};

export default config;

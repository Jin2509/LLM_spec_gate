/**
 * src/app/layout.tsx — Root Layout
 *
 * Responsibilities:
 *   1. Register Google Fonts via next/font (self-hosted, no external requests)
 *   2. Inject anti-FOUC theme-init script BEFORE body paints
 *   3. Apply font CSS variable classes to <html>
 *   4. Import global styles (tokens → tailwind → resets)
 */
import type { Metadata } from "next";
import { Schibsted_Grotesk, JetBrains_Mono } from "next/font/google";
import { themeInitScript } from "./theme-init";
import "../styles/globals.css";

// ── Schibsted Grotesk — UI font ───────────────────────────────────────────
// variable: allows usage as CSS var --font-schibsted-grotesk
// vietnamese subset covers all diacritics (đ, ă, ơ, ư, ắ, ề, ộ, etc.)
const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-schibsted-grotesk",
  subsets: ["latin", "latin-ext"], // latin-ext = full Vietnamese diacritic support
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

// ── JetBrains Mono — Code / data font ─────────────────────────────────────
// Ligatures are disabled globally via CSS: font-variant-ligatures: none
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false, // Non-critical; load on demand
});

export const metadata: Metadata = {
  title: "Adjudicator Lab",
  description:
    "UI testbed for Adjudicated Dual-Oracle Monitoring — interactive research verification environment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      // data-theme is set by the inline script before paint — avoids FOUC
      className={`${schibstedGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/*
         * Anti-FOUC inline script — MUST execute before body renders.
         * Reads localStorage / prefers-color-scheme and sets data-theme.
         * dangerouslySetInnerHTML is safe here: themeInitScript is a
         * static string with no user input.
         */}
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

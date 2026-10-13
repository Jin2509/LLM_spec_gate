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
import { themeInitScript } from "./theme-init";
import "../styles/globals.css";

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
    <html lang="vi" suppressHydrationWarning>
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

/**
 * src/app/layout.tsx — Root Layout
 *
 * Responsibilities:
 *   1. Register Google Fonts via next/font (self-hosted, no external requests)
 *   2. Inject anti-FOUC theme-init script BEFORE body paints
 *   3. Apply font CSS variable classes to <html>
 *   4. Import global styles (tokens → tailwind → resets)
 *   5. Mount client providers (cấu hình LLM giữ trong bộ nhớ khi chuyển trang)
 */
import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import { Providers } from "./providers";
import { themeInitScript } from "./theme-init";
import "../styles/globals.css";

const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpecGate",
  description:
    "SpecGate — UI testbed for Adjudicated Dual-Oracle Monitoring, interactive research verification environment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${roboto.variable} ${robotoMono.variable}`} suppressHydrationWarning>
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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

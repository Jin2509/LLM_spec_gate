import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/app/**/{page,layout,error,loading,not-found,route}.{ts,tsx}",
    "src/app/**/default.{ts,tsx}",
    "vitest.config.ts",
    "playwright.config.ts",
    "next.config.ts",
  ],
  project: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
  ignore: [
    "src/**/*.test.{ts,tsx}",
    "src/**/*.spec.{ts,tsx}",
    // Placeholder files will be removed as modules are implemented
    "src/**/placeholder.ts",
  ],
  ignoreDependencies: [
    // Needed by Next.js but not directly imported
    "@types/node",
  ],
};

export default config;

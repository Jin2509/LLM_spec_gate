import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // ── Base: Next.js recommended rules (includes jsx-a11y) ──────────────────
  ...nextVitals,
  ...nextTs,

  // ── Module A boundary: src/core/** must be UI-independent ─────────────────
  // Pure formal logic — zero dependency on React, Next, features, ui, mock.
  {
    files: ["src/core/**/*.{ts,tsx,mts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react/*", "react-dom", "react-dom/*"],
              message:
                "[core-boundary] src/core must not import React. Keep formal logic UI-independent.",
            },
            {
              group: ["next", "next/*"],
              message:
                "[core-boundary] src/core must not import Next.js. Keep formal logic framework-independent.",
            },
            {
              group: [
                "*/features/*",
                "@/features/*",
                "../features/*",
                "../../features/*",
              ],
              message:
                "[core-boundary] src/core must not import from features/. Invert the dependency.",
            },
            {
              group: [
                "*/ui/*",
                "@/ui/*",
                "../ui/*",
                "../../ui/*",
              ],
              message:
                "[core-boundary] src/core must not import from ui/. Keep formal logic UI-independent.",
            },
            {
              group: [
                "*/mock/*",
                "@/mock/*",
                "../mock/*",
                "../../mock/*",
              ],
              message:
                "[core-boundary] src/core must not import from mock/. Keep formal logic deterministic.",
            },
          ],
        },
      ],
    },
  },

  // ── Grading field guard: only grading-proxy.ts may access .grading ────────
  // All other files must go through src/guard/grading-proxy.ts.
  {
    files: ["**/*.{ts,tsx,mts}"],
    ignores: ["src/guard/grading-proxy.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='grading']",
          message:
            "[grading-guard] Direct access to .grading is forbidden. Use src/guard/grading-proxy.ts instead.",
        },
      ],
    },
  },

  // ── Global ignores ────────────────────────────────────────────────────────
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;

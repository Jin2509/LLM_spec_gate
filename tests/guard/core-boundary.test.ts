/**
 * tests/guard/core-boundary.test.ts — Verification of Architecture Boundary via ESLint
 *
 * Asserts that:
 * 1. Files in src/core/ attempting to import from react, next, features, ui, mock
 *    are blocked with error `no-restricted-imports`.
 * 2. Files outside src/guard/grading-proxy.ts attempting to access `.grading`
 *    are blocked with error `no-restricted-syntax`.
 */
import { describe, it, expect } from "vitest";
import { ESLint } from "eslint";

describe("Architecture Boundary Enforcement (ESLint Rules)", () => {
  const eslint = new ESLint();

  it("blocks importing 'react' from within src/core/", async () => {
    const code = `import React from "react";\nexport const x = React;\n`;
    const [result] = await eslint.lintText(code, {
      filePath: "src/core/violation-react.ts",
    });

    expect(result).toBeDefined();
    const violation = result?.messages.find(
      (m) => m.ruleId === "no-restricted-imports"
    );
    expect(violation).toBeDefined();
    expect(violation?.message).toContain("[core-boundary]");
    expect(violation?.message).toContain("must not import React");
  }, 30000);

  it("blocks importing 'next' or Next modules from within src/core/", async () => {
    const code = `import { NextRequest } from "next/server";\nexport const x = NextRequest;\n`;
    const [result] = await eslint.lintText(code, {
      filePath: "src/core/violation-next.ts",
    });

    expect(result).toBeDefined();
    const violation = result?.messages.find(
      (m) => m.ruleId === "no-restricted-imports"
    );
    expect(violation).toBeDefined();
    expect(violation?.message).toContain("[core-boundary]");
    expect(violation?.message).toContain("must not import Next.js");
  });

  it("blocks importing from '@/ui/*' from within src/core/", async () => {
    const code = `import { Button } from "@/ui/primitives";\nexport const x = Button;\n`;
    const [result] = await eslint.lintText(code, {
      filePath: "src/core/violation-ui.ts",
    });

    expect(result).toBeDefined();
    const violation = result?.messages.find(
      (m) => m.ruleId === "no-restricted-imports"
    );
    expect(violation).toBeDefined();
    expect(violation?.message).toContain("[core-boundary]");
    expect(violation?.message).toContain("must not import from ui/");
  });

  it("blocks direct access to `.grading` outside src/guard/grading-proxy.ts", async () => {
    const code = `interface Item { grading: string; }\nexport function read(item: Item) { return item.grading; }\n`;
    const [result] = await eslint.lintText(code, {
      filePath: "src/features/violation-grading.ts",
    });

    expect(result).toBeDefined();
    const violation = result?.messages.find(
      (m) => m.ruleId === "no-restricted-syntax"
    );
    expect(violation).toBeDefined();
    expect(violation?.message).toContain("[grading-guard]");
  });

  it("allows valid imports in src/core/ from standard library or sibling core modules", async () => {
    const code = `import { areEquivalent } from "./equivalence";\nexport const eq = areEquivalent;\n`;
    const [result] = await eslint.lintText(code, {
      filePath: "src/core/valid-import.ts",
    });

    expect(result).toBeDefined();
    const violation = result?.messages.find(
      (m) => m.ruleId === "no-restricted-imports"
    );
    expect(violation).toBeUndefined();
  });
});

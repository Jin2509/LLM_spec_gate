/**
 * tests/api/datasets-upload.test.ts — JSONL Upload & Zod Validation Test
 *
 * Requirements:
 *   - Parse upload .jsonl, kiểm tra Zod, báo lỗi chi tiết theo dòng.
 */
import { describe, it, expect } from "vitest";
import { POST as handleUpload } from "@/app/api/datasets/route";
import { NextRequest } from "next/server";

describe("API: POST /api/datasets (JSONL upload & line-by-line Zod check)", () => {
  it("rejects empty body with HTTP 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/datasets", {
      method: "POST",
      body: "",
    });

    const res = await handleUpload(req);
    expect(res.status).toBe(400);
  });

  it("reports detailed line numbers and field errors on malformed JSON or invalid schema", async () => {
    const invalidJsonl = [
      // Line 1: Valid
      JSON.stringify({
        id: "task_test_01",
        name: "test_task",
        intentDocstring: "Calculates sum of two integers.",
        outputType: "int",
        isUniqueOutput: true,
        hasA2: false,
        hasA3: false,
        anchorLevel: "A1",
        isBSynthSupported: true,
      }),
      // Line 2: Malformed JSON syntax
      `{"id": "broken_line", name: unquoted}`,
      // Line 3: Schema invalid (missing intentDocstring & invalid outputType)
      JSON.stringify({
        id: "task_test_03",
        name: "invalid_output_type",
        outputType: "unsupported_type_xyz",
        isUniqueOutput: true,
        hasA2: false,
        hasA3: false,
        anchorLevel: "A0",
        isBSynthSupported: false,
      }),
    ].join("\n");

    const req = new NextRequest("http://localhost:3000/api/datasets", {
      method: "POST",
      body: invalidJsonl,
    });

    const res = await handleUpload(req);
    expect(res.status).toBe(422);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.errorCount).toBe(2);

    // Verify error lines
    const line2Error = data.errors.find((e: { line: number }) => e.line === 2);
    expect(line2Error).toBeDefined();
    expect(line2Error.message).toContain("Lỗi cú pháp JSON ở dòng 2");

    const line3Error = data.errors.find((e: { line: number }) => e.line === 3);
    expect(line3Error).toBeDefined();
    expect(line3Error.line).toBe(3);
  });

  it("successfully parses 100% valid JSONL with HTTP 201 Created", async () => {
    const validJsonl = [
      JSON.stringify({
        id: "task_valid_01",
        name: "sum_two",
        intentDocstring: "Computes sum of numbers.",
        outputType: "int",
        isUniqueOutput: true,
        assignedBy: "ann_mai",
        anchorOrigin: "gốc",
        hasA2: true,
        hasA3: false,
        anchorLevel: "A2",
        isBSynthSupported: true,
      }),
      JSON.stringify({
        id: "task_valid_02",
        name: "reverse_string",
        intentDocstring: "Reverses input string.",
        outputType: "str",
        isUniqueOutput: true,
        assignedBy: "ann_jin",
        anchorOrigin: "gốc",
        hasA2: false,
        hasA3: true,
        anchorLevel: "A3",
        isBSynthSupported: true,
      }),
    ].join("\n");

    const req = new NextRequest("http://localhost:3000/api/datasets", {
      method: "POST",
      body: validJsonl,
    });

    const res = await handleUpload(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.taskCount).toBe(2);
  });
});

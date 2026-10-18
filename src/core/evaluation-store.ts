import "server-only";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Run } from "./evaluation-types";

const dataDir = join(process.cwd(), ".data");
const storeFile = join(dataDir, "evaluation-runs.jsonl");

async function readAll(): Promise<Run[]> {
  try {
    const contents = await readFile(storeFile, "utf8");
    return contents.split("\n").filter(Boolean).flatMap((line) => {
      try { return [JSON.parse(line) as Run]; } catch { return []; }
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function listEvaluationRuns() { return (await readAll()).sort((a, b) => b.created_at.localeCompare(a.created_at)); }
export async function getEvaluationRun(id: string) { return (await readAll()).find((run) => run.run_id === id); }
export async function createEvaluationRun(run: Run) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(storeFile, `${JSON.stringify(run)}\n`, "utf8");
  return run;
}
export async function updateEvaluationRun(id: string, update: (run: Run) => Run) {
  const rows = await readAll();
  const index = rows.findIndex((run) => run.run_id === id);
  if (index < 0) return undefined;
  rows[index] = update(rows[index]!);
  await mkdir(dataDir, { recursive: true });
  const temp = `${storeFile}.${Date.now()}.tmp`;
  await writeFile(temp, rows.map((run) => JSON.stringify(run)).join("\n") + "\n", "utf8");
  await rename(temp, storeFile);
  return rows[index];
}
export async function deleteEvaluationRuns() {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storeFile, "", "utf8");
}

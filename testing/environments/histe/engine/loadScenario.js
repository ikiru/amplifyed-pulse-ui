// HISTE Utility — Scenario loader
// Governed by:
// - docs/testing-environments.md
// - server/contracts/Human Interaction Stress Testing Environment (HISTE).md

export async function loadScenario(filePath) {
  if (typeof window !== "undefined") {
    throw new Error("HISTE scenario loader is only available in Node.");
  }
  if (!filePath) {
    throw new Error("Scenario file path is required.");
  }
  const { readFile } = await import("node:fs/promises");
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export default loadScenario;

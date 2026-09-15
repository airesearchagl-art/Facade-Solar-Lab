// One-time capture only; deliberately separate from the reusable probe module.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { createServer } from "vite";
const checkpoint = "2ccbcc89cfe475df4df5a5ec42f0c899b250deaa";
if (execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() !== checkpoint) throw new Error("Capture only from the authorized pre-array checkpoint; never regenerate from new implementation");
if (execFileSync("git", ["diff", "--name-only", checkpoint, "--", "src"], { encoding: "utf8" }).trim()) throw new Error("Checkpoint product sources must be unchanged");
const server = await createServer({ configFile: false, envDir: false, logLevel: "silent", server: { middlewareMode: true }, appType: "custom" });
try {
  const { edgeCheckpoint } = await server.ssrLoadModule("/scripts/validation/m7-shading/edge-checkpoint.ts");
  const result = edgeCheckpoint();
  // Only the intentionally renamed descriptive direct model ID is excluded.
  const digest = createHash("sha256").update(JSON.stringify(result, (key, value) => key === "directShadingModel" ? undefined : value)).digest("hex");
  const record = { checkpoint, source: "pre-array FSL edge-fin regression, NOT independent physical validation", normalization: "omit directShadingModel identity string only; every numerical field and remaining result field exact", shadowCases: result.shadows.length, annualCases: result.annual.length, intervals: 8760, digest };
  await writeFile("scripts/validation/m7-shading/edge-checkpoint.json", JSON.stringify(record, null, 2) + "\n");
  console.log(record);
} finally { await server.close(); }

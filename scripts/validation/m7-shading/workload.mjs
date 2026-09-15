import assert from "node:assert/strict";
import { createServer } from "vite";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import { resolve } from "node:path";

const server = await createServer({ configFile: false, envDir: false, logLevel: "silent", server: { middlewareMode: true }, appType: "custom" });
try {
  const { workload } = await server.ssrLoadModule("/scripts/validation/m7-shading/probes.ts");
  const rows = [];
  for (const [cases, floors] of [[1, 1], [4, 5]]) {
    for (const fins of [false, true]) {
      const subject = workload(floors, cases, fins);
      const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
      const expected = hash(subject.run());
      const elapsedMs = [];
      for (let iteration = 0; iteration < 5; iteration += 1) {
        const start = performance.now();
        const result = subject.run();
        elapsedMs.push(performance.now() - start);
        assert.equal(hash(result), expected);
        for (const item of result.cases) assert(Number.isFinite(item.total.annualKWh));
      }
      rows.push({ cases, floors, fins, intervals: subject.intervals, elapsedMs, medianMs: [...elapsedMs].sort((a,b) => a-b)[2], digest: expected });
    }
  }
  const report = { checkedAtUtc: new Date().toISOString(), node: process.version, cpu: cpus()[0]?.model, method: "M5 syntheticYear/independentCase inputs, all floors with overhang; same-process v1 vs v2, 1 warmup + 5 measured repetitions per arm; setup and hashing excluded. Local workload, not solver evidence. No predeclared performance PASS threshold.", rows, ratios: [rows[1].medianMs / rows[0].medianMs, rows[3].medianMs / rows[2].medianMs] };
  const output = resolve(".local-validation/m7-shading");
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, "workload.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
} finally { await server.close(); }

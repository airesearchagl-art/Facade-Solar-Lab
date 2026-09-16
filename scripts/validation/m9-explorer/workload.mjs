import assert from "node:assert/strict";
import { cpus } from "node:os";
import { createServer } from "vite";

// CPU calculation evidence only. Browser responsiveness/cancellation is checked separately.
// Never loads .env files or weather from disk; deterministic synthetic 8760 intervals.
const server = await createServer({ configFile: false, envDir: false, logLevel: "silent", server: { middlewareMode: true }, appType: "custom" });
try {
  const { runStudy } = await server.ssrLoadModule("/src/explorer/study.ts");
  const { createDemoWeatherDataset } = await server.ssrLoadModule("/src/demo/demo-weather.ts");
  const { createDemoComparisonWorkspace } = await server.ssrLoadModule("/src/demo/demo-scenario.ts");
  const dataset = createDemoWeatherDataset(), base = createDemoComparisonWorkspace().cases[0];
  const rows = [];
  for (const pitch of [null, 1.5, .6]) {
    const source = { ...base, parameters: { ...base.parameters, ...(pitch === null ? {} : { intermediateFins: { depthM: .6, bottomZM: .9, topZM: 3.3, layout: { mode: "pitch", pitchM: pitch } } }) } };
    runStudy(dataset, source, { a: { key: "overhang.depthM", min: .8, max: .8, step: .1 } }, "2026-09-16T00:00:00.000Z");
    for (const [aCount, bCount] of [[8, 1], [16, 1], [32, 1], [64, 1], [4, 4], [6, 6], [8, 8]]) {
      const sweep = { a: { key: "overhang.depthM", min: .8, max: Number((.8 + (aCount - 1) * .02).toFixed(6)), step: .02 }, ...(bCount === 1 ? {} : { b: { key: "facadeAzimuthDegFromNorth", min: 150, max: 150 + (bCount - 1) * 5, step: 5 } }) };
      const progress = [];
      const study = runStudy(dataset, source, sweep, "2026-09-16T00:00:00.000Z", completed => progress.push(completed), () => performance.now());
      assert.equal(study.candidates.length, aCount * bCount);
      assert(study.candidates.every(c => c.status === "VALID"));
      assert.deepEqual(progress, Array.from({ length: aCount * bCount + 1 }, (_, i) => i));
      const timings = study.candidates.map(c => c.runtimeMs).sort((a,b) => a-b), mid = Math.floor(timings.length / 2);
      const row = { arm: pitch === null ? "no-fins" : `pitch-${pitch}m`, grid: `${aCount}x${bCount}`, count: aCount * bCount, totalMs: study.runtimeMs, medianCandidateMs: (timings[mid-1] + timings[mid]) / 2, maxCandidateMs: Math.max(...timings), progressEvents: progress.length, valid: study.candidates.length };
      rows.push(row); console.log(JSON.stringify(row));
    }
  }
  console.log(JSON.stringify({ checkedAtUtc: new Date().toISOString(), node: process.version, cpu: cpus()[0]?.model, intervals: dataset.intervals.length,
    method: "One single-candidate warmup per arm, one measured study per grid; median of candidate times within run. Total includes baseline and per-candidate validation, excludes worker setup/structured cloning/UI rendering. Local CPU evidence, no SLA or physical validation.", rows }));
} finally { await server.close(); }

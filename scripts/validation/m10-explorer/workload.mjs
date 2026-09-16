import assert from "node:assert/strict";
import { cpus } from "node:os";
import { createServer } from "vite";

// CPU-only, synthetic input, no .env loading or external weather.
const server = await createServer({ configFile: false, envDir: false, logLevel: "silent", server: { middlewareMode: true }, appType: "custom" });
try {
  const { runMultiStudy } = await server.ssrLoadModule("/src/explorer/multi-study.ts");
  const { createDemoWeatherDataset } = await server.ssrLoadModule("/src/demo/demo-weather.ts");
  const { createMultiFloorDemoWorkspace } = await server.ssrLoadModule("/src/multifloor/demo.ts");
  const dataset = createDemoWeatherDataset(), base = createMultiFloorDemoWorkspace().cases[0], rows = [];
  for (const pitch of [null, 2]) for (const floorCount of [3, 5, 10]) {
    const source = { ...base, floors: Array.from({ length: floorCount }, (_, i) => ({ ...base.floors[0], id: `floor-${i+1}`, name: `${i+1}F`, ...(pitch === null ? {} : { intermediateFins: { depthM: .6, bottomZM: .9, topZM: 3.3, layout: { mode: "pitch", pitchM: pitch } } }) })) };
    const input = { source, selectedFloorId: source.floors[1].id, scope: "all", sweep: { a: { key: "overhang.depthM", min: .8, max: .8, step: .1 } } };
    runMultiStudy(dataset, input, "2026-09-16T00:00:00.000Z");
    for (const side of [4, 6, 8]) {
      const progress = [], timestamps = [];
      const study = runMultiStudy(dataset, { ...input, sweep: { a: { key: "overhang.depthM", min: .8, max: (.8e6 + (side-1)*1e5)/1e6, step: .1 }, b: { key: "solarHeatGainCoefficient", min: .2, max: (.2e6 + (side-1)*1e4)/1e6, step: .01 } } }, "2026-09-16T00:00:00.000Z", completed => { progress.push(completed); timestamps.push(performance.now()); }, () => performance.now());
      assert.equal(study.candidates.length, side*side);
      assert(study.candidates.every(candidate => candidate.status === "VALID"));
      assert.deepEqual(progress, Array.from({ length: side*side+1 }, (_, i) => i));
      const times = study.candidates.map(candidate => candidate.runtimeMs).sort((a,b) => a-b), middle = times.length/2;
      const row = { arm: pitch === null ? "no-fins" : "pitch-2m", floorCount, candidates: side*side, totalMs: study.runtimeMs, medianCandidateMs: (times[middle-1]+times[middle])/2,
        maxProgressGapMs: Math.max(...timestamps.slice(1).map((t,i) => t-timestamps[i])), progressEvents: progress.length, valid: study.candidates.length };
      rows.push(row); console.log(JSON.stringify(row));
    }
  }
  console.log(JSON.stringify({ checkedAtUtc: new Date().toISOString(), node: process.version, cpu: cpus()[0]?.model, intervals: dataset.intervals.length,
    method: "1-candidate warmup per arm/floor count; one run per grid. Candidate median within run; total includes baseline/validation but excludes Worker setup/structured clone/final owned freeze/UI. Progress gap includes baseline before first candidate. Synthetic local CPU evidence, not SLA. Browser cancellation measured separately.", rows }));
} finally { await server.close(); }

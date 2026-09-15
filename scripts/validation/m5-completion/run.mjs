import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { cpus, platform, arch, release } from "node:os";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createServer } from "vite";

const script = fileURLToPath(import.meta.url);
const root = resolve(dirname(script), "../../..");
const hash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const [mode, ...args] = process.argv.slice(2);
if (mode === "--worker") {
  const server = await createServer({ root, configFile: false, envDir: false, logLevel: "silent", server: { middlewareMode: true }, appType: "custom" });
  try {
    const probes = await server.ssrLoadModule("/scripts/validation/m5-completion/probes.ts");
    if (args[0] === "tz") console.log(JSON.stringify({ hash: hash(probes.timezoneProbe()), hostOffsetMinutes: new Date("2025-07-01T00:00:00Z").getTimezoneOffset() }));
    else if (args[0] === "step") console.log(JSON.stringify(probes.timeStepProbe(Number(args[1]))));
    else {
      const [floors, cases, year, step] = args.map(Number);
      const subject = probes.workload(floors, cases, year, step);
      const warmup = subject.run();
      const expected = hash(warmup);
      const elapsedMs = [];
      for (let iteration = 0; iteration < 3; iteration++) {
        const start = performance.now();
        const result = subject.run();
        elapsedMs.push(performance.now() - start);
        assert.equal(hash(result), expected, "non-deterministic workload result");
        for (const item of result.cases) assert(Number.isFinite(item.total.annualKWh) && item.total.annualKWh >= 0);
      }
      console.log(JSON.stringify({ floors, cases, year, step, intervals: subject.intervalCount, warmups: 1, iterations: 3,
        elapsedMs, medianMs: [...elapsedMs].sort((a, b) => a - b)[1], maxMs: Math.max(...elapsedMs),
        processHighWaterRssKiB: process.resourceUsage().maxRSS,
      }));
    }
  } finally { await server.close(); }
} else {
  if (mode !== undefined) throw new Error("Usage: node scripts/validation/m5-completion/run.mjs");
  const worker = (args, extraEnv = {}) => {
    const child = spawnSync(process.execPath, [script, "--worker", ...args.map(String)], { cwd: root, env: { ...process.env, ...extraEnv }, encoding: "utf8", windowsHide: true, timeout: 180000 });
    if (child.status !== 0) throw new Error(child.stderr || child.stdout || "validation worker failed");
    return JSON.parse(child.stdout.trim());
  };
  const timezones = ["UTC", "Asia/Tokyo", "America/Los_Angeles"].map(TZ => ({ TZ, ...worker(["tz"], { TZ }) }));
  assert.equal(new Set(timezones.map(v => v.hash)).size, 1, "host TZ changed calculation");
  assert.equal(new Set(timezones.map(v => v.hostOffsetMinutes)).size, 3, "TZ worker environments did not actually differ");
  const timeSteps = [60, 15, 5].map(step => worker(["step", step]));
  for (const result of timeSteps) {
    for (const component of ["diffuse", "ground"]) for (const field of ["withOverhangKWh", "withoutOverhangKWh"]) {
      assert(Math.abs(result[component][field] - timeSteps[0][component][field]) <= 1e-6, "interval energy conservation failed");
    }
    result.directDifferenceFrom60MinKWh = result.direct.withOverhangKWh - timeSteps[0].direct.withOverhangKWh;
  }
  const workloads = [];
  for (const floors of [1, 3, 10]) for (const cases of [1, 4]) for (const year of [2025, 2024]) {
    workloads.push(worker([floors, cases, year, 60]));
    console.log(`workload PASS: ${floors} floors / ${cases} cases / ${year}`);
  }
  workloads.push(worker([3, 4, 2025, 15]));
  const git = (...args) => {
    const child = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
    if (child.status !== 0) throw new Error("Git checkpoint unavailable");
    return child.stdout.trim();
  };
  const report = {
    measuredAtUtc: new Date().toISOString(), startingCheckpoint: git("rev-parse", "HEAD"), dirtyAtMeasurement: git("status", "--porcelain").length > 0,
    environment: { node: process.version, platform: platform(), arch: arch(), release: release(), cpu: cpus()[0]?.model },
    methodology: "Isolated Node/Vite SSR worker per workload; setup excluded, 1 warmup + 3 measured runs. RSS is whole-worker lifetime high-water, not incremental engine memory. Sequential measurements; no performance acceptance threshold. Synthetic constant Wh profiles, including nighttime DNI for sensitivity only; 5-minute is NOT an oracle.",
    timezones, timeSteps, workloads, status: "PASS",
  };
  const output = join(root, ".local-validation/m5-completion");
  await mkdir(output, { recursive: true });
  await writeFile(join(output, "measurements.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
}

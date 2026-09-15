import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { createServer } from "vite";

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, "../../..");
const args = process.argv.slice(2);
const mode = args.shift() ?? "--prepare";
if (!["--prepare", "--run"].includes(mode)) throw new Error("Use --prepare or --run [--radiance-bin DIRECTORY]");
let binaryDirectory;
if (args.length) {
  if (args.length !== 2 || args[0] !== "--radiance-bin") throw new Error("Unknown arguments");
  binaryDirectory = resolve(args[1]);
}
const text = (name) => readFileSync(join(directory, name), "utf8").replace(/\r\n/g, "\n");
const digest = (value) => createHash("sha256").update(value).digest("hex");
const protocol = JSON.parse(text("protocol.json"));
function git(...gitArgs) {
  const result = spawnSync("git", gitArgs, { cwd: root, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error("Unable to resolve source checkpoint");
  return result.stdout.trim();
}
const geometryTree = git("rev-parse", "HEAD:src/geometry");
if (geometryTree !== git("rev-parse", `${protocol.fslSourceCheckpoint}:src/geometry`)) {
  throw new Error("FSL geometry drift: define a new reviewed protocol instead of overwriting the checkpoint");
}
function executable(name) {
  const paths = binaryDirectory ? [binaryDirectory] : (process.env.PATH ?? "").split(delimiter);
  return paths.map((p) => join(p, name + (process.platform === "win32" ? ".exe" : ""))).find(existsSync);
}
const rtrace = executable("rtrace");
const oconv = executable("oconv");
const available = Boolean(rtrace && oconv);
const toolchain = {
  status: available ? "AVAILABLE" : "UNAVAILABLE",
  version: null,
  rtraceSha256: rtrace ? digest(readFileSync(rtrace)) : null,
  oconvSha256: oconv ? digest(readFileSync(oconv)) : null,
};
if (available && mode === "--run") {
  const version = spawnSync(rtrace, ["-version"], { encoding: "utf8", windowsHide: true, timeout: 10000 });
  if (version.status !== 0) throw new Error("Installed rtrace version probe failed; no reference PASS recorded");
  toolchain.version = (version.stdout || version.stderr).trim();
}

async function withTimeout(promise, child) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => { child.kill(); reject(new Error("rtrace timeout")); }, 10000);
    })]);
  } finally { clearTimeout(timer); }
}

async function traceCase(c, reference, outputDirectory) {
  const scene = reference.sceneText(c);
  const octreePath = join(outputDirectory, `${c.id}.oct`);
  await writeFile(join(outputDirectory, `${c.id}.rad`), scene);
  const compiled = spawnSync(oconv, protocol.oconvArgs, {
    input: scene, windowsHide: true, timeout: 15000, maxBuffer: 4 * 1024 * 1024,
  });
  await writeFile(join(outputDirectory, `${c.id}.oconv.log`), compiled.stderr ?? "");
  if (compiled.status !== 0 || !compiled.stdout?.length) throw new Error("oconv failed");
  await writeFile(octreePath, compiled.stdout);
  const child = spawn(rtrace, [...protocol.rtraceArgs, octreePath], { windowsHide: true });
  let processError = false;
  child.on("error", () => { processError = true; });
  child.stdin.on("error", () => { processError = true; });
  const finished = new Promise((resolveExit) => child.on("close", (code) => resolveExit(code)));
  const reader = createInterface({ input: child.stdout, crlfDelay: Infinity });
  const lines = reader[Symbol.asyncIterator]();
  const sent = [];
  const received = [];
  let stderr = "";
  child.stderr.on("data", (data) => { stderr += data; });
  const query = async (points) => {
    if (processError || sent.length + points.length > 2000) throw new Error("rtrace process error / fixed ray budget exceeded");
    const rays = points.map((point) => reference.rayLine(c, point));
    sent.push(...rays);
    child.stdin.write(rays.join("\n") + "\n");
    const hits = [];
    for (let i = 0; i < points.length; i += 1) {
      const line = await withTimeout(lines.next(), child);
      if (line.done) throw new Error("rtrace ended before all rays were answered");
      received.push(line.value);
      hits.push(reference.surfaceHit(line.value));
    }
    return hits;
  };
  const samples = [];
  try {
    for (const steps of protocol.sampling.bisectionSteps) {
      samples.push(await reference.sampleFraction(query, steps, protocol.sampling.edgeInsetFraction));
    }
    child.stdin.end();
    if (await withTimeout(finished, child) !== 0 || processError) throw new Error("rtrace failed");
    if (c.controlFraction !== undefined &&
      Math.abs(samples.at(-1).fraction - c.controlFraction) > samples.at(-1).integrationBound) {
      throw new Error("Independent no-hit/full-hit/analytical control failed");
    }
    return { samples, rayCount: sent.length, transcriptSha256: digest(sent.join("\n") + "\n--hits--\n" + received.join("\n")) };
  } finally {
    if (child.exitCode === null) child.kill();
    reader.close();
    await writeFile(join(outputDirectory, `${c.id}.rays.txt`), sent.join("\n") + "\n");
    await writeFile(join(outputDirectory, `${c.id}.hits.txt`), received.join("\n") + "\n");
    await writeFile(join(outputDirectory, `${c.id}.rtrace.log`), stderr);
  }
}

const server = await createServer({ root, configFile: false, envDir: false, logLevel: "silent", server: { middlewareMode: true }, appType: "custom" });
try {
  const reference = await server.ssrLoadModule("/scripts/validation/radiance-direct-shadow/reference.ts");
  const sut = await server.ssrLoadModule("/scripts/validation/radiance-direct-shadow/fsl-adapter.ts");
  let outputDirectory;
  if (mode === "--run" && available) {
    const parent = join(root, ".local-validation", "radiance-direct-shadow");
    await mkdir(parent, { recursive: true });
    outputDirectory = await mkdtemp(join(parent, "run-"));
  }
  const cases = [];
  for (const c of protocol.cases) {
    reference.validateCase(c);
    const result = {
      id: c.id, tolerance: protocol.tolerances[c.toleranceClass],
      sceneSha256: digest(reference.sceneText(c)),
      fslFraction: null, referenceFraction: null, absoluteError: null,
      status: "NOT_RUN", reason: available ? "PREPARE_ONLY" : "RADIANCE_UNAVAILABLE", samples: [],
    };
    let measurement;
    if (outputDirectory) {
      try { measurement = await traceCase(c, reference, outputDirectory); }
      catch { result.status = "UNRESOLVED"; result.reason = "REFERENCE_EXECUTION_OR_PROFILE_ERROR; inspect local transcripts"; }
    }
    // Reference queries have completed before obtaining the SUT value.
    result.fslFraction = sut.fslFraction(c);
    if (measurement) {
      Object.assign(result, measurement, reference.compareFraction(result.fslFraction, measurement.samples, result.tolerance, protocol.sampling.referenceBudgetShare));
      result.reason = result.status === "UNRESOLVED" ? "REFERENCE_CONVERGENCE_OR_TOLERANCE_MARGIN" : "MEASURED_COMPARISON";
    }
    cases.push(result);
  }
  const measuredErrors = cases.flatMap((c) => c.absoluteError === null ? [] : [c.absoluteError]);
  const report = {
    protocolId: protocol.id, protocolSha256: digest(text("protocol.json")),
    harnessSha256: digest(["reference.ts", "fsl-adapter.ts", "run.mjs"].map(text).join("\n--file--\n")),
    fslSourceCheckpoint: protocol.fslSourceCheckpoint, fslGeometryTree: geometryTree,
    toolchain, cases,
    counts: Object.fromEntries(["PASS", "FAIL", "UNRESOLVED", "NOT_RUN"].map((status) => [status, cases.filter((c) => c.status === status).length])),
    maxAbsoluteError: measuredErrors.length ? Math.max(...measuredErrors) : null,
  };
  if (outputDirectory) await writeFile(join(outputDirectory, "comparison.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  if (mode === "--run" && cases.some((c) => c.status !== "PASS")) process.exitCode = 2;
} finally { await server.close(); }

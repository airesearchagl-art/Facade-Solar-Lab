import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AXES, applyAxis, axisValues, candidateCount, generateCandidates, parameterValue, validateStudyDefinition } from "../src/explorer/sweep";
import { runStudy, transferCandidate, metricValue, studyInputKey } from "../src/explorer/study";
import { studyCsv } from "../src/explorer/export";
import { parseStudyPreset, studyPreset } from "../src/explorer/preset";
import { executeStudyRequest, type StudyMessage, type StudyRequest } from "../src/explorer/protocol";
import { StudyClient, type StudyWorker } from "../src/app/explorer-client";
import { ExplorerResults, ParametricExplorer } from "../src/app/components/ParametricExplorer";
import { createDemoComparisonWorkspace, createFinArrayDemoWorkspace } from "../src/demo/demo-scenario";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import { createComparisonWorkspace, runComparison } from "../src/comparison";
import { simulateFacade } from "../src/engine/facade-v2";
import { deriveFinLayout } from "../src/geometry/facade-v2";
import type { SweepAxis, SweepDefinition } from "../src/explorer/types";

const source = createDemoComparisonWorkspace().cases[0]!;
const fullWeather = createDemoWeatherDataset();
// Two solstice days retain real canonical solar/weather paths without repeating full-year work per unit test.
const weather = { ...fullWeather, coverage: "partial" as const, intervals: [...fullWeather.intervals.slice(24 * 171, 24 * 172), ...fullWeather.intervals.slice(24 * 354, 24 * 355)] };
const time = "2026-09-16T00:00:00.000Z";
const a: SweepAxis = { key: "overhang.depthM", min: .8, max: 2, step: .2 };
const one = { a };
const two: SweepDefinition = { a: { ...a, max: 1 }, b: { key: "solarHeatGainCoefficient", min: .3, max: .5, step: .2 } };
const execute = (sweep = one) => runStudy(weather, source, sweep, time);

describe("M9 deterministic sweep", () => {
  it("generates inclusive decimal grids without repeated-addition drift or forced max", () => {
    expect(axisValues(a)).toEqual([.8, 1, 1.2, 1.4, 1.6, 1.8, 2]);
    expect(axisValues({ ...a, min: .1, max: .3, step: .1 })).toEqual([.1, .2, .3]);
    expect(axisValues({ ...a, min: -1, max: -.5, step: .2 })).toEqual([-1, -.8, -.6]);
    expect(axisValues({ ...a, min: 1, max: 1 })).toEqual([1]);
  });
  it.each([{ min: NaN }, { max: Infinity }, { step: 0 }, { step: -1 }, { min: 3 }, { step: .0000001 }, { max: 1e30 }])("rejects invalid range %s", patch => {
    expect(() => axisValues({ ...a, ...patch })).toThrow();
  });
  it("rejects duplicate axes, fractional count and over-cap without truncating", () => {
    expect(() => candidateCount({ a, b: a })).toThrow(/同じ/);
    expect(() => axisValues({ key: "intermediateFins.layout.count", min: 1, max: 2, step: .5 })).toThrow(/整数/);
    expect(generateCandidates(source, { a: { ...a, min: 0, max: 63, step: 1 } })).toHaveLength(64);
    expect(() => generateCandidates(source, { a: { ...a, min: 0, max: 64, step: 1 } })).toThrow(/65/);
    expect(candidateCount({ a: { ...a, min: 0, max: 8, step: 1 }, b: { ...two.b!, min: 0, max: 7, step: 1 } })).toBe(72);
    expect(() => generateCandidates(source, { a: { ...a, min: 0, max: 8, step: 1 }, b: { ...two.b!, min: 0, max: 7, step: 1 } })).toThrow(/72/);
  });
  it("makes stable row-major IDs and independent full clones", () => {
    const before = JSON.stringify(source), candidates = generateCandidates(source, two);
    expect(candidates.map(c => [c.id, c.a, c.b])).toEqual([["candidate-1-1", .8, .3], ["candidate-1-2", 1, .3], ["candidate-2-1", .8, .5], ["candidate-2-2", 1, .5]]);
    expect(generateCandidates(source, two)).toEqual(candidates);
    expect(candidates[0]!.parameters.opening).not.toBe(source.parameters.opening);
    expect(candidates[0]!.parameters.opening).not.toBe(candidates[1]!.parameters.opening);
    expect(JSON.stringify(source)).toBe(before);
  });
  it("supports all 15 allowlisted axes and preserves all other fields", () => {
    const fin = { depthM: .6, bottomZM: .9, topZM: 3.3 };
    expect(AXES).toHaveLength(15);
    for (const axis of AXES) {
      const parameters = { ...source.parameters, leftFin: fin, rightFin: fin, intermediateFins: { ...fin, layout: axis.key.endsWith(".count") ? { mode: "count" as const, count: 4 } : { mode: "pitch" as const, pitchM: 1.5 } } };
      const changed = applyAxis(parameters, axis.key, 1);
      expect(parameterValue(changed, axis.key)).toBe(1);
      expect(changed).not.toBe(parameters);
      expect(changed.opening.centerXM).toBe(parameters.opening.centerXM);
    }
  });
  it("never inserts missing shapes or changes layout mode; invalid source refuses run", () => {
    for (const key of ["leftFin.depthM", "rightFin.depthM", "intermediateFins.layout.pitchM"] as const) expect(() => generateCandidates(source, { a: { ...a, key } })).toThrow(/有効/);
    expect(() => generateCandidates({ ...source, parameters: { ...source.parameters, overhang: undefined } }, one)).toThrow(/有効/);
    expect(() => generateCandidates(createFinArrayDemoWorkspace().cases[1]!, { a: { key: "intermediateFins.layout.count", min: 1, max: 2, step: 1 } })).toThrow(/枚数指定/);
    expect(() => validateStudyDefinition({ ...source, name: "" }, one)).toThrow(/元の案/);
  });
});

describe("M9 canonical integration, snapshot and export", () => {
  it.each([one, two])("matches direct canonical and normal comparison exactly in every cell", sweep => {
    const study = execute(sweep);
    expect(study.baseline).toEqual(simulateFacade(weather, source.parameters));
    for (const candidate of study.candidates) {
      expect(candidate.status).toBe("VALID");
      if (candidate.status !== "VALID") throw new Error("Expected valid fixture");
      const direct = simulateFacade(weather, candidate.parameters);
      expect(candidate.simulation).toEqual(direct);
      for (const period of ["annual", "cooling", "heating"] as const) expect(candidate.delta[period]).toBe(direct.summary[period].withOverhangKWh - study.baseline.summary[period].withOverhangKWh);
      const normal = runComparison(weather, createComparisonWorkspace({ id: "candidate", name: "candidate", parameters: candidate.parameters }));
      expect(candidate.simulation).toEqual(normal.cases[0]!.simulation);
    }
  });
  it("freezes owned snapshot/result but does not freeze or mutate source weather", () => {
    const baseline = JSON.stringify({ source, weather });
    const study = execute();
    expect(Object.isFrozen(study.snapshot.source.parameters.opening)).toBe(true);
    expect(Object.isFrozen(study.candidates[0])).toBe(true);
    expect(Object.isFrozen(weather.provenance)).toBe(false);
    expect(JSON.stringify({ source, weather })).toBe(baseline);
    expect(study.snapshot).toMatchObject({ weatherDatasetId: weather.id, intervalCount: 48, coverage: "partial", executedAt: time, generationVersion: "decimal-grid-v1", source });
    expect(studyInputKey(source, one)).not.toBe(studyInputKey({ ...source, name: "changed" }, one));
    expect(studyInputKey(source, one)).not.toBe(studyInputKey(source, two));
  });
  it("preserves invalid cells and zero-depth v1 / positive-depth v2 routing", () => {
    const finSource = createFinArrayDemoWorkspace().cases[1]!;
    const study = runStudy(weather, finSource, { a: { key: "intermediateFins.depthM", min: 0, max: .6, step: .6 } }, time);
    expect(study.candidates.map(c => c.status === "VALID" && c.simulation.modelVersion)).toEqual(["facade-v1-weather", "facade-v2-weather"]);
    for (const candidate of study.candidates) if (candidate.status === "VALID") expect(candidate.fins).toEqual(deriveFinLayout(6, candidate.parameters.intermediateFins!.layout));
    const invalid = execute({ a: { key: "opening.headZM", min: .5, max: 4, step: .5 } });
    expect(invalid.candidates[0]!.status).toBe("INVALID");
    expect(invalid.candidates.at(-1)!.status).toBe("INVALID");
    expect(invalid.candidates.some(c => c.status === "VALID")).toBe(true);
    expect(metricValue(invalid.candidates[0]!, "annual")).toBeNull();
    const csv = studyCsv(invalid);
    expect(csv).toContain('"INVALID"');
    const html = renderToStaticMarkup(<ExplorerResults study={invalid} selected="" onSelect={() => {}} metric="annual" metricLabel="読込期間" />);
    expect(html).toContain("計算値なし・0ではありません");
  });
  it("handles pitch > width as actual zero and count >128 as INVALID", () => {
    const finSource = createFinArrayDemoWorkspace().cases[1]!;
    const zero = runStudy(weather, finSource, { a: { key: "intermediateFins.layout.pitchM", min: 7, max: 7, step: 1 } }, time).candidates[0]!;
    expect(zero.status === "VALID" && zero.fins?.count).toBe(0);
    const counted = { ...finSource, parameters: { ...finSource.parameters, intermediateFins: { ...finSource.parameters.intermediateFins!, layout: { mode: "count" as const, count: 2 } } } };
    expect(runStudy(weather, counted, { a: { key: "intermediateFins.layout.count", min: 129, max: 129, step: 1 } }, time).candidates[0]!.status).toBe("INVALID");
  });
  it("transfers exact cloned inputs with collision-free identity, never overwrites max4", () => {
    const candidate = execute().candidates[1]!;
    const workspace = createDemoComparisonWorkspace();
    const next = transferCandidate(workspace, candidate, true), full = transferCandidate(next, candidate, true);
    expect(next.cases[2]!.parameters).toEqual(candidate.parameters);
    expect(next.cases[2]!.parameters).not.toBe(candidate.parameters);
    expect(next.cases[2]!.id).not.toBe(full.cases[3]!.id);
    expect(workspace.cases).toHaveLength(2);
    expect(() => transferCandidate(full, candidate, true)).toThrow(/最大4/);
    expect(() => transferCandidate(workspace, candidate, false)).toThrow();
    expect(() => transferCandidate(workspace, execute({ a: { ...a, min: -1, max: -1 } }).candidates[0]!, true)).toThrow();
  });
  it("exports every candidate + baseline, guarding text formula injection and preserving exact numbers", () => {
    const study = runStudy(weather, { ...source, name: '=HYPERLINK("bad")' }, one, time), csv = studyCsv(study);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.trim().split("\r\n")).toHaveLength(9);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain(String(study.baseline.summary.annual.withOverhangKWh));
    expect(csv).toContain('"baseline"');
    expect(csv).toContain("decimal-grid-v1");
  });
  it("round-trips input-only presets and rejects invalid/oversized JSON", () => {
    const serialized = studyPreset(source, two), parsed = parseStudyPreset(serialized);
    expect(parsed.source.parameters).toEqual(source.parameters); expect(parsed.sweep).toEqual(two);
    for (const privateKey of ["result", "intervals", "provenance", "localPath", "token", "executedAt"]) expect(serialized).not.toContain(`"${privateKey}"`);
    expect(() => parseStudyPreset("{bad")).toThrow();
    expect(() => parseStudyPreset(serialized.replace('"schemaVersion": 1', '"schemaVersion": 999'))).toThrow();
    expect(() => parseStudyPreset(' '.repeat(262145))).toThrow(/256/);
    expect(() => parseStudyPreset('あ'.repeat(90000))).toThrow(/256/);
    const extras = JSON.parse(serialized); extras.result = { secret: "discard" }; extras.sweep.a.localPath = "discard";
    expect(JSON.stringify(parseStudyPreset(JSON.stringify(extras)))).not.toContain("discard");
  });
  it("renders 1D reference and 2D exact cells/scatter with keyboard points", () => {
    const render = (sweep: SweepDefinition) => renderToStaticMarkup(<ExplorerResults study={execute(sweep)} selected="candidate-1-1" onSelect={() => {}} metric="annualDelta" metricLabel="合計差" />);
    expect(render(one)).toContain("基準案");
    const html = render(two);
    expect(html).toContain("Heatmap"); expect(html).toContain("Trade-off"); expect(html).toContain('tabindex="0"'); expect(html).toContain("読込期間合計");
    expect(renderToStaticMarkup(<ParametricExplorer dataset={null} source={source} caseCount={1} weatherLoading={false} onImport={() => {}} onTransfer={() => {}} />)).toContain("パラメトリック探索");
  });
});

describe("M9 worker protocol and lifecycle", () => {
  const input = { dataset: weather, source, sweep: two, executedAt: time };
  it("emits ordered progress and final complete; definition failures never complete", () => {
    const events: StudyMessage[] = [];
    executeStudyRequest({ ...input, type: "run", runId: 1 }, event => events.push(event));
    expect(events.filter(e => e.type === "progress").map(e => e.completed)).toEqual([0, 1, 2, 3, 4]);
    expect(events.at(-1)?.type).toBe("complete");
    const errors: StudyMessage[] = [];
    executeStudyRequest({ ...input, sweep: { a: { ...a, step: 0 } }, type: "run", runId: 2 }, e => errors.push(e));
    expect(errors.map(e => e.type)).toEqual(["error"]);
  });
  function fake(): StudyWorker & { stopped: boolean; sent: StudyRequest[] } {
    return { onmessage: null, onerror: null, onmessageerror: null, stopped: false, sent: [], postMessage(m) { this.sent.push(m); }, terminate() { this.stopped = true; } };
  }
  it("terminates canceled work and ignores queued old/wrong run IDs; completes once", () => {
    const workers: ReturnType<typeof fake>[] = [], events: StudyMessage[] = [];
    const client = new StudyClient(() => { const w = fake(); workers.push(w); return w; });
    const id = client.run(input, e => events.push(e)), old = workers[0]!;
    client.cancel(); expect(old.stopped).toBe(true);
    old.onmessage!({ data: { type: "complete", runId: id, result: execute(two) } } as MessageEvent<StudyMessage>);
    expect(events).toEqual([]);
    const next = client.run(input, e => events.push(e)), worker = workers[1]!;
    worker.onmessage!({ data: { type: "progress", runId: id, completed: 1, total: 4 } } as MessageEvent<StudyMessage>);
    expect(events).toEqual([]);
    worker.onmessage!({ data: { type: "complete", runId: next, result: execute(two) } } as MessageEvent<StudyMessage>);
    expect(events).toHaveLength(1); expect(worker.stopped).toBe(true);
    worker.onmessage!({ data: events[0]! } as MessageEvent<StudyMessage>); expect(events).toHaveLength(1);
  });
  it("reports worker error and terminates without main-thread fallback", () => {
    const worker = fake(), events: StudyMessage[] = [], client = new StudyClient(() => worker);
    client.run(input, e => events.push(e)); worker.onerror!({} as ErrorEvent);
    expect(events[0]?.type).toBe("error"); expect(worker.stopped).toBe(true);
  });
});

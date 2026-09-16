import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createMultiFloorDemoWorkspace } from "../src/multifloor/demo";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import { createMultiFloorWorkspace } from "../src/multifloor/case";
import { floorToFacadeV1Parameters } from "../src/multifloor/parameters";
import { runMultiFloorComparison } from "../src/multifloor/simulation";
import { simulateFacade } from "../src/engine/facade-v2";
import { AXES, axisValues, parameterValue, recommendedSweepAxis } from "../src/explorer/sweep";
import { floorSource, generateMultiCandidates, multiStudyInputKey, recommendedMultiAxis, validateMultiStudy, type MultiStudyInput, type MultiScope } from "../src/explorer/multi-sweep";
import { runMultiStudy, transferMultiCandidate } from "../src/explorer/multi-study";
import { multiStudyCsv, multiStudyPreset, parseMultiStudyPreset } from "../src/explorer/multi-export";
import { executeMultiStudyRequest, type MultiStudyMessage, type MultiStudyRequest } from "../src/explorer/multi-protocol";
import { MultiStudyClient, type MultiStudyWorker } from "../src/app/explorer-client";
import { MultiParametricExplorer } from "../src/app/components/MultiParametricExplorer";
import { FloorContribution, MultiParametricResults, multiChartStudy } from "../src/app/components/MultiParametricResults";

const source = createMultiFloorDemoWorkspace().cases[0]!;
const full = createDemoWeatherDataset();
const weather = { ...full, coverage: "partial" as const, intervals: [...full.intervals.slice(4104, 4128), ...full.intervals.slice(8496, 8520)] };
const time = "2026-09-16T00:00:00.000Z";
const input: MultiStudyInput = { source, selectedFloorId: source.floors[1]!.id, scope: "selected", sweep: { a: { key: "overhang.depthM", min: .8, max: 1, step: .2 } } };
const two = { ...input, sweep: { ...input.sweep, b: { key: "solarHeatGainCoefficient" as const, min: .3, max: .5, step: .2 } } };
const execute = (value = input) => runMultiStudy(weather, value, time);
const fin = { depthM: .6, bottomZM: .9, topZM: 3.3 };

describe("M10 candidate and source contracts", () => {
  it.each(["selected", "all"] as const)("generates exact full Multi clones in %s scope", scope => {
    const before = JSON.stringify(source), studyInput = { ...two, scope };
    const candidates = generateMultiCandidates(studyInput);
    expect(candidates.map(c => [c.id, c.a, c.b])).toEqual([["multi-candidate-1-1", .8, .3], ["multi-candidate-1-2", 1, .3], ["multi-candidate-2-1", .8, .5], ["multi-candidate-2-2", 1, .5]]);
    expect(generateMultiCandidates(studyInput)).toEqual(candidates);
    for (const candidate of candidates) {
      expect(candidate.affectedFloorIds).toEqual(scope === "selected" ? [input.selectedFloorId] : source.floors.map(f => f.id));
      for (const floor of candidate.definition.floors) {
        const original = source.floors.find(f => f.id === floor.id)!;
        expect(floor).not.toBe(original);
        if (scope === "selected" && floor.id !== input.selectedFloorId) expect(floor).toEqual(original);
        else { expect(floor.overhang!.depthM).toBe(candidate.a); expect(floor.solarHeatGainCoefficient).toBe(candidate.b); }
      }
    }
    expect(JSON.stringify(source)).toBe(before);
  });
  it.each(AXES.map(axis => axis.key))("reuses axis %s without shape insertion", key => {
    const withFins = { ...source, floors: source.floors.map(floor => ({ ...floor, leftFin: fin, rightFin: fin, intermediateFins: { ...fin, layout: key.endsWith(".count") ? { mode: "count" as const, count: 3 } : { mode: "pitch" as const, pitchM: 2 } } })) };
    const value = key === "opening.headZM" ? 3.4 : key === "overhang.elevationZM" ? 3.5 : 1;
    const candidate = generateMultiCandidates({ ...input, source: withFins, scope: "all", sweep: { a: { key, min: value, max: value, step: 1 } } })[0]!;
    for (const floor of candidate.definition.floors) expect(parameterValue(floorToFacadeV1Parameters(candidate.definition, floor), key)).toBe(value);
    expect(candidate.definition.floors[0]!.floorHeightM).toBe(source.floors[0]!.floorHeightM);
  });
  it("keeps building axes all-only, not an implicit change of other floors", () => {
    for (const key of ["facadeAzimuthDegFromNorth", "groundReflectance"] as const) expect(() => validateMultiStudy({ ...input, sweep: { a: { key, min: 0, max: 0, step: 1 } } })).toThrow(/建物共通/);
  });
  it("retains cap, duplicate, decimal and selection validation", () => {
    expect(generateMultiCandidates({ ...input, sweep: { a: { ...input.sweep.a, min: 0, max: 63, step: 1 } } })).toHaveLength(64);
    expect(() => generateMultiCandidates({ ...input, sweep: { a: { ...input.sweep.a, min: 0, max: 64, step: 1 } } })).toThrow(/65/);
    expect(() => validateMultiStudy({ ...input, sweep: { a: input.sweep.a, b: input.sweep.a } })).toThrow(/同じ/);
    expect(() => validateMultiStudy({ ...input, sweep: { a: { ...input.sweep.a, step: .0000001 } } })).toThrow(/小数6桁/);
    expect(() => validateMultiStudy({ ...input, selectedFloorId: "missing" })).toThrow(/選択階/);
    expect(() => validateMultiStudy({ ...input, scope: "bad" as MultiScope })).toThrow(/適用範囲/);
  });
  it("names every missing shape/layout floor and permits unaffected missing shapes", () => {
    const absent = { ...source, floors: source.floors.map((floor, i) => i === 1 ? floor : { ...floor, overhang: undefined }) };
    expect(validateMultiStudy({ ...input, source: absent })).toBe(2);
    expect(() => validateMultiStudy({ ...input, source: absent, scope: "all" })).toThrow(/1F.*3F/);
    const pitch = { ...source, floors: source.floors.map(floor => ({ ...floor, intermediateFins: { ...fin, layout: { mode: "pitch" as const, pitchM: 2 } } })) };
    expect(() => validateMultiStudy({ ...input, source: pitch, scope: "all", sweep: { a: { key: "intermediateFins.layout.count", min: 1, max: 2, step: 1 } } })).toThrow(/1F.*枚数指定.*2F.*3F/);
  });
  it("intersects geometry recommendations and respects floor height", () => {
    const changed = { ...source, floors: source.floors.map((floor, i) => ({ ...floor, opening: { ...floor.opening, heightM: 2.1 + i * .15 } })) };
    const elevation = recommendedMultiAxis(changed, input.selectedFloorId, "all", "overhang.elevationZM");
    expect(elevation.min).toBe(3.3); expect(elevation.max).toBe(3.8);
    const head = recommendedMultiAxis(changed, input.selectedFloorId, "all", "opening.headZM");
    expect(head.min).toBe(2.7); expect(head.max).toBe(3.6);
    for (const key of ["overhang.depthM", "solarHeatGainCoefficient", "groundReflectance"] as const) expect(recommendedMultiAxis(source, input.selectedFloorId, "all", key)).toEqual(recommendedSweepAxis(floorSource(source, source.floors[0]!), key));
    const impossible = { ...source, floors: source.floors.map((floor, i) => ({ ...floor, opening: { ...floor.opening, widthM: i === 1 ? 20 : 1 } })) };
    expect(() => recommendedMultiAxis(impossible, input.selectedFloorId, "all", "opening.widthM")).toThrow(/共通推奨範囲/);
    for (const key of AXES.map(axis => axis.key)) expect(axisValues(recommendedMultiAxis(source, input.selectedFloorId, "all", key)).length).toBeLessThanOrEqual(8);
  });
});
describe("M10 canonical route, results and exports", () => {
  it.each(["selected", "all"] as const)("matches normal Multi and direct per-floor engine exactly: %s", scope => {
    const study = execute({ ...two, scope });
    for (const candidate of study.candidates) {
      if (candidate.status !== "VALID") throw new Error("Expected valid fixture");
      expect(candidate.result).toEqual(runMultiFloorComparison(weather, createMultiFloorWorkspace(candidate.definition)).cases[0]);
      for (const [i, floor] of candidate.result.floors.entries()) {
        expect(floor.simulation).toEqual(simulateFacade(weather, floorToFacadeV1Parameters(candidate.definition, candidate.definition.floors[i]!)));
        for (const p of ["annual", "cooling", "heating"] as const) expect(candidate.floorDeltas[floor.floorId]![p]).toBe(floor.simulation.summary[p].withOverhangKWh - study.baseline.floors[i]!.simulation.summary[p].withOverhangKWh);
        if (scope === "selected" && floor.floorId !== input.selectedFloorId) expect(floor.simulation).toEqual(study.baseline.floors[i]!.simulation);
      }
      expect(candidate.result.total.annualKWh).toBe(candidate.result.floors.reduce((sum, floor) => sum + floor.simulation.summary.annual.withOverhangKWh, 0));
      expect(candidate.delta).toEqual({ annual: candidate.result.total.annualKWh - study.baseline.total.annualKWh, cooling: candidate.result.total.summerKWh - study.baseline.total.summerKWh, heating: candidate.result.total.winterKWh - study.baseline.total.winterKWh });
    }
  });
  it("keeps invalid whole-building candidates with floor reasons and continues", () => {
    const study = execute({ ...input, sweep: { a: { key: "overhang.elevationZM", min: 3, max: 3.6, step: .3 } } });
    expect(study.candidates.map(c => c.status)).toEqual(["INVALID", "VALID", "VALID"]);
    expect(study.candidates[0]).toMatchObject({ issues: [expect.stringMatching(/2F.*開口上端/)] });
    expect(study.candidates[0]).not.toHaveProperty("result");
    expect(multiStudyCsv(study)).toContain("INVALID");
  });
  it("owns immutable snapshots without freezing or mutating caller data", () => {
    const before = JSON.stringify({ weather, input }), study = execute();
    expect(Object.isFrozen(study.snapshot.source.floors[0]!.opening)).toBe(true);
    expect(Object.isFrozen(study.candidates[0])).toBe(true);
    expect(Object.isFrozen(weather.provenance)).toBe(false);
    expect(Object.isFrozen(source.floors)).toBe(false);
    expect(JSON.stringify({ weather, input })).toBe(before);
    expect(study.snapshot).toMatchObject({ source, scope: "selected", selectedFloorId: input.selectedFloorId, weatherDatasetId: weather.id, intervalCount: 48, generationVersion: "decimal-grid-v1" });
  });
  it("keys all source floors, order, selection, scope and ranges", () => {
    const variants = [{ ...input, scope: "all" as const }, { ...input, selectedFloorId: source.floors[0]!.id }, two,
      { ...input, source: { ...source, floors: [...source.floors].reverse() } }, { ...input, source: { ...source, floors: source.floors.slice(1) } },
      { ...input, source: { ...source, floors: source.floors.map((f, i) => i === 0 ? { ...f, solarHeatGainCoefficient: .6 } : f) } }];
    for (const variant of variants) expect(multiStudyInputKey(variant)).not.toBe(multiStudyInputKey(input));
  });
  it("transfers exact inputs and rejects stale/max4 without overwrite", () => {
    const candidate = execute().candidates[1]!;
    let workspace = createMultiFloorWorkspace(source);
    for (let i = 0; i < 3; i++) workspace = transferMultiCandidate(workspace, candidate, true);
    expect(workspace.cases[0]).toEqual(source);
    expect(workspace.cases[1]!.floors).toEqual(candidate.definition.floors);
    expect(workspace.cases[1]!.floors).not.toBe(candidate.definition.floors);
    expect(new Set(workspace.cases.map(c => c.id)).size).toBe(4);
    expect(() => transferMultiCandidate(workspace, candidate, true)).toThrow(/最大4/);
    expect(() => transferMultiCandidate(createMultiFloorWorkspace(source), candidate, false)).toThrow(/現在/);
  });
  it("round-trips input-only JSON; rejects corrupt selection and versions", () => {
    const text = multiStudyPreset(two);
    expect(parseMultiStudyPreset(text)).toEqual(two);
    for (const term of ["weather", "result", "executedAt", "provenance", "localPath", "token"]) expect(text).not.toContain(`"${term}"`);
    const injected = JSON.parse(text); injected.token = "secret"; injected.source.case.token = "secret"; injected.sweep.a.token = "secret";
    expect(JSON.stringify(parseMultiStudyPreset(JSON.stringify(injected)))).not.toContain("secret");
    expect(() => parseMultiStudyPreset(JSON.stringify({ ...injected, selectedFloorId: "missing" }))).toThrow(/選択階/);
    expect(() => parseMultiStudyPreset(JSON.stringify({ ...injected, schemaVersion: 2 }))).toThrow(/未対応/);
    expect(() => parseMultiStudyPreset(" ".repeat(256 * 1024 + 1))).toThrow(/256/);
  });
  it("exports baseline + building/floor rows, exact values, provenance and guarded text", () => {
    const study = execute({ ...input, source: { ...source, name: "=unsafe" } }), csv = multiStudyCsv(study);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(1 + (study.candidates.length + 1) * 4);
    expect(csv).toContain("'=unsafe");
    for (const term of ["floor", "building", "affected", "finLayout"]) expect(csv).toContain(`"${term}"`);
    expect(csv).toContain(String(study.baseline.total.annualKWh)); expect(csv).toContain("NOT_RUN");
  });
  it("renders charts, floor sums and partial labels without changing values", () => {
    const study = execute(two), before = JSON.stringify(study), candidate = study.candidates[0]!;
    if (candidate.status !== "VALID") throw new Error("valid");
    const html = renderToStaticMarkup(<><MultiParametricExplorer dataset={null} source={source} selectedFloorId={input.selectedFloorId} caseCount={1} weatherLoading={false} onTransfer={() => {}} onImport={() => {}} />
      <MultiParametricResults study={study} selected={candidate.id} onSelect={() => {}} metric="annual" metricLabel="読込期間合計" /><FloorContribution candidate={candidate} study={study} /></>);
    for (const text of ["複数階探索を設定する", "Heatmap", "Trade-off", "Floor Breakdown", "Building Total", "変更対象", "固定", "読込期間合計", "2F"]) expect(html).toContain(text);
    expect(multiChartStudy(study).candidates[0]).toMatchObject({ simulation: { summary: { annual: { withOverhangKWh: candidate.result.total.annualKWh } } } });
    expect(JSON.stringify(study)).toBe(before);
    expect(renderToStaticMarkup(<MultiParametricResults study={execute()} selected="" onSelect={() => {}} metric="annual" metricLabel="読込期間合計" />)).toContain("1D感度グラフ");
  });
});
describe("M10 worker transport reuses M9 cancellation guard", () => {
  const request: MultiStudyRequest = { type: "run", runId: 1, dataset: weather, input, executedAt: time };
  it("emits ordered progress, candidate, complete and explicit error", () => {
    const messages: MultiStudyMessage[] = [];
    executeMultiStudyRequest(request, message => messages.push(message));
    expect(messages.filter(m => m.type === "progress").map(m => m.completed)).toEqual([0, 1, 2]);
    expect(messages.at(-1)?.type).toBe("complete"); expect(messages[1]).toHaveProperty("candidate");
    executeMultiStudyRequest({ ...request, runId: 0 }, message => messages.push(message)); expect(messages.at(-1)?.type).toBe("error");
  });
  it("terminates, rejects queued old runs and reports worker failure", () => {
    const workers: (MultiStudyWorker & { stopped: boolean })[] = [];
    const client = new MultiStudyClient(() => {
      const worker: MultiStudyWorker & { stopped: boolean } = { stopped: false, onmessage: null, onerror: null, onmessageerror: null, postMessage() {}, terminate() { this.stopped = true; } };
      workers.push(worker); return worker;
    });
    const seen: MultiStudyMessage[] = [], receive = (m: MultiStudyMessage) => seen.push(m);
    const first = client.run(request, receive), old = workers[0]!;
    client.cancel(); expect(old.stopped).toBe(true);
    old.onmessage?.({ data: { type: "complete", runId: first, result: execute() } } as MessageEvent<MultiStudyMessage>); expect(seen).toHaveLength(0);
    const second = client.run(request, receive), current = workers[1]!;
    current.onmessage?.({ data: { type: "progress", runId: first, completed: 1, total: 2 } } as MessageEvent<MultiStudyMessage>); expect(seen).toHaveLength(0);
    current.onmessage?.({ data: { type: "complete", runId: second, result: execute() } } as MessageEvent<MultiStudyMessage>);
    expect(seen).toHaveLength(1); expect(current.stopped).toBe(true);
    client.run(request, receive); workers[2]!.onerror?.({} as ErrorEvent);
    expect(seen.at(-1)).toMatchObject({ type: "error", message: expect.stringContaining("main-thread") }); expect(workers[2]!.stopped).toBe(true);
  });
});

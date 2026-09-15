import { describe, expect, it } from "vitest";
import { simulateFacade, simulateFacadeV2, calculateFacadeV2IntervalIrradiance } from "../src/engine/facade-v2";
import { simulateFacadeV1, calculateFacadeV1IntervalIrradiance } from "../src/engine/facade-v1";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import { createComparisonCase, createComparisonWorkspace, runComparison, comparisonInputDifferences, duplicateComparisonCase } from "../src/comparison";
import { createMultiFloorCase, createMultiFloorDefinition, createMultiFloorWorkspace, runMultiFloorComparison, floorToFacadeV1Parameters, duplicateMultiFloorCase } from "../src/multifloor";
import { parseFacadePreset, serializeCasePreset, serializeWorkspacePreset } from "../src/preset";
import { parseMultiFloorPreset, serializeMultiFloorCasePreset, serializeMultiFloorWorkspacePreset } from "../src/multifloor/preset";
import { createComparisonCsv } from "../src/export";
import { createMultiFloorCsv } from "../src/multifloor/csv";

const weather = createDemoWeatherDataset();
const base = createComparisonCase("a", "A").parameters;
const fin = { depthM: 1.2, bottomZM: 0.9, topZM: 3.3 };
const parameters = { ...base, leftFin: fin, rightFin: { ...fin, depthM: 0.7 } };
const floor = { ...createMultiFloorDefinition("f1", "1F"), leftFin: fin, rightFin: parameters.rightFin };
const building = createMultiFloorCase("b1", "B1", [floor]);

describe("M7 canonical engine / input preservation", () => {
  it("v2 no-fin monthly and periods are bit-exact v1", () => {
    const v1 = simulateFacadeV1(weather, base), v2 = simulateFacadeV2(weather, base);
    expect(v2.monthly).toEqual(v1.monthly); expect(v2.summary).toEqual(v1.summary);
    expect(simulateFacade(weather, base)).toEqual(v1);
    expect(simulateFacade(weather, { ...base, leftFin: { ...fin, depthM: 0 } })).toEqual(v1);
  });
  it("fin-only direct substitution preserves diffuse/ground/unshaded gain", () => {
    const radiation = { globalHorizontalWhPerM2: 600, directNormalWhPerM2: 800, diffuseHorizontalWhPerM2: 100 };
    const solar = { azimuthDeg: 230, elevationDeg: 25 };
    const v1 = calculateFacadeV1IntervalIrradiance(base, radiation, solar), v2 = calculateFacadeV2IntervalIrradiance(parameters, radiation, solar);
    for (const key of ["diffuseWithOverhangWhPerM2", "diffuseWithoutOverhangWhPerM2", "groundReflectedWhPerM2", "totalWithoutOverhangWhPerM2"] as const) expect(v2[key]).toBe(v1[key]);
    expect(v2.directWithOverhangWhPerM2).toBeLessThan(v1.directWithOverhangWhPerM2);
  });
  it("single and one-floor composition exactly agree with v2", () => {
    const adapted = floorToFacadeV1Parameters(building, floor);
    const single = runComparison(weather, createComparisonWorkspace(createComparisonCase("a", "A", adapted))).cases[0]!.simulation;
    const multi = runMultiFloorComparison(weather, createMultiFloorWorkspace(building)).cases[0]!;
    expect(single.modelVersion).toBe("facade-v2-weather");
    expect(multi.floors[0]!.simulation).toEqual(single);
    expect(multi.total.annualKWh).toBe(single.summary.annual.withOverhangKWh);
    expect(multi.total.monthlyKWh).toEqual(single.monthly.map((m) => m.withOverhangKWh));
  });
  it("two floors sum independent canonical simulations without cross-floor effect", () => {
    const other = { ...floor, id: "f2", name: "2F", leftFin: { ...fin, topZM: 20 } };
    const item = createMultiFloorCase("b", "B", [floor, other]);
    const result = runMultiFloorComparison(weather, createMultiFloorWorkspace(item)).cases[0]!;
    expect(result.floors[0]!.simulation).toEqual(simulateFacade(weather, floorToFacadeV1Parameters(item, floor)));
    expect(result.total.annualKWh).toBe(result.floors.reduce((sum, f) => sum + f.simulation.summary.annual.withOverhangKWh, 0));
  });
  it("duplicates deep-copy fins in Single/Multi", () => {
    const single = duplicateComparisonCase(createComparisonWorkspace(createComparisonCase("a", "A", parameters)), "a", "b");
    expect(single.cases[1]!.parameters.leftFin).toEqual(fin);
    expect(single.cases[1]!.parameters.leftFin).not.toBe(single.cases[0]!.parameters.leftFin);
    const multi = duplicateMultiFloorCase(createMultiFloorWorkspace(building), "b1", "b2", "B2");
    expect(multi.cases[1]!.floors[0]!.leftFin).toEqual(fin);
    expect(multi.cases[1]!.floors[0]!.leftFin).not.toBe(multi.cases[0]!.floors[0]!.leftFin);
  });
  it("case difference lists enabled/depth/bottom/top without inventing absent dimensions", () => {
    const diff = comparisonInputDifferences(createComparisonCase("a", "A", base), createComparisonCase("b", "B", parameters));
    expect(diff.map((d) => d.key)).toEqual(["leftFin.enabled", "leftFin.depthM", "leftFin.bottomZM", "leftFin.topZM", "rightFin.enabled", "rightFin.depthM", "rightFin.bottomZM", "rightFin.topZM"]);
    expect(diff[1]!.baselineValue).toBe("—");
  });
});

describe("M7 versioned input-only presets and exports", () => {
  it("v1 Single reader migrates to absent fins and v1 identity", () => {
    const preset = parseFacadePreset(serializeCasePreset(createComparisonCase("a", "A", base)));
    expect(preset.schemaVersion).toBe(1);
    if (preset.kind !== "facade-solar-lab-case-preset") throw new Error("kind");
    expect(preset.parameters.leftFin).toBeUndefined();
    expect(simulateFacade(weather, preset.parameters)).toEqual(simulateFacadeV1(weather, base));
  });
  it("Single v2 case/workspace retains exact fin input only", () => {
    const item = createComparisonCase("a", "A", parameters);
    const a = parseFacadePreset(serializeCasePreset(item));
    const b = parseFacadePreset(serializeWorkspacePreset(createComparisonWorkspace(item), "a"));
    expect(a.schemaVersion).toBe(2); expect(a.geometryVersion).toBe("facade-v2");
    if (a.kind !== "facade-solar-lab-case-preset" || b.kind !== "facade-solar-lab-workspace-preset") throw new Error("kind");
    expect(a.parameters).toEqual(parameters); expect(b.cases[0]!.parameters).toEqual(parameters);
    expect(JSON.stringify(a)).not.toMatch(/result|weather|interval|raw/i);
  });
  it("v1 Multi remains readable with absent fins", () => {
    const preset = parseMultiFloorPreset(serializeMultiFloorCasePreset(createMultiFloorCase("a", "A")));
    expect(preset.schemaVersion).toBe(1);
    if (preset.kind !== "facade-solar-lab-multifloor-case-preset") throw new Error("kind");
    expect(preset.case.floors[0]!.leftFin).toBeUndefined();
  });
  it("Multi v2 case/workspace retains per-floor fins, order and selection", () => {
    const a = parseMultiFloorPreset(serializeMultiFloorCasePreset(building));
    const b = parseMultiFloorPreset(serializeMultiFloorWorkspacePreset(createMultiFloorWorkspace(building), "b1", "f1"));
    expect(a.schemaVersion).toBe(2); expect(b.schemaVersion).toBe(2);
    if (a.kind !== "facade-solar-lab-multifloor-case-preset" || b.kind !== "facade-solar-lab-multifloor-workspace-preset") throw new Error("kind");
    expect(a.case).toEqual(building); expect(b.cases[0]).toEqual(building); expect(b.selectedFloorId).toBe("f1");
    expect(JSON.stringify(b)).not.toMatch(/result|weather|interval|raw/i);
  });
  it.each([null, { depthM: -1, bottomZM: 0, topZM: 3 }, { depthM: "1", bottomZM: 0, topZM: 3 }, { depthM: 1, bottomZM: 3, topZM: 3 }])("rejects malformed v2 fin %j", (leftFin) => {
    const single = JSON.parse(serializeCasePreset(createComparisonCase("a", "A", parameters)));
    single.parameters.leftFin = leftFin;
    expect(() => parseFacadePreset(JSON.stringify(single))).toThrow();
    const multi = JSON.parse(serializeMultiFloorCasePreset(building));
    multi.case.floors[0].leftFin = leftFin;
    expect(() => parseMultiFloorPreset(JSON.stringify(multi))).toThrow();
  });
  it("does not silently drop fins in a mislabeled v1 preset", () => {
    const raw = JSON.parse(serializeCasePreset(createComparisonCase("a", "A", parameters)));
    raw.schemaVersion = 1;
    expect(() => parseFacadePreset(JSON.stringify(raw))).toThrow(/schemaVersion/);
  });
  it("new fin whitelist excludes untrusted embedded fields", () => {
    const raw = JSON.parse(serializeCasePreset(createComparisonCase("a", "A", parameters)));
    raw.parameters.leftFin.result = "private"; raw.parameters.leftFin.rawWeather = "private";
    const parsed = parseFacadePreset(JSON.stringify(raw));
    expect(JSON.stringify(parsed)).not.toContain("private");
  });
  it("CSV appends fin fields without changing legacy column offsets; injection stays protected", () => {
    const item = createComparisonCase("a", "=SUM(A1)", parameters);
    const single = createComparisonCsv(runComparison(weather, createComparisonWorkspace(item)), weather);
    expect(single).toContain("左フィン出幅_m"); expect(single).toContain("右フィン上端_m");
    expect(single).toContain("'=" ); expect(single).toContain("facade-v2-weather");
    const multi = createMultiFloorCsv(runMultiFloorComparison(weather, createMultiFloorWorkspace({ ...building, name: "=1+1" })), weather);
    expect(multi).toContain("左フィン出幅_m"); expect(multi).toContain("右フィン上端_m"); expect(multi).toContain("'=1+1");
    for (const csv of [single, multi]) {
      const lines = csv.trim().split("\r\n");
      const counts = lines.map((line) => line.split('","').length);
      expect(new Set(counts).size).toBe(1);
    }
  });
});

import { describe, expect, it } from "vitest";

import { simulateFacadeV1 } from "../src/engine";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import {
  acceptMultiFloorRun,
  addFloor,
  addMultiFloorCase,
  createMultiFloorCase,
  createMultiFloorDefinition,
  createMultiFloorDemoWorkspace,
  createMultiFloorWorkspace,
  deleteFloor,
  duplicateFloor,
  duplicateMultiFloorCase,
  floorToFacadeV1Parameters,
  markMultiFloorResultStale,
  replaceFloor,
  runMultiFloorComparison,
  setMultiFloorBaseline,
  validateMultiFloorCase,
} from "../src/multifloor";

function floor(id = "floor-1", name = "1F", depthM = 0.8) {
  return createMultiFloorDefinition(id, name, {
    id,
    name,
    floorHeightM: 3.8,
    opening: { centerXM: 0, widthM: 6, heightM: 2.4, sillHeightM: 0.9 },
    overhang: {
      depthM,
      elevationM: 3.6,
      leftExtensionM: 0.5,
      rightExtensionM: 0.5,
    },
    solarHeatGainCoefficient: 0.5,
  });
}

describe("M4.5 multi-floor domain", () => {
  it("creates one floor and preserves ordered add, duplicate, and delete operations", () => {
    let item = createMultiFloorCase("building-a", "建物案A", [floor()]);
    item = addFloor(item, floor("floor-2", "2F", 1.2));
    item = duplicateFloor(item, "floor-2", "floor-3", "3F");
    expect(item.floors.map((value) => value.name)).toEqual(["1F", "2F", "3F"]);
    expect(item.floors[2]).not.toBe(item.floors[1]);
    expect(item.floors[2]!.overhang).not.toBe(item.floors[1]!.overhang);
    const changed = replaceFloor(item, {
      ...item.floors[2]!,
      overhang: { ...item.floors[2]!.overhang!, depthM: 1.8 },
    });
    expect(changed.floors[1]!.overhang!.depthM).toBe(1.2);
    expect(deleteFloor(changed, "floor-2").floors.map((value) => value.id)).toEqual([
      "floor-1",
      "floor-3",
    ]);
    expect(() => deleteFloor(createMultiFloorCase("x", "x", [floor()]), "floor-1")).toThrow(/final floor/u);
  });

  it("deep-copies every floor when duplicating a Building Case", () => {
    const source = createMultiFloorCase("building-a", "A", [floor(), floor("floor-2", "2F")]);
    const workspace = duplicateMultiFloorCase(
      createMultiFloorWorkspace(source),
      source.id,
      "building-b",
      "B",
    );
    expect(workspace.cases[1]).not.toBe(workspace.cases[0]);
    expect(workspace.cases[1]!.floors[0]).not.toBe(workspace.cases[0]!.floors[0]);
    expect(workspace.cases[1]!.floors[0]!.opening).not.toBe(workspace.cases[0]!.floors[0]!.opening);
  });

  it("rejects invalid floor height, opening head, SHGC, ground, and non-finite inputs without clamping", () => {
    const base = createMultiFloorCase("building-a", "A", [floor()]);
    const issuePaths = (item: typeof base) => validateMultiFloorCase(item).map((issue) => issue.path);
    expect(issuePaths({ ...base, floors: [{ ...base.floors[0]!, floorHeightM: 0 }] })).toContain("floorHeightM");
    expect(issuePaths({ ...base, floors: [{ ...base.floors[0]!, opening: { ...base.floors[0]!.opening, heightM: 4 } }] })).toContain("opening.heightM");
    expect(issuePaths({ ...base, floors: [{ ...base.floors[0]!, opening: { ...base.floors[0]!.opening, sillHeightM: -0.1 } }] })).toContain("opening.sillHeightM");
    expect(issuePaths({ ...base, floors: [{ ...base.floors[0]!, solarHeatGainCoefficient: 0 }] })).toContain("solarHeatGainCoefficient");
    expect(issuePaths({ ...base, groundReflectance: 2 })).toContain("groundReflectance");
    expect(issuePaths({ ...base, floors: [{ ...base.floors[0]!, overhang: { ...base.floors[0]!.overhang!, elevationM: 3 } }] })).toContain("overhang.elevationM");
    expect(issuePaths({ ...base, floors: [{ ...base.floors[0]!, opening: { ...base.floors[0]!.opening, widthM: Number.NaN } }] })).toContain("opening.widthM");
  });

  it("aggregates three floors and calculates canonical Building total deltas", () => {
    const dataset = createDemoWeatherDataset();
    const workspace = createMultiFloorDemoWorkspace();
    const result = runMultiFloorComparison(dataset, workspace);
    expect(result.cases).toHaveLength(2);
    const baseline = result.cases[0]!;
    const alternative = result.cases[1]!;
    expect(baseline.floors).toHaveLength(3);
    expect(baseline.total.annualKWh).toBe(
      baseline.floors.reduce((sum, item) => sum + item.simulation.summary.annual.withOverhangKWh, 0),
    );
    expect(baseline.total.summerKWh).toBe(
      baseline.floors.reduce((sum, item) => sum + item.simulation.summary.cooling.withOverhangKWh, 0),
    );
    expect(baseline.total.winterKWh).toBe(
      baseline.floors.reduce((sum, item) => sum + item.simulation.summary.heating.withOverhangKWh, 0),
    );
    expect(baseline.total.monthlyKWh).toHaveLength(12);
    expect(baseline.total.monthlyKWh).toEqual(
      Array.from({ length: 12 }, (_, index) => baseline.floors.reduce(
        (sum, item) => sum + item.simulation.monthly[index]!.withOverhangKWh,
        0,
      )),
    );
    expect(baseline.deltaFromBaseline.annual).toEqual({ kWh: 0, percent: 0 });
    expect(alternative.deltaFromBaseline.annual.kWh).toBe(
      alternative.total.annualKWh - baseline.total.annualKWh,
    );
    expect(alternative.deltaFromBaseline.annual.percent).toBe(
      ((alternative.total.annualKWh - baseline.total.annualKWh) / baseline.total.annualKWh) * 100,
    );
    expect(alternative.deltaFromBaseline.monthly).toHaveLength(12);
  });

  it("matches a direct single-floor facade-v1 result exactly for every required summary", () => {
    const dataset = createDemoWeatherDataset();
    const item = createMultiFloorCase("building-a", "A", [floor()]);
    const direct = simulateFacadeV1(dataset, floorToFacadeV1Parameters(item, item.floors[0]!));
    const multi = runMultiFloorComparison(dataset, createMultiFloorWorkspace(item)).cases[0]!;
    expect(multi.total.annualKWh).toBe(direct.summary.annual.withOverhangKWh);
    expect(multi.total.summerKWh).toBe(direct.summary.cooling.withOverhangKWh);
    expect(multi.total.winterKWh).toBe(direct.summary.heating.withOverhangKWh);
    expect(multi.total.monthlyKWh).toEqual(direct.monthly.map((month) => month.withOverhangKWh));
  });

  it("supports one-to-four Building Cases and baseline selection", () => {
    const first = createMultiFloorCase("building-a", "A", [floor()]);
    let workspace = createMultiFloorWorkspace(first);
    for (const id of ["building-b", "building-c", "building-d"]) {
      workspace = addMultiFloorCase(workspace, createMultiFloorCase(id, id, [floor()]));
    }
    expect(setMultiFloorBaseline(workspace, "building-c").baselineCaseId).toBe("building-c");
    expect(() => addMultiFloorCase(workspace, createMultiFloorCase("building-e", "E", [floor()]))).toThrow(/at most 4/u);
  });

  it("marks prior results stale until an explicit rerun is accepted", () => {
    const result = runMultiFloorComparison(createDemoWeatherDataset(), createMultiFloorDemoWorkspace());
    expect(acceptMultiFloorRun(result)).toEqual({ result, dirty: false });
    expect(markMultiFloorResultStale(result)).toEqual({ result, dirty: true });
  });
});

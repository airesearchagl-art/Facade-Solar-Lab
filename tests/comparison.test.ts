import { describe, expect, it } from "vitest";

import {
  addComparisonCase,
  createComparisonCase,
  createComparisonWorkspace,
  DEFAULT_COMPARISON_PARAMETERS,
  deleteComparisonCase,
  duplicateComparisonCase,
  runComparison,
  setBaselineCase,
  validateComparisonCase,
  type ComparisonCase,
} from "../src/comparison";
import { parseEpw, type WeatherDataset } from "../src/weather";
import subhourFixture from "./fixtures/weather/synthetic-subhour.epw?raw";

const dataset = parseEpw(subhourFixture, {
  sourceName: "synthetic-subhour",
  sourceType: "synthetic",
});

function caseWith(
  id: string,
  name: string,
  overrides: Partial<ComparisonCase["parameters"]> = {},
): ComparisonCase {
  return createComparisonCase(id, name, {
    ...DEFAULT_COMPARISON_PARAMETERS,
    ...overrides,
    opening: {
      ...DEFAULT_COMPARISON_PARAMETERS.opening,
      ...overrides.opening,
    },
    ...(overrides.overhang === undefined
      ? { overhang: { ...DEFAULT_COMPARISON_PARAMETERS.overhang! } }
      : { overhang: overrides.overhang }),
  });
}

function zeroRadiationDataset(source: WeatherDataset): WeatherDataset {
  return {
    ...source,
    id: `${source.id}-zero`,
    intervals: source.intervals.map((interval) => ({
      ...interval,
      radiation: {
        globalHorizontalWhPerM2: 0,
        directNormalWhPerM2: 0,
        diffuseHorizontalWhPerM2: 0,
      },
    })),
  };
}

describe("comparison workspace", () => {
  it("runs one case and returns all twelve aligned months", () => {
    const result = runComparison(dataset, createComparisonWorkspace());
    expect(result.cases).toHaveLength(1);
    expect(result.cases[0]!.simulation.monthly.map((item) => item.month)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    );
    expect(result.cases[0]!.deltaFromBaseline.monthly).toHaveLength(12);
  });

  it("returns zero deltas for two identical cases", () => {
    const initial = createComparisonWorkspace(caseWith("a", "Case A"));
    const workspace = addComparisonCase(initial, caseWith("b", "Case B"));
    const result = runComparison(dataset, workspace);
    const baseline = result.cases[0]!.simulation;
    const second = result.cases[1]!;
    expect(second.deltaFromBaseline.annual).toEqual({ kWh: 0, percent: 0 });
    expect(second.deltaFromBaseline.cooling).toEqual({
      kWh: 0,
      percent:
        baseline.summary.cooling.withOverhangKWh === 0 ? null : 0,
    });
    expect(second.deltaFromBaseline.heating).toEqual({
      kWh: 0,
      percent:
        baseline.summary.heating.withOverhangKWh === 0 ? null : 0,
    });
  });

  it("switches baseline deterministically", () => {
    const initial = createComparisonWorkspace(caseWith("a", "Case A"));
    const withSecond = addComparisonCase(
      initial,
      caseWith("b", "Case B", { facadeAzimuthDegFromNorth: 90 }),
    );
    const result = runComparison(dataset, setBaselineCase(withSecond, "b"));
    expect(result.baselineCaseId).toBe("b");
    expect(result.cases[1]!.deltaFromBaseline.annual).toEqual({
      kWh: 0,
      percent: 0,
    });
  });

  it("reassigns a deleted baseline to the first remaining case", () => {
    const initial = createComparisonWorkspace(caseWith("a", "Case A"));
    const workspace = addComparisonCase(initial, caseWith("b", "Case B"));
    const deleted = deleteComparisonCase(workspace, "a");
    expect(deleted.cases.map((item) => item.id)).toEqual(["b"]);
    expect(deleted.baselineCaseId).toBe("b");
    expect(() => deleteComparisonCase(deleted, "b")).toThrow(/final/u);
  });

  it("limits add and duplicate operations to four cases", () => {
    let workspace = createComparisonWorkspace(caseWith("a", "Case A"));
    workspace = addComparisonCase(workspace, caseWith("b", "Case B"));
    workspace = addComparisonCase(workspace, caseWith("c", "Case C"));
    workspace = addComparisonCase(workspace, caseWith("d", "Case D"));
    expect(() => addComparisonCase(workspace, caseWith("e", "Case E"))).toThrow(
      /at most 4/u,
    );
    expect(() => duplicateComparisonCase(workspace, "a", "e")).toThrow(
      /at most 4/u,
    );
  });

  it("duplicates parameters under a new deterministic ID", () => {
    const workspace = duplicateComparisonCase(
      createComparisonWorkspace(caseWith("a", "Case A")),
      "a",
      "b",
      "Case B",
    );
    expect(workspace.cases[1]!.id).toBe("b");
    expect(workspace.cases[1]!.parameters).toEqual(workspace.cases[0]!.parameters);
    expect(workspace.cases[1]!.parameters).not.toBe(
      workspace.cases[0]!.parameters,
    );
    expect(workspace.cases[1]!.parameters.opening).not.toBe(
      workspace.cases[0]!.parameters.opening,
    );
  });

  it("calculates annual, summer, winter, and monthly deltas as case minus baseline", () => {
    const initial = createComparisonWorkspace(caseWith("a", "Case A"));
    const workspace = addComparisonCase(
      initial,
      caseWith("b", "Case B", { solarHeatGainCoefficient: 0.35 }),
    );
    const result = runComparison(dataset, workspace);
    const baseline = result.cases[0]!.simulation;
    const selected = result.cases[1]!;
    expect(selected.deltaFromBaseline.annual.kWh).toBeCloseTo(
      selected.simulation.summary.annual.withOverhangKWh -
        baseline.summary.annual.withOverhangKWh,
      12,
    );
    expect(selected.deltaFromBaseline.cooling.kWh).toBeCloseTo(
      selected.simulation.summary.cooling.withOverhangKWh -
        baseline.summary.cooling.withOverhangKWh,
      12,
    );
    expect(selected.deltaFromBaseline.heating.kWh).toBeCloseTo(
      selected.simulation.summary.heating.withOverhangKWh -
        baseline.summary.heating.withOverhangKWh,
      12,
    );
    expect(selected.deltaFromBaseline.monthly.map((item) => item.month)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    );
  });

  it("uses null percentage deltas when the baseline is zero", () => {
    const workspace = addComparisonCase(
      createComparisonWorkspace(caseWith("a", "Case A")),
      caseWith("b", "Case B"),
    );
    const result = runComparison(zeroRadiationDataset(dataset), workspace);
    expect(result.cases[1]!.deltaFromBaseline.annual).toEqual({
      kWh: 0,
      percent: null,
    });
    expect(result.cases[1]!.deltaFromBaseline.monthly).toHaveLength(12);
    expect(
      result.cases[1]!.deltaFromBaseline.monthly.every(
        (item) => item.percent === null,
      ),
    ).toBe(true);
  });
});

describe("comparison validation", () => {
  it("rejects an invalid opening", () => {
    const item = caseWith("a", "Case A", {
      opening: { centerXM: 0, widthM: 0, sillZM: 1, headZM: 1 },
    });
    const paths = validateComparisonCase(item).map((finding) => finding.path);
    expect(paths).toContain("opening.widthM");
    expect(paths).toContain("opening.headZM");
  });

  it("rejects invalid overhang dimensions", () => {
    const item = caseWith("a", "Case A", {
      overhang: {
        depthM: -1,
        elevationZM: 3,
        leftExtensionM: -0.1,
        rightExtensionM: -0.2,
      },
    });
    const paths = validateComparisonCase(item).map((finding) => finding.path);
    expect(paths).toContain("overhang.depthM");
    expect(paths).toContain("overhang.elevationZM");
    expect(paths).toContain("overhang.leftExtensionM");
    expect(paths).toContain("overhang.rightExtensionM");
  });

  it("rejects invalid SHGC and ground reflectance", () => {
    const item = caseWith("a", "Case A", {
      solarHeatGainCoefficient: 0,
      groundReflectance: 1.1,
    });
    const paths = validateComparisonCase(item).map((finding) => finding.path);
    expect(paths).toContain("solarHeatGainCoefficient");
    expect(paths).toContain("groundReflectance");
  });

  it("rejects non-finite numeric input", () => {
    const item = caseWith("a", "Case A", {
      facadeAzimuthDegFromNorth: Number.NaN,
    });
    expect(validateComparisonCase(item)).toContainEqual(
      expect.objectContaining({ path: "facadeAzimuthDegFromNorth" }),
    );
  });
});

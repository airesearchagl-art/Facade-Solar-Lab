import { describe, expect, it } from "vitest";

import { runComparison } from "../src/comparison";
import {
  DEMO_BASELINE_PARAMETERS,
  createDemoComparisonWorkspace,
} from "../src/demo/demo-scenario";
import {
  DEMO_WEATHER_DATASET_ID,
  createDemoWeatherDataset,
} from "../src/demo/demo-weather";

function expectFinite(value: number | null): void {
  if (value !== null) expect(Number.isFinite(value)).toBe(true);
}

describe("visible synthetic demo comparison", () => {
  it("creates the same finite canonical full-year dataset every time", () => {
    const first = createDemoWeatherDataset();
    const second = createDemoWeatherDataset();

    expect(first).toEqual(second);
    expect(first.id).toBe(DEMO_WEATHER_DATASET_ID);
    expect(first.provenance).toMatchObject({
      sourceType: "synthetic",
      sourceName: "Synthetic Demo Weather",
    });
    expect(first.intervals).toHaveLength(8760);
    expect([...new Set(first.intervals.map((item) => item.time.month))]).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    );
    for (const interval of first.intervals) {
      expectFinite(interval.radiation.globalHorizontalWhPerM2);
      expectFinite(interval.radiation.directNormalWhPerM2);
      expectFinite(interval.radiation.diffuseHorizontalWhPerM2);
    }
  });

  it("runs the exact two-case demo through facade-v1-weather", () => {
    const dataset = createDemoWeatherDataset();
    const workspace = createDemoComparisonWorkspace();
    const result = runComparison(dataset, workspace);

    expect(workspace.cases).toHaveLength(2);
    expect(workspace.baselineCaseId).toBe("case-a");
    expect(workspace.cases[0]!.parameters).toEqual(DEMO_BASELINE_PARAMETERS);
    expect(workspace.cases[1]!.parameters).toEqual({
      ...DEMO_BASELINE_PARAMETERS,
      overhang: { ...DEMO_BASELINE_PARAMETERS.overhang!, depthM: 1.6 },
    });
    expect(result.cases).toHaveLength(2);
    expect(result.cases[0]!.simulation.modelVersion).toBe("facade-v1-weather");
    for (const item of result.cases) {
      expect(item.simulation.monthly).toHaveLength(12);
      expect(item.deltaFromBaseline.monthly).toHaveLength(12);
      for (const month of item.simulation.monthly) {
        expectFinite(month.withOverhangKWh);
        expectFinite(month.withoutOverhangKWh);
      }
      for (const delta of item.deltaFromBaseline.monthly) {
        expectFinite(delta.kWh);
        expectFinite(delta.percent);
      }
      for (const period of ["annual", "cooling", "heating"] as const) {
        expectFinite(item.simulation.summary[period].withOverhangKWh);
        expectFinite(item.simulation.summary[period].withoutOverhangKWh);
        expectFinite(item.deltaFromBaseline[period].kWh);
        expectFinite(item.deltaFromBaseline[period].percent);
      }
    }
    expect(result.cases[1]!.simulation.summary.annual.withOverhangKWh).not.toBe(
      result.cases[0]!.simulation.summary.annual.withOverhangKWh,
    );
  });
});

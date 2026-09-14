import { describe, expect, it } from "vitest";

import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import {
  createMultiFloorCsv,
  createMultiFloorDemoWorkspace,
  runMultiFloorComparison,
} from "../src/multifloor";

describe("M4.5 multi-floor CSV", () => {
  it("exports Building and Floor rows with Excel-safe encoding and monthly values", () => {
    const dataset = createDemoWeatherDataset();
    const result = runMultiFloorComparison(dataset, createMultiFloorDemoWorkspace());
    const csv = createMultiFloorCsv(result, dataset);
    const lines = csv.split("\r\n");
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.replaceAll("\r\n", "")).not.toContain("\n");
    expect(lines).toHaveLength(10);
    const columnCounts = lines.slice(0, -1).map((line) => line.split('\",\"').length);
    expect(new Set(columnCounts).size).toBe(1);
    expect(csv).toContain('"Building"');
    expect(csv).toContain('"Floor"');
    expect(csv).toContain('"年間基準案差_kWh"');
    expect(csv).toContain('"12月_kWh"');
    expect(csv).not.toMatch(/NaN|Infinity/u);
  });

  it("neutralizes formula prefixes in user-facing names", () => {
    const dataset = createDemoWeatherDataset();
    const workspace = createMultiFloorDemoWorkspace();
    const unsafe = {
      ...workspace,
      cases: [{ ...workspace.cases[0]!, name: "=SUM(A1:A2)" }, workspace.cases[1]!],
    };
    const csv = createMultiFloorCsv(runMultiFloorComparison(dataset, unsafe), dataset);
    expect(csv).toContain('"\'=SUM(A1:A2)"');
  });
});

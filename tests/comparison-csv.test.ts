import { describe, expect, it } from "vitest";

import { renameComparisonCase, runComparison } from "../src/comparison";
import { createDemoComparisonWorkspace } from "../src/demo/demo-scenario";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import { createComparisonCsv } from "../src/export";

describe("comparison CSV export", () => {
  it("creates an Excel-friendly wide CSV with all period and monthly values", () => {
    const dataset = createDemoWeatherDataset();
    const result = runComparison(dataset, createDemoComparisonWorkspace());
    const csv = createComparisonCsv(result, dataset);
    const lines = csv.split("\r\n");

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.replaceAll("\r\n", "")).not.toContain("\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toContain('"年間_庇あり_kWh"');
    expect(lines[0]).toContain('"夏期_基準案差_pct"');
    expect(lines[0]).toContain('"冬期_庇なし_kWh"');
    for (let month = 1; month <= 12; month += 1) {
      expect(lines[0]).toContain(`"${month}月_kWh"`);
    }
    expect(csv).toContain("デモ用合成気象データ");
    expect(csv).toContain("実測気象ではありません");
    expect(csv).toContain("性能検証用データではありません");
    expect(csv).not.toMatch(/NaN|Infinity/u);
  });

  it("quotes cells and neutralizes spreadsheet formulas in user-entered names", () => {
    const dataset = createDemoWeatherDataset();
    const workspace = renameComparisonCase(
      createDemoComparisonWorkspace(),
      "case-a",
      '=SUM(A1:A2), "unsafe"',
    );
    const csv = createComparisonCsv(runComparison(dataset, workspace), dataset);

    expect(csv).toContain('"\'=SUM(A1:A2), ""unsafe"""');
  });
});

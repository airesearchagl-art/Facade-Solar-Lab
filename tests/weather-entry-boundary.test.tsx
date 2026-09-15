import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PrintReportSummary, ResultsPanel, WeatherPanel as SingleWeatherPanel } from "../src/app/App";
import { MultiFloorResults } from "../src/app/components/MultiFloorResults";
import { MultiFloorPrintSummary, WeatherPanel as MultiWeatherPanel } from "../src/app/components/MultiFloorWorkspace";
import { WeatherCoverageNotice, weatherPeriodLabels } from "../src/app/weather-coverage";
import { parseBrowserEpwFile } from "../src/app/weather-file";
import { createDemoComparisonWorkspace } from "../src/demo/demo-scenario";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import { runComparison } from "../src/comparison";
import { createMultiFloorDemoWorkspace, runMultiFloorComparison } from "../src/multifloor";
import { assertWeatherDatasetUsable, hasWeatherErrors, WeatherDataError } from "../src/weather";
import hourlyFixture from "./fixtures/weather/synthetic-hourly.epw?raw";
import subhourFixture from "./fixtures/weather/synthetic-subhour.epw?raw";

const singleWorkspace = createDemoComparisonWorkspace();
const multiWorkspace = createMultiFloorDemoWorkspace();

function readEpw(text: string) {
  return parseBrowserEpwFile({ name: "synthetic-entry-boundary.epw", text: async () => text } as File);
}

function withRadiation(index: number, value: string): string {
  const lines = hourlyFixture.trimEnd().split(/\r?\n/u);
  const fields = lines[8]!.split(",");
  fields[index] = value;
  lines[8] = fields.join(",");
  return lines.join("\n");
}

function partialEpw(month: number): string {
  const lines = hourlyFixture.trimEnd().split(/\r?\n/u);
  lines[7] = `DATA PERIODS,1,1,Data,Wednesday,${month}/1,${month}/1`;
  const fields = lines[8]!.split(",");
  fields[1] = String(month);
  fields[3] = "13";
  lines[8] = fields.join(",");
  return lines.join("\n");
}

describe("P0-C weather entry rejection characterization", () => {
  for (const [field, index, property] of [
    ["GHI", 13, "globalHorizontalWhPerM2"],
    ["DNI", 14, "directNormalWhPerM2"],
    ["DHI", 15, "diffuseHorizontalWhPerM2"],
  ] as const) {
    it.each(["", " \t ", "9999"])(`${field} rejects blank / whitespace / missing sentinel %j without zero fill`, async (value) => {
      const dataset = await readEpw(withRadiation(index, value));
      expect(dataset.issues).toContainEqual(expect.objectContaining({ code: "RADIATION_MISSING", severity: "error", field, line: 9 }));
      expect(dataset.intervals[0]!.radiation[property]).toBeNull();
      expect(hasWeatherErrors(dataset.issues)).toBe(true);
      expect(() => assertWeatherDatasetUsable(dataset)).toThrow(WeatherDataError);
      expect(() => runComparison(dataset, singleWorkspace)).toThrow(WeatherDataError);
      expect(() => runMultiFloorComparison(dataset, multiWorkspace)).toThrow(WeatherDataError);
    });

    it(`${field} retains an explicit zero as valid, unlike a blank field`, async () => {
      const dataset = await readEpw(withRadiation(index, "0"));
      expect(dataset.issues).toEqual([]);
      expect(dataset.intervals[0]!.radiation[property]).toBe(0);
      expect(() => assertWeatherDatasetUsable(dataset)).not.toThrow();
    });
  }

  it("rejects a truncated row missing the radiation columns", async () => {
    const lines = hourlyFixture.trimEnd().split(/\r?\n/u);
    lines[8] = lines[8]!.split(",").slice(0, 13).join(",");
    const dataset = await readEpw(lines.join("\n"));
    expect(dataset.issues).toContainEqual(expect.objectContaining({ code: "ROW_MALFORMED", severity: "error" }));
    expect(() => runComparison(dataset, singleWorkspace)).toThrow(WeatherDataError);
    expect(() => runMultiFloorComparison(dataset, multiWorkspace)).toThrow(WeatherDataError);
  });

  it("rejects two DATA PERIODS before returning a usable browser dataset", async () => {
    const text = hourlyFixture.replace(/DATA PERIODS[^\r\n]*/u,
      "DATA PERIODS,2,1,Winter,Wednesday,1/1,1/1,Summer,Tuesday,7/1,7/1");
    await expect(readEpw(text)).rejects.toMatchObject({
      issues: [expect.objectContaining({ code: "DATA_PERIOD_UNSUPPORTED", severity: "error", line: 8 })],
    });
  });
});

describe("P0-C partial display regression (baseline used unqualified annual / season labels)", () => {
  it.each([1, 7])("single-floor month %i labels observed sums and warns on screen / print without changing values", async (month) => {
    const dataset = await readEpw(partialEpw(month));
    expect(dataset.coverage).toBe("partial");
    expect(dataset.issues).toEqual([]);
    const result = runComparison(dataset, singleWorkspace);
    const before = JSON.stringify(result);
    const html = renderToStaticMarkup(<ResultsPanel result={result} isDemo={false} colors={{}} coverage={dataset.coverage} />);
    expect(html).toContain("読込期間合計の日射熱取得");
    expect(html).toContain("夏期の読込分の日射熱取得");
    expect(html).toContain("冬期の読込分の日射熱取得");
    expect(html).toContain("4〜9月の読込区間のみ");
    expect(html).toContain("10〜3月の読込区間のみ");
    expect(html).not.toContain("年間の日射熱取得");
    const weather = renderToStaticMarkup(<SingleWeatherPanel dataset={dataset} loading={false} failure={null}
      isDemo={false} onDemo={() => undefined} onFile={() => undefined} />);
    const print = renderToStaticMarkup(<PrintReportSummary dataset={dataset} result={result} colors={{}} />);
    for (const markup of [html, weather, print]) {
      expect(markup).toContain("部分期間の気象データ");
      expect(markup).toContain("通年結果ではありません");
      expect(markup).toContain("未読込期間の0は日射量ゼロの確認ではなく");
    }
    expect(print).toContain("print-report-summary");
    expect(JSON.stringify(result)).toBe(before);
    for (const item of result.cases) {
      const summary = item.simulation.summary;
      expect(summary.annual.withOverhangKWh).toBeGreaterThan(0);
      expect(summary.annual).toEqual(summary[month === 1 ? "heating" : "cooling"]);
      expect(summary[month === 1 ? "cooling" : "heating"].withOverhangKWh).toBe(0);
      expect(item.simulation.monthly[month - 1]!.withOverhangKWh).toBe(summary.annual.withOverhangKWh);
    }
  });

  it.each([1, 7])("multi-floor month %i labels Building Total / floor / delta / print as observed-only", async (month) => {
    const dataset = await readEpw(partialEpw(month));
    const result = runMultiFloorComparison(dataset, multiWorkspace);
    const before = JSON.stringify(result);
    const html = renderToStaticMarkup(<MultiFloorResults result={result} dataset={dataset}
      selectedCaseId={multiWorkspace.cases[0]!.id} selectedFloorId={multiWorkspace.cases[0]!.floors[0]!.id}
      onSelectCase={() => undefined} onSelectFloor={() => undefined} />);
    expect(html).toContain("読込期間合計</th>");
    expect(html).toContain("夏期の読込分（4〜9月）");
    expect(html).toContain("冬期の読込分（10〜3月）");
    expect(html).not.toMatch(/>年間<|>夏期<|>冬期</u);
    // These tables include both screen and all-floor print content.
    const tables = html.match(/<table[^>]*class="data-table (?:story-comparison-table|floor-result-table)"[\s\S]*?<\/table>/gu)!;
    expect(tables.length).toBeGreaterThan(4);
    for (const table of tables) {
      expect(table).toContain("読込期間合計</th>");
      expect(table).toContain("夏期の読込分</th>");
      expect(table).toContain("冬期の読込分</th>");
    }
    const weather = renderToStaticMarkup(<MultiWeatherPanel dataset={dataset} loading={false} failure={null}
      onDemo={() => undefined} onFile={() => undefined} />);
    const print = renderToStaticMarkup(<MultiFloorPrintSummary dataset={dataset} result={result} />);
    for (const markup of [html, weather, print]) {
      expect(markup).toContain("部分期間の気象データ");
      expect(markup).toContain("通年結果ではありません");
    }
    expect(print).toContain("multifloor-print-summary");
    expect(JSON.stringify(result)).toBe(before);
    for (const item of result.cases) {
      expect(item.total.annualKWh).toBeGreaterThan(0);
      expect(item.total.annualKWh).toBe(item.total[month === 1 ? "winterKWh" : "summerKWh"]);
      expect(item.total[month === 1 ? "summerKWh" : "winterKWh"]).toBe(0);
    }
  });

  it("also warns for the existing partial sub-hour fixture without a new temporal classifier", async () => {
    const dataset = await readEpw(subhourFixture);
    expect(dataset.coverage).toBe("partial");
    expect(dataset.issues).toEqual([]);
    expect(weatherPeriodLabels(dataset.coverage).annual).toBe("読込期間合計");
    expect(renderToStaticMarkup(<WeatherCoverageNotice coverage={dataset.coverage} />)).toContain("通年結果ではありません");
  });

  it.each(["full-year-8760", "full-leap-year-8784", "full-year-subhour"] as const)("preserves existing full-year display policy for %s", (coverage) => {
    // Presentation contract only, not a new claim of sub-hour temporal validation.
    expect(weatherPeriodLabels(coverage)).toEqual({ annual: "年間", summer: "夏期", winter: "冬期" });
    expect(renderToStaticMarkup(<WeatherCoverageNotice coverage={coverage} />)).toBe("");
  });

  it("retains full-year demo labels and does not add partial warnings in either mode", () => {
    const dataset = createDemoWeatherDataset();
    expect(dataset.coverage).toBe("full-year-8760");
    const single = runComparison(dataset, singleWorkspace);
    const multi = runMultiFloorComparison(dataset, multiWorkspace);
    const singleHtml = renderToStaticMarkup(<ResultsPanel result={single} isDemo colors={{}} coverage={dataset.coverage} />);
    const multiHtml = renderToStaticMarkup(<MultiFloorResults result={multi} dataset={dataset}
      selectedCaseId={multiWorkspace.cases[0]!.id} selectedFloorId={multiWorkspace.cases[0]!.floors[0]!.id}
      onSelectCase={() => undefined} onSelectFloor={() => undefined} />);
    expect(singleHtml).toContain("年間の日射熱取得");
    expect(singleHtml).toContain("夏期の日射熱取得");
    expect(singleHtml).toContain("冬期の日射熱取得");
    expect(multiHtml).toContain(">年間</th>");
    expect(multiHtml).toContain("夏期（4〜9月）");
    expect(multiHtml).toContain("冬期（10〜3月）");
    for (const html of [singleHtml, multiHtml]) expect(html).not.toContain("通年結果ではありません");
  });
});

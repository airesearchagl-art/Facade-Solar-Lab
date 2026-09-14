import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PrintGeometryComparison } from "../src/app/App";
import { CaseColorPicker, CaseMarker, getCaseStyle } from "../src/app/case-colors";
import { FloorMonthlyChart, caseFloorSeries } from "../src/app/components/FloorMonthlyChart";
import { MonthlyChart } from "../src/app/components/MonthlyChart";
import { MultiFloorResults, storyMonthlySeries } from "../src/app/components/MultiFloorResults";
import { runComparison } from "../src/comparison";
import { createDemoComparisonWorkspace } from "../src/demo/demo-scenario";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import { createComparisonCsv } from "../src/export";
import { createMultiFloorCsv, createMultiFloorDemoWorkspace, runMultiFloorComparison, serializeMultiFloorWorkspacePreset } from "../src/multifloor";
import { serializeWorkspacePreset } from "../src/preset";

const dataset = createDemoWeatherDataset();
const single = createDemoComparisonWorkspace();
const multi = createMultiFloorDemoWorkspace();
const singleResult = runComparison(dataset, single);
const multiResult = runMultiFloorComparison(dataset, multi);
const colors = { "case-a": "#0055cc", "case-b": "#d00080", "building-a": "#0055cc", "building-b": "#d00080" };

describe("session-only Case colors", () => {
  it("keeps the existing four Case colors and index-based monochrome dash patterns", () => {
    expect([0, 1, 2, 3].map((index) => getCaseStyle({}, "case", index))).toEqual([
      { color: "#ca5a2e", dash: undefined }, { color: "#176b73", dash: "10 5" },
      { color: "#7f5aa2", dash: "3 5" }, { color: "#647438", dash: "14 4 3 4" },
    ]);
  });

  it("binds custom colors to Case ID, not a baseline or reordered index, and rejects invalid CSS", () => {
    expect(getCaseStyle(colors, "case-b", 0).color).toBe("#d00080");
    expect(getCaseStyle(colors, "case-b", 3)).toEqual({ color: "#d00080", dash: "14 4 3 4" });
    expect(getCaseStyle(colors, "new-case", 2).color).toBe("#7f5aa2");
    expect(getCaseStyle({ a: "url(https://example.invalid)" }, "a", 0).color).toBe("#ca5a2e");
  });

  it("exposes a named native color input and keeps the Case letter readable for white", () => {
    const html = renderToStaticMarkup(<CaseColorPicker caseName="案B" value="#d00080" onChange={() => undefined} />);
    expect(html).toContain('type="color"');
    expect(html).toContain('aria-label="案Bの表示色"');
    expect(html).toContain("このセッションのみ");
    const marker = renderToStaticMarkup(<CaseMarker colors={{ b: "#ffffff" }} caseId="b" index={1} />);
    expect(marker).toContain('style="border-color:#ffffff"');
    expect(marker).toContain(">B</span>");
  });

  it("shares Single-floor colors across chart, legend, exact table and print geometry", () => {
    const html = renderToStaticMarkup(<MonthlyChart result={singleResult} colors={colors} />);
    for (const color of ["#0055cc", "#d00080"]) {
      expect(html).toContain(`stroke="${color}"`);
      expect(html).toContain(`border-color:${color}`);
      expect(renderToStaticMarkup(<PrintGeometryComparison result={singleResult} dataset={dataset} colors={colors} />)).toContain(`border-color:${color}`);
    }
    expect(html.match(/stroke-dasharray="10 5"/g)).toHaveLength(2); // legend and curve
  });

  it("shares Multi-floor Case colors with totals, story comparisons and all-case print reports", () => {
    const html = renderToStaticMarkup(<MultiFloorResults result={multiResult} dataset={dataset} colors={colors} selectedCaseId="building-b" selectedFloorId="floor-3" onSelectCase={() => undefined} onSelectFloor={() => undefined} />);
    for (const color of ["#0055cc", "#d00080"]) {
      expect(html).toContain(`stroke="${color}"`);
      expect(html).toContain(`border-color:${color}`);
    }
    const reports = html.split('class="multifloor-case-report"').slice(1);
    expect(reports).toHaveLength(2);
    expect(reports[0]).toContain('stroke="#0055cc"');
    expect(reports[1]).toContain('stroke="#d00080"');
    const floorHtml = renderToStaticMarkup(<FloorMonthlyChart title="Case Bの階比較" series={caseFloorSeries(multiResult.cases[1]!)} colorOverride="#d00080" />);
    expect(floorHtml.match(/<polyline[^>]*stroke="#d00080"/g)).toHaveLength(3);
    expect(floorHtml).toContain('stroke-dasharray="8 4"');
    expect(floorHtml).toContain('stroke-dasharray="2 4"');
  });

  it("does not recolor/reindex surviving story series when another Case has no matching floor", () => {
    const missing = { ...multiResult, cases: [{ ...multiResult.cases[0]!, floors: multiResult.cases[0]!.floors.slice(0, 1) }, multiResult.cases[1]!] };
    const series = storyMonthlySeries(missing, 2, colors);
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({ id: "building-b", color: "#d00080", dash: "10 5" });
    expect(storyMonthlySeries(missing, 2)[0]?.color).toBe("#176b73");
  });

  it("never changes saved results, numeric plots, CSV or preset bytes", () => {
    const before = JSON.stringify([single, multi, singleResult, multiResult]);
    const exportsBefore = [createComparisonCsv(singleResult, dataset), createMultiFloorCsv(multiResult, dataset), serializeWorkspacePreset(single, "case-a"), serializeMultiFloorWorkspacePreset(multi, "building-a", "floor-1")];
    const plain = renderToStaticMarkup(<MonthlyChart result={singleResult} />);
    const colored = renderToStaticMarkup(<MonthlyChart result={singleResult} colors={colors} />);
    expect(colored.match(/points="[^"]+"/g)).toEqual(plain.match(/points="[^"]+"/g));
    expect(colored.match(/<td[^>]*>.*?<\/td>/g)).toEqual(plain.match(/<td[^>]*>.*?<\/td>/g));
    storyMonthlySeries(multiResult, 1, colors);
    expect(JSON.stringify([single, multi, singleResult, multiResult])).toBe(before);
    expect([createComparisonCsv(singleResult, dataset), createMultiFloorCsv(multiResult, dataset), serializeWorkspacePreset(single, "case-a"), serializeMultiFloorWorkspacePreset(multi, "building-a", "floor-1")]).toEqual(exportsBefore);
  });

});

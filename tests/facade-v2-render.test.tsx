import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FinEditor } from "../src/app/components/FinEditor";
import { GeometryPreview } from "../src/app/components/GeometryPreview";
import { MultiFloorGeometryPreview } from "../src/app/components/MultiFloorGeometryPreview";
import { MultiFloorResults } from "../src/app/components/MultiFloorResults";
import { createComparisonCase } from "../src/comparison";
import { createMultiFloorCase, createMultiFloorDefinition, createMultiFloorWorkspace, runMultiFloorComparison } from "../src/multifloor";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";

const fins = { leftFin: { depthM: 1.2, bottomZM: 0.9, topZM: 3.3 }, rightFin: { depthM: 0.8, bottomZM: 0.9, topZM: 3.3 } };
describe("M7 fin display / print boundary", () => {
  it("editor associates six numeric labels, two toggles, and field errors", () => {
    const html = renderToStaticMarkup(<FinEditor fins={fins} sillZM={0.9} headZM={3.3} inputPrefix="case-a" issues={new Map([["leftFin.depthM", "出が不正です"]])} onChange={() => {}} />);
    expect(html.match(/type="number"/g)).toHaveLength(6);
    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
    expect(html).toContain('aria-describedby="case-a-leftFin-depthM-issue"');
    expect(html).toContain("天空日射へのフィン効果・上下階相互遮蔽は計算しません");
  });
  it("absent fins expose toggles without fabricated saved dimensions", () => {
    const html = renderToStaticMarkup(<FinEditor fins={{}} sillZM={0.9} headZM={3.3} inputPrefix="a" issues={new Map()} onChange={() => {}} />);
    expect(html).not.toContain('type="number"');
    expect(html).toContain("左フィンを使用"); expect(html).toContain("右フィンを使用");
  });
  it("single elevation and side projection display both fins", () => {
    const base = createComparisonCase("a", "A");
    const html = renderToStaticMarkup(<GeometryPreview comparisonCase={{ ...base, parameters: { ...base.parameters, ...fins } }} dataset={null} />);
    expect(html.match(/class="drawing-line fin-line/g)).toHaveLength(2);
    expect(html.match(/class="fin-projection/g)).toHaveLength(2);
    expect(html).toContain("中央断面の切断面ではありません");
    expect(html).not.toMatch(/NaN|Infinity/);
  });
  it("invalid fin suppresses geometry instead of rendering NaN", () => {
    const base = createComparisonCase("a", "A");
    const html = renderToStaticMarkup(<GeometryPreview comparisonCase={{ ...base, parameters: { ...base.parameters, leftFin: { ...fins.leftFin, topZM: NaN } } }} dataset={null} />);
    expect(html).toContain("形状入力を修正"); expect(html).not.toContain("NaN");
  });
  it("long multi fin display ends at its own floor boundary, not adjacent floor", () => {
    const floor = { ...createMultiFloorDefinition("f1", "1F"), leftFin: { depthM: 1, bottomZM: -5, topZM: 15 } };
    const building = createMultiFloorCase("a", "A", [floor, { ...floor, id: "f2", name: "2F", leftFin: undefined }]);
    const before = JSON.stringify(building);
    const html = renderToStaticMarkup(<MultiFloorGeometryPreview buildingCase={building} dataset={null} />);
    const match = html.match(/data-fin="leftFin"[^>]*y1="([^"]+)" y2="([^"]+)"/);
    expect(match).not.toBeNull();
    const delta = Number(match![2]) - Number(match![1]);
    expect(delta).toBeCloseTo(floor.floorHeightM * 28, 10);
    expect(JSON.stringify(building)).toBe(before);
    expect(html).toContain("可視化のみ");
  });
  it("print contains every floor's fin inputs and canonical model identity", () => {
    const floor = { ...createMultiFloorDefinition("f1", "1F"), ...fins };
    const weather = createDemoWeatherDataset();
    const result = runMultiFloorComparison(weather, createMultiFloorWorkspace(createMultiFloorCase("a", "A", [floor])));
    const html = renderToStaticMarkup(<MultiFloorResults result={result} dataset={weather} selectedCaseId="a" selectedFloorId="f1" onSelectCase={() => {}} onSelectFloor={() => {}} />);
    expect(html).toContain("階別の遮蔽入力"); expect(html).toContain("左フィン"); expect(html).toContain("出 1.2 m / 下端 0.9 m / 上端 3.3 m");
    expect(html).toContain("Floor Breakdown"); expect(html).not.toMatch(/NaN|Infinity/);
  });
});

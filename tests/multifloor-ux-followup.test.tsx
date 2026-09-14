import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FloorMonthlyChart, caseFloorSeries } from "../src/app/components/FloorMonthlyChart";
import { MultiFloorCaseEditor } from "../src/app/components/MultiFloorCaseEditor";
import { MultiFloorGeometryPreview } from "../src/app/components/MultiFloorGeometryPreview";
import { StoryComparisonTable, storyMonthlySeries } from "../src/app/components/MultiFloorResults";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import { compareStory, createMultiFloorDemoWorkspace, createMultiFloorReferences, runMultiFloorComparison, type MultiFloorRunResult } from "../src/multifloor";
import { createFacadeSolsticeReferences } from "../src/solar-reference";

const dataset = createDemoWeatherDataset();
const workspace = createMultiFloorDemoWorkspace();
const result = runMultiFloorComparison(dataset, workspace);

describe("M4.5 UX follow-up: story alignment", () => {
  // Controlled result values are independent of the comparison implementation.
  const fixture: MultiFloorRunResult = {
    ...result,
    cases: result.cases.map((item, caseIndex) => ({
      ...item,
      floors: item.floors.map((floor, index) => ({
        ...floor,
        floorId: caseIndex === 0 ? "base-" + index : "different-" + (2 - index),
        name: caseIndex === 0 ? floor.name : "別名-" + index,
        simulation: {
          ...floor.simulation,
          summary: {
            ...floor.simulation.summary,
            annual: { ...floor.simulation.summary.annual, withOverhangKWh: 1000 + index * 100 + caseIndex * 50 },
            cooling: { ...floor.simulation.summary.cooling, withOverhangKWh: 400 + index * 20 + caseIndex * 10 },
            heating: { ...floor.simulation.summary.heating, withOverhangKWh: 600 + index * 80 + caseIndex * 40 },
          },
        },
      })),
    })),
  };
  it("aligns by position, not IDs/names, and computes all three baseline deltas", () => {
    const before = JSON.stringify(fixture);
    const rows = compareStory(fixture, 1);
    expect(rows[0]!.floor).toBe(fixture.cases[0]!.floors[1]);
    expect(rows[1]!.floor?.name).toBe("別名-1");
    expect(rows[1]!.delta).toEqual({
      annual: { kWh: 50, percent: 50 / 1100 * 100 },
      summer: { kWh: 10, percent: 10 / 420 * 100 },
      winter: { kWh: 40, percent: 40 / 680 * 100 },
    });
    expect(JSON.stringify(fixture)).toBe(before);
  });
  it("leaves missing case or baseline stories unavailable without reassigning another floor", () => {
    const shortened = { ...fixture, cases: [{ ...fixture.cases[0]!, floors: fixture.cases[0]!.floors.slice(0, 1) }, fixture.cases[1]!] };
    const rows = compareStory(shortened, 2);
    expect(rows[0]!.floor).toBeNull();
    expect(rows[0]!.delta).toBeNull();
    expect(rows[1]!.floor).toBe(fixture.cases[1]!.floors[2]);
    expect(rows[1]!.delta).toBeNull();
    const html = renderToStaticMarkup(<StoryComparisonTable result={shortened} storyIndex={2} />);
    expect(html).toContain("該当階なし");
    expect(html).toContain("—");
    expect(storyMonthlySeries(shortened, 2)).toHaveLength(1);
    expect(compareStory(shortened, 10).every((row) => row.floor === null && row.delta === null)).toBe(true);
    expect(() => compareStory(shortened, -1)).toThrow(RangeError);
  });
  it("plots each selected story from existing multi-Case monthly results", () => {
    const series = storyMonthlySeries(fixture, 1);
    expect(series).toHaveLength(2);
    expect(series.map((item) => item.monthlyKWh)).toEqual(fixture.cases.map((item) => item.floors[1]!.simulation.monthly.map((month) => month.withOverhangKWh)));
  });
});

describe("M4.5 UX follow-up: stacked references", () => {
  const first = workspace.cases[1]!;
  const noFirstOverhang = { ...first, floors: first.floors.map((floor, index) => index === 0 ? { ...floor, overhang: undefined } : floor) };
  it("keeps both references on every overhang floor, including unselected floors, with absolute Z offsets", () => {
    const rays = createMultiFloorReferences(dataset, noFirstOverhang);
    expect(rays.map((ray) => ray.floorId)).toEqual(["floor-2", "floor-2", "floor-3", "floor-3"]);
    for (const [index, baseZM] of [[1, 3.8], [2, 7.6]] as const) {
      const floor = first.floors[index]!;
      const overhang = floor.overhang!;
      const local = createFacadeSolsticeReferences({ dataset, facadeAzimuthDegFromNorth: first.facadeAzimuthDegFromNorth, overhang: { ...overhang, elevationZM: overhang.elevationM } });
      const actual = rays.filter((ray) => ray.floorId === floor.id);
      expect(actual[0]!.startZM).toBe(baseZM + 3.6);
      expect(actual.map((ray) => ray.intersectionZM)).toEqual(local.map((ref) => baseZM + ref.overhangTipFacadeIntersectionZM!));
    }
    const html = renderToStaticMarkup(<MultiFloorGeometryPreview buildingCase={noFirstOverhang} selectedFloorId="floor-1" dataset={dataset} report />);
    expect(html.match(/data-floor-id=/gu)).toHaveLength(4);
    expect(html).not.toContain('data-floor-id="floor-1"');
    expect(html).toContain('data-floor-id="floor-3"');
    expect(html).toContain("6/21");
    expect(html).toContain("12/21");
  });
});

describe("M4.5 UX follow-up: charts and labels", () => {
  it("renders 3 Floor × 12 months and draws the selected Floor last with a visible highlight", () => {
    const item = result.cases[1]!;
    const series = caseFloorSeries(item, item.floors[1]!.floorId);
    expect(series).toHaveLength(3);
    expect(series.map((line) => line.monthlyKWh)).toEqual(item.floors.map((floor) => floor.simulation.monthly.map((month) => month.withOverhangKWh)));
    const html = renderToStaticMarkup(<FloorMonthlyChart title="階別月別" series={series} />);
    expect(html.match(/<circle /gu)).toHaveLength(36);
    expect(html).toContain('data-series-id="floor-2" data-highlighted="true"');
    expect(html).toContain("2F · 選択中");
    expect(html.indexOf('data-series-id="floor-2"')).toBeGreaterThan(html.indexOf('data-series-id="floor-3"'));
  });
  it("separates Floor names from ordinal numbers instead of producing 11F/22F/33F", () => {
    const noop = () => undefined;
    const html = renderToStaticMarkup(<MultiFloorCaseEditor buildingCase={workspace.cases[0]!} selectedFloorId="floor-1" issues={[]} onCaseChange={noop} onSelectFloor={noop} onAddFloor={noop} onDeleteFloor={noop} onDuplicateFloor={noop} />);
    expect(html).toContain('class="floor-tab-name">1F</strong>');
    expect(html).toContain('class="floor-tab-position">下から1番目</small>');
    expect(html).not.toMatch(/>1<\/span>1F|>2<\/span>2F|>3<\/span>3F/u);
  });
});

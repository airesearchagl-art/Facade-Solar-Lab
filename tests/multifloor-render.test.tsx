import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MultiFloorGeometryPreview } from "../src/app/components/MultiFloorGeometryPreview";
import { MultiFloorResults } from "../src/app/components/MultiFloorResults";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import { createMultiFloorDemoWorkspace, runMultiFloorComparison } from "../src/multifloor";

describe("M4.5 multi-floor presentation", () => {
  it("renders Building Total, Floor Breakdown, exact monthly values, and baseline deltas", () => {
    const workspace = createMultiFloorDemoWorkspace();
    const result = runMultiFloorComparison(createDemoWeatherDataset(), workspace);
    const html = renderToString(
      <MultiFloorResults
        result={result}
        selectedCaseId={workspace.cases[0]!.id}
        selectedFloorId={workspace.cases[0]!.floors[0]!.id}
        onSelectCase={() => undefined}
        onSelectFloor={() => undefined}
      />,
    );
    expect(html).toContain("Building Total");
    expect(html).toContain("Floor Breakdown");
    expect(html).toContain("夏期（4〜9月）");
    expect(html).toContain("冬期（10〜3月）");
    expect(html).toContain("建物全体の月別値");
    expect(html).toContain("と基準案差");
    expect(html).toContain("-14.4%");
    expect(html).toContain("全建物案の階別結果");
    expect(html).toContain("階別の案比較");
    expect(html).toContain("Case内で階比較");
    expect(html).toContain("同じ階を案比較");
    expect(html).toContain("階別月別日射熱取得");
    expect(html).not.toMatch(/NaN|Infinity/u);
  });

  it("renders every stacked floor with separate label gutters and all-floor reference rays", () => {
    const workspace = createMultiFloorDemoWorkspace();
    const buildingCase = workspace.cases[0]!;
    const html = renderToString(
      <MultiFloorGeometryPreview
        buildingCase={buildingCase}
        selectedFloorId={buildingCase.floors[1]!.id}
        dataset={createDemoWeatherDataset()}
      />,
    );
    expect(html).toContain("積層立面");
    expect(html).toContain("積層断面");
    expect(html).toContain("累積建物高さ");
    expect(html).toContain("11.40");
    expect(html).toContain("1F");
    expect(html).toContain("2F");
    expect(html).toContain("3F");
    expect(html).toContain("各階の6/21・12/21参考日射線");
    expect(html.match(/data-floor-id=/gu)).toHaveLength(6);
    expect(html.match(/class="floor-name"/gu)).toHaveLength(6);
    expect(html.match(/class="floor-height"/gu)).toHaveLength(6);
    expect(html).not.toContain("選択階の6/21");
  });
});

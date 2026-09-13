import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GeometryPreview } from "../src/app/components/GeometryPreview";
import { createDemoComparisonWorkspace } from "../src/demo/demo-scenario";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";

describe("solstice reference section diagram", () => {
  it("renders labeled, non-color-only summer and winter references", () => {
    const comparisonCase = createDemoComparisonWorkspace().cases[0]!;
    const html = renderToString(
      <GeometryPreview
        comparisonCase={comparisonCase}
        dataset={createDemoWeatherDataset()}
      />,
    );

    expect(html).toContain("夏至頃");
    expect(html).toContain("6/21");
    expect(html).toContain("冬至頃");
    expect(html).toContain("12/21");
    expect(html).toContain("太陽高度");
    expect(html).toContain("断面角");
    expect(html).toContain("solar-reference-ray summer");
    expect(html).toContain("solar-reference-ray winter");
    expect(html).toContain("年間日射熱取得計算そのものを置き換えるものではありません");
  });

  it("explains back-facing reference sun without drawing an incident ray", () => {
    const base = createDemoComparisonWorkspace().cases[0]!;
    const html = renderToString(
      <GeometryPreview
        comparisonCase={{
          ...base,
          parameters: { ...base.parameters, facadeAzimuthDegFromNorth: 0 },
        }}
        dataset={createDemoWeatherDataset()}
      />,
    );

    expect(html).toContain("この時刻の太陽はファサード背面側です");
    expect(html).not.toContain("solar-reference-ray summer");
    expect(html).not.toContain("solar-reference-ray winter");
  });
});

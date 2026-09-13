import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PrintGeometryComparison } from "../src/app/App";
import {
  addComparisonCase,
  createComparisonCase,
  runComparison,
} from "../src/comparison";
import { createDemoComparisonWorkspace } from "../src/demo/demo-scenario";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";

describe("print comparison geometry", () => {
  it("renders all three report cases in result order with geometry and reference rays", () => {
    const dataset = createDemoWeatherDataset();
    const initial = createDemoComparisonWorkspace();
    const workspace = addComparisonCase(
      initial,
      createComparisonCase("case-c", "案C・西面", {
        ...initial.cases[0]!.parameters,
        facadeAzimuthDegFromNorth: 270,
      }),
    );
    const result = runComparison(dataset, workspace);
    const html = renderToString(
      <PrintGeometryComparison result={result} dataset={dataset} />,
    );

    expect(html).toContain("比較案の形状と参考日射線");
    expect(html).toContain("count-3");
    expect(html.indexOf("案A・基準案")).toBeLessThan(html.indexOf("案B・庇を深くした案"));
    expect(html.indexOf("案B・庇を深くした案")).toBeLessThan(html.indexOf("案C・西面"));
    expect(html.match(/基準案/g)?.length).toBeGreaterThanOrEqual(1);
    expect(html.match(/の断面/g)).toHaveLength(6);
    expect(html.match(/の立面/g)).toHaveLength(6);
    expect(html.match(/夏至頃/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html.match(/冬至頃/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain("太陽高度");
    expect(html).toContain("断面角");
    expect(html).toContain("庇の出 D");
    expect(html).toContain("開口幅 W");
  });
});

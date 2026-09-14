import { describe, expect, it } from "vitest";

import {
  comparisonInputDifferences,
  createComparisonCase,
  DEFAULT_COMPARISON_PARAMETERS,
  formatInputValue,
} from "../src/comparison";

const baseline = createComparisonCase("a", "Case A");

describe("comparison input difference model", () => {
  it("reports azimuth and geometry differences", () => {
    const selected = createComparisonCase("b", "Case B", {
      ...DEFAULT_COMPARISON_PARAMETERS,
      facadeAzimuthDegFromNorth: 225,
      opening: {
        ...DEFAULT_COMPARISON_PARAMETERS.opening,
        widthM: 4.8,
      },
    });
    expect(comparisonInputDifferences(baseline, selected)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "facadeAzimuthDegFromNorth",
          baselineValue: 180,
          caseValue: 225,
        }),
        expect.objectContaining({
          key: "opening.widthM",
          baselineValue: 6,
          caseValue: 4.8,
        }),
      ]),
    );
  });

  it("reports overhang enable and disable without irrelevant dimensions", () => {
    const selected = createComparisonCase("b", "Case B", {
      ...DEFAULT_COMPARISON_PARAMETERS,
      overhang: undefined,
    });
    expect(comparisonInputDifferences(baseline, selected)).toEqual([
      {
        key: "overhang.enabled",
        label: "水平庇",
        baselineValue: true,
        caseValue: false,
      },
    ]);
    expect(formatInputValue(true)).toBe("あり");
    expect(formatInputValue(false)).toBe("なし");
  });

  it("reports SHGC differences", () => {
    const selected = createComparisonCase("b", "Case B", {
      ...DEFAULT_COMPARISON_PARAMETERS,
      solarHeatGainCoefficient: 0.35,
    });
    expect(comparisonInputDifferences(baseline, selected)).toContainEqual(
      expect.objectContaining({
        key: "solarHeatGainCoefficient",
        baselineValue: 0.5,
        caseValue: 0.35,
      }),
    );
  });

  it("omits unchanged fields", () => {
    const selected = createComparisonCase(
      "b",
      "Case B",
      DEFAULT_COMPARISON_PARAMETERS,
    );
    expect(comparisonInputDifferences(baseline, selected)).toEqual([]);
  });
});

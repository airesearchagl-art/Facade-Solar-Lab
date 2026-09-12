import { describe, expect, it } from "vitest";

import { calculateDirectShadow } from "../src/geometry";

const OPENING = {
  centerXM: 0,
  widthM: 2,
  sillZM: 0,
  headZM: 2,
} as const;

function normalSun(overrides: {
  readonly depthM: number;
  readonly elevationZM?: number;
}) {
  return calculateDirectShadow({
    facadeAzimuthDegFromNorth: 180,
    solarAzimuthDegFromNorth: 180,
    solarElevationDeg: 45,
    opening: OPENING,
    overhang: {
      depthM: overrides.depthM,
      elevationZM: overrides.elevationZM ?? 2,
      leftExtensionM: 0,
      rightExtensionM: 0,
    },
  });
}

describe("facade-v1 analytical direct shadow", () => {
  it("G1 gives zero shade for a zero-depth overhang", () => {
    const result = normalSun({ depthM: 0 });
    expect(result.shadedAreaM2).toBe(0);
    expect(result.directShadedFraction).toBe(0);
    expect(result.directLitFraction).toBe(1);
  });

  it("G2 gives the hand-calculated half shade at normal 45-degree sun", () => {
    // 1 m projection × tan(45°) = 1 m drop; 2 m × 1 m = 2 m².
    const result = normalSun({ depthM: 1 });
    expect(result.openingAreaM2).toBe(4);
    expect(result.shadedAreaM2).toBeCloseTo(2, 12);
    expect(result.directShadedFraction).toBeCloseTo(0.5, 12);
    expect(result.directLitFraction).toBeCloseTo(0.5, 12);
    expect(result.shadowPolygon).toHaveLength(4);
    expect(result.clippedShadowPolygon).toHaveLength(4);
  });

  it("G3 gives full shade for a two-metre projection at 45 degrees", () => {
    // 2 m projection × tan(45°) spans the complete 2 m opening height.
    const result = normalSun({ depthM: 2 });
    expect(result.shadedAreaM2).toBeCloseTo(4, 12);
    expect(result.directShadedFraction).toBe(1);
  });

  it("G4 preserves the hand-calculated gap above the opening", () => {
    // Front edge projects from z=2.5 to z=1.5: only the upper 0.5 m
    // intersects the 2 m-wide opening, giving 1 m² / 4 m² = 0.25.
    const result = normalSun({ depthM: 1, elevationZM: 2.5 });
    expect(result.shadedAreaM2).toBeCloseTo(1, 12);
    expect(result.directShadedFraction).toBeCloseTo(0.25, 12);
  });

  it("G5 is invariant under a common x/z datum translation", () => {
    const baseline = normalSun({ depthM: 1 });
    const translated = calculateDirectShadow({
      facadeAzimuthDegFromNorth: 180,
      solarAzimuthDegFromNorth: 180,
      solarElevationDeg: 45,
      opening: { centerXM: 4, widthM: 2, sillZM: 10, headZM: 12 },
      overhang: {
        depthM: 1,
        elevationZM: 12,
        leftExtensionM: 0,
        rightExtensionM: 0,
      },
    });
    expect(translated.directShadedFraction).toBeCloseTo(
      baseline.directShadedFraction,
      12,
    );
  });

  it("G6 is invariant when every geometry length is uniformly scaled", () => {
    const baseline = normalSun({ depthM: 1 });
    const scaled = calculateDirectShadow({
      facadeAzimuthDegFromNorth: 180,
      solarAzimuthDegFromNorth: 180,
      solarElevationDeg: 45,
      opening: { centerXM: 0, widthM: 6, sillZM: 0, headZM: 6 },
      overhang: {
        depthM: 3,
        elevationZM: 6,
        leftExtensionM: 0,
        rightExtensionM: 0,
      },
    });
    expect(scaled.directShadedFraction).toBeCloseTo(
      baseline.directShadedFraction,
      12,
    );
  });
});

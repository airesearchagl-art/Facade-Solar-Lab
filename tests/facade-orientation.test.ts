import { describe, expect, it } from "vitest";

import { calculateDirectShadow } from "../src/geometry";

const OPENING = {
  centerXM: 0,
  widthM: 2,
  sillZM: 0,
  headZM: 2,
} as const;

function shade(
  facadeAzimuthDegFromNorth: number,
  solarAzimuthDegFromNorth: number,
  leftExtensionM: number,
  rightExtensionM: number,
) {
  return calculateDirectShadow({
    facadeAzimuthDegFromNorth,
    solarAzimuthDegFromNorth,
    solarElevationDeg: 45,
    opening: OPENING,
    overhang: {
      depthM: 1,
      elevationZM: 2,
      leftExtensionM,
      rightExtensionM,
    },
  });
}

describe("facade-v1 orientation and finite-width behavior", () => {
  it("G7 preserves shade when facade and sun rotate together", () => {
    const baseline = shade(180, 135, 0.25, 0.75);
    const rotated = shade(225, 180, 0.25, 0.75);
    expect(rotated.directShadedFraction).toBeCloseTo(
      baseline.directShadedFraction,
      12,
    );
  });

  it.each([0, 45, 90, 135, 180, 225, 270, 315])(
    "handles facade azimuth %d° with an invariant relative sun angle",
    (facadeAzimuth) => {
      const result = shade(facadeAzimuth, facadeAzimuth - 45, 0.5, 0.5);
      const reference = shade(180, 135, 0.5, 0.5);
      expect(result.frontFacing).toBe(true);
      expect(result.directShadedFraction).toBeCloseTo(
        reference.directShadedFraction,
        12,
      );
    },
  );

  it("G8 identifies a sun behind the facade", () => {
    const result = shade(180, 0, 0, 0);
    expect(result.frontFacing).toBe(false);
    expect(result.facadeLocalSunVector.y).toBeLessThan(0);
    expect(result.directShadedFraction).toBe(0);
    expect(result.directLitFraction).toBe(1);
  });

  it.each([90, 89.999999])(
    "G9 remains finite and bounded at a %d-degree grazing angle",
    (relativeAzimuth) => {
      const result = shade(180, 180 + relativeAzimuth, 0, 0);
      const numbers = [
        result.openingAreaM2,
        result.shadedAreaM2,
        result.directShadedFraction,
        result.directLitFraction,
        result.facadeLocalSunVector.x,
        result.facadeLocalSunVector.y,
        result.facadeLocalSunVector.z,
        ...result.shadowPolygon.flatMap((point) => [point.xM, point.zM]),
        ...result.clippedShadowPolygon.flatMap((point) => [point.xM, point.zM]),
      ];
      expect(numbers.every(Number.isFinite)).toBe(true);
      expect(result.directShadedFraction).toBeGreaterThanOrEqual(0);
      expect(result.directShadedFraction).toBeLessThanOrEqual(1);
    },
  );

  it("F1 mirrors symmetric extensions with the sun", () => {
    const fromViewerRight = shade(180, 135, 0.5, 0.5);
    const fromViewerLeft = shade(180, 225, 0.5, 0.5);
    expect(fromViewerRight.directShadedFraction).toBeCloseTo(
      fromViewerLeft.directShadedFraction,
      12,
    );
  });

  it("F2 shows an asymmetric extension effect and mirror equivalence", () => {
    const asymmetricFromRight = shade(180, 135, 0.1, 0.8);
    const asymmetricFromLeft = shade(180, 225, 0.1, 0.8);
    const mirroredAndSwapped = shade(180, 225, 0.8, 0.1);

    expect(asymmetricFromRight.directShadedFraction).not.toBeCloseTo(
      asymmetricFromLeft.directShadedFraction,
      6,
    );
    expect(asymmetricFromRight.directShadedFraction).toBeCloseTo(
      mirroredAndSwapped.directShadedFraction,
      12,
    );
  });

  it("F3 does not lose shade when the relevant-side extension grows", () => {
    const shortRight = shade(180, 135, 0, 0.1);
    const longRight = shade(180, 135, 0, 1);
    expect(longRight.shadedAreaM2).toBeGreaterThanOrEqual(
      shortRight.shadedAreaM2,
    );
  });

  it("F4 reaches the hand-calculated infinite-width vertical-shadow limit", () => {
    const result = shade(180, 135, 100, 100);
    // drop = D*tan(45°)/cos(45°) = sqrt(2) m over a 2 m opening.
    const expectedFraction = Math.SQRT2 / 2;
    expect(result.directShadedFraction).toBeCloseTo(expectedFraction, 12);
  });
});

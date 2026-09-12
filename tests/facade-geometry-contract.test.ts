import { describe, expect, it } from "vitest";

import {
  facadeLocalSunVector,
  normalizeAzimuthDeg,
  openingGeometryMetrics,
  overhangGeometryMetrics,
  validateHorizontalOverhang,
  validateRectangularOpening,
} from "../src/geometry";

describe("facade-v1 geometry contract", () => {
  it("represents full-height and waist-wall openings with the same contract", () => {
    const fullHeight = openingGeometryMetrics({
      centerXM: 0,
      widthM: 2,
      sillZM: 0,
      headZM: 3,
    });
    const waistWall = openingGeometryMetrics({
      centerXM: 1,
      widthM: 2,
      sillZM: 0.9,
      headZM: 3,
    });

    expect(fullHeight).toMatchObject({ heightM: 3, areaM2: 6 });
    expect(waistWall).toMatchObject({ heightM: 2.1, areaM2: 4.2 });
    expect(waistWall.bounds).toEqual({
      leftM: 0,
      rightM: 2,
      bottomM: 0.9,
      topM: 3,
    });
  });

  it("derives symmetric and asymmetric overhang edges from the opening", () => {
    const opening = { centerXM: 0, widthM: 2, sillZM: 0, headZM: 2 };
    expect(
      overhangGeometryMetrics(opening, {
        depthM: 1,
        elevationZM: 2.5,
        leftExtensionM: 0.25,
        rightExtensionM: 0.75,
      }),
    ).toEqual({ leftM: -1.25, rightM: 1.75, widthM: 3 });
  });

  it("rejects invalid opening and overhang geometry without correction", () => {
    expect(() =>
      validateRectangularOpening({
        centerXM: 0,
        widthM: 0,
        sillZM: 0,
        headZM: 2,
      }),
    ).toThrow(/widthM/u);
    expect(() =>
      validateRectangularOpening({
        centerXM: 0,
        widthM: 2,
        sillZM: 2,
        headZM: 2,
      }),
    ).toThrow(/headZM/u);
    expect(() =>
      validateHorizontalOverhang(
        { centerXM: 0, widthM: 2, sillZM: 0, headZM: 2 },
        {
          depthM: 1,
          elevationZM: 1.9,
          leftExtensionM: -0.1,
          rightExtensionM: 0,
        },
      ),
    ).toThrow(/extensions/u);
    expect(() =>
      validateHorizontalOverhang(
        { centerXM: 0, widthM: 2, sillZM: 0, headZM: 2 },
        {
          depthM: 1,
          elevationZM: 1.9,
          leftExtensionM: 0,
          rightExtensionM: 0,
        },
      ),
    ).toThrow(/elevationZM/u);
    expect(() =>
      validateHorizontalOverhang(
        { centerXM: 0, widthM: 2, sillZM: 0, headZM: 2 },
        {
          depthM: -0.1,
          elevationZM: 2,
          leftExtensionM: 0,
          rightExtensionM: 0,
        },
      ),
    ).toThrow(/depthM/u);
    expect(() =>
      validateRectangularOpening({
        centerXM: Number.POSITIVE_INFINITY,
        widthM: 2,
        sillZM: 0,
        headZM: 2,
      }),
    ).toThrow(/finite/u);
  });

  it("normalizes only finite azimuths", () => {
    expect(normalizeAzimuthDeg(-90)).toBe(270);
    expect(normalizeAzimuthDeg(450)).toBe(90);
    expect(() => normalizeAzimuthDeg(Number.NaN)).toThrow(/finite/u);
  });

  it("derives local sun-vector signs from the front-view coordinate basis", () => {
    const normal = facadeLocalSunVector(180, 180, 45);
    const viewerRight = facadeLocalSunVector(180, 135, 45);
    const viewerLeft = facadeLocalSunVector(180, 225, 45);

    expect(normal.x).toBeCloseTo(0, 12);
    expect(normal.y).toBeCloseTo(Math.SQRT1_2, 12);
    expect(normal.z).toBeCloseTo(Math.SQRT1_2, 12);
    expect(viewerRight.x).toBeGreaterThan(0);
    expect(viewerLeft.x).toBeLessThan(0);
  });
});

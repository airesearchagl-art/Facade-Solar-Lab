import { describe, expect, it } from "vitest";
import { calculateDirectShadow, polygonAreaM2, type Point2 } from "../src/geometry";
import { calculateDirectShadowV2, convexShadowUnionArea, intersectConvexPolygons, type DirectShadowV2Input } from "../src/geometry/facade-v2";

// Hand-derived reference: sx/sy=-1, sz/sy=1. Left fin shadows x=-1+t,
// z=[-t, 2-t], t in [0,D]. D=1 gives integral(2-t,0..1)=1.5 m².
const input: DirectShadowV2Input = {
  facadeAzimuthDegFromNorth: 180, solarAzimuthDegFromNorth: 225,
  solarElevationDeg: Math.atan(Math.SQRT1_2) * 180 / Math.PI,
  opening: { centerXM: 0, widthM: 2, sillZM: 0, headZM: 2 },
};
const fin = { depthM: 1, bottomZM: 0, topZM: 2 };
const overhang = { depthM: 1, elevationZM: 2, leftExtensionM: 1, rightExtensionM: 1 };
const shade = (override: Partial<DirectShadowV2Input>) => calculateDirectShadowV2({ ...input, ...override });
const rectangle = (left: number, right: number, bottom: number, top: number): Point2[] => [
  { xM: left, zM: bottom }, { xM: right, zM: bottom }, { xM: right, zM: top }, { xM: left, zM: top },
];

describe("M7 direct geometry: independent analytical areas, not solver validation", () => {
  it.each([undefined, overhang])("absent fins exactly preserve every v1 result field", (overhang) => {
    const base = { ...input, overhang };
    const { surfaceShadows: _, ...result } = calculateDirectShadowV2(base);
    expect(result).toEqual(calculateDirectShadow(base));
  });
  it("zero depth preserves v1 exactly", () => {
    const { surfaceShadows: _, ...result } = shade({ overhang, leftFin: { ...fin, depthM: 0 }, rightFin: { ...fin, depthM: 0 } });
    expect(result).toEqual(calculateDirectShadow({ ...input, overhang }));
  });
  it("left fin analytical area = 1.5 / 4", () => expect(shade({ leftFin: fin }).directShadedFraction).toBeCloseTo(0.375, 13));
  it("right fin with mirrored sun = 1.5 / 4", () => expect(shade({ rightFin: fin, solarAzimuthDegFromNorth: 135 }).directShadedFraction).toBeCloseTo(0.375, 13));
  it("opposite fin does not shade the opening", () => expect(shade({ rightFin: fin }).directShadedFraction).toBe(0));
  it.each(["left", "right", "both"] as const)("overhang + %s fin: overlap is subtracted, union 3 / 4", (side) => {
    const result = shade({ overhang, leftFin: side === "right" ? undefined : fin, rightFin: side === "left" ? undefined : fin, solarAzimuthDegFromNorth: side === "right" ? 135 : 225 });
    expect(result.surfaceShadows.reduce((sum, item) => sum + item.areaM2, 0)).toBeCloseTo(3.5, 12);
    expect(result.shadedAreaM2).toBeCloseTo(3, 12);
    expect(result.directShadedFraction).toBeCloseTo(0.75, 12);
  });
  it("fully shading tall deep fin", () => expect(shade({ leftFin: { depthM: 2, bottomZM: 0, topZM: 4 } }).directShadedFraction).toBe(1));
  it("fin wholly below opening casts no shade", () => expect(shade({ leftFin: { depthM: 2, bottomZM: -3, topZM: -1 } }).directShadedFraction).toBe(0));
  it("parallel-to-fin frontal sun gives no fin shade", () => expect(shade({ leftFin: fin, rightFin: fin, solarAzimuthDegFromNorth: 180 }).directShadedFraction).toBe(0));
  it.each([270, 270 - 1e-10, 270 + 1e-10, 90])("grazing %s respects front-facing epsilon", (solarAzimuthDegFromNorth) => {
    const result = shade({ solarAzimuthDegFromNorth, leftFin: fin, rightFin: fin });
    expect(result.frontFacing).toBe(false);
    expect(result.directShadedFraction).toBe(0);
  });
  it("near grazing above epsilon remains finite and bounded", () => {
    const result = shade({ solarAzimuthDegFromNorth: 269.9999, leftFin: fin, rightFin: fin, overhang });
    expect(result.directShadedFraction).toBeGreaterThanOrEqual(0);
    expect(result.directShadedFraction).toBeLessThanOrEqual(1);
  });
  it("low-altitude left strip approaches half opening", () => expect(shade({ solarElevationDeg: 0.00001, leftFin: fin }).directShadedFraction).toBeCloseTo(0.5, 6));
  it("night sun yields no direct contribution", () => expect(shade({ solarElevationDeg: -1, leftFin: fin }).frontFacing).toBe(false));
  it("intermediate bearing rotates jointly without changing geometry", () => expect(shade({ facadeAzimuthDegFromNorth: 37, solarAzimuthDegFromNorth: 82, leftFin: fin, overhang }).directShadedFraction).toBeCloseTo(0.75, 13));
  it("asymmetric heights/depths preserve mirror, including asymmetric overhang", () => {
    const a = shade({ leftFin: { depthM: 0.8, bottomZM: -0.2, topZM: 2.4 }, rightFin: { depthM: 0.3, bottomZM: 0.5, topZM: 1.8 }, opening: { ...input.opening, centerXM: 13 }, overhang: { ...overhang, leftExtensionM: 0.3, rightExtensionM: 1.4 } });
    const b = shade({ rightFin: { depthM: 0.8, bottomZM: -0.2, topZM: 2.4 }, leftFin: { depthM: 0.3, bottomZM: 0.5, topZM: 1.8 }, solarAzimuthDegFromNorth: 135, opening: { ...input.opening, centerXM: -13 }, overhang: { ...overhang, leftExtensionM: 1.4, rightExtensionM: 0.3 } });
    expect(a.directShadedFraction).toBeCloseTo(b.directShadedFraction, 12);
  });
  it.each([1e6, 1e9, 1e12])("translated datum %s preserves local union", (datum) => {
    const result = shade({ opening: { ...input.opening, centerXM: datum, sillZM: datum, headZM: datum + 2 }, overhang: { ...overhang, elevationZM: datum + 2 }, leftFin: { ...fin, bottomZM: datum, topZM: datum + 2 } });
    expect(result.directShadedFraction).toBeCloseTo(0.75, 12);
  });
  it("extremely shallow fin snaps only within epsilon", () => expect(shade({ leftFin: { ...fin, depthM: 1e-12 } }).directShadedFraction).toBe(0));
  it("extremely deep finite fin remains bounded", () => expect(shade({ leftFin: { depthM: 1e8, bottomZM: 0, topZM: 1e8 } }).directShadedFraction).toBe(1));
  it.each([
    { ...fin, depthM: -1 }, { ...fin, depthM: Infinity }, { ...fin, depthM: NaN },
    { ...fin, topZM: 0 }, { ...fin, bottomZM: Infinity }, { ...fin, topZM: Infinity },
    { ...fin, bottomZM: -Number.MAX_VALUE, topZM: Number.MAX_VALUE },
  ])("rejects invalid fin even on night side: %j", (leftFin) => expect(() => shade({ leftFin, solarElevationDeg: -10 })).toThrow(RangeError));
  it("rejects projection overflow", () => expect(() => shade({ leftFin: { ...fin, depthM: Number.MAX_VALUE }, solarAzimuthDegFromNorth: 269 })).toThrow(RangeError));
  it("rejects unresolved opening at huge datum", () => expect(() => shade({ leftFin: fin, opening: { ...input.opening, centerXM: 1e25 } })).toThrow(RangeError));
  it("three overlapping convex areas include triple intersection once", () => {
    // A/B/C union fills [0,3]x[0,2]: singles=12, pairs=8, triple=2 =>6.
    const a = rectangle(0, 2, 0, 2), b = rectangle(1, 3, 0, 2), c = rectangle(0.5, 2.5, 0, 2);
    expect(convexShadowUnionArea([a, b, c])).toBe(6);
    expect(convexShadowUnionArea([a, [...b].reverse(), c])).toBe(6);
    expect(convexShadowUnionArea([a, a, a])).toBe(4);
  });
  it("edge-only contact has zero intersection", () => expect(polygonAreaM2(intersectConvexPolygons(rectangle(0, 1, 0, 1), rectangle(1, 2, 0, 1)))).toBe(0));
  it("four surfaces are explicitly unsupported", () => expect(() => convexShadowUnionArea([[], [], [], []])).toThrow(/three/));
});

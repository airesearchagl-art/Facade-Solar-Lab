import { describe, expect, it } from "vitest";
import { calculateDirectShadow, polygonAreaM2, GEOMETRY_EPSILON } from "../src/geometry";
import { calculateFacadeV1IntervalGain, simulateFacadeV1 } from "../src/engine";
import { independentCase, parameters, syntheticYear } from "../scripts/validation/m5-completion/fixtures";
import { aggregateMultiFloorResults, type MultiFloorFloorResult } from "../src/multifloor";

const base = { ...parameters, solarAzimuthDegFromNorth: 180, solarElevationDeg: 45 };
const radiation = { globalHorizontalWhPerM2: 300, directNormalWhPerM2: 500, diffuseHorizontalWhPerM2: 120 };
describe("M5 numerical boundaries", () => {
  it.each([89.999999, 90, 90.000001, 269.999999, 270, 270.000001])("grazing solar azimuth %f remains bounded", azimuth => {
    const result = calculateDirectShadow({ ...base, solarAzimuthDegFromNorth: azimuth });
    expect(result.directShadedFraction).toBeGreaterThanOrEqual(0);
    expect(result.directShadedFraction).toBeLessThanOrEqual(1);
    const gain = calculateFacadeV1IntervalGain(parameters, radiation, { azimuthDeg: azimuth, elevationDeg: 45 });
    expect(Number.isFinite(gain.withOverhangKWh)).toBe(true);
    expect(gain.withOverhangKWh).toBeGreaterThanOrEqual(0);
  });
  it.each([-2, -1, 0, 1, 2])("contact %+i epsilon preserves bounded results", factor => {
    const result = calculateDirectShadow({ ...base, overhang: { ...parameters.overhang!, elevationZM: 3 + factor * GEOMETRY_EPSILON } });
    expect(result.directShadedFraction).toBeGreaterThanOrEqual(0);
    expect(result.directShadedFraction).toBeLessThanOrEqual(2e-9);
  });
  it.each([1e-3, 1, 1e3, 1e6])("scale %f retains analytical half shade", scale => {
    const result = calculateDirectShadow({ ...base,
      opening: { centerXM: 0, widthM: 2 * scale, sillZM: 0, headZM: 2 * scale },
      overhang: { depthM: scale, elevationZM: 2 * scale, leftExtensionM: 0, rightExtensionM: 0 },
    });
    expect(result.directShadedFraction).toBeCloseTo(0.5, 9);
  });
  it.each([1e6, 1e9])("large coordinate datum %f retains analytical half shade", datum => {
    expect(calculateDirectShadow({ ...base, opening: { centerXM: datum, widthM: 2, sillZM: datum, headZM: datum + 2 }, overhang: { ...parameters.overhang!, elevationZM: datum + 2 } }).directShadedFraction).toBeCloseTo(0.5, 9);
  });
  it.each([0, 1e-12, 2e-7, 2 - 2e-7, 2, 1e6])("depth %f remains analytically bounded", depth => {
    expect(calculateDirectShadow({ ...base, overhang: { ...parameters.overhang!, depthM: depth } }).directShadedFraction).toBeCloseTo(Math.min(1, depth / 2), 9);
  });
  it("asymmetric extensions remain finite and bounded near lateral escape", () => {
    for (const azimuth of [91, 120, 179, 240, 269]) {
      const shadow = calculateDirectShadow({ ...base, solarAzimuthDegFromNorth: azimuth, overhang: { ...parameters.overhang!, leftExtensionM: 1e4, rightExtensionM: 1e-6 } });
      expect(shadow.directShadedFraction).toBeGreaterThanOrEqual(0);
      expect(shadow.directShadedFraction).toBeLessThanOrEqual(1);
    }
  });
  it.each([1e-6, 1e-12, 1e160])("explicitly rejects unsupported opening scale %f", scale => {
    expect(() => calculateDirectShadow({ ...base, opening: { centerXM: 0, widthM: scale, sillZM: 0, headZM: scale }, overhang: undefined })).toThrow(RangeError);
  });
  it("rejects width lost at a huge coordinate datum even without an overhang", () => {
    expect(() => calculateDirectShadow({ ...base, opening: { ...parameters.opening, centerXM: 1e100 }, overhang: undefined })).toThrow(RangeError);
  });
  it("rejects non-finite polygon area from finite coordinates", () => {
    expect(() => polygonAreaM2([{ xM: 0, zM: 0 }, { xM: 1e200, zM: 0 }, { xM: 1e200, zM: 1e200 }])).toThrow(RangeError);
  });
  it("rejects overflow in interval energy rather than emitting Infinity", () => {
    expect(() => calculateFacadeV1IntervalGain({ ...parameters, opening: { ...parameters.opening, widthM: 1e100 }, overhang: undefined }, { ...radiation, diffuseHorizontalWhPerM2: 1e250 }, { azimuthDeg: 180, elevationDeg: 45 })).toThrow(RangeError);
  });
  it("rejects accumulated energy overflow with individually finite intervals", () => {
    const year = syntheticYear();
    const data = { ...year, intervals: year.intervals.map(i => ({ ...i, radiation: { globalHorizontalWhPerM2: 0, directNormalWhPerM2: 0, diffuseHorizontalWhPerM2: 1e308 } })) };
    expect(() => simulateFacadeV1(data, { ...parameters, overhang: undefined })).toThrow(RangeError);
  });
  it("rejects relative angle subtraction overflow", () => {
    expect(() => calculateDirectShadow({ ...base, facadeAzimuthDegFromNorth: -Number.MAX_VALUE, solarAzimuthDegFromNorth: Number.MAX_VALUE })).toThrow(RangeError);
  });
  it("rejects building sum overflow", () => {
    const simulation = simulateFacadeV1(syntheticYear(), parameters);
    const period = { withOverhangKWh: 1e308, withoutOverhangKWh: 1e308, reductionPercent: 0 };
    const floor: MultiFloorFloorResult = { floorId: "f", name: "F", absoluteBaseZM: 0, parameters, definition: independentCase(1).floors[0]!,
      simulation: { ...simulation, monthly: Array.from({ length: 12 }, (_, m) => ({ month: m + 1, withOverhangKWh: 1e308, withoutOverhangKWh: 1e308 })), summary: { annual: period, cooling: period, heating: period } } };
    expect(() => aggregateMultiFloorResults([floor, floor])).toThrow(RangeError);
  });
});

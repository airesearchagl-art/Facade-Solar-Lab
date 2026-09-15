import { describe, expect, it } from "vitest";
import { calculateSolarPosition, calculateFacadeV1IntervalGain, simulateFacadeV1 } from "../src/engine";
import { parameters, syntheticYear } from "../scripts/validation/m5-completion/fixtures";

const dates = [[2025, 3, 20], [2025, 6, 21], [2025, 9, 22], [2025, 12, 21], [2024, 2, 29], [2024, 12, 31], [2025, 1, 1]] as const;
describe("M5 solar/time-step stability (not external accuracy validation)", () => {
  for (const latitude of [0, 70, -70]) {
    it.each(dates)(`finite 5-minute day at latitude ${latitude}: %i-%i-%i`, (year, month, day) => {
      for (const offset of [-12, 0, 5.5, 9, 14]) {
        for (let minuteOfDay = 0; minuteOfDay < 1440; minuteOfDay += 5) {
          const solar = calculateSolarPosition({ location: { latitudeDeg: latitude, longitudeDeg: 0, timeZoneOffsetHours: offset }, localStandardTime: { year, month, day, minuteOfDay } });
          for (const value of Object.values(solar)) if (typeof value === "number") expect(Number.isFinite(value)).toBe(true);
          const gain = calculateFacadeV1IntervalGain(parameters, { globalHorizontalWhPerM2: 300, directNormalWhPerM2: 500, diffuseHorizontalWhPerM2: 120 }, solar);
          expect(gain.withOverhangKWh).toBeGreaterThanOrEqual(0);
          if (solar.elevationDeg <= 0) {
            expect(gain.irradiance.directWithOverhangWhPerM2).toBe(0);
            expect(gain.irradiance.directWithoutOverhangWhPerM2).toBe(0);
          }
        }
      }
    });
  }
  it.each([70, -70])("recognizes continuous polar day/night at %i degrees", latitude => {
    for (const month of [6, 12]) {
      const elevations = Array.from({ length: 24 }, (_, hour) => calculateSolarPosition({
        location: { latitudeDeg: latitude, longitudeDeg: 0, timeZoneOffsetHours: 0 },
        localStandardTime: { year: 2025, month, day: 21, minuteOfDay: hour * 60 },
      }).elevationDeg);
      expect(elevations.every(e => latitude * (month === 6 ? 1 : -1) > 0 ? e > 0 : e < 0)).toBe(true);
    }
  });
  it("rejects finite offsets whose minute conversion overflows", () => {
    expect(() => calculateSolarPosition({ location: { latitudeDeg: 0, longitudeDeg: 0, timeZoneOffsetHours: Number.MAX_VALUE }, localStandardTime: { year: 2025, month: 1, day: 1, minuteOfDay: 0 } })).toThrow(RangeError);
  });
  it.each([60, 15, 5])("conserves annual diffuse and ground interval energy at %i minutes", step => {
    const dataset = syntheticYear(2025, step);
    const diffuse = { ...dataset, intervals: dataset.intervals.map(i => ({ ...i, radiation: { globalHorizontalWhPerM2: 0, directNormalWhPerM2: 0, diffuseHorizontalWhPerM2: 120 * step / 60 } })) };
    const ground = { ...dataset, intervals: dataset.intervals.map(i => ({ ...i, radiation: { globalHorizontalWhPerM2: 300 * step / 60, directNormalWhPerM2: 0, diffuseHorizontalWhPerM2: 0 } })) };
    const noOverhang = { ...parameters, overhang: undefined };
    expect(simulateFacadeV1(diffuse, noOverhang).summary.annual.withOverhangKWh).toBeCloseTo(8760 * 120 * 0.5 * 4 * 0.5 / 1000, 6);
    expect(simulateFacadeV1(ground, parameters).summary.annual.withOverhangKWh).toBeCloseTo(8760 * 300 * 0.2 * 0.5 * 4 * 0.5 / 1000, 6);
  }, 20000);
});

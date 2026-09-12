import { describe, expect, it } from "vitest";

import { calculateSolarPosition } from "../src/engine";
import type { LocalStandardTime } from "../src/weather";

const TOKYO = {
  latitudeDeg: 35.7,
  longitudeDeg: 139 + 46 / 60,
  timeZoneOffsetHours: 9,
} as const;

function time(
  year: number,
  month: number,
  day: number,
  hour: number,
): LocalStandardTime {
  return { year, month, day, minuteOfDay: hour * 60 };
}

/**
 * Independent expected values were transcribed from the NOAA/GML old Solar
 * Position Calculator on 2026-09-12. Its manual-entry convention is west-positive,
 * so Tokyo -139°46' / UTC offset -9 maps to this engine's east-positive
 * 139.7667° / UTC+9 contract. NOAA output is rounded to 0.01°.
 */
const NOAA_REFERENCES = [
  { label: "equinox morning", year: 2025, month: 3, day: 20, hour: 9, azimuth: 122.96, elevation: 36.95 },
  { label: "equinox noon", year: 2025, month: 3, day: 20, hour: 12, azimuth: 184.94, elevation: 54.11 },
  { label: "equinox afternoon", year: 2025, month: 3, day: 20, hour: 15, azimuth: 242.16, elevation: 32.97 },
  { label: "summer noon", year: 2025, month: 6, day: 21, hour: 12, azimuth: 198.14, elevation: 77.18 },
  { label: "winter noon", year: 2025, month: 12, day: 21, hour: 12, azimuth: 185.61, elevation: 30.68 },
] as const;

const NOAA_LEAP_YEAR_REFERENCES = [
  { label: "leap day noon", year: 2024, month: 2, day: 29, hour: 12, azimuth: 182.36, elevation: 46.47 },
  { label: "leap-year summer noon", year: 2024, month: 6, day: 21, hour: 12, azimuth: 198.09, elevation: 77.18 },
  { label: "leap-year late-year noon", year: 2024, month: 12, day: 21, hour: 12, azimuth: 185.58, elevation: 30.68 },
] as const;

describe("weather-v1 NOAA-style solar position", () => {
  it.each(NOAA_REFERENCES)(
    "matches the independent NOAA $label reference within the documented approximation",
    ({ year, month, day, hour, azimuth, elevation }) => {
      const result = calculateSolarPosition({
        location: TOKYO,
        localStandardTime: time(year, month, day, hour),
      });

      expect(result.azimuthDeg).toBeCloseTo(azimuth, 0);
      expect(result.apparentElevationDeg).toBeCloseTo(elevation, 0);
      expect(result.fractionalYearDays).toBe(365);
      expect(result.isAboveHorizon).toBe(true);
    },
  );

  it.each(NOAA_LEAP_YEAR_REFERENCES)(
    "matches the independent NOAA $label reference with a 366-day denominator",
    ({ year, month, day, hour, azimuth, elevation }) => {
      const result = calculateSolarPosition({
        location: TOKYO,
        localStandardTime: time(year, month, day, hour),
      });

      expect(result.azimuthDeg).toBeCloseTo(azimuth, 0);
      expect(result.apparentElevationDeg).toBeCloseTo(elevation, 0);
      expect(result.fractionalYearDays).toBe(366);
      expect(result.isAboveHorizon).toBe(true);
    },
  );

  it("identifies a midnight sun position as below the horizon", () => {
    const result = calculateSolarPosition({
      location: TOKYO,
      localStandardTime: time(2025, 3, 20, 0),
    });
    expect(result.elevationDeg).toBeLessThan(0);
    expect(result.isAboveHorizon).toBe(false);
  });

  it("rejects a local-standard-time value outside one civil day", () => {
    expect(() =>
      calculateSolarPosition({
        location: TOKYO,
        localStandardTime: { ...time(2025, 3, 20, 0), minuteOfDay: 1440 },
      }),
    ).toThrow(/minuteOfDay/u);
  });

  it("shows the expected east-to-west azimuth tendency around noon", () => {
    const morning = calculateSolarPosition({
      location: TOKYO,
      localStandardTime: time(2025, 3, 20, 9),
    });
    const afternoon = calculateSolarPosition({
      location: TOKYO,
      localStandardTime: time(2025, 3, 20, 15),
    });
    expect(morning.azimuthDeg).toBeLessThan(180);
    expect(afternoon.azimuthDeg).toBeGreaterThan(180);
    expect(Math.abs(morning.elevationDeg - afternoon.elevationDeg)).toBeLessThan(5);
  });
});

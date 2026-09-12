import { describe, expect, it } from "vitest";

import {
  createWeatherIntervalTime,
  dayOfYear,
  isLeapYear,
} from "../src/weather";

describe("canonical EPW local-standard-time contract", () => {
  it("maps hourly interval end to the preceding interval midpoint", () => {
    const time = createWeatherIntervalTime(2025, 1, 1, 1, 60, 60);

    expect(time.intervalEndLocalStandardTime).toEqual({
      year: 2025,
      month: 1,
      day: 1,
      minuteOfDay: 60,
    });
    expect(time.midpointLocalStandardTime).toEqual({
      year: 2025,
      month: 1,
      day: 1,
      minuteOfDay: 30,
    });
  });

  it("normalizes the final interval end without using Date or host timezone", () => {
    const time = createWeatherIntervalTime(2024, 12, 31, 24, 60, 60);

    expect(time.intervalEndLocalStandardTime).toEqual({
      year: 2025,
      month: 1,
      day: 1,
      minuteOfDay: 0,
    });
    expect(time.midpointLocalStandardTime).toEqual({
      year: 2024,
      month: 12,
      day: 31,
      minuteOfDay: 1410,
    });
  });

  it("retains a fractional-minute midpoint for sub-hour records", () => {
    const time = createWeatherIntervalTime(2025, 6, 1, 1, 15, 15);
    expect(time.midpointLocalStandardTime.minuteOfDay).toBe(7.5);
  });

  it("handles Gregorian leap years deterministically", () => {
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2100)).toBe(false);
    expect(dayOfYear(2024, 2, 29)).toBe(60);
    expect(dayOfYear(2025, 12, 31)).toBe(365);
  });

  it("rejects interval metadata that cannot produce the encoded end minute", () => {
    expect(() => createWeatherIntervalTime(2025, 1, 1, 1, 20, 15)).toThrow(
      /inconsistent/u,
    );
  });
});

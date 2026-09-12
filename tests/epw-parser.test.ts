import { describe, expect, it } from "vitest";

import {
  daysInMonth,
  parseEpw,
  WeatherDataError,
} from "../src/weather";
import hourlyFixture from "./fixtures/weather/synthetic-hourly.epw?raw";
import subhourFixture from "./fixtures/weather/synthetic-subhour.epw?raw";

function headers(recordsPerHour: number, endDate = "12/31"): string[] {
  return [
    "LOCATION,Synthetic,Region,JPN,SYNTHETIC,999999,35,139,9,40",
    "DESIGN CONDITIONS,0",
    "TYPICAL/EXTREME PERIODS,0",
    "GROUND TEMPERATURES,0",
    "HOLIDAYS/DAYLIGHT SAVINGS,No,0,0,0",
    "COMMENTS 1,Synthetic",
    "COMMENTS 2,Tests only",
    `DATA PERIODS,1,${recordsPerHour},Data,Wednesday,1/1,${endDate}`,
  ];
}

function row(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  ghi = 100,
  dni = 200,
  dhi = 30,
): string {
  return [
    year,
    month,
    day,
    hour,
    minute,
    "?9?9?9?9",
    10,
    5,
    50,
    101325,
    0,
    0,
    300,
    ghi,
    dni,
    dhi,
  ].join(",");
}

function fullYear(year: number): string {
  const lines = headers(1);
  for (let month = 1; month <= 12; month += 1) {
    for (let day = 1; day <= daysInMonth(year, month); day += 1) {
      for (let hour = 1; hour <= 24; hour += 1) {
        lines.push(row(year, month, day, hour, 60));
      }
    }
  }
  return lines.join("\n");
}

describe("EPW parser", () => {
  it("maps LOCATION, DATA PERIODS, radiation, and hourly time semantics", () => {
    const dataset = parseEpw(hourlyFixture, { sourceName: "synthetic-hourly" });

    expect(dataset.location).toMatchObject({
      city: "Synthetic Tokyo",
      region: "Test Region",
      country: "JPN",
      stationId: "999999",
      latitudeDeg: 35,
      longitudeDeg: 139,
      timeZoneOffsetHours: 9,
      elevationM: 40,
    });
    expect(dataset.recordsPerHour).toBe(1);
    expect(dataset.intervalMinutes).toBe(60);
    expect(dataset.dataPeriods[0]).toMatchObject({
      startMonth: 1,
      startDay: 1,
      endMonth: 1,
      endDay: 1,
    });
    expect(dataset.intervals[0]?.radiation).toEqual({
      globalHorizontalWhPerM2: 100,
      directNormalWhPerM2: 200,
      diffuseHorizontalWhPerM2: 30,
    });
    expect(dataset.intervals[0]?.time.midpointLocalStandardTime.minuteOfDay).toBe(30);
    expect(dataset.issues).toEqual([]);
  });

  it("uses DATA PERIODS records/hour for sub-hour interval ends and midpoints", () => {
    const dataset = parseEpw(subhourFixture, { sourceName: "synthetic-subhour" });
    expect(dataset.recordsPerHour).toBe(4);
    expect(dataset.intervalMinutes).toBe(15);
    expect(dataset.intervals).toHaveLength(4);
    expect(
      dataset.intervals.map(
        (interval) => interval.time.midpointLocalStandardTime.minuteOfDay,
      ),
    ).toEqual([7.5, 22.5, 37.5, 52.5]);
  });

  it("accepts padded M/D fields used by official EnergyPlus distributions", () => {
    const source = [
      ...headers(1).slice(0, 7),
      "DATA PERIODS,1,1,Data,Sunday, 1/ 1,12/31",
      row(2025, 1, 1, 1, 60),
    ].join("\n");
    expect(parseEpw(source, { sourceName: "synthetic-padded-date" }).dataPeriods[0]).toMatchObject({
      startMonth: 1,
      startDay: 1,
      endMonth: 12,
      endDay: 31,
    });
  });

  it("classifies 8760 and 8784 record datasets", () => {
    const ordinary = parseEpw(fullYear(2025), { sourceName: "synthetic-8760" });
    const leap = parseEpw(fullYear(2024), { sourceName: "synthetic-8784" });

    expect(ordinary.intervals).toHaveLength(8760);
    expect(ordinary.coverage).toBe("full-year-8760");
    expect(leap.intervals).toHaveLength(8784);
    expect(leap.coverage).toBe("full-leap-year-8784");
    expect(leap.intervals.some((item) => item.time.month === 2 && item.time.day === 29)).toBe(
      true,
    );
  });

  it("reports malformed records without inventing an interval", () => {
    const dataset = parseEpw([...headers(1), "2025,1,1"].join("\n"), {
      sourceName: "synthetic-malformed",
    });
    expect(dataset.intervals).toEqual([]);
    expect(dataset.issues[0]).toMatchObject({ code: "ROW_MALFORMED", line: 9 });
  });

  it.each([
    ["missing", 9999, "RADIATION_MISSING"],
    ["negative", -1, "RADIATION_INVALID"],
  ])("retains required solar %s as null and emits an error", (_, dni, code) => {
    const dataset = parseEpw(
      [...headers(1), row(2025, 1, 1, 1, 60, 100, Number(dni), 30)].join("\n"),
      { sourceName: "synthetic-invalid-solar" },
    );
    expect(dataset.intervals[0]?.radiation.directNormalWhPerM2).toBeNull();
    expect(dataset.issues).toContainEqual(
      expect.objectContaining({ code, field: "DNI", line: 9 }),
    );
  });

  it("rejects unsupported records/hour metadata", () => {
    expect(() =>
      parseEpw([...headers(7), row(2025, 1, 1, 1, 60)].join("\n"), {
        sourceName: "synthetic-unsupported",
      }),
    ).toThrow(WeatherDataError);
  });

  it("reports a record minute inconsistent with DATA PERIODS", () => {
    const dataset = parseEpw(
      [...headers(4), row(2025, 1, 1, 1, 20)].join("\n"),
      { sourceName: "synthetic-inconsistent",
      },
    );
    expect(dataset.intervals).toEqual([]);
    expect(dataset.issues[0]).toMatchObject({ code: "TIME_INVALID", line: 9 });
  });
});

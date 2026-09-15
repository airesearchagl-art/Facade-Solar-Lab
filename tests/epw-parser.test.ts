import { describe, expect, it } from "vitest";

import {
  assertWeatherDatasetUsable,
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
    expect(ordinary.issues).toEqual([]);
    expect(() => assertWeatherDatasetUsable(ordinary)).not.toThrow();
    expect(leap.intervals).toHaveLength(8784);
    expect(leap.coverage).toBe("full-leap-year-8784");
    expect(leap.issues).toEqual([]);
    expect(() => assertWeatherDatasetUsable(leap)).not.toThrow();
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

describe("hourly EPW temporal integrity", () => {
  const options = { sourceName: "synthetic-temporal-integrity" };

  function expectRejected(source: string, code: string) {
    const dataset = parseEpw(source, options);
    expect(dataset.coverage).toBe("partial");
    expect(dataset.issues).toContainEqual(expect.objectContaining({ severity: "error", code }));
    expect(() => assertWeatherDatasetUsable(dataset)).toThrow(WeatherDataError);
    return dataset;
  }

  it.each([
    [2025, 0], [2025, 4000], [2025, 8759],
    [2024, 0], [2024, 1427], [2024, 8783],
  ])("rejects year %i with missing slot %i, including annual endpoints and Feb 29", (year, slot) => {
    const lines = fullYear(year).split("\n");
    lines.splice(8 + slot, 1);
    const dataset = expectRejected(lines.join("\n"), "INTERVAL_MISSING");
    expect(dataset.intervals).toHaveLength(year === 2024 ? 8783 : 8759);
    expect(dataset.issues).toHaveLength(1);
    expect(dataset.issues[0]?.message).toMatch(/^1 hourly interval/u);
  });

  it("rejects a repeated interval without dropping the duplicate or its radiation", () => {
    const lines = fullYear(2025).split("\n");
    lines.splice(9, 0, row(2025, 1, 1, 1, 60, 101, 201, 31));
    const dataset = expectRejected(lines.join("\n"), "INTERVAL_DUPLICATE");
    expect(dataset.intervals).toHaveLength(8761);
    expect(dataset.intervals[1]?.radiation.directNormalWhPerM2).toBe(201);
    expect(dataset.issues).toEqual([
      expect.objectContaining({ code: "INTERVAL_DUPLICATE", line: 10 }),
    ]);
  });

  it("does not certify 8760 rows when a duplicate replaces a missing slot", () => {
    const lines = fullYear(2025).split("\n");
    lines[9] = lines[8]!;
    const dataset = expectRejected(lines.join("\n"), "INTERVAL_DUPLICATE");
    expect(dataset.intervals).toHaveLength(8760);
    expect(dataset.issues).toContainEqual(expect.objectContaining({ code: "INTERVAL_MISSING" }));
  });

  it.each([2025, 2024])("rejects swapped intervals in %i without silently sorting", (year) => {
    const lines = fullYear(year).split("\n");
    [lines[8], lines[9]] = [lines[9]!, lines[8]!];
    const dataset = expectRejected(lines.join("\n"), "INTERVAL_OUT_OF_ORDER");
    expect(dataset.intervals.slice(0, 2).map(({ time }) => time.rawHour)).toEqual([2, 1]);
    expect(dataset.issues).toEqual([
      expect.objectContaining({ code: "INTERVAL_OUT_OF_ORDER", line: 10 }),
    ]);
  });

  it("requires all 24 Feb 29 slots when the header declares a leap calendar", () => {
    const lines = fullYear(2024).split("\n").filter((line) => !line.startsWith("2024,2,29,"));
    lines[4] = "HOLIDAYS/DAYLIGHT SAVINGS,Yes,0,0,0";
    const dataset = expectRejected(lines.join("\n"), "INTERVAL_MISSING");
    expect(dataset.intervals).toHaveLength(8760);
    expect(dataset.issues[0]?.message).toMatch(/^24 hourly interval/u);
  });

  it("preserves mixed TMY source years without treating raw leap years as extra days", () => {
    const lines = fullYear(2025).split("\n").map((line, index) => {
      if (index < 8) return line;
      const month = Number(line.split(",")[1]);
      return line.replace(/^2025,/u, month % 2 === 1 ? "2024," : "1999,");
    });
    const dataset = parseEpw(lines.join("\n"), options);
    expect(dataset.coverage).toBe("full-year-8760");
    expect(dataset.issues).toEqual([]);
    expect(dataset.intervals[0]?.time.year).toBe(2024);
    expect(dataset.intervals[31 * 24]?.time.year).toBe(1999);
  });

  it("identifies duplicate calendar slots even when raw source years differ", () => {
    const lines = fullYear(2025).split("\n");
    lines[9] = row(1999, 1, 1, 1, 60);
    const dataset = expectRejected(lines.join("\n"), "INTERVAL_DUPLICATE");
    expect(dataset.issues).toContainEqual(expect.objectContaining({ code: "INTERVAL_MISSING" }));
  });

  it("retains valid partial files but rejects gaps inside their observed span", () => {
    const valid = parseEpw(hourlyFixture, options);
    expect(valid.coverage).toBe("partial");
    expect(() => assertWeatherDatasetUsable(valid)).not.toThrow();
    const dataset = expectRejected([
      ...headers(1, "1/1"), row(2025, 1, 1, 1, 60), row(2025, 1, 1, 3, 60),
    ].join("\n"), "INTERVAL_MISSING");
    expect(dataset.intervals.map(({ time }) => time.rawHour)).toEqual([1, 3]);
  });

  it("accepts the declared Dec 31 -> Jan 1 boundary but not a reverse or repeated cycle", () => {
    const periodHeaders = headers(1, "1/1");
    periodHeaders[7] = "DATA PERIODS,1,1,Data,Wednesday,12/31,1/1";
    const last = row(2025, 12, 31, 24, 60);
    const first = row(2026, 1, 1, 1, 60);
    const dataset = parseEpw([...periodHeaders, last, first].join("\n"), options);
    expect(dataset.issues).toEqual([]);
    expect(dataset.coverage).toBe("partial");
    expect(dataset.intervals[0]?.time.intervalEndLocalStandardTime).toEqual({
      year: 2026, month: 1, day: 1, minuteOfDay: 0,
    });
    expect(dataset.intervals[1]?.time.midpointLocalStandardTime).toEqual({
      year: 2026, month: 1, day: 1, minuteOfDay: 30,
    });
    expectRejected([...periodHeaders, first, last].join("\n"), "INTERVAL_OUT_OF_ORDER");
    expectRejected([...periodHeaders, last, first, last].join("\n"), "INTERVAL_DUPLICATE");
  });

  it("does not accept Jan 1 after Dec 31 as a new cycle in a Jan-Dec annual period", () => {
    const dataset = expectRejected(`${fullYear(2025)}\n${row(2026, 1, 1, 1, 60)}`, "INTERVAL_OUT_OF_ORDER");
    expect(dataset.issues).toContainEqual(expect.objectContaining({ code: "INTERVAL_DUPLICATE" }));
  });

  it("rejects dates outside the declared partial period", () => {
    expectRejected([...headers(1, "1/1"), row(2025, 1, 2, 1, 60)].join("\n"), "INTERVAL_OUT_OF_PERIOD");
  });

  it("reports an invalid period endpoint explicitly", () => {
    expectRejected([...headers(1, "13/1"), row(2025, 1, 1, 1, 60)].join("\n"), "HEADER_INVALID");
  });
});

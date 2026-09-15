import { describe, expect, it } from "vitest";

import { assertWeatherDatasetUsable, parseEpw, WeatherDataError } from "../src/weather";
import subhourFixture from "./fixtures/weather/synthetic-subhour.epw?raw";

const options = { sourceName: "synthetic-subhour-temporal" };

function headers(recordsPerHour = 4, start = "1/1", end = "12/31", leap = "No"): string[] {
  return [
    "LOCATION,Synthetic,Region,JPN,SYNTHETIC,999999,35,139,9,40",
    "DESIGN CONDITIONS,0", "TYPICAL/EXTREME PERIODS,0", "GROUND TEMPERATURES,0",
    `HOLIDAYS/DAYLIGHT SAVINGS,${leap},0,0,0`,
    "COMMENTS 1,Synthetic", "COMMENTS 2,Temporal tests only",
    `DATA PERIODS,1,${recordsPerHour},Data,Wednesday,${start},${end}`,
  ];
}

function row(year: number, month: number, day: number, hour: number, minute: number, dni = 50): string {
  return [year, month, day, hour, minute, "?9?9?9?9", 10, 5, 50, 101325, 0, 0, 300, 25, dni, 7.5].join(",");
}

// Fixed synthetic calendars, independent of the validator's slot/dayOfYear logic.
function yearRows(year: 2025 | 2024): string[] {
  const monthLengths = [31, year === 2024 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return monthLengths.flatMap((days, index) => Array.from({ length: days }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => [15, 30, 45, 60].map((minute) =>
      row(year, index + 1, day + 1, hour + 1, minute))).flat()).flat());
}

const annualRows = { 2025: yearRows(2025), 2024: yearRows(2024) };

function parse(rows: readonly string[], periodHeaders = headers()) {
  return parseEpw([...periodHeaders, ...rows].join("\n"), options);
}

function rejected(rows: readonly string[], code: string, periodHeaders = headers()) {
  const dataset = parse(rows, periodHeaders);
  expect(dataset.coverage).toBe("partial");
  expect(dataset.issues).toContainEqual(expect.objectContaining({ code, severity: "error" }));
  expect(() => assertWeatherDatasetUsable(dataset)).toThrow(WeatherDataError);
  return dataset;
}

describe("P1-A sub-hour EPW temporal integrity", () => {
  it.each([[2025, 35040], [2024, 35136]] as const)("accepts every 15-minute slot in %i (%i records)", (year, count) => {
    const dataset = parse(annualRows[year]);
    expect(dataset.intervals).toHaveLength(count);
    expect(dataset.coverage).toBe("full-year-subhour");
    expect(dataset.issues).toEqual([]);
    expect(() => assertWeatherDatasetUsable(dataset)).not.toThrow();
    expect(dataset.recordsPerHour).toBe(4);
    expect(dataset.intervalMinutes).toBe(15);
    expect(dataset.provenance).toEqual({ sourceType: "epw", sourceName: options.sourceName });
    expect(dataset.intervals.slice(0, 4).map(({ time }) => time.rawMinute)).toEqual([15, 30, 45, 60]);
    expect(dataset.intervals[0]!.time.midpointLocalStandardTime).toEqual({ year, month: 1, day: 1, minuteOfDay: 7.5 });
    expect(dataset.intervals.at(-1)!.time).toMatchObject({
      year, month: 12, day: 31, rawHour: 24, rawMinute: 60,
      midpointLocalStandardTime: { year, month: 12, day: 31, minuteOfDay: 1432.5 },
      intervalEndLocalStandardTime: { year: year + 1, month: 1, day: 1, minuteOfDay: 0 },
    });
    expect(dataset.intervals.filter(({ time }) => time.month === 2 && time.day === 29)).toHaveLength(year === 2024 ? 96 : 0);
    expect(dataset.intervals.at(-1)!.radiation).toEqual({ globalHorizontalWhPerM2: 25, directNormalWhPerM2: 50, diffuseHorizontalWhPerM2: 7.5 });
  });

  it.each([
    [2025, 0], [2025, 8001], [2025, 35039],
    [2024, 0], [2024, 5681], [2024, 35135],
  ] as const)("rejects missing slot %i / %i, including endpoints and Feb 29", (year, slot) => {
    const rows = [...annualRows[year]];
    rows.splice(slot, 1);
    const dataset = rejected(rows, "INTERVAL_MISSING");
    expect(dataset.intervals).toHaveLength(annualRows[year].length - 1);
    expect(dataset.issues).toEqual([expect.objectContaining({ code: "INTERVAL_MISSING", message: expect.stringMatching(/^1 sub-hour interval/u) })]);
  });

  it("retains a duplicate's different source year and radiation, without deduplication", () => {
    const rows = [...annualRows[2025]];
    rows.splice(1, 0, row(1999, 1, 1, 1, 15, 123));
    const dataset = rejected(rows, "INTERVAL_DUPLICATE");
    expect(dataset.intervals).toHaveLength(35041);
    expect(dataset.intervals[1]).toMatchObject({ time: { year: 1999, rawHour: 1, rawMinute: 15 }, radiation: { directNormalWhPerM2: 123 }, sourceLine: 10 });
    expect(dataset.intervals[2]!.time.rawMinute).toBe(30);
    expect(dataset.issues).toEqual([expect.objectContaining({ code: "INTERVAL_DUPLICATE", line: 10, message: expect.stringContaining("line 9") })]);
  });

  it.each([2025, 2024] as const)("rejects count-preserving duplicate + missing minute in %i", (year) => {
    const rows = [...annualRows[year]];
    rows[1] = rows[0]!;
    const dataset = rejected(rows, "INTERVAL_DUPLICATE");
    expect(dataset.intervals).toHaveLength(annualRows[year].length);
    expect(dataset.issues).toEqual([
      expect.objectContaining({ code: "INTERVAL_DUPLICATE", line: 10 }),
      expect.objectContaining({ code: "INTERVAL_MISSING" }),
    ]);
  });

  it.each([2025, 2024] as const)("rejects same-hour swapped minutes in %i without sorting or false missing issues", (year) => {
    const rows = [...annualRows[year]];
    [rows[0], rows[1]] = [rows[1]!, rows[0]!];
    const dataset = rejected(rows, "INTERVAL_OUT_OF_ORDER");
    expect(dataset.intervals.slice(0, 2).map(({ time }) => time.rawMinute)).toEqual([30, 15]);
    expect(dataset.issues).toEqual([expect.objectContaining({ code: "INTERVAL_OUT_OF_ORDER", line: 10 })]);
  });

  it("requires all 96 Feb 29 slots when the header declares a leap calendar, even with 35040 rows", () => {
    const rows = annualRows[2024].filter((line) => !line.startsWith("2024,2,29,"));
    const dataset = rejected(rows, "INTERVAL_MISSING", headers(4, "1/1", "12/31", "Yes"));
    expect(dataset.intervals).toHaveLength(35040);
    expect(dataset.issues).toEqual([expect.objectContaining({ message: expect.stringMatching(/^96 sub-hour interval/u) })]);
  });

  it("preserves mixed TMY source years, flags, radiation, and original order", () => {
    const rows = annualRows[2025].map((line) => line.replace(/^2025,/u,
      Number(line.split(",")[1]) % 2 === 1 ? "2024," : "1999,"));
    const dataset = parse(rows);
    expect(dataset.coverage).toBe("full-year-subhour");
    expect(dataset.issues).toEqual([]);
    expect(dataset.intervals.map(({ time, radiation, dataSourceAndUncertaintyFlags, sourceLine }) => [
      time.year, time.month, time.day, time.rawHour, time.rawMinute,
      dataSourceAndUncertaintyFlags, radiation.globalHorizontalWhPerM2,
      radiation.directNormalWhPerM2, radiation.diffuseHorizontalWhPerM2, sourceLine,
    ])).toEqual(rows.map((line, index) => {
      const fields = line.split(",");
      return [...fields.slice(0, 5).map(Number), fields[5], ...fields.slice(13, 16).map(Number), index + 9];
    }));
  });

  it("keeps partial compatibility but rejects minute gaps inside the observed span", () => {
    const dataset = parseEpw(subhourFixture, options);
    expect(dataset.coverage).toBe("partial");
    expect(dataset.issues).toEqual([]);
    expect(() => assertWeatherDatasetUsable(dataset)).not.toThrow();
    const partialHeaders = headers(4, "1/1", "1/1");
    expect(parse([row(2025, 1, 1, 1, 30), row(2025, 1, 1, 1, 45)], partialHeaders).issues).toEqual([]);
    const invalid = rejected([row(2025, 1, 1, 1, 15), row(2025, 1, 1, 1, 45)], "INTERVAL_MISSING", partialHeaders);
    expect(invalid.intervals.map(({ time }) => time.rawMinute)).toEqual([15, 45]);
  });

  it("handles Feb 28 -> Feb 29 -> Mar 1 as adjacent slots without shifting source dates", () => {
    const rows = [row(2024, 2, 28, 24, 60), ...annualRows[2024].filter((line) => line.startsWith("2024,2,29,")), row(2024, 3, 1, 1, 15)];
    const dataset = parse(rows, headers(4, "2/28", "3/1"));
    expect(dataset.issues).toEqual([]);
    expect(dataset.intervals).toHaveLength(98);
    expect(dataset.intervals[0]!.time).toMatchObject({ month: 2, day: 28, rawHour: 24, rawMinute: 60 });
    expect(dataset.intervals[1]!.time).toMatchObject({ month: 2, day: 29, rawHour: 1, rawMinute: 15 });
    expect(dataset.intervals.at(-1)!.time).toMatchObject({ month: 3, day: 1, rawHour: 1, rawMinute: 15 });
  });

  it("accepts declared Dec -> Jan adjacency but rejects reverse order, repeated cycle, or a boundary gap", () => {
    const periodHeaders = headers(4, "12/31", "1/1");
    const last = row(2025, 12, 31, 24, 60);
    const first = row(2026, 1, 1, 1, 15);
    const dataset = parse([last, first], periodHeaders);
    expect(dataset.issues).toEqual([]);
    expect(dataset.coverage).toBe("partial");
    expect(dataset.intervals[0]!.time.intervalEndLocalStandardTime).toEqual({ year: 2026, month: 1, day: 1, minuteOfDay: 0 });
    expect(dataset.intervals[1]!.time.midpointLocalStandardTime.minuteOfDay).toBe(7.5);
    rejected([first, last], "INTERVAL_OUT_OF_ORDER", periodHeaders);
    rejected([last, first, last], "INTERVAL_DUPLICATE", periodHeaders);
    rejected([row(2025, 12, 31, 24, 45), first], "INTERVAL_MISSING", periodHeaders);
  });

  it("does not allow Jan 1 to start a second cycle after a complete Jan-Dec year", () => {
    const dataset = rejected([...annualRows[2025], row(2026, 1, 1, 1, 15)], "INTERVAL_OUT_OF_ORDER");
    expect(dataset.issues).toContainEqual(expect.objectContaining({ code: "INTERVAL_DUPLICATE" }));
  });

  it("validates all slots of a full year declared April -> March", () => {
    const april = 90 * 96;
    const rows = [...annualRows[2025].slice(april), ...annualRows[2025].slice(0, april)];
    const dataset = parse(rows, headers(4, "4/1", "3/31"));
    expect(dataset.coverage).toBe("full-year-subhour");
    expect(dataset.issues).toEqual([]);
    expect(dataset.intervals[0]!.time.month).toBe(4);
    expect(dataset.intervals.at(-1)!.time.month).toBe(3);
    rejected(rows.slice(1), "INTERVAL_MISSING", headers(4, "4/1", "3/31"));
  });

  it("rejects a partial-period overflow and invalid header dates", () => {
    rejected([row(2025, 1, 2, 1, 15)], "INTERVAL_OUT_OF_PERIOD", headers(4, "1/1", "1/1"));
    rejected([row(2025, 1, 1, 1, 15)], "HEADER_INVALID", headers(4, "1/1", "13/1"));
  });

  it.each([0, 20, 61])("keeps the existing explicit rejection of invalid raw minute %i", (minute) => {
    const dataset = rejected([row(2025, 1, 1, 1, minute)], "TIME_INVALID");
    expect(dataset.intervals).toHaveLength(0);
  });

  it.each([2, 3, 5, 6, 10, 12, 15, 20, 30, 60])("uses recordsPerHour=%i rather than assuming four slots", (recordsPerHour) => {
    const minutes = Array.from({ length: recordsPerHour }, (_, index) => (index + 1) * 60 / recordsPerHour);
    const rows = minutes.map((minute) => row(2025, 1, 1, 1, minute));
    const periodHeaders = headers(recordsPerHour, "1/1", "1/1");
    expect(parse(rows, periodHeaders).issues).toEqual([]);
    rejected([...rows, row(2025, 1, 1, 2, minutes[1]!)], "INTERVAL_MISSING", periodHeaders);
  });
});

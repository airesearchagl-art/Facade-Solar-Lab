import type { WeatherDataPeriod, WeatherLocation } from "../canonical";
import { WeatherDataError, type WeatherParseIssue } from "../issues";
import type { EpwHeaders } from "./types";

const EXPECTED_HEADER_NAMES = [
  "LOCATION",
  "DESIGN CONDITIONS",
  "TYPICAL/EXTREME PERIODS",
  "GROUND TEMPERATURES",
  "HOLIDAYS/DAYLIGHT SAVINGS",
  "COMMENTS 1",
  "COMMENTS 2",
  "DATA PERIODS",
] as const;

export function splitEpwCsvLine(line: string): readonly string[] {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]!;
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(field.trim());
      field = "";
    } else {
      field += character;
    }
  }
  fields.push(field.trim());
  return fields;
}

function finiteNumber(value: string | undefined, field: string, line: number): number {
  const parsed = Number(value);
  if (value === undefined || value === "" || !Number.isFinite(parsed)) {
    throw new WeatherDataError(`Invalid EPW ${field}`, [
      {
        severity: "error",
        code: "HEADER_INVALID",
        message: `${field} must be a finite number`,
        line,
        field,
        rawValue: value,
      },
    ]);
  }
  return parsed;
}

function parseMonthDay(value: string | undefined, field: string): [number, number] {
  const match = /^\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*$/u.exec(value ?? "");
  if (match === null) {
    throw new WeatherDataError(`Invalid EPW ${field}`, [
      {
        severity: "error",
        code: "HEADER_INVALID",
        message: `${field} must use M/D form`,
        line: 8,
        field,
        rawValue: value,
      },
    ]);
  }
  return [Number(match[1]), Number(match[2])];
}

function parseLocation(fields: readonly string[]): WeatherLocation {
  if (fields.length < 10) {
    throw new WeatherDataError("EPW LOCATION header is incomplete", [
      {
        severity: "error",
        code: "HEADER_INVALID",
        message: "LOCATION requires 10 comma-separated fields",
        line: 1,
      },
    ]);
  }
  const latitudeDeg = finiteNumber(fields[6], "latitude", 1);
  const longitudeDeg = finiteNumber(fields[7], "longitude", 1);
  const timeZoneOffsetHours = finiteNumber(fields[8], "time zone", 1);
  const elevationM = finiteNumber(fields[9], "elevation", 1);
  if (latitudeDeg < -90 || latitudeDeg > 90) {
    throw new WeatherDataError("EPW latitude is outside -90..90", [
      {
        severity: "error",
        code: "HEADER_INVALID",
        message: "Latitude must be in -90..90 degrees",
        line: 1,
        field: "latitude",
        rawValue: fields[6],
      },
    ]);
  }
  if (longitudeDeg < -180 || longitudeDeg > 180) {
    throw new WeatherDataError("EPW longitude is outside -180..180", [
      {
        severity: "error",
        code: "HEADER_INVALID",
        message: "Longitude must be in -180..180 degrees",
        line: 1,
        field: "longitude",
        rawValue: fields[7],
      },
    ]);
  }

  return {
    city: fields[1] ?? "",
    region: fields[2] ?? "",
    country: fields[3] ?? "",
    source: fields[4] ?? "",
    ...(fields[5] === undefined || fields[5] === ""
      ? {}
      : { stationId: fields[5] }),
    latitudeDeg,
    longitudeDeg,
    timeZoneOffsetHours,
    elevationM,
  };
}

function parseDataPeriods(
  fields: readonly string[],
): {
  readonly recordsPerHour: number;
  readonly intervalMinutes: number;
  readonly dataPeriods: readonly WeatherDataPeriod[];
} {
  const periodCount = finiteNumber(fields[1], "number of data periods", 8);
  const recordsPerHour = finiteNumber(fields[2], "records per hour", 8);
  const issue: WeatherParseIssue = {
    severity: "error",
    code: "INTERVAL_METADATA_INVALID",
    message: "Records per hour must be a positive integer divisor of 60",
    line: 8,
    field: "records per hour",
    rawValue: fields[2],
  };
  if (
    !Number.isInteger(periodCount) ||
    periodCount < 1 ||
    !Number.isInteger(recordsPerHour) ||
    recordsPerHour < 1 ||
    60 % recordsPerHour !== 0
  ) {
    throw new WeatherDataError("Unsupported EPW DATA PERIODS metadata", [issue]);
  }
  if (periodCount !== 1) {
    throw new WeatherDataError("Multiple EPW data periods are not supported in M2", [
      {
        severity: "error",
        code: "DATA_PERIOD_UNSUPPORTED",
        message: "M2 supports exactly one EPW data period",
        line: 8,
        field: "number of data periods",
        rawValue: fields[1],
      },
    ]);
  }
  if (fields.length < 7) {
    throw new WeatherDataError("EPW DATA PERIODS header is incomplete", [
      {
        severity: "error",
        code: "HEADER_INVALID",
        message: "DATA PERIODS requires name, weekday, start date, and end date",
        line: 8,
      },
    ]);
  }
  const [startMonth, startDay] = parseMonthDay(fields[5], "start date");
  const [endMonth, endDay] = parseMonthDay(fields[6], "end date");
  return {
    recordsPerHour,
    intervalMinutes: 60 / recordsPerHour,
    dataPeriods: [
      {
        name: fields[3] ?? "",
        startDayOfWeek: fields[4] ?? "",
        startMonth,
        startDay,
        endMonth,
        endDay,
      },
    ],
  };
}

export function parseEpwHeaders(lines: readonly string[]): EpwHeaders {
  if (lines.length < EXPECTED_HEADER_NAMES.length) {
    throw new WeatherDataError("EPW requires eight header lines", [
      {
        severity: "error",
        code: "HEADER_MISSING",
        message: "Fewer than eight EPW header lines were provided",
      },
    ]);
  }
  const parsed = lines
    .slice(0, EXPECTED_HEADER_NAMES.length)
    .map((line) => splitEpwCsvLine(line.replace(/^\uFEFF/u, "")));
  for (let index = 0; index < EXPECTED_HEADER_NAMES.length; index += 1) {
    if (parsed[index]?.[0]?.toUpperCase() !== EXPECTED_HEADER_NAMES[index]) {
      throw new WeatherDataError(`EPW header ${index + 1} is invalid`, [
        {
          severity: "error",
          code: "HEADER_MISSING",
          message: `Expected ${EXPECTED_HEADER_NAMES[index]}`,
          line: index + 1,
          rawValue: parsed[index]?.[0],
        },
      ]);
    }
  }
  return {
    location: parseLocation(parsed[0]!),
    ...parseDataPeriods(parsed[7]!),
    raw: lines.slice(0, EXPECTED_HEADER_NAMES.length),
  };
}

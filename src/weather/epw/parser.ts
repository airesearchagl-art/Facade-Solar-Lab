import type {
  WeatherDataset,
  WeatherInterval,
  WeatherRadiation,
} from "../canonical";
import {
  hasWeatherErrors,
  WeatherDataError,
  type WeatherParseIssue,
} from "../issues";
import type { WeatherParseOptions, WeatherSourceProvenance } from "../provenance";
import { createWeatherIntervalTime } from "../time";
import { parseEpwHeaders, splitEpwCsvLine } from "./headers";
import { validateEpwTemporalIntegrity } from "./temporal";

const MINIMUM_DATA_FIELDS = 16;

function parseInteger(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseRadiation(
  fields: readonly string[],
  line: number,
  issues: WeatherParseIssue[],
): WeatherRadiation {
  const fieldDefinitions = [
    ["globalHorizontalWhPerM2", "GHI", 13],
    ["directNormalWhPerM2", "DNI", 14],
    ["diffuseHorizontalWhPerM2", "DHI", 15],
  ] as const;
  const result: Record<(typeof fieldDefinitions)[number][0], number | null> = {
    globalHorizontalWhPerM2: null,
    directNormalWhPerM2: null,
    diffuseHorizontalWhPerM2: null,
  };
  for (const [property, label, index] of fieldDefinitions) {
    const rawValue = fields[index];
    const value = Number(rawValue);
    if (
      rawValue === undefined ||
      rawValue === "" ||
      !Number.isFinite(value) ||
      value >= 9999
    ) {
      issues.push({
        severity: "error",
        code: "RADIATION_MISSING",
        message: `${label} is required and may not be silently replaced with zero`,
        line,
        field: label,
        rawValue,
      });
    } else if (value < 0) {
      issues.push({
        severity: "error",
        code: "RADIATION_INVALID",
        message: `${label} must be non-negative`,
        line,
        field: label,
        rawValue,
      });
    } else {
      result[property] = value;
    }
  }
  return result;
}

function parseRecord(
  fields: readonly string[],
  line: number,
  intervalMinutes: number,
  issues: WeatherParseIssue[],
): WeatherInterval | null {
  if (fields.length < MINIMUM_DATA_FIELDS) {
    issues.push({
      severity: "error",
      code: "ROW_MALFORMED",
      message: `EPW data row requires at least ${MINIMUM_DATA_FIELDS} fields`,
      line,
      rawValue: fields.join(","),
    });
    return null;
  }
  const year = parseInteger(fields[0]);
  const month = parseInteger(fields[1]);
  const day = parseInteger(fields[2]);
  const hour = parseInteger(fields[3]);
  const minute = parseInteger(fields[4]);
  if (year === null || month === null || day === null) {
    issues.push({
      severity: "error",
      code: "DATE_INVALID",
      message: "EPW year, month, and day must be integers forming a valid civil date",
      line,
    });
    return null;
  }
  if (hour === null || minute === null) {
    issues.push({
      severity: "error",
      code: "TIME_INVALID",
      message: "EPW hour and minute must be integers",
      line,
    });
    return null;
  }
  try {
    return {
      time: createWeatherIntervalTime(
        year,
        month,
        day,
        hour,
        minute,
        intervalMinutes,
      ),
      radiation: parseRadiation(fields, line, issues),
      dataSourceAndUncertaintyFlags: fields[5] ?? "",
      sourceLine: line,
    };
  } catch (error) {
    issues.push({
      severity: "error",
      code:
        error instanceof RangeError && /day|month|year/u.test(error.message)
          ? "DATE_INVALID"
          : "TIME_INVALID",
      message: error instanceof Error ? error.message : "Invalid EPW date/time",
      line,
    });
    return null;
  }
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function parseEpw(text: string, options: WeatherParseOptions): WeatherDataset {
  const lines = text.replace(/^\uFEFF/u, "").split(/\r?\n/u);
  while (lines.at(-1) === "") lines.pop();
  const headers = parseEpwHeaders(lines);
  const issues: WeatherParseIssue[] = [];
  const intervals: WeatherInterval[] = [];

  for (let index = 8; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (line.trim() === "") continue;
    const interval = parseRecord(
      splitEpwCsvLine(line),
      index + 1,
      headers.intervalMinutes,
      issues,
    );
    if (interval !== null) intervals.push(interval);
  }

  const temporal = validateEpwTemporalIntegrity(
    intervals,
    headers.dataPeriods[0]!,
    splitEpwCsvLine(headers.raw[4] ?? "")[1]?.toLowerCase() === "yes",
    headers.intervalMinutes,
  );
  for (const issue of temporal.issues) issues.push(issue);

  const provenance: WeatherSourceProvenance = {
    sourceType: options.sourceType ?? "epw",
    sourceName: options.sourceName,
    ...(options.sourceReference === undefined
      ? {}
      : { sourceReference: options.sourceReference }),
    ...(options.retrievedOn === undefined ? {} : { retrievedOn: options.retrievedOn }),
    ...(options.sourceSha256 === undefined
      ? {}
      : { sourceSha256: options.sourceSha256 }),
  };
  return {
    id: options.datasetId ?? `epw-${fnv1a32(text)}`,
    format: "epw",
    location: headers.location,
    recordsPerHour: headers.recordsPerHour,
    intervalMinutes: headers.intervalMinutes,
    dataPeriods: headers.dataPeriods,
    intervals,
    coverage: temporal.coverage,
    provenance,
    issues,
  };
}

export function assertWeatherDatasetUsable(dataset: WeatherDataset): void {
  if (hasWeatherErrors(dataset.issues)) {
    throw new WeatherDataError(
      `Weather dataset ${dataset.id} contains parse errors`,
      dataset.issues,
    );
  }
  if (dataset.intervals.length === 0) {
    throw new WeatherDataError(`Weather dataset ${dataset.id} has no intervals`, [
      {
        severity: "error",
        code: "ROW_MALFORMED",
        message: "At least one valid interval is required",
      },
    ]);
  }
}

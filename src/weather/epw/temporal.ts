import type { WeatherCoverage, WeatherDataPeriod, WeatherInterval } from "../canonical";
import type { WeatherParseIssue } from "../issues";
import { dayOfYear } from "../time";

/** Validate one hourly EPW period without rewriting source years, records, or order. */
export function validateHourlyTemporalIntegrity(
  intervals: readonly WeatherInterval[],
  period: WeatherDataPeriod,
  leapYearObserved: boolean,
): { readonly coverage: WeatherCoverage; readonly issues: readonly WeatherParseIssue[] } {
  // Typical-year source years may change between months. Calendar slots, not raw
  // source years or row count, identify intervals. Never discard observed Feb 29.
  const leap = leapYearObserved || intervals.some(
    ({ time }) => time.month === 2 && time.day === 29,
  );
  const calendarYear = leap ? 2000 : 2001;
  const hoursInYear = (leap ? 366 : 365) * 24;
  const firstHour = (month: number, day: number): number =>
    (dayOfYear(calendarYear, month, day) - 1) * 24;
  let periodStart: number;
  let periodEnd: number;
  try {
    periodStart = firstHour(period.startMonth, period.startDay);
    periodEnd = firstHour(period.endMonth, period.endDay) + 23;
  } catch (error) {
    return {
      coverage: "partial",
      issues: [{
        severity: "error",
        code: "HEADER_INVALID",
        message: error instanceof Error ? error.message : "Invalid data period date",
        line: 8,
        field: "DATA PERIODS",
      }],
    };
  }
  // Anchoring to the declared start permits Dec -> Jan only for a wrapping period.
  const offset = (hour: number): number =>
    (hour - periodStart + hoursInYear) % hoursInYear;
  const periodHours = offset(periodEnd) + 1;
  const fullYear = periodHours === hoursInYear;
  const issues: WeatherParseIssue[] = [];
  const seen = new Map<number, number>();
  let previous: number | undefined;
  let minimum = hoursInYear;
  let maximum = -1;

  for (const { time, sourceLine } of intervals) {
    const slot = offset(firstHour(time.month, time.day) + time.rawHour - 1);
    if (slot >= periodHours) {
      issues.push({
        severity: "error",
        code: "INTERVAL_OUT_OF_PERIOD",
        message: "Hourly interval lies outside the declared DATA PERIODS date range",
        line: sourceLine,
        field: "timestamp",
      });
    }
    const firstLine = seen.get(slot);
    if (firstLine !== undefined) {
      issues.push({
        severity: "error",
        code: "INTERVAL_DUPLICATE",
        message: `Duplicate hourly calendar interval; first occurrence at line ${firstLine}`,
        line: sourceLine,
        field: "timestamp",
      });
    }
    if (previous !== undefined && slot < previous) {
      issues.push({
        severity: "error",
        code: "INTERVAL_OUT_OF_ORDER",
        message: "Hourly intervals must follow the declared period in source order",
        line: sourceLine,
        field: "timestamp",
      });
    }
    if (firstLine === undefined) seen.set(slot, sourceLine);
    previous = slot;
    minimum = Math.min(minimum, slot);
    maximum = Math.max(maximum, slot);
  }

  // Annual declarations require every slot, including both endpoints. Partial
  // files retain their existing support; only their observed span must be intact.
  const firstExpected = fullYear ? 0 : minimum;
  const lastExpected = fullYear ? hoursInYear - 1 : maximum;
  let missing = 0;
  for (let slot = firstExpected; slot <= lastExpected; slot += 1) {
    if (!seen.has(slot)) missing += 1;
  }
  if (missing > 0) {
    issues.push({
      severity: "error",
      code: "INTERVAL_MISSING",
      message: `${missing} hourly interval(s) missing from ${fullYear ? "the declared full year" : "the observed partial span"}; no filling was performed`,
      field: "timestamp",
    });
  }
  return {
    coverage: fullYear && issues.length === 0
      ? (leap ? "full-leap-year-8784" : "full-year-8760")
      : "partial",
    issues,
  };
}

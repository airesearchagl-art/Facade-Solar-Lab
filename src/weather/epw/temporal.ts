import type { WeatherCoverage, WeatherDataPeriod, WeatherInterval } from "../canonical";
import type { WeatherParseIssue } from "../issues";
import { dayOfYear } from "../time";

/** Validate one EPW period after header/record time validation, without rewriting input. */
export function validateEpwTemporalIntegrity(
  intervals: readonly WeatherInterval[],
  period: WeatherDataPeriod,
  leapYearObserved: boolean,
  intervalMinutes: number,
): { readonly coverage: WeatherCoverage; readonly issues: readonly WeatherParseIssue[] } {
  // Typical-year source years may change between months. Calendar slots, not raw
  // source years or row count, identify intervals. Never discard observed Feb 29.
  const leap = leapYearObserved || intervals.some(
    ({ time }) => time.month === 2 && time.day === 29,
  );
  const calendarYear = leap ? 2000 : 2001;
  // The parser already requires an integer divisor of 60 and aligned raw minutes.
  const slotsPerHour = 60 / intervalMinutes;
  const slotsPerDay = 24 * slotsPerHour;
  const slotsInYear = (leap ? 366 : 365) * slotsPerDay;
  const firstSlot = (month: number, day: number): number =>
    (dayOfYear(calendarYear, month, day) - 1) * slotsPerDay;
  const unit = intervalMinutes === 60 ? "hourly" : "sub-hour";
  const unitLabel = intervalMinutes === 60 ? "Hourly" : "Sub-hour";
  let periodStart: number;
  let periodEnd: number;
  try {
    periodStart = firstSlot(period.startMonth, period.startDay);
    periodEnd = firstSlot(period.endMonth, period.endDay) + slotsPerDay - 1;
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
  const offset = (slot: number): number =>
    (slot - periodStart + slotsInYear) % slotsInYear;
  const periodSlots = offset(periodEnd) + 1;
  const fullYear = periodSlots === slotsInYear;
  const issues: WeatherParseIssue[] = [];
  const seen = new Map<number, number>();
  let previous: number | undefined;
  let minimum = slotsInYear;
  let maximum = -1;

  for (const { time, sourceLine } of intervals) {
    // Raw EPW interval-end minute identifies the slot inside its raw hour.
    // 24:60 remains on its source date; normalized next-day 00:00 is not used.
    const slot = offset(firstSlot(time.month, time.day)
      + (time.rawHour - 1) * slotsPerHour + time.rawMinute / intervalMinutes - 1);
    if (slot >= periodSlots) {
      issues.push({
        severity: "error",
        code: "INTERVAL_OUT_OF_PERIOD",
        message: `${unitLabel} interval lies outside the declared DATA PERIODS date range`,
        line: sourceLine,
        field: "timestamp",
      });
    }
    const firstLine = seen.get(slot);
    if (firstLine !== undefined) {
      issues.push({
        severity: "error",
        code: "INTERVAL_DUPLICATE",
        message: `Duplicate ${unit} calendar interval; first occurrence at line ${firstLine}`,
        line: sourceLine,
        field: "timestamp",
      });
    }
    if (previous !== undefined && slot < previous) {
      issues.push({
        severity: "error",
        code: "INTERVAL_OUT_OF_ORDER",
        message: `${unitLabel} intervals must follow the declared period in source order`,
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
  const lastExpected = fullYear ? slotsInYear - 1 : maximum;
  let missing = 0;
  for (let slot = firstExpected; slot <= lastExpected; slot += 1) {
    if (!seen.has(slot)) missing += 1;
  }
  if (missing > 0) {
    issues.push({
      severity: "error",
      code: "INTERVAL_MISSING",
      message: `${missing} ${unit} interval(s) missing from ${fullYear ? "the declared full year" : "the observed partial span"}; no filling was performed`,
      field: "timestamp",
    });
  }
  return {
    coverage: fullYear && issues.length === 0
      ? (slotsPerHour > 1 ? "full-year-subhour" : leap ? "full-leap-year-8784" : "full-year-8760")
      : "partial",
    issues,
  };
}

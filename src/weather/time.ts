export interface LocalStandardTime {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  /** Minutes since local-standard-time midnight. Fractions represent seconds. */
  readonly minuteOfDay: number;
}

export interface WeatherIntervalTime {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  /** EPW interval-end representation: 1..24. */
  readonly rawHour: number;
  /** EPW interval-end representation: 1..60. */
  readonly rawMinute: number;
  readonly intervalMinutes: number;
  readonly intervalEndLocalStandardTime: LocalStandardTime;
  readonly midpointLocalStandardTime: LocalStandardTime;
}

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number): number {
  const days = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ] as const;
  const value = days[month - 1];
  if (value === undefined) {
    throw new RangeError(`month must be in 1..12; received ${month}`);
  }
  return value;
}

export function assertCivilDate(year: number, month: number, day: number): void {
  if (!Number.isInteger(year) || year < 1) {
    throw new RangeError(`year must be a positive integer; received ${year}`);
  }
  const maximumDay = daysInMonth(year, month);
  if (!Number.isInteger(day) || day < 1 || day > maximumDay) {
    throw new RangeError(
      `day must be in 1..${maximumDay} for ${year}-${month}; received ${day}`,
    );
  }
}

export function dayOfYear(year: number, month: number, day: number): number {
  assertCivilDate(year, month, day);
  let ordinal = day;
  for (let precedingMonth = 1; precedingMonth < month; precedingMonth += 1) {
    ordinal += daysInMonth(year, precedingMonth);
  }
  return ordinal;
}

function shiftCivilDay(
  year: number,
  month: number,
  day: number,
  dayOffset: number,
): { readonly year: number; readonly month: number; readonly day: number } {
  assertCivilDate(year, month, day);
  let shiftedYear = year;
  let shiftedMonth = month;
  let shiftedDay = day;
  let remaining = dayOffset;

  while (remaining > 0) {
    shiftedDay += 1;
    if (shiftedDay > daysInMonth(shiftedYear, shiftedMonth)) {
      shiftedDay = 1;
      shiftedMonth += 1;
      if (shiftedMonth > 12) {
        shiftedMonth = 1;
        shiftedYear += 1;
      }
    }
    remaining -= 1;
  }

  while (remaining < 0) {
    shiftedDay -= 1;
    if (shiftedDay < 1) {
      shiftedMonth -= 1;
      if (shiftedMonth < 1) {
        shiftedMonth = 12;
        shiftedYear -= 1;
      }
      shiftedDay = daysInMonth(shiftedYear, shiftedMonth);
    }
    remaining += 1;
  }

  return { year: shiftedYear, month: shiftedMonth, day: shiftedDay };
}

export function normalizeLocalStandardTime(
  year: number,
  month: number,
  day: number,
  minuteOfDay: number,
): LocalStandardTime {
  assertCivilDate(year, month, day);
  if (!Number.isFinite(minuteOfDay)) {
    throw new RangeError("minuteOfDay must be finite");
  }
  const dayOffset = Math.floor(minuteOfDay / 1440);
  const normalizedMinute = minuteOfDay - dayOffset * 1440;
  const date = shiftCivilDay(year, month, day, dayOffset);
  return { ...date, minuteOfDay: normalizedMinute };
}

export function createWeatherIntervalTime(
  year: number,
  month: number,
  day: number,
  rawHour: number,
  rawMinute: number,
  intervalMinutes: number,
): WeatherIntervalTime {
  assertCivilDate(year, month, day);
  if (!Number.isInteger(rawHour) || rawHour < 1 || rawHour > 24) {
    throw new RangeError(`EPW hour must be in 1..24; received ${rawHour}`);
  }
  if (!Number.isInteger(rawMinute) || rawMinute < 1 || rawMinute > 60) {
    throw new RangeError(`EPW minute must be in 1..60; received ${rawMinute}`);
  }
  if (!Number.isInteger(intervalMinutes) || intervalMinutes < 1 || intervalMinutes > 60) {
    throw new RangeError(
      `intervalMinutes must be an integer in 1..60; received ${intervalMinutes}`,
    );
  }
  if (60 % intervalMinutes !== 0 || rawMinute % intervalMinutes !== 0) {
    throw new RangeError(
      `EPW minute ${rawMinute} is inconsistent with ${intervalMinutes}-minute intervals`,
    );
  }

  const intervalEndMinute = (rawHour - 1) * 60 + rawMinute;
  return {
    year,
    month,
    day,
    rawHour,
    rawMinute,
    intervalMinutes,
    intervalEndLocalStandardTime: normalizeLocalStandardTime(
      year,
      month,
      day,
      intervalEndMinute,
    ),
    midpointLocalStandardTime: normalizeLocalStandardTime(
      year,
      month,
      day,
      intervalEndMinute - intervalMinutes / 2,
    ),
  };
}

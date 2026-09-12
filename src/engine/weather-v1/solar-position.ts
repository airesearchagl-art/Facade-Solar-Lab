import { dayOfYear, isLeapYear } from "../../weather/time";
import type { SolarPosition, SolarPositionInput } from "./types";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function toRadians(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function normalizeMinutes(minutes: number): number {
  return ((minutes % 1440) + 1440) % 1440;
}

function atmosphericRefractionCorrectionDeg(elevationDeg: number): number {
  if (elevationDeg > 85) return 0;
  const tangent = Math.tan(toRadians(elevationDeg));
  let arcSeconds: number;
  if (elevationDeg > 5) {
    arcSeconds =
      58.1 / tangent -
      0.07 / tangent ** 3 +
      0.000086 / tangent ** 5;
  } else if (elevationDeg > -0.575) {
    arcSeconds =
      1735 -
      518.2 * elevationDeg +
      103.4 * elevationDeg ** 2 -
      12.79 * elevationDeg ** 3 +
      0.711 * elevationDeg ** 4;
  } else {
    arcSeconds = -20.774 / tangent;
  }
  return arcSeconds / 3600;
}

/**
 * NOAA/GML's documented fractional-year approximation.
 *
 * Longitude is east-positive and timeZoneOffsetHours is the number of hours
 * added to UTC to obtain local standard time. No host clock, DST, or Date is used.
 */
export function calculateSolarPosition(input: SolarPositionInput): SolarPosition {
  const { latitudeDeg, longitudeDeg, timeZoneOffsetHours } = input.location;
  if (!Number.isFinite(latitudeDeg) || latitudeDeg < -90 || latitudeDeg > 90) {
    throw new RangeError("latitudeDeg must be finite and in -90..90");
  }
  if (!Number.isFinite(longitudeDeg) || longitudeDeg < -180 || longitudeDeg > 180) {
    throw new RangeError("longitudeDeg must be finite and in -180..180");
  }
  if (!Number.isFinite(timeZoneOffsetHours)) {
    throw new RangeError("timeZoneOffsetHours must be finite");
  }
  if (
    !Number.isFinite(input.localStandardTime.minuteOfDay) ||
    input.localStandardTime.minuteOfDay < 0 ||
    input.localStandardTime.minuteOfDay >= 1440
  ) {
    throw new RangeError("local-standard-time minuteOfDay must be in [0, 1440)");
  }

  const localStandardHour = input.localStandardTime.minuteOfDay / 60;
  const ordinalDay = dayOfYear(
    input.localStandardTime.year,
    input.localStandardTime.month,
    input.localStandardTime.day,
  );
  const fractionalYearDays = isLeapYear(input.localStandardTime.year) ? 366 : 365;
  const fractionalYearRadians =
    (2 * Math.PI * (ordinalDay - 1 + (localStandardHour - 12) / 24)) /
    fractionalYearDays;
  const equationOfTimeMinutes =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(fractionalYearRadians) -
      0.032077 * Math.sin(fractionalYearRadians) -
      0.014615 * Math.cos(2 * fractionalYearRadians) -
      0.040849 * Math.sin(2 * fractionalYearRadians));
  const declinationRadians =
    0.006918 -
    0.399912 * Math.cos(fractionalYearRadians) +
    0.070257 * Math.sin(fractionalYearRadians) -
    0.006758 * Math.cos(2 * fractionalYearRadians) +
    0.000907 * Math.sin(2 * fractionalYearRadians) -
    0.002697 * Math.cos(3 * fractionalYearRadians) +
    0.00148 * Math.sin(3 * fractionalYearRadians);

  const trueSolarMinuteOfDay = normalizeMinutes(
    input.localStandardTime.minuteOfDay +
      equationOfTimeMinutes +
      4 * longitudeDeg -
      60 * timeZoneOffsetHours,
  );
  const hourAngleDeg =
    trueSolarMinuteOfDay / 4 < 0
      ? trueSolarMinuteOfDay / 4 + 180
      : trueSolarMinuteOfDay / 4 - 180;
  const hourAngleRadians = toRadians(hourAngleDeg);
  const latitudeRadians = toRadians(latitudeDeg);
  const cosineOfZenith = clamp(
    Math.sin(latitudeRadians) * Math.sin(declinationRadians) +
      Math.cos(latitudeRadians) *
        Math.cos(declinationRadians) *
        Math.cos(hourAngleRadians),
    -1,
    1,
  );
  const zenithDeg = Math.acos(cosineOfZenith) * RAD_TO_DEG;
  const elevationDeg = 90 - zenithDeg;
  const azimuthDeg = normalizeDegrees(
    Math.atan2(
      Math.sin(hourAngleRadians),
      Math.cos(hourAngleRadians) * Math.sin(latitudeRadians) -
        Math.tan(declinationRadians) * Math.cos(latitudeRadians),
    ) *
      RAD_TO_DEG +
      180,
  );

  return {
    algorithm: "noaa-fractional-year-v1",
    fractionalYearDays,
    equationOfTimeMinutes,
    declinationDeg: declinationRadians * RAD_TO_DEG,
    trueSolarMinuteOfDay,
    hourAngleDeg,
    zenithDeg,
    elevationDeg,
    apparentElevationDeg:
      elevationDeg + atmosphericRefractionCorrectionDeg(elevationDeg),
    azimuthDeg,
    cosineOfZenith,
    isAboveHorizon: elevationDeg > 0,
  };
}

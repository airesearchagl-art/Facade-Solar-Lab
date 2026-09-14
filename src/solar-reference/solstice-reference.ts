import { resolveWeatherV1SolarCalendarYear, calculateSolarPosition } from "../engine/weather-v1";
import { facadeLocalSunVector } from "../geometry";
import type {
  FacadeSolarReference,
  FacadeSolarReferenceInput,
  SolarNoonReference,
  SolarReferenceLocation,
  SolarReferenceSeason,
} from "./types";

const RAD_TO_DEG = 180 / Math.PI;

const REFERENCE_DATES = [
  { season: "summer", label: "夏至頃", dateLabel: "6/21", month: 6, day: 21 },
  { season: "winter", label: "冬至頃", dateLabel: "12/21", month: 12, day: 21 },
] as const satisfies readonly {
  readonly season: SolarReferenceSeason;
  readonly label: string;
  readonly dateLabel: string;
  readonly month: number;
  readonly day: number;
}[];

function assertScanStep(scanStepMinutes: number): void {
  if (
    !Number.isInteger(scanStepMinutes) ||
    scanStepMinutes <= 0 ||
    scanStepMinutes > 60
  ) {
    throw new RangeError("scanStepMinutes must be an integer in 1..60");
  }
}

export function findReferenceSolarNoon(
  location: SolarReferenceLocation,
  year: number,
  month: number,
  day: number,
  scanStepMinutes = 5,
): SolarNoonReference {
  assertScanStep(scanStepMinutes);
  let best: SolarNoonReference | null = null;
  for (let minuteOfDay = 0; minuteOfDay < 1440; minuteOfDay += scanStepMinutes) {
    const position = calculateSolarPosition({
      location,
      localStandardTime: { year, month, day, minuteOfDay },
    });
    if (best === null || position.elevationDeg > best.position.elevationDeg) {
      best = { year, month, day, minuteOfDay, position };
    }
  }
  if (best === null || !Number.isFinite(best.position.elevationDeg)) {
    throw new RangeError("solar-noon search did not produce a finite position");
  }
  return best;
}

function referenceYear(
  dataset: FacadeSolarReferenceInput["dataset"],
): number {
  const canonical = resolveWeatherV1SolarCalendarYear(dataset);
  const sourceYear = dataset.intervals[0]?.time.year;
  if (canonical !== undefined) return canonical;
  if (sourceYear === undefined) {
    throw new RangeError("weather dataset requires at least one interval");
  }
  return sourceYear;
}

export function createFacadeSolsticeReferences(
  input: FacadeSolarReferenceInput,
): readonly FacadeSolarReference[] {
  const year = referenceYear(input.dataset);
  return REFERENCE_DATES.map((referenceDate) => {
    const solarNoon = findReferenceSolarNoon(
      input.dataset.location,
      year,
      referenceDate.month,
      referenceDate.day,
      input.scanStepMinutes,
    );
    const localSunVector = facadeLocalSunVector(
      input.facadeAzimuthDegFromNorth,
      solarNoon.position.azimuthDeg,
      solarNoon.position.elevationDeg,
    );
    const frontFacing = localSunVector.y > 0;
    const profileAngleDeg = frontFacing
      ? Math.atan2(localSunVector.z, localSunVector.y) * RAD_TO_DEG
      : null;
    const overhangTipFacadeIntersectionZM =
      frontFacing && input.overhang !== undefined
        ? input.overhang.elevationZM -
          input.overhang.depthM * (localSunVector.z / localSunVector.y)
        : null;
    return {
      season: referenceDate.season,
      label: referenceDate.label,
      dateLabel: referenceDate.dateLabel,
      solarNoon,
      localSunVector,
      frontFacing,
      profileAngleDeg,
      overhangTipFacadeIntersectionZM,
    };
  });
}

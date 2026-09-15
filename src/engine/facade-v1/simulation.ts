import { normalizeAzimuthDeg } from "../../geometry";
import { finiteNonNegative } from "../../models/numeric";
import {
  assertWeatherDatasetUsable,
  type LocalStandardTime,
  type WeatherDataset,
  type WeatherIntervalTime,
  type WeatherRadiation,
} from "../../weather";
import {
  calculateSolarPosition,
  resolveWeatherV1SolarCalendarYear,
} from "../weather-v1";
import { calculateFacadeV1IntervalGain, validateFacadeV1Parameters } from "./irradiance";
import {
  FACADE_V1_DIFFUSE_SHADING_MODEL,
  FACADE_V1_DIRECT_SHADING_MODEL,
  FACADE_V1_GROUND_REFLECTION_MODEL,
  type FacadeV1MonthlyGain,
  type FacadeV1Parameters,
  type FacadeV1PeriodDefinition,
  type FacadeV1PeriodSummary,
  type FacadeV1SimulationResult,
  type FacadeV1IntervalGain,
  type FacadeV1SolarPosition,
} from "./types";

export const DEFAULT_FACADE_V1_PERIODS: FacadeV1PeriodDefinition = Object.freeze({
  coolingMonths: Object.freeze([4, 5, 6, 7, 8, 9]),
  heatingMonths: Object.freeze([10, 11, 12, 1, 2, 3]),
});

function solarTime(
  intervalTime: WeatherIntervalTime,
  canonicalYear: number | undefined,
): LocalStandardTime {
  return canonicalYear === undefined
    ? intervalTime.midpointLocalStandardTime
    : { ...intervalTime.midpointLocalStandardTime, year: canonicalYear };
}

function summarize(
  monthly: readonly FacadeV1MonthlyGain[],
  months: readonly number[],
): FacadeV1PeriodSummary {
  const included = new Set(months);
  let withOverhangKWh = 0;
  let withoutOverhangKWh = 0;
  for (const item of monthly) {
    if (included.has(item.month)) {
      withOverhangKWh += item.withOverhangKWh;
      withoutOverhangKWh += item.withoutOverhangKWh;
    }
  }
  return {
    withOverhangKWh: finiteNonNegative(withOverhangKWh, "period gain with overhang"),
    withoutOverhangKWh: finiteNonNegative(withoutOverhangKWh, "period gain without overhang"),
    reductionPercent:
      withoutOverhangKWh > 0
        ? (1 - withOverhangKWh / withoutOverhangKWh) * 100
        : 0,
  };
}

export function simulateFacadeV1(
  dataset: WeatherDataset,
  parameters: FacadeV1Parameters,
  periods: FacadeV1PeriodDefinition = DEFAULT_FACADE_V1_PERIODS,
): FacadeV1SimulationResult {
  assertWeatherDatasetUsable(dataset);
  validateFacadeV1Parameters(parameters);
  return simulateFacadeWeather(dataset, parameters, periods, (radiation, solar) =>
    calculateFacadeV1IntervalGain(parameters, radiation, solar));
}

/** Shared solar/calendar/monthly/period traversal. Called once per case/floor. */
export function simulateFacadeWeather(
  dataset: WeatherDataset,
  parameters: FacadeV1Parameters,
  periods: FacadeV1PeriodDefinition,
  intervalGain: (radiation: WeatherRadiation, solar: FacadeV1SolarPosition) => FacadeV1IntervalGain,
): FacadeV1SimulationResult {
  const monthly = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    withOverhangKWh: 0,
    withoutOverhangKWh: 0,
  }));
  const canonicalYear = resolveWeatherV1SolarCalendarYear(dataset);
  for (const interval of dataset.intervals) {
    const solar = calculateSolarPosition({
      location: dataset.location,
      localStandardTime: solarTime(interval.time, canonicalYear),
    });
    const gain = intervalGain(interval.radiation, solar);
    const month = monthly[interval.time.month - 1]!;
    month.withOverhangKWh += gain.withOverhangKWh;
    month.withoutOverhangKWh += gain.withoutOverhangKWh;
  }

  return {
    modelVersion: "facade-v1-weather",
    geometryVersion: "facade-v1",
    solarPositionAlgorithm: "noaa-fractional-year-v1",
    directShadingModel: FACADE_V1_DIRECT_SHADING_MODEL,
    diffuseShadingModel: FACADE_V1_DIFFUSE_SHADING_MODEL,
    groundReflectionModel: FACADE_V1_GROUND_REFLECTION_MODEL,
    weatherDatasetId: dataset.id,
    weatherSource: dataset.provenance,
    geometry: {
      facadeAzimuthDegFromNorth: normalizeAzimuthDeg(
        parameters.facadeAzimuthDegFromNorth,
      ),
      opening: parameters.opening,
      ...(parameters.overhang === undefined ? {} : { overhang: parameters.overhang }),
    },
    intervalCount: dataset.intervals.length,
    periods,
    monthly,
    summary: {
      annual: summarize(
        monthly,
        Array.from({ length: 12 }, (_, index) => index + 1),
      ),
      cooling: summarize(monthly, periods.coolingMonths),
      heating: summarize(monthly, periods.heatingMonths),
    },
  };
}

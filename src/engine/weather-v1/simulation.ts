import {
  assertWeatherDatasetUsable,
  type WeatherDataset,
  type WeatherIntervalTime,
  type LocalStandardTime,
} from "../../weather";
import { calculateWeatherIntervalGain } from "./irradiance";
import { calculateSolarPosition } from "./solar-position";
import type {
  WeatherDrivenSimulationResult,
  WeatherV1MonthlyGain,
  WeatherV1Parameters,
  WeatherV1PeriodDefinition,
  WeatherV1PeriodSummary,
} from "./types";

export const DEFAULT_WEATHER_V1_PERIODS: WeatherV1PeriodDefinition = Object.freeze({
  coolingMonths: Object.freeze([4, 5, 6, 7, 8, 9]),
  heatingMonths: Object.freeze([10, 11, 12, 1, 2, 3]),
});

function summarize(
  monthly: readonly WeatherV1MonthlyGain[],
  months: readonly number[],
): WeatherV1PeriodSummary {
  let withOverhangKWh = 0;
  let withoutOverhangKWh = 0;
  const included = new Set(months);
  for (const value of monthly) {
    if (included.has(value.month)) {
      withOverhangKWh += value.withOverhangKWh;
      withoutOverhangKWh += value.withoutOverhangKWh;
    }
  }
  return {
    withOverhangKWh,
    withoutOverhangKWh,
    reductionPercent:
      withoutOverhangKWh > 0
        ? (1 - withOverhangKWh / withoutOverhangKWh) * 100
        : 0,
  };
}

/**
 * EPW typical-year files may retain different source years for each month.
 * Their 8760/8784 structure, not those source years, defines the solar calendar.
 */
export function resolveWeatherV1SolarTime(
  dataset: Pick<WeatherDataset, "coverage" | "intervals">,
  intervalTime: WeatherIntervalTime,
): LocalStandardTime {
  let canonicalYear: number | undefined;
  if (dataset.coverage === "full-year-8760") {
    canonicalYear = 2001;
  } else if (dataset.coverage === "full-leap-year-8784") {
    canonicalYear = 2000;
  } else if (dataset.coverage === "full-year-subhour") {
    canonicalYear = dataset.intervals.some(
      (interval) => interval.time.month === 2 && interval.time.day === 29,
    )
      ? 2000
      : 2001;
  }
  return canonicalYear === undefined
    ? intervalTime.midpointLocalStandardTime
    : { ...intervalTime.midpointLocalStandardTime, year: canonicalYear };
}

export function simulateWeatherV1(
  dataset: WeatherDataset,
  parameters: WeatherV1Parameters,
  periods: WeatherV1PeriodDefinition = DEFAULT_WEATHER_V1_PERIODS,
): WeatherDrivenSimulationResult {
  assertWeatherDatasetUsable(dataset);
  const totals = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    withOverhangKWh: 0,
    withoutOverhangKWh: 0,
  }));
  for (const interval of dataset.intervals) {
    const solar = calculateSolarPosition({
      location: dataset.location,
      localStandardTime: resolveWeatherV1SolarTime(dataset, interval.time),
    });
    const gain = calculateWeatherIntervalGain(
      parameters,
      interval.radiation,
      solar,
    );
    const month = totals[interval.time.month - 1]!;
    month.withOverhangKWh += gain.withOverhangKWh;
    month.withoutOverhangKWh += gain.withoutOverhangKWh;
  }
  const monthly: readonly WeatherV1MonthlyGain[] = totals;
  return {
    modelVersion: "weather-v1",
    solarPositionAlgorithm: "noaa-fractional-year-v1",
    weatherDatasetId: dataset.id,
    weatherSource: dataset.provenance,
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

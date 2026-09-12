import {
  LEGACY_V01_MONTH_DAYS,
  LEGACY_V01_STEPS_PER_HOUR,
} from "./constants";
import { calculateLegacyShadedGain } from "./shading";
import { calculateLegacySolarState } from "./solar";
import type {
  LegacyV01HourlyGain,
  LegacyV01MonthlyGain,
  LegacyV01Parameters,
  LegacyV01PeriodSummary,
  LegacyV01SimulationResult,
  LegacyV01Summary,
} from "./types";

const ALL_MONTHS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const);
const COOLING_MONTHS = Object.freeze([4, 5, 6, 7, 8, 9] as const);
const HEATING_MONTHS = Object.freeze([10, 11, 12, 1, 2, 3] as const);

export function calculateLegacyHourlyGain(
  parameters: LegacyV01Parameters,
  monthIndex: number,
  solarHour: number,
): LegacyV01HourlyGain {
  const solar = calculateLegacySolarState(parameters, monthIndex, solarHour);
  if (solar === null) {
    return { withOverhangWPerM2: 0, withoutOverhangWPerM2: 0 };
  }
  return calculateLegacyShadedGain(parameters, solar);
}

export function simulateLegacyV01Monthly(
  parameters: LegacyV01Parameters,
): readonly LegacyV01MonthlyGain[] {
  const windowAreaM2 = parameters.windowHeightM * parameters.windowWidthM;
  const monthly: LegacyV01MonthlyGain[] = [];

  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    let withOverhang = 0;
    let withoutOverhang = 0;
    for (let hour = 0; hour < 24; hour += 1) {
      for (let step = 0; step < LEGACY_V01_STEPS_PER_HOUR; step += 1) {
        const gain = calculateLegacyHourlyGain(
          parameters,
          monthIndex,
          hour + (step + 0.5) / LEGACY_V01_STEPS_PER_HOUR,
        );
        withOverhang += gain.withOverhangWPerM2 / LEGACY_V01_STEPS_PER_HOUR;
        withoutOverhang += gain.withoutOverhangWPerM2 / LEGACY_V01_STEPS_PER_HOUR;
      }
    }
    monthly.push({
      withOverhangKWh:
        (withOverhang * LEGACY_V01_MONTH_DAYS[monthIndex]! * windowAreaM2 *
          parameters.solarHeatGainCoefficient) /
        1000,
      withoutOverhangKWh:
        (withoutOverhang * LEGACY_V01_MONTH_DAYS[monthIndex]! * windowAreaM2 *
          parameters.solarHeatGainCoefficient) /
        1000,
    });
  }

  return monthly;
}

function summarizeMonths(
  monthly: readonly LegacyV01MonthlyGain[],
  oneBasedMonthNumbers: readonly number[],
): LegacyV01PeriodSummary {
  let withOverhangKWh = 0;
  let withoutOverhangKWh = 0;
  for (const monthNumber of oneBasedMonthNumbers) {
    const month = monthly[monthNumber - 1]!;
    withOverhangKWh += month.withOverhangKWh;
    withoutOverhangKWh += month.withoutOverhangKWh;
  }
  return {
    withOverhangKWh,
    withoutOverhangKWh,
    reductionPercent:
      withoutOverhangKWh > 0 ? (1 - withOverhangKWh / withoutOverhangKWh) * 100 : 0,
  };
}

export function summarizeLegacyV01(
  monthly: readonly LegacyV01MonthlyGain[],
): LegacyV01Summary {
  return {
    annual: summarizeMonths(monthly, ALL_MONTHS),
    cooling: summarizeMonths(monthly, COOLING_MONTHS),
    heating: summarizeMonths(monthly, HEATING_MONTHS),
  };
}

export function simulateLegacyV01(
  parameters: LegacyV01Parameters,
): LegacyV01SimulationResult {
  const monthly = simulateLegacyV01Monthly(parameters);
  return { monthly, summary: summarizeLegacyV01(monthly) };
}

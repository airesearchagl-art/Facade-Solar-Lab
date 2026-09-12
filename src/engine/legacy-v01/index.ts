export {
  LEGACY_V01_ASHRAE,
  LEGACY_V01_DEFAULT_PARAMETERS,
  LEGACY_V01_MONTH_DAYS,
  LEGACY_V01_REPRESENTATIVE_DAY_OF_YEAR,
  LEGACY_V01_STEPS_PER_HOUR,
  LEGACY_V01_STRIP_COUNT,
} from "./constants";
export { calculateLegacyShadedGain } from "./shading";
export {
  calculateLegacySolarState,
  legacyDeclinationRadians,
  legacyDegreesToRadians,
} from "./solar";
export {
  calculateLegacyHourlyGain,
  simulateLegacyV01,
  simulateLegacyV01Monthly,
  summarizeLegacyV01,
} from "./simulation";
export type {
  LegacyV01HourlyGain,
  LegacyV01MonthlyGain,
  LegacyV01Parameters,
  LegacyV01PeriodSummary,
  LegacyV01SimulationResult,
  LegacyV01Summary,
} from "./types";

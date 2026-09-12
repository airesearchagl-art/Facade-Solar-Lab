import type { LegacyV01Parameters } from "./types";

export type LegacyAshraeMonthlyConstants = readonly [
  extraterrestrialIrradianceWPerM2: number,
  extinctionCoefficient: number,
  diffuseCoefficient: number,
];

export const LEGACY_V01_ASHRAE = Object.freeze([
  [1230, 0.142, 0.058],
  [1215, 0.144, 0.06],
  [1186, 0.156, 0.071],
  [1136, 0.18, 0.097],
  [1104, 0.196, 0.121],
  [1088, 0.205, 0.134],
  [1085, 0.207, 0.136],
  [1107, 0.201, 0.122],
  [1152, 0.177, 0.092],
  [1193, 0.16, 0.073],
  [1221, 0.149, 0.063],
  [1234, 0.142, 0.057],
] as const satisfies readonly LegacyAshraeMonthlyConstants[]);

export const LEGACY_V01_MONTH_DAYS = Object.freeze([
  31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
] as const);

export const LEGACY_V01_REPRESENTATIVE_DAY_OF_YEAR = Object.freeze([
  17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344,
] as const);

export const LEGACY_V01_STRIP_COUNT = 20;
export const LEGACY_V01_STEPS_PER_HOUR = 4;

export const LEGACY_V01_DEFAULT_PARAMETERS = Object.freeze({
  windowHeightM: 2.4,
  overhangDepthM: 1.6,
  overhangToWindowHeadM: 0.3,
  windowWidthM: 6,
  latitudeDeg: 35.2,
  surfaceAzimuthDeg: 0,
  solarHeatGainCoefficient: 1,
  groundReflectance: 0.2,
  legacySkyFactor: 2,
} satisfies LegacyV01Parameters);

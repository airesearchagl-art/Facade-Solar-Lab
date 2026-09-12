import type { WeatherLocation } from "../../weather";
import type {
  WeatherRadiation,
  WeatherSourceProvenance,
} from "../../weather";
import type { LocalStandardTime } from "../../weather/time";

export interface SolarPositionInput {
  readonly location: Pick<
    WeatherLocation,
    "latitudeDeg" | "longitudeDeg" | "timeZoneOffsetHours"
  >;
  readonly localStandardTime: LocalStandardTime;
}

export interface SolarPosition {
  readonly algorithm: "noaa-fractional-year-v1";
  /** Calendar denominator used by the NOAA fractional-year approximation. */
  readonly fractionalYearDays: 365 | 366;
  readonly equationOfTimeMinutes: number;
  readonly declinationDeg: number;
  readonly trueSolarMinuteOfDay: number;
  readonly hourAngleDeg: number;
  readonly zenithDeg: number;
  /** Geometric elevation; this drives incidence and shading. */
  readonly elevationDeg: number;
  /** NOAA piecewise approximate atmospheric-refraction correction. */
  readonly apparentElevationDeg: number;
  /** Degrees clockwise from north in [0, 360). */
  readonly azimuthDeg: number;
  readonly cosineOfZenith: number;
  readonly isAboveHorizon: boolean;
}

export interface WeatherV1Parameters {
  /** Window height [m]. */
  readonly windowHeightM: number;
  /** Window width [m]. */
  readonly windowWidthM: number;
  /** Horizontal overhang projection [m]. */
  readonly overhangDepthM: number;
  /** Vertical distance from overhang to window head [m]. */
  readonly overhangToWindowHeadM: number;
  /** Vertical surface normal, degrees clockwise from north. */
  readonly surfaceAzimuthDegFromNorth: number;
  readonly solarHeatGainCoefficient: number;
  readonly groundReflectance: number;
  readonly stripCount?: number;
}

export interface WeatherV1ShadingFactors {
  readonly beamIncidenceFactor: number;
  readonly directLitFraction: number;
  readonly shadedSkyViewFactor: number;
  readonly unshadedSkyViewFactor: 0.5;
  readonly groundViewFactor: 0.5;
}

export interface WeatherV1IntervalIrradiance {
  readonly factors: WeatherV1ShadingFactors;
  readonly directWithOverhangWhPerM2: number;
  readonly directWithoutOverhangWhPerM2: number;
  readonly diffuseWithOverhangWhPerM2: number;
  readonly diffuseWithoutOverhangWhPerM2: number;
  readonly groundReflectedWhPerM2: number;
  readonly totalWithOverhangWhPerM2: number;
  readonly totalWithoutOverhangWhPerM2: number;
}

export interface WeatherV1IntervalGain {
  readonly withOverhangKWh: number;
  readonly withoutOverhangKWh: number;
  readonly irradiance: WeatherV1IntervalIrradiance;
}

export interface WeatherV1MonthlyGain {
  readonly month: number;
  readonly withOverhangKWh: number;
  readonly withoutOverhangKWh: number;
}

export interface WeatherV1PeriodSummary {
  readonly withOverhangKWh: number;
  readonly withoutOverhangKWh: number;
  readonly reductionPercent: number;
}

export interface WeatherV1PeriodDefinition {
  readonly coolingMonths: readonly number[];
  readonly heatingMonths: readonly number[];
}

export interface WeatherDrivenSimulationResult {
  readonly modelVersion: "weather-v1";
  readonly solarPositionAlgorithm: SolarPosition["algorithm"];
  readonly weatherDatasetId: string;
  readonly weatherSource: WeatherSourceProvenance;
  readonly intervalCount: number;
  readonly periods: WeatherV1PeriodDefinition;
  readonly monthly: readonly WeatherV1MonthlyGain[];
  readonly summary: {
    readonly annual: WeatherV1PeriodSummary;
    readonly cooling: WeatherV1PeriodSummary;
    readonly heating: WeatherV1PeriodSummary;
  };
}

export type RequiredWeatherRadiation = {
  readonly [Key in keyof WeatherRadiation]: NonNullable<WeatherRadiation[Key]>;
};

import type {
  DirectShadowResult,
  HorizontalOverhangGeometry,
  RectangularOpeningGeometry,
} from "../../geometry";
import type {
  WeatherRadiation,
  WeatherSourceProvenance,
} from "../../weather";
import type { SolarPosition } from "../weather-v1";

export const FACADE_V1_DIRECT_SHADING_MODEL =
  "finite-rectangular-overhang-shadow-polygon-v1" as const;
export const FACADE_V1_DIFFUSE_SHADING_MODEL =
  "isotropic-2d-infinite-width-v1" as const;
export const FACADE_V1_GROUND_REFLECTION_MODEL =
  "ghi-ground-reflection-0.5-v1" as const;

export interface FacadeV1Parameters {
  readonly facadeAzimuthDegFromNorth: number;
  readonly opening: RectangularOpeningGeometry;
  readonly overhang?: HorizontalOverhangGeometry;
  readonly solarHeatGainCoefficient: number;
  readonly groundReflectance: number;
}

export type FacadeV1SolarPosition = Pick<
  SolarPosition,
  "azimuthDeg" | "elevationDeg"
>;

export interface FacadeV1IntervalFactors {
  readonly beamIncidenceFactor: number;
  readonly directShadow: DirectShadowResult;
  readonly shadedSkyViewFactor: number;
  readonly unshadedSkyViewFactor: 0.5;
  readonly groundViewFactor: 0.5;
}

export interface FacadeV1IntervalIrradiance {
  readonly factors: FacadeV1IntervalFactors;
  readonly directWithOverhangWhPerM2: number;
  readonly directWithoutOverhangWhPerM2: number;
  readonly diffuseWithOverhangWhPerM2: number;
  readonly diffuseWithoutOverhangWhPerM2: number;
  readonly groundReflectedWhPerM2: number;
  readonly totalWithOverhangWhPerM2: number;
  readonly totalWithoutOverhangWhPerM2: number;
}

export interface FacadeV1IntervalGain {
  readonly withOverhangKWh: number;
  readonly withoutOverhangKWh: number;
  readonly irradiance: FacadeV1IntervalIrradiance;
}

export interface FacadeV1MonthlyGain {
  readonly month: number;
  readonly withOverhangKWh: number;
  readonly withoutOverhangKWh: number;
}

export interface FacadeV1PeriodDefinition {
  readonly coolingMonths: readonly number[];
  readonly heatingMonths: readonly number[];
}

export interface FacadeV1PeriodSummary {
  readonly withOverhangKWh: number;
  readonly withoutOverhangKWh: number;
  readonly reductionPercent: number;
}

export interface FacadeV1SimulationResult {
  readonly modelVersion: "facade-v1-weather";
  readonly geometryVersion: "facade-v1";
  readonly solarPositionAlgorithm: SolarPosition["algorithm"];
  readonly directShadingModel: typeof FACADE_V1_DIRECT_SHADING_MODEL;
  readonly diffuseShadingModel: typeof FACADE_V1_DIFFUSE_SHADING_MODEL;
  readonly groundReflectionModel: typeof FACADE_V1_GROUND_REFLECTION_MODEL;
  readonly weatherDatasetId: string;
  readonly weatherSource: WeatherSourceProvenance;
  readonly geometry: Readonly<
    Pick<FacadeV1Parameters, "facadeAzimuthDegFromNorth" | "opening" | "overhang">
  >;
  readonly intervalCount: number;
  readonly periods: FacadeV1PeriodDefinition;
  readonly monthly: readonly FacadeV1MonthlyGain[];
  readonly summary: {
    readonly annual: FacadeV1PeriodSummary;
    readonly cooling: FacadeV1PeriodSummary;
    readonly heating: FacadeV1PeriodSummary;
  };
}

export type RequiredFacadeV1Radiation = {
  readonly [Key in keyof WeatherRadiation]: NonNullable<WeatherRadiation[Key]>;
};

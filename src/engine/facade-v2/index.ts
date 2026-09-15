import {
  DEFAULT_FACADE_V1_PERIODS, gainFromFacadeIrradiance, irradianceFromDirectShadow,
  requireFacadeV1Radiation, simulateFacadeV1, simulateFacadeWeather, validateFacadeV1Parameters,
  type FacadeV1Parameters, type FacadeV1PeriodDefinition, type FacadeV1SimulationResult,
  type FacadeV1SolarPosition,
} from "../facade-v1";
import { calculateDirectShadowV2, hasActiveFins, validateVerticalFins, type VerticalFins } from "../../geometry/facade-v2";
import { assertWeatherDatasetUsable, type WeatherDataset, type WeatherRadiation } from "../../weather";

export interface FacadeV2Parameters extends FacadeV1Parameters, VerticalFins {}
export const FACADE_V2_DIRECT_SHADING_MODEL = "overhang-vertical-fin-array-shadow-union-v2" as const;
export interface FacadeV2SimulationResult extends Omit<FacadeV1SimulationResult, "modelVersion" | "geometryVersion" | "directShadingModel" | "geometry"> {
  readonly modelVersion: "facade-v2-weather";
  readonly geometryVersion: "facade-v2";
  readonly directShadingModel: typeof FACADE_V2_DIRECT_SHADING_MODEL;
  readonly geometry: FacadeV1SimulationResult["geometry"] & VerticalFins;
}
export type FacadeSimulationResult = FacadeV1SimulationResult | FacadeV2SimulationResult;

export function validateFacadeV2Parameters(parameters: FacadeV2Parameters): void {
  validateFacadeV1Parameters(parameters);
  validateVerticalFins(parameters, parameters.opening.widthM);
}

export function calculateFacadeV2IntervalIrradiance(parameters: FacadeV2Parameters, radiation: WeatherRadiation, solar: FacadeV1SolarPosition) {
  validateFacadeV2Parameters(parameters);
  const required = requireFacadeV1Radiation(radiation);
  const shadow = calculateDirectShadowV2({ ...parameters, solarAzimuthDegFromNorth: solar.azimuthDeg, solarElevationDeg: solar.elevationDeg });
  return irradianceFromDirectShadow(parameters, required, shadow);
}

export function simulateFacadeV2(dataset: WeatherDataset, parameters: FacadeV2Parameters, periods: FacadeV1PeriodDefinition = DEFAULT_FACADE_V1_PERIODS): FacadeV2SimulationResult {
  assertWeatherDatasetUsable(dataset);
  validateFacadeV2Parameters(parameters);
  const result = simulateFacadeWeather(dataset, parameters, periods, (radiation, solar) =>
    gainFromFacadeIrradiance(parameters, calculateFacadeV2IntervalIrradiance(parameters, radiation, solar)));
  return {
    ...result, modelVersion: "facade-v2-weather", geometryVersion: "facade-v2",
    directShadingModel: FACADE_V2_DIRECT_SHADING_MODEL,
    geometry: { ...result.geometry,
      ...(parameters.leftFin === undefined ? {} : { leftFin: parameters.leftFin }),
      ...(parameters.rightFin === undefined ? {} : { rightFin: parameters.rightFin }),
      ...(parameters.intermediateFins === undefined ? {} : { intermediateFins: parameters.intermediateFins }),
    },
  };
}

/** Canonical adapter: absent/zero-depth fins preserve v1 result identity exactly. */
export function simulateFacade(dataset: WeatherDataset, parameters: FacadeV2Parameters): FacadeSimulationResult {
  validateFacadeV2Parameters(parameters);
  return hasActiveFins(parameters) ? simulateFacadeV2(dataset, parameters) : simulateFacadeV1(dataset, parameters);
}

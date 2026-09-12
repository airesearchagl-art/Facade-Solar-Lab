import type { WeatherRadiation } from "../../weather";
import { WeatherDataError } from "../../weather";
import { calculateWeatherV1ShadingFactors } from "./shading";
import type {
  RequiredWeatherRadiation,
  SolarPosition,
  WeatherV1IntervalGain,
  WeatherV1IntervalIrradiance,
  WeatherV1Parameters,
} from "./types";

export function requireWeatherRadiation(
  radiation: WeatherRadiation,
  sourceLine?: number,
): RequiredWeatherRadiation {
  const definitions = [
    ["globalHorizontalWhPerM2", "GHI"],
    ["directNormalWhPerM2", "DNI"],
    ["diffuseHorizontalWhPerM2", "DHI"],
  ] as const;
  for (const [property, label] of definitions) {
    const value = radiation[property];
    if (value === null || !Number.isFinite(value) || value < 0) {
      throw new WeatherDataError(`${label} is required for weather-v1`, [
        {
          severity: "error",
          code: value === null ? "RADIATION_MISSING" : "RADIATION_INVALID",
          message: `${label} must be present, finite, and non-negative`,
          ...(sourceLine === undefined ? {} : { line: sourceLine }),
          field: label,
          rawValue: value === null ? "null" : String(value),
        },
      ]);
    }
  }
  return radiation as RequiredWeatherRadiation;
}

export function calculateWeatherIntervalIrradiance(
  parameters: WeatherV1Parameters,
  radiationInput: WeatherRadiation,
  solar: SolarPosition,
): WeatherV1IntervalIrradiance {
  const radiation = requireWeatherRadiation(radiationInput);
  const factors = calculateWeatherV1ShadingFactors(parameters, solar);
  const directWithoutOverhangWhPerM2 =
    radiation.directNormalWhPerM2 * factors.beamIncidenceFactor;
  const directWithOverhangWhPerM2 =
    directWithoutOverhangWhPerM2 * factors.directLitFraction;
  const diffuseWithoutOverhangWhPerM2 =
    radiation.diffuseHorizontalWhPerM2 * factors.unshadedSkyViewFactor;
  const diffuseWithOverhangWhPerM2 =
    radiation.diffuseHorizontalWhPerM2 * factors.shadedSkyViewFactor;
  const groundReflectedWhPerM2 =
    radiation.globalHorizontalWhPerM2 *
    parameters.groundReflectance *
    factors.groundViewFactor;

  return {
    factors,
    directWithOverhangWhPerM2,
    directWithoutOverhangWhPerM2,
    diffuseWithOverhangWhPerM2,
    diffuseWithoutOverhangWhPerM2,
    groundReflectedWhPerM2,
    totalWithOverhangWhPerM2:
      directWithOverhangWhPerM2 +
      diffuseWithOverhangWhPerM2 +
      groundReflectedWhPerM2,
    totalWithoutOverhangWhPerM2:
      directWithoutOverhangWhPerM2 +
      diffuseWithoutOverhangWhPerM2 +
      groundReflectedWhPerM2,
  };
}

export function calculateWeatherIntervalGain(
  parameters: WeatherV1Parameters,
  radiation: WeatherRadiation,
  solar: SolarPosition,
): WeatherV1IntervalGain {
  const irradiance = calculateWeatherIntervalIrradiance(
    parameters,
    radiation,
    solar,
  );
  const solarGainScaleKWh =
    (parameters.windowHeightM *
      parameters.windowWidthM *
      parameters.solarHeatGainCoefficient) /
    1000;
  return {
    withOverhangKWh:
      irradiance.totalWithOverhangWhPerM2 * solarGainScaleKWh,
    withoutOverhangKWh:
      irradiance.totalWithoutOverhangWhPerM2 * solarGainScaleKWh,
    irradiance,
  };
}

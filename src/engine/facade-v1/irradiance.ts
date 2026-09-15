import {
  calculateDirectShadow,
  openingGeometryMetrics,
  validateFacadeAzimuth,
  validateHorizontalOverhang,
  validateRectangularOpening,
} from "../../geometry";
import type { WeatherRadiation } from "../../weather";
import type { DirectShadowResult } from "../../geometry";
import { WeatherDataError } from "../../weather";
import { finiteNonNegative } from "../../models/numeric";
import type {
  FacadeV1IntervalGain,
  FacadeV1IntervalIrradiance,
  FacadeV1Parameters,
  FacadeV1SolarPosition,
  RequiredFacadeV1Radiation,
} from "./types";

const DIFFUSE_STRIP_COUNT = 20;

export function validateFacadeV1Parameters(parameters: FacadeV1Parameters): void {
  validateFacadeAzimuth(parameters.facadeAzimuthDegFromNorth);
  validateRectangularOpening(parameters.opening);
  if (parameters.overhang !== undefined) {
    validateHorizontalOverhang(parameters.opening, parameters.overhang);
  }
  if (
    !Number.isFinite(parameters.solarHeatGainCoefficient) ||
    parameters.solarHeatGainCoefficient < 0 ||
    parameters.solarHeatGainCoefficient > 1
  ) {
    throw new RangeError("solarHeatGainCoefficient must be finite and in 0..1");
  }
  if (
    !Number.isFinite(parameters.groundReflectance) ||
    parameters.groundReflectance < 0 ||
    parameters.groundReflectance > 1
  ) {
    throw new RangeError("groundReflectance must be finite and in 0..1");
  }
}

export function requireFacadeV1Radiation(
  radiation: WeatherRadiation,
  sourceLine?: number,
): RequiredFacadeV1Radiation {
  const definitions = [
    ["globalHorizontalWhPerM2", "GHI"],
    ["directNormalWhPerM2", "DNI"],
    ["diffuseHorizontalWhPerM2", "DHI"],
  ] as const;
  for (const [property, label] of definitions) {
    const value = radiation[property];
    if (value === null || !Number.isFinite(value) || value < 0) {
      throw new WeatherDataError(`${label} is required for facade-v1`, [
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
  return radiation as RequiredFacadeV1Radiation;
}

function shadedSkyViewFactor(parameters: FacadeV1Parameters): number {
  const overhang = parameters.overhang;
  if (overhang === undefined || overhang.depthM === 0) return 0.5;
  const opening = openingGeometryMetrics(parameters.opening);
  const gapM = overhang.elevationZM - parameters.opening.headZM;
  let sum = 0;
  for (let index = 0; index < DIFFUSE_STRIP_COUNT; index += 1) {
    const distanceM = finiteNonNegative(
      gapM + (opening.heightM * (index + 0.5)) / DIFFUSE_STRIP_COUNT,
      "diffuse strip distance",
    );
    sum += 0.5 * Math.sin(Math.atan(distanceM / overhang.depthM));
  }
  return sum / DIFFUSE_STRIP_COUNT;
}

export function calculateFacadeV1IntervalIrradiance(
  parameters: FacadeV1Parameters,
  radiationInput: WeatherRadiation,
  solar: FacadeV1SolarPosition,
): FacadeV1IntervalIrradiance {
  validateFacadeV1Parameters(parameters);
  const radiation = requireFacadeV1Radiation(radiationInput);
  const directShadow = calculateDirectShadow({
    facadeAzimuthDegFromNorth: parameters.facadeAzimuthDegFromNorth,
    solarAzimuthDegFromNorth: solar.azimuthDeg,
    solarElevationDeg: solar.elevationDeg,
    opening: parameters.opening,
    ...(parameters.overhang === undefined ? {} : { overhang: parameters.overhang }),
  });
  return irradianceFromDirectShadow(parameters, radiation, directShadow);
}

/** Shared v1/v2 energy path. Geometry is the only substituted calculation. */
export function irradianceFromDirectShadow(
  parameters: FacadeV1Parameters,
  radiation: RequiredFacadeV1Radiation,
  directShadow: DirectShadowResult,
): FacadeV1IntervalIrradiance {
  const beamIncidenceFactor = directShadow.frontFacing
    ? directShadow.facadeLocalSunVector.y
    : 0;
  const directWithoutOverhangWhPerM2 =
    radiation.directNormalWhPerM2 * beamIncidenceFactor;
  const directWithOverhangWhPerM2 =
    directWithoutOverhangWhPerM2 * directShadow.directLitFraction;
  const diffuseWithoutOverhangWhPerM2 =
    radiation.diffuseHorizontalWhPerM2 * 0.5;
  const skyViewFactor = shadedSkyViewFactor(parameters);
  const diffuseWithOverhangWhPerM2 =
    radiation.diffuseHorizontalWhPerM2 * skyViewFactor;
  const groundReflectedWhPerM2 =
    radiation.globalHorizontalWhPerM2 * parameters.groundReflectance * 0.5;

  return {
    factors: {
      beamIncidenceFactor,
      directShadow,
      shadedSkyViewFactor: skyViewFactor,
      unshadedSkyViewFactor: 0.5,
      groundViewFactor: 0.5,
    },
    directWithOverhangWhPerM2,
    directWithoutOverhangWhPerM2,
    diffuseWithOverhangWhPerM2,
    diffuseWithoutOverhangWhPerM2,
    groundReflectedWhPerM2,
    totalWithOverhangWhPerM2: finiteNonNegative(
      directWithOverhangWhPerM2 +
      diffuseWithOverhangWhPerM2 +
      groundReflectedWhPerM2, "total irradiance with overhang"),
    totalWithoutOverhangWhPerM2: finiteNonNegative(
      directWithoutOverhangWhPerM2 +
      diffuseWithoutOverhangWhPerM2 +
      groundReflectedWhPerM2, "total irradiance without overhang"),
  };
}

export function calculateFacadeV1IntervalGain(
  parameters: FacadeV1Parameters,
  radiation: WeatherRadiation,
  solar: FacadeV1SolarPosition,
): FacadeV1IntervalGain {
  const irradiance = calculateFacadeV1IntervalIrradiance(
    parameters,
    radiation,
    solar,
  );
  return gainFromFacadeIrradiance(parameters, irradiance);
}

/** Common opening area / SHGC / Wh-to-kWh conversion; no v2 formula copy. */
export function gainFromFacadeIrradiance(
  parameters: FacadeV1Parameters,
  irradiance: FacadeV1IntervalIrradiance,
): FacadeV1IntervalGain {
  const opening = openingGeometryMetrics(parameters.opening);
  const scaleKWh =
    (opening.areaM2 * parameters.solarHeatGainCoefficient) / 1000;
  return {
    withOverhangKWh: finiteNonNegative(irradiance.totalWithOverhangWhPerM2 * scaleKWh, "interval gain with overhang"),
    withoutOverhangKWh: finiteNonNegative(irradiance.totalWithoutOverhangWhPerM2 * scaleKWh, "interval gain without overhang"),
    irradiance,
  };
}

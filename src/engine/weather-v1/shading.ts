import type {
  SolarPosition,
  WeatherV1Parameters,
  WeatherV1ShadingFactors,
} from "./types";

const DEG_TO_RAD = Math.PI / 180;
const DEFAULT_STRIP_COUNT = 20;

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be finite and non-negative`);
  }
}

export function validateWeatherV1Parameters(parameters: WeatherV1Parameters): void {
  assertFiniteNonNegative(parameters.windowHeightM, "windowHeightM");
  assertFiniteNonNegative(parameters.windowWidthM, "windowWidthM");
  assertFiniteNonNegative(parameters.overhangDepthM, "overhangDepthM");
  assertFiniteNonNegative(
    parameters.overhangToWindowHeadM,
    "overhangToWindowHeadM",
  );
  if (parameters.windowHeightM === 0 || parameters.windowWidthM === 0) {
    throw new RangeError("glazing dimensions must be greater than zero");
  }
  if (
    !Number.isFinite(parameters.surfaceAzimuthDegFromNorth) ||
    !Number.isFinite(parameters.solarHeatGainCoefficient) ||
    parameters.solarHeatGainCoefficient < 0 ||
    parameters.solarHeatGainCoefficient > 1 ||
    !Number.isFinite(parameters.groundReflectance) ||
    parameters.groundReflectance < 0 ||
    parameters.groundReflectance > 1
  ) {
    throw new RangeError("azimuth, SHGC, and ground reflectance are invalid");
  }
  const stripCount = parameters.stripCount ?? DEFAULT_STRIP_COUNT;
  if (!Number.isInteger(stripCount) || stripCount < 1) {
    throw new RangeError("stripCount must be a positive integer");
  }
}

export function calculateWeatherV1ShadingFactors(
  parameters: WeatherV1Parameters,
  solar: SolarPosition,
): WeatherV1ShadingFactors {
  validateWeatherV1Parameters(parameters);
  const stripCount = parameters.stripCount ?? DEFAULT_STRIP_COUNT;
  const elevationRadians = solar.elevationDeg * DEG_TO_RAD;
  const relativeAzimuthRadians =
    (solar.azimuthDeg - parameters.surfaceAzimuthDegFromNorth) * DEG_TO_RAD;
  const beamIncidenceFactor = solar.isAboveHorizon
    ? Math.max(0, Math.cos(elevationRadians) * Math.cos(relativeAzimuthRadians))
    : 0;

  if (parameters.overhangDepthM === 0) {
    return {
      beamIncidenceFactor,
      directLitFraction: beamIncidenceFactor > 0 ? 1 : 0,
      shadedSkyViewFactor: 0.5,
      unshadedSkyViewFactor: 0.5,
      groundViewFactor: 0.5,
    };
  }

  const surfaceFacingCosine = Math.cos(relativeAzimuthRadians);
  const shadowDropM =
    beamIncidenceFactor > 0 && surfaceFacingCosine > 0
      ? (parameters.overhangDepthM * Math.tan(elevationRadians)) /
        surfaceFacingCosine
      : Number.POSITIVE_INFINITY;
  let litStrips = 0;
  let skyViewSum = 0;
  for (let stripIndex = 0; stripIndex < stripCount; stripIndex += 1) {
    const distanceFromOverhangM =
      parameters.overhangToWindowHeadM +
      (parameters.windowHeightM * (stripIndex + 0.5)) / stripCount;
    if (beamIncidenceFactor > 0 && shadowDropM < distanceFromOverhangM) {
      litStrips += 1;
    }
    skyViewSum +=
      0.5 *
      Math.sin(Math.atan(distanceFromOverhangM / parameters.overhangDepthM));
  }

  return {
    beamIncidenceFactor,
    directLitFraction: litStrips / stripCount,
    shadedSkyViewFactor: skyViewSum / stripCount,
    unshadedSkyViewFactor: 0.5,
    groundViewFactor: 0.5,
  };
}

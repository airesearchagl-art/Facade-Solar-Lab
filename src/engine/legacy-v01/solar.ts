import {
  LEGACY_V01_ASHRAE,
  LEGACY_V01_REPRESENTATIVE_DAY_OF_YEAR,
} from "./constants";
import type { LegacyV01Parameters } from "./types";

export interface LegacyV01SolarState {
  readonly altitudeRadians: number;
  readonly relativeAzimuthRadians: number;
  readonly cosineOfIncidence: number;
  readonly beamOnSurfaceWPerM2: number;
  readonly diffuseHorizontalWPerM2: number;
  readonly groundReflectedWPerM2: number;
}

export function legacyDegreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function legacyDeclinationRadians(dayOfYear: number): number {
  return legacyDegreesToRadians(
    23.45 * Math.sin(legacyDegreesToRadians((360 * (284 + dayOfYear)) / 365)),
  );
}

export function calculateLegacySolarState(
  parameters: LegacyV01Parameters,
  monthIndex: number,
  solarHour: number,
): LegacyV01SolarState | null {
  const [a, b, c] = LEGACY_V01_ASHRAE[monthIndex]!;
  const declination = legacyDeclinationRadians(
    LEGACY_V01_REPRESENTATIVE_DAY_OF_YEAR[monthIndex]!,
  );
  const hourAngle = legacyDegreesToRadians(15 * (solarHour - 12));
  const latitude = legacyDegreesToRadians(parameters.latitudeDeg);
  const sinAltitude =
    Math.sin(latitude) * Math.sin(declination) +
    Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle);

  if (sinAltitude <= 0.01) {
    return null;
  }

  const altitude = Math.asin(sinAltitude);
  let cosineSolarAzimuth =
    (sinAltitude * Math.sin(latitude) - Math.sin(declination)) /
    (Math.cos(altitude) * Math.cos(latitude));
  cosineSolarAzimuth = Math.max(-1, Math.min(1, cosineSolarAzimuth));
  const solarAzimuth = (hourAngle >= 0 ? 1 : -1) * Math.acos(cosineSolarAzimuth);
  const directNormalIrradiance = a * Math.exp(-b / sinAltitude);
  const diffuseHorizontalIrradiance = c * directNormalIrradiance * parameters.legacySkyFactor;
  const relativeAzimuth = solarAzimuth - legacyDegreesToRadians(parameters.surfaceAzimuthDeg);
  const cosineOfIncidence = Math.cos(altitude) * Math.cos(relativeAzimuth);
  const beamOnSurface =
    cosineOfIncidence > 0 ? directNormalIrradiance * cosineOfIncidence : 0;
  const groundReflected =
    parameters.groundReflectance *
    (directNormalIrradiance * sinAltitude + diffuseHorizontalIrradiance) *
    0.5;

  return {
    altitudeRadians: altitude,
    relativeAzimuthRadians: relativeAzimuth,
    cosineOfIncidence,
    beamOnSurfaceWPerM2: beamOnSurface,
    diffuseHorizontalWPerM2: diffuseHorizontalIrradiance,
    groundReflectedWPerM2: groundReflected,
  };
}

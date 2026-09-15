import type { FacadeLocalSunVector } from "./types";
import { validateFacadeAzimuth } from "./validation";

const DEG_TO_RAD = Math.PI / 180;

export function normalizeAzimuthDeg(azimuthDegFromNorth: number): number {
  validateFacadeAzimuth(azimuthDegFromNorth);
  return ((azimuthDegFromNorth % 360) + 360) % 360;
}

/**
 * Converts a north-zero/clockwise sun azimuth into facade-local coordinates.
 *
 * In global east/north coordinates the outward normal is (sin A, cos A).
 * A viewer outside looking inward sees local +x to their right, so the local
 * x basis is (-cos A, sin A). Dotting the sun direction with those bases gives
 * x=-cos(e)sin(S-A), y=cos(e)cos(S-A), z=sin(e).
 */
export function facadeLocalSunVector(
  facadeAzimuthDegFromNorth: number,
  solarAzimuthDegFromNorth: number,
  solarElevationDeg: number,
): FacadeLocalSunVector {
  validateFacadeAzimuth(facadeAzimuthDegFromNorth);
  if (!Number.isFinite(solarAzimuthDegFromNorth)) {
    throw new RangeError("solarAzimuthDegFromNorth must be finite");
  }
  if (!Number.isFinite(solarElevationDeg)) {
    throw new RangeError("solarElevationDeg must be finite");
  }
  const relativeAzimuthRadians =
    (solarAzimuthDegFromNorth - facadeAzimuthDegFromNorth) * DEG_TO_RAD;
  if (!Number.isFinite(relativeAzimuthRadians)) {
    throw new RangeError("relative solar azimuth must remain finite");
  }
  const elevationRadians = solarElevationDeg * DEG_TO_RAD;
  const horizontal = Math.cos(elevationRadians);
  return {
    x: -horizontal * Math.sin(relativeAzimuthRadians),
    y: horizontal * Math.cos(relativeAzimuthRadians),
    z: Math.sin(elevationRadians),
  };
}

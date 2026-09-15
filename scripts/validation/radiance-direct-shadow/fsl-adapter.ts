import { calculateDirectShadow } from "../../../src/geometry";
import type { BenchmarkCase } from "./reference";

// System under test ONLY. Never used to construct scene, rays, or reference values.
export function fslFraction(c: BenchmarkCase): number {
  return calculateDirectShadow({
    facadeAzimuthDegFromNorth: c.facadeAzimuthDeg,
    solarAzimuthDegFromNorth: c.sunAzimuthDeg,
    solarElevationDeg: c.sunAltitudeDeg,
    opening: {
      centerXM: c.opening.centerXM, widthM: c.opening.widthM,
      sillZM: c.opening.sillM, headZM: c.opening.headM,
    },
    ...(c.overhang === null ? {} : { overhang: {
      depthM: c.overhang.depthM, elevationZM: c.overhang.elevationM,
      leftExtensionM: c.overhang.leftExtensionM, rightExtensionM: c.overhang.rightExtensionM,
    } }),
  }).directShadedFraction;
}

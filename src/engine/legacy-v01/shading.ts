import { LEGACY_V01_STRIP_COUNT } from "./constants";
import type { LegacyV01SolarState } from "./solar";
import type { LegacyV01HourlyGain, LegacyV01Parameters } from "./types";

export function calculateLegacyShadedGain(
  parameters: LegacyV01Parameters,
  solar: LegacyV01SolarState,
): LegacyV01HourlyGain {
  const shadowDrop =
    solar.cosineOfIncidence > 0
      ? (parameters.overhangDepthM * Math.tan(solar.altitudeRadians)) /
        Math.cos(solar.relativeAzimuthRadians)
      : Infinity;
  let withOverhang = 0;
  let withoutOverhang = 0;

  for (let stripIndex = 0; stripIndex < LEGACY_V01_STRIP_COUNT; stripIndex += 1) {
    const distanceFromOverhangM =
      parameters.overhangToWindowHeadM +
      (parameters.windowHeightM * (stripIndex + 0.5)) / LEGACY_V01_STRIP_COUNT;
    const isDirectlyLit =
      solar.cosineOfIncidence > 0 && shadowDrop < distanceFromOverhangM ? 1 : 0;
    const skyViewFactor =
      parameters.overhangDepthM > 0
        ? 0.5 * Math.sin(Math.atan(distanceFromOverhangM / parameters.overhangDepthM))
        : 0.5;

    withOverhang +=
      solar.beamOnSurfaceWPerM2 * isDirectlyLit +
      solar.diffuseHorizontalWPerM2 * skyViewFactor +
      solar.groundReflectedWPerM2;
    withoutOverhang +=
      solar.beamOnSurfaceWPerM2 +
      solar.diffuseHorizontalWPerM2 * 0.5 +
      solar.groundReflectedWPerM2;
  }

  return {
    withOverhangWPerM2: withOverhang / LEGACY_V01_STRIP_COUNT,
    withoutOverhangWPerM2: withoutOverhang / LEGACY_V01_STRIP_COUNT,
  };
}

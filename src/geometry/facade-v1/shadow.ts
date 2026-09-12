import { facadeLocalSunVector } from "./coordinates";
import { openingGeometryMetrics, overhangGeometryMetrics } from "./overhang";
import {
  clipPolygonToRectangle,
  GEOMETRY_EPSILON,
  polygonAreaM2,
} from "./polygon";
import type {
  DirectShadowInput,
  DirectShadowResult,
  FacadeLocalSunVector,
  Point2,
} from "./types";
import {
  validateHorizontalOverhang,
  validateRectangularOpening,
} from "./validation";

function emptyShadowResult(
  openingAreaM2: number,
  sunVector: FacadeLocalSunVector,
  frontFacing: boolean,
): DirectShadowResult {
  return {
    openingAreaM2,
    shadowPolygon: [],
    clippedShadowPolygon: [],
    shadedAreaM2: 0,
    directShadedFraction: 0,
    directLitFraction: 1,
    frontFacing,
    facadeLocalSunVector: sunVector,
  };
}

function boundedShadedFraction(shadedAreaM2: number, openingAreaM2: number): number {
  const fraction = shadedAreaM2 / openingAreaM2;
  if (
    fraction < -GEOMETRY_EPSILON ||
    fraction > 1 + GEOMETRY_EPSILON
  ) {
    throw new RangeError("calculated shaded fraction is outside 0..1");
  }
  if (fraction <= GEOMETRY_EPSILON) return 0;
  if (fraction >= 1 - GEOMETRY_EPSILON) return 1;
  return fraction;
}

export function calculateDirectShadow(
  input: DirectShadowInput,
): DirectShadowResult {
  validateRectangularOpening(input.opening);
  const openingMetrics = openingGeometryMetrics(input.opening);
  const sunVector = facadeLocalSunVector(
    input.facadeAzimuthDegFromNorth,
    input.solarAzimuthDegFromNorth,
    input.solarElevationDeg,
  );
  const frontFacing =
    sunVector.y > GEOMETRY_EPSILON && sunVector.z > GEOMETRY_EPSILON;

  if (input.overhang === undefined || input.overhang.depthM === 0) {
    return emptyShadowResult(openingMetrics.areaM2, sunVector, frontFacing);
  }
  validateHorizontalOverhang(input.opening, input.overhang);
  if (!frontFacing) {
    return emptyShadowResult(openingMetrics.areaM2, sunVector, false);
  }

  const overhangMetrics = overhangGeometryMetrics(input.opening, input.overhang);
  const projectedXOffsetM =
    (input.overhang.depthM * sunVector.x) / sunVector.y;
  const projectedDropM =
    (input.overhang.depthM * sunVector.z) / sunVector.y;
  const projectedElevationZM = input.overhang.elevationZM - projectedDropM;
  const projectedLeftM = overhangMetrics.leftM - projectedXOffsetM;
  const projectedRightM = overhangMetrics.rightM - projectedXOffsetM;
  const projectedValues = [
    projectedElevationZM,
    projectedLeftM,
    projectedRightM,
  ];
  if (projectedValues.some((value) => !Number.isFinite(value))) {
    throw new RangeError("shadow projection must remain finite");
  }

  const shadowPolygon: readonly Point2[] = [
    { xM: overhangMetrics.leftM, zM: input.overhang.elevationZM },
    { xM: overhangMetrics.rightM, zM: input.overhang.elevationZM },
    { xM: projectedRightM, zM: projectedElevationZM },
    { xM: projectedLeftM, zM: projectedElevationZM },
  ];
  const clippedShadowPolygon = clipPolygonToRectangle(
    shadowPolygon,
    openingMetrics.bounds,
  );
  const shadedAreaM2 = polygonAreaM2(clippedShadowPolygon);
  const directShadedFraction = boundedShadedFraction(
    shadedAreaM2,
    openingMetrics.areaM2,
  );

  return {
    openingAreaM2: openingMetrics.areaM2,
    shadowPolygon,
    clippedShadowPolygon,
    shadedAreaM2,
    directShadedFraction,
    directLitFraction: 1 - directShadedFraction,
    frontFacing,
    facadeLocalSunVector: sunVector,
  };
}

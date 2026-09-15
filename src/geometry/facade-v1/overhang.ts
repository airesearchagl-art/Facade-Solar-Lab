import type {
  HorizontalOverhangGeometry,
  OpeningGeometryMetrics,
  OverhangGeometryMetrics,
  RectangularOpeningGeometry,
} from "./types";
import {
  validateHorizontalOverhang,
  validateRectangularOpening,
} from "./validation";
import { GEOMETRY_EPSILON } from "./polygon";

export function openingGeometryMetrics(
  opening: RectangularOpeningGeometry,
): OpeningGeometryMetrics {
  validateRectangularOpening(opening);
  const heightM = opening.headZM - opening.sillZM;
  const leftM = opening.centerXM - opening.widthM / 2;
  const rightM = opening.centerXM + opening.widthM / 2;
  const areaM2 = opening.widthM * heightM;
  if (
    ![heightM, leftM, rightM, areaM2].every(Number.isFinite) ||
    opening.widthM <= GEOMETRY_EPSILON || heightM <= GEOMETRY_EPSILON ||
    areaM2 <= GEOMETRY_EPSILON || rightM <= leftM
  ) {
    throw new RangeError("opening exceeds finite geometry resolution (length/area epsilon = 1e-9)");
  }
  return {
    heightM,
    areaM2,
    bounds: {
      leftM,
      rightM,
      bottomM: opening.sillZM,
      topM: opening.headZM,
    },
  };
}

export function overhangGeometryMetrics(
  opening: RectangularOpeningGeometry,
  overhang: HorizontalOverhangGeometry,
): OverhangGeometryMetrics {
  validateHorizontalOverhang(opening, overhang);
  const openingMetrics = openingGeometryMetrics(opening);
  const leftM = openingMetrics.bounds.leftM - overhang.leftExtensionM;
  const rightM = openingMetrics.bounds.rightM + overhang.rightExtensionM;
  if (![leftM, rightM, rightM - leftM].every(Number.isFinite)) {
    throw new RangeError("overhang dimensions must remain finite");
  }
  return { leftM, rightM, widthM: rightM - leftM };
}

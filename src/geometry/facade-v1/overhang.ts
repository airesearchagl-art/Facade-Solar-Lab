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

export function openingGeometryMetrics(
  opening: RectangularOpeningGeometry,
): OpeningGeometryMetrics {
  validateRectangularOpening(opening);
  const heightM = opening.headZM - opening.sillZM;
  const leftM = opening.centerXM - opening.widthM / 2;
  const rightM = opening.centerXM + opening.widthM / 2;
  return {
    heightM,
    areaM2: opening.widthM * heightM,
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
  return { leftM, rightM, widthM: rightM - leftM };
}

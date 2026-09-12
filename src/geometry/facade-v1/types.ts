export interface Point2 {
  readonly xM: number;
  readonly zM: number;
}

export interface Rectangle2 {
  readonly leftM: number;
  readonly rightM: number;
  readonly bottomM: number;
  readonly topM: number;
}

export interface FacadeLocalSunVector {
  /** Right when the facade is viewed from outside. */
  readonly x: number;
  /** Facade-outward component. */
  readonly y: number;
  /** Vertical-up component. */
  readonly z: number;
}

export interface RectangularOpeningGeometry {
  readonly centerXM: number;
  readonly widthM: number;
  readonly sillZM: number;
  readonly headZM: number;
}

export interface HorizontalOverhangGeometry {
  readonly depthM: number;
  readonly elevationZM: number;
  readonly leftExtensionM: number;
  readonly rightExtensionM: number;
}

export interface OpeningGeometryMetrics {
  readonly heightM: number;
  readonly areaM2: number;
  readonly bounds: Rectangle2;
}

export interface OverhangGeometryMetrics {
  readonly leftM: number;
  readonly rightM: number;
  readonly widthM: number;
}

export interface DirectShadowInput {
  readonly facadeAzimuthDegFromNorth: number;
  readonly solarAzimuthDegFromNorth: number;
  readonly solarElevationDeg: number;
  readonly opening: RectangularOpeningGeometry;
  readonly overhang?: HorizontalOverhangGeometry;
}

export interface DirectShadowResult {
  readonly openingAreaM2: number;
  readonly shadowPolygon: readonly Point2[];
  readonly clippedShadowPolygon: readonly Point2[];
  readonly shadedAreaM2: number;
  readonly directShadedFraction: number;
  readonly directLitFraction: number;
  readonly frontFacing: boolean;
  readonly facadeLocalSunVector: FacadeLocalSunVector;
}

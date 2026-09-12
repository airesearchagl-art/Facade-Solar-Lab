import type {
  HorizontalOverhangGeometry,
  RectangularOpeningGeometry,
} from "./types";

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
  }
}

export function validateRectangularOpening(
  opening: RectangularOpeningGeometry,
): void {
  assertFinite(opening.centerXM, "opening.centerXM");
  assertFinite(opening.widthM, "opening.widthM");
  assertFinite(opening.sillZM, "opening.sillZM");
  assertFinite(opening.headZM, "opening.headZM");
  if (opening.widthM <= 0) {
    throw new RangeError("opening.widthM must be greater than zero");
  }
  if (opening.headZM <= opening.sillZM) {
    throw new RangeError("opening.headZM must be greater than opening.sillZM");
  }
}

export function validateHorizontalOverhang(
  opening: RectangularOpeningGeometry,
  overhang: HorizontalOverhangGeometry,
): void {
  validateRectangularOpening(opening);
  assertFinite(overhang.depthM, "overhang.depthM");
  assertFinite(overhang.elevationZM, "overhang.elevationZM");
  assertFinite(overhang.leftExtensionM, "overhang.leftExtensionM");
  assertFinite(overhang.rightExtensionM, "overhang.rightExtensionM");
  if (overhang.depthM < 0) {
    throw new RangeError("overhang.depthM must be non-negative");
  }
  if (overhang.leftExtensionM < 0 || overhang.rightExtensionM < 0) {
    throw new RangeError("overhang extensions must be non-negative");
  }
  if (overhang.elevationZM < opening.headZM) {
    throw new RangeError(
      "overhang.elevationZM must not be below opening.headZM",
    );
  }
}

export function validateFacadeAzimuth(azimuthDegFromNorth: number): void {
  assertFinite(azimuthDegFromNorth, "facadeAzimuthDegFromNorth");
}

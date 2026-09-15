import type { FacadeV2Parameters } from "../engine/facade-v2";
import type { MultiFloorCase, MultiFloorDefinition } from "./types";

export function floorToFacadeV1Parameters(
  item: Pick<MultiFloorCase, "facadeAzimuthDegFromNorth" | "groundReflectance">,
  floor: MultiFloorDefinition,
): FacadeV2Parameters {
  return {
    facadeAzimuthDegFromNorth: item.facadeAzimuthDegFromNorth,
    ...(floor.leftFin === undefined ? {} : { leftFin: { ...floor.leftFin } }),
    ...(floor.rightFin === undefined ? {} : { rightFin: { ...floor.rightFin } }),
    opening: {
      centerXM: floor.opening.centerXM,
      widthM: floor.opening.widthM,
      sillZM: floor.opening.sillHeightM,
      headZM: floor.opening.sillHeightM + floor.opening.heightM,
    },
    ...(floor.overhang === undefined
      ? {}
      : {
          overhang: {
            depthM: floor.overhang.depthM,
            elevationZM: floor.overhang.elevationM,
            leftExtensionM: floor.overhang.leftExtensionM,
            rightExtensionM: floor.overhang.rightExtensionM,
          },
        }),
    solarHeatGainCoefficient: floor.solarHeatGainCoefficient,
    groundReflectance: item.groundReflectance,
  };
}

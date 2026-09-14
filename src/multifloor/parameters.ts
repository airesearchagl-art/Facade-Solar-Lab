import type { FacadeV1Parameters } from "../engine/facade-v1";
import type { MultiFloorCase, MultiFloorDefinition } from "./types";

export function floorToFacadeV1Parameters(
  item: Pick<MultiFloorCase, "facadeAzimuthDegFromNorth" | "groundReflectance">,
  floor: MultiFloorDefinition,
): FacadeV1Parameters {
  return {
    facadeAzimuthDegFromNorth: item.facadeAzimuthDegFromNorth,
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

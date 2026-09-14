import { createFacadeSolsticeReferences, type FacadeSolarReference } from "../solar-reference";
import type { WeatherDataset } from "../weather";
import type { MultiFloorCase, MultiFloorDefinition } from "./types";

export interface PositionedFloor {
  readonly floor: MultiFloorDefinition;
  readonly baseZM: number;
  readonly topZM: number;
}

export function positionFloors(buildingCase: MultiFloorCase): readonly PositionedFloor[] {
  let baseZM = 0;
  return buildingCase.floors.map((floor) => {
    const item = { floor, baseZM, topZM: baseZM + floor.floorHeightM };
    baseZM = item.topZM;
    return item;
  });
}

export interface FloorSolarReference {
  readonly floorId: string;
  readonly reference: FacadeSolarReference;
  readonly startZM: number;
  readonly intersectionZM: number;
  readonly depthM: number;
}

/** Visualization only: translate existing local intersections to absolute Z [m]. */
export function createMultiFloorReferences(dataset: WeatherDataset, buildingCase: MultiFloorCase): readonly FloorSolarReference[] {
  return positionFloors(buildingCase).flatMap(({ floor, baseZM }) => {
    const overhang = floor.overhang;
    if (overhang === undefined) return [];
    const references = createFacadeSolsticeReferences({
      dataset,
      facadeAzimuthDegFromNorth: buildingCase.facadeAzimuthDegFromNorth,
      overhang: { depthM: overhang.depthM, elevationZM: overhang.elevationM, leftExtensionM: overhang.leftExtensionM, rightExtensionM: overhang.rightExtensionM },
    });
    return references.flatMap((reference) => {
      const intersection = reference.overhangTipFacadeIntersectionZM;
      if (!reference.frontFacing || intersection === null || !Number.isFinite(intersection)) return [];
      return [{ floorId: floor.id, reference, startZM: baseZM + overhang.elevationM, intersectionZM: baseZM + intersection, depthM: overhang.depthM }];
    });
  });
}

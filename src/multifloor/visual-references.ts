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

export interface FloorRayDisplayEnd {
  readonly displayEndZM: number;
  readonly displayEndDepthM: number;
  readonly wasFloorClipped: boolean;
}

/** Display-only segment clipping in metres; null means an invalid/non-finite ray.
 * The tip must be inside its own floor band. Interpolate along the original ray,
 * never move its wall intersection vertically (which would change its angle).
 * This is not inter-floor shading or a change to the solar reference calculation.
 */
export function clipFloorReferenceRay(
  depthM: number,
  startZM: number,
  rawIntersectionZM: number,
  baseZM: number,
  topZM: number,
): FloorRayDisplayEnd | null {
  if (![depthM, startZM, rawIntersectionZM, baseZM, topZM].every(Number.isFinite) ||
      depthM < 0 || topZM <= baseZM || startZM < baseZM || startZM > topZM) return null;
  if (rawIntersectionZM >= baseZM && rawIntersectionZM <= topZM) {
    // Includes horizontal and zero-length segments: no division is needed.
    return { displayEndZM: rawIntersectionZM, displayEndDepthM: 0, wasFloorClipped: false };
  }
  const displayEndZM = rawIntersectionZM < baseZM ? baseZM : topZM;
  const denominator = rawIntersectionZM - startZM;
  if (!Number.isFinite(denominator) || denominator === 0) return null;
  const t = (displayEndZM - startZM) / denominator;
  if (!Number.isFinite(t) || t < 0 || t > 1) return null;
  const displayEndDepthM = depthM * (1 - t);
  if (!Number.isFinite(displayEndDepthM)) return null;
  return { displayEndZM, displayEndDepthM, wasFloorClipped: true };
}

export interface FloorSolarReference extends FloorRayDisplayEnd {
  readonly floorId: string;
  readonly reference: FacadeSolarReference;
  readonly startZM: number;
  readonly rawIntersectionZM: number;
  readonly depthM: number;
}

/** Visualization only: retain raw absolute Z and clip display endpoints per floor. */
export function createMultiFloorReferences(dataset: WeatherDataset, buildingCase: MultiFloorCase): readonly FloorSolarReference[] {
  return positionFloors(buildingCase).flatMap(({ floor, baseZM, topZM }) => {
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
      const startZM = baseZM + overhang.elevationM;
      const rawIntersectionZM = baseZM + intersection;
      const display = clipFloorReferenceRay(overhang.depthM, startZM, rawIntersectionZM, baseZM, topZM);
      if (display === null) return [];
      return [{ floorId: floor.id, reference, startZM, rawIntersectionZM, depthM: overhang.depthM, ...display }];
    });
  });
}

import {
  addMultiFloorCase,
  createMultiFloorCase,
  createMultiFloorDefinition,
  createMultiFloorWorkspace,
} from "./case";
import type { MultiFloorDefinition, MultiFloorWorkspace } from "./types";

function demoFloor(
  sequence: number,
  overhangDepthM: number,
): MultiFloorDefinition {
  return createMultiFloorDefinition(`floor-${sequence}`, `${sequence}F`, {
    id: `floor-${sequence}`,
    name: `${sequence}F`,
    floorHeightM: 3.8,
    opening: {
      centerXM: 0,
      widthM: 6,
      heightM: 2.4,
      sillHeightM: 0.9,
    },
    overhang: {
      depthM: overhangDepthM,
      elevationM: 3.6,
      leftExtensionM: 0.5,
      rightExtensionM: 0.5,
    },
    solarHeatGainCoefficient: 0.5,
  });
}
export function createMultiFloorDemoWorkspace(): MultiFloorWorkspace {
  const baseline = createMultiFloorCase(
    "building-a",
    "建物案A・全階同一庇",
    [demoFloor(1, 0.8), demoFloor(2, 0.8), demoFloor(3, 0.8)],
  );
  const alternative = createMultiFloorCase(
    "building-b",
    "建物案B・上階ほど深い庇",
    [demoFloor(1, 0.8), demoFloor(2, 1.2), demoFloor(3, 1.6)],
  );
  return addMultiFloorCase(createMultiFloorWorkspace(baseline), alternative);
}

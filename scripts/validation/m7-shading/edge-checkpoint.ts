import { calculateDirectShadowV2, type DirectShadowV2Input } from "../../../src/geometry/facade-v2";
import { simulateFacade } from "../../../src/engine/facade-v2";
import { DEFAULT_COMPARISON_PARAMETERS } from "../../../src/comparison";
import { syntheticYear } from "../m5-completion/fixtures";

/** Fixed pre-array inputs. Deliberately no new array geometry in this checkpoint. */
export function edgeCheckpoint() {
  const p = DEFAULT_COMPARISON_PARAMETERS;
  const fins = { leftFin: { depthM: 0.8, bottomZM: 0.4, topZM: 3.6 }, rightFin: { depthM: 1.2, bottomZM: 0.9, topZM: 3.3 } };
  const shadows = [];
  for (const azimuth of [90, 90.0001, 120, 150, 180, 210, 240, 269.9999, 270]) {
    for (const elevation of [-1, 0.00001, 15, 45, 80]) {
      for (const overhang of [undefined, p.overhang]) {
        const input: DirectShadowV2Input = { ...p, ...fins, overhang, solarAzimuthDegFromNorth: azimuth, solarElevationDeg: elevation };
        shadows.push(calculateDirectShadowV2(input));
      }
    }
  }
  const dataset = syntheticYear(2025, 60);
  const annual = [0, 37, 180].map((orientation) => simulateFacade(dataset, { ...p, ...fins, facadeAzimuthDegFromNorth: orientation }));
  return { shadows, annual };
}

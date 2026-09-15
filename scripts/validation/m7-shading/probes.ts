import { independentCase, syntheticYear } from "../m5-completion/fixtures";
import { runMultiFloorComparison, type MultiFloorCase } from "../../../src/multifloor";

export function workload(floors: number, count: number, fins: boolean) {
  const dataset = syntheticYear(2025, 60);
  const cases: MultiFloorCase[] = Array.from({ length: count }, (_, i) => {
    const item = independentCase(floors, i);
    return { ...item, floors: item.floors.map((floor) => ({
      ...floor,
      // Same overhang on both benchmark arms, including floors absent in M5 fixture.
      overhang: floor.overhang ?? { depthM: 1, elevationM: 3.2, leftExtensionM: 0.2, rightExtensionM: 0.7 },
      ...(fins ? {
        leftFin: { depthM: 0.8, bottomZM: 0.6, topZM: 3.2 },
        rightFin: { depthM: 1.2, bottomZM: 0.6, topZM: 3.2 },
      } : {}),
    })) };
  });
  return { intervals: dataset.intervals.length, run: () => runMultiFloorComparison(dataset, { cases, baselineCaseId: cases[0]!.id }) };
}

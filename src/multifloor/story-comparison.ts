import { calculateMultiFloorDelta } from "./simulation";
import type { MultiFloorFloorResult, MultiFloorPeriodDelta, MultiFloorRunResult } from "./types";

export interface StoryComparisonRow {
  readonly caseId: string;
  readonly caseName: string;
  readonly floor: MultiFloorFloorResult | null;
  /** Null if either case has no floor at this position. Never match by ID/name. */
  readonly delta: {
    readonly annual: MultiFloorPeriodDelta;
    readonly summer: MultiFloorPeriodDelta;
    readonly winter: MultiFloorPeriodDelta;
  } | null;
}

/** Compare existing results by zero-based story position, ordered bottom to top. */
export function compareStory(result: MultiFloorRunResult, storyIndex: number): readonly StoryComparisonRow[] {
  if (!Number.isInteger(storyIndex) || storyIndex < 0) throw new RangeError("Story index must be a nonnegative integer");
  const baselineFloor = result.cases.find((item) => item.caseId === result.baselineCaseId)?.floors[storyIndex];
  return result.cases.map((item) => {
    const floor = item.floors[storyIndex] ?? null;
    const summary = floor?.simulation.summary;
    const baseline = baselineFloor?.simulation.summary;
    return {
      caseId: item.caseId,
      caseName: item.name,
      floor,
      delta: summary === undefined || baseline === undefined ? null : {
        annual: calculateMultiFloorDelta(summary.annual.withOverhangKWh, baseline.annual.withOverhangKWh),
        summer: calculateMultiFloorDelta(summary.cooling.withOverhangKWh, baseline.cooling.withOverhangKWh),
        winter: calculateMultiFloorDelta(summary.heating.withOverhangKWh, baseline.heating.withOverhangKWh),
      },
    };
  });
}

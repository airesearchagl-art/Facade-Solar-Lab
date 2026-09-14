import type { MultiFloorRunResult } from "./types";

export interface MultiFloorResultState {
  readonly result: MultiFloorRunResult | null;
  readonly dirty: boolean;
}
export function markMultiFloorResultStale(
  result: MultiFloorRunResult | null,
): MultiFloorResultState {
  return { result, dirty: true };
}

export function acceptMultiFloorRun(
  result: MultiFloorRunResult,
): MultiFloorResultState {
  return { result, dirty: false };
}

import type { ComparisonRunResult, ComparisonWorkspace } from "../comparison";
import {
  applyPresetToWorkspace,
  type FacadePresetV1,
} from "../preset";

export interface PresetAppliedAppState {
  readonly workspace: ComparisonWorkspace;
  readonly selectedCaseId: string;
  readonly result: ComparisonRunResult | null;
  readonly dirty: true;
}

export function applyPresetToAppState(
  current: ComparisonWorkspace,
  preset: FacadePresetV1,
  nextCaseId?: string,
): PresetAppliedAppState {
  const applied = applyPresetToWorkspace(current, preset, nextCaseId);
  return {
    ...applied,
    result: null,
    dirty: true,
  };
}

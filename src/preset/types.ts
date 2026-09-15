import type { ComparisonCase, ComparisonWorkspace } from "../comparison";
import type { FacadeV2Parameters } from "../engine/facade-v2";
import type { ShadingPresetVersion } from "./shading";

export const PRESET_SCHEMA_VERSION = 1 as const;
export const CASE_PRESET_KIND = "facade-solar-lab-case-preset" as const;
export const WORKSPACE_PRESET_KIND = "facade-solar-lab-workspace-preset" as const;
export const MAX_PRESET_BYTES = 256 * 1024;
export const MAX_PRESET_NAME_LENGTH = 120;

/** Historical type name retained for callers; supports versioned v1/v2 input. */
export interface FacadeCasePresetV1 extends ShadingPresetVersion {
  readonly kind: typeof CASE_PRESET_KIND;
  readonly name: string;
  readonly parameters: FacadeV2Parameters;
}

export interface FacadeWorkspacePresetV1 extends ShadingPresetVersion {
  readonly kind: typeof WORKSPACE_PRESET_KIND;
  readonly cases: readonly ComparisonCase[];
  readonly baselineCaseId: string;
  readonly selectedCaseId: string;
}

export type FacadePresetV1 = FacadeCasePresetV1 | FacadeWorkspacePresetV1;

export interface AppliedPresetWorkspace {
  readonly workspace: ComparisonWorkspace;
  readonly selectedCaseId: string;
}

import type { ComparisonCase, ComparisonWorkspace } from "../comparison";
import type { FacadeV1Parameters } from "../engine/facade-v1";

export const PRESET_SCHEMA_VERSION = 1 as const;
export const CASE_PRESET_KIND = "facade-solar-lab-case-preset" as const;
export const WORKSPACE_PRESET_KIND = "facade-solar-lab-workspace-preset" as const;
export const MAX_PRESET_BYTES = 256 * 1024;
export const MAX_PRESET_NAME_LENGTH = 120;

export interface FacadeCasePresetV1 {
  readonly kind: typeof CASE_PRESET_KIND;
  readonly schemaVersion: typeof PRESET_SCHEMA_VERSION;
  readonly name: string;
  readonly parameters: FacadeV1Parameters;
}

export interface FacadeWorkspacePresetV1 {
  readonly kind: typeof WORKSPACE_PRESET_KIND;
  readonly schemaVersion: typeof PRESET_SCHEMA_VERSION;
  readonly cases: readonly ComparisonCase[];
  readonly baselineCaseId: string;
  readonly selectedCaseId: string;
}

export type FacadePresetV1 = FacadeCasePresetV1 | FacadeWorkspacePresetV1;

export interface AppliedPresetWorkspace {
  readonly workspace: ComparisonWorkspace;
  readonly selectedCaseId: string;
}

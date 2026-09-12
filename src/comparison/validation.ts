import { validateFacadeV1Parameters } from "../engine/facade-v1";
import {
  MAX_COMPARISON_CASES,
  MIN_COMPARISON_CASES,
} from "./case";
import type {
  ComparisonCase,
  ComparisonValidationIssue,
  ComparisonWorkspace,
} from "./types";

export class ComparisonValidationError extends Error {
  readonly issues: readonly ComparisonValidationIssue[];

  constructor(issues: readonly ComparisonValidationIssue[]) {
    super("Comparison workspace contains invalid cases");
    this.name = "ComparisonValidationError";
    this.issues = issues;
  }
}

function issue(
  caseId: string,
  path: string,
  message: string,
): ComparisonValidationIssue {
  return { caseId, path, message };
}

function finiteIssue(
  caseId: string,
  path: string,
  value: number,
): ComparisonValidationIssue | null {
  return Number.isFinite(value)
    ? null
    : issue(caseId, path, `${path} must be a finite number`);
}

export function validateComparisonCase(
  comparisonCase: ComparisonCase,
): readonly ComparisonValidationIssue[] {
  const { id, name, parameters } = comparisonCase;
  const issues: ComparisonValidationIssue[] = [];
  if (id.trim() === "") issues.push(issue(id, "id", "Case ID is required"));
  if (name.trim() === "") issues.push(issue(id, "name", "Case name is required"));

  const numericFields: Array<readonly [string, number]> = [
    ["facadeAzimuthDegFromNorth", parameters.facadeAzimuthDegFromNorth],
    ["opening.centerXM", parameters.opening.centerXM],
    ["opening.widthM", parameters.opening.widthM],
    ["opening.sillZM", parameters.opening.sillZM],
    ["opening.headZM", parameters.opening.headZM],
    ["solarHeatGainCoefficient", parameters.solarHeatGainCoefficient],
    ["groundReflectance", parameters.groundReflectance],
  ];
  if (parameters.overhang !== undefined) {
    numericFields.push(
      ["overhang.depthM", parameters.overhang.depthM],
      ["overhang.elevationZM", parameters.overhang.elevationZM],
      ["overhang.leftExtensionM", parameters.overhang.leftExtensionM],
      ["overhang.rightExtensionM", parameters.overhang.rightExtensionM],
    );
  }
  for (const [path, value] of numericFields) {
    const finding = finiteIssue(id, path, value);
    if (finding !== null) issues.push(finding);
  }

  if (Number.isFinite(parameters.opening.widthM) && parameters.opening.widthM <= 0) {
    issues.push(issue(id, "opening.widthM", "Opening width must be greater than 0 m"));
  }
  if (
    Number.isFinite(parameters.opening.headZM) &&
    Number.isFinite(parameters.opening.sillZM) &&
    parameters.opening.headZM <= parameters.opening.sillZM
  ) {
    issues.push(issue(id, "opening.headZM", "Opening head must be above the sill"));
  }
  if (parameters.overhang !== undefined) {
    if (Number.isFinite(parameters.overhang.depthM) && parameters.overhang.depthM < 0) {
      issues.push(issue(id, "overhang.depthM", "Overhang depth must be 0 m or greater"));
    }
    if (
      Number.isFinite(parameters.overhang.leftExtensionM) &&
      parameters.overhang.leftExtensionM < 0
    ) {
      issues.push(issue(id, "overhang.leftExtensionM", "Left extension must be 0 m or greater"));
    }
    if (
      Number.isFinite(parameters.overhang.rightExtensionM) &&
      parameters.overhang.rightExtensionM < 0
    ) {
      issues.push(issue(id, "overhang.rightExtensionM", "Right extension must be 0 m or greater"));
    }
    if (
      Number.isFinite(parameters.overhang.elevationZM) &&
      Number.isFinite(parameters.opening.headZM) &&
      parameters.overhang.elevationZM < parameters.opening.headZM
    ) {
      issues.push(issue(id, "overhang.elevationZM", "Overhang elevation must be at or above the opening head"));
    }
  }
  if (
    Number.isFinite(parameters.solarHeatGainCoefficient) &&
    (parameters.solarHeatGainCoefficient <= 0 ||
      parameters.solarHeatGainCoefficient > 1)
  ) {
    issues.push(issue(id, "solarHeatGainCoefficient", "SHGC must be greater than 0 and at most 1"));
  }
  if (
    Number.isFinite(parameters.groundReflectance) &&
    (parameters.groundReflectance < 0 || parameters.groundReflectance > 1)
  ) {
    issues.push(issue(id, "groundReflectance", "Ground reflectance must be between 0 and 1"));
  }

  if (issues.length === 0) {
    try {
      validateFacadeV1Parameters(parameters);
    } catch (error) {
      issues.push(
        issue(
          id,
          "parameters",
          error instanceof Error ? error.message : "Facade parameters are invalid",
        ),
      );
    }
  }
  return issues;
}

export function validateComparisonWorkspace(
  workspace: ComparisonWorkspace,
): readonly ComparisonValidationIssue[] {
  const issues: ComparisonValidationIssue[] = [];
  if (
    workspace.cases.length < MIN_COMPARISON_CASES ||
    workspace.cases.length > MAX_COMPARISON_CASES
  ) {
    issues.push({
      path: "cases",
      message: `Comparison requires ${MIN_COMPARISON_CASES}–${MAX_COMPARISON_CASES} cases`,
    });
  }
  const ids = new Set<string>();
  for (const item of workspace.cases) {
    if (ids.has(item.id)) {
      issues.push(issue(item.id, "id", `Duplicate case ID: ${item.id}`));
    }
    ids.add(item.id);
    issues.push(...validateComparisonCase(item));
  }
  if (!ids.has(workspace.baselineCaseId)) {
    issues.push({ path: "baselineCaseId", message: "Baseline must reference an existing case" });
  }
  return issues;
}

export function assertComparisonWorkspaceValid(
  workspace: ComparisonWorkspace,
): void {
  const issues = validateComparisonWorkspace(workspace);
  if (issues.length > 0) throw new ComparisonValidationError(issues);
}

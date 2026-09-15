import { validateFacadeV2Parameters } from "../engine/facade-v2";
import { finInputIssues } from "./fin-input";
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
    super("比較案の入力に不正な値があります。");
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
    : issue(caseId, path, `${path}には有限の数値を入力してください。`);
}

export function validateComparisonCase(
  comparisonCase: ComparisonCase,
): readonly ComparisonValidationIssue[] {
  const { id, name, parameters } = comparisonCase;
  const issues: ComparisonValidationIssue[] = [];
  issues.push(...finInputIssues(parameters).map((finding) => ({ ...finding, caseId: id })));
  if (id.trim() === "") issues.push(issue(id, "id", "案のIDが必要です。"));
  if (name.trim() === "") issues.push(issue(id, "name", "案の名称を入力してください。"));

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
    issues.push(issue(id, "opening.widthM", "開口幅は0 mより大きい値にしてください。"));
  }
  if (
    Number.isFinite(parameters.opening.headZM) &&
    Number.isFinite(parameters.opening.sillZM) &&
    parameters.opening.headZM <= parameters.opening.sillZM
  ) {
    issues.push(issue(id, "opening.headZM", "開口上端は開口下端より高くしてください。"));
  }
  if (parameters.overhang !== undefined) {
    if (Number.isFinite(parameters.overhang.depthM) && parameters.overhang.depthM < 0) {
      issues.push(issue(id, "overhang.depthM", "庇の出は0 m以上にしてください。"));
    }
    if (
      Number.isFinite(parameters.overhang.leftExtensionM) &&
      parameters.overhang.leftExtensionM < 0
    ) {
      issues.push(issue(id, "overhang.leftExtensionM", "左側の張り出しは0 m以上にしてください。"));
    }
    if (
      Number.isFinite(parameters.overhang.rightExtensionM) &&
      parameters.overhang.rightExtensionM < 0
    ) {
      issues.push(issue(id, "overhang.rightExtensionM", "右側の張り出しは0 m以上にしてください。"));
    }
    if (
      Number.isFinite(parameters.overhang.elevationZM) &&
      Number.isFinite(parameters.opening.headZM) &&
      parameters.overhang.elevationZM < parameters.opening.headZM
    ) {
      issues.push(issue(id, "overhang.elevationZM", "庇高さは開口上端以上にしてください。"));
    }
  }
  if (
    Number.isFinite(parameters.solarHeatGainCoefficient) &&
    (parameters.solarHeatGainCoefficient <= 0 ||
      parameters.solarHeatGainCoefficient > 1)
  ) {
    issues.push(issue(id, "solarHeatGainCoefficient", "日射熱取得率（SHGC）は0より大きく1以下にしてください。"));
  }
  if (
    Number.isFinite(parameters.groundReflectance) &&
    (parameters.groundReflectance < 0 || parameters.groundReflectance > 1)
  ) {
    issues.push(issue(id, "groundReflectance", "地面反射率は0以上1以下にしてください。"));
  }

  if (issues.length === 0) {
    try {
      validateFacadeV2Parameters(parameters);
    } catch {
      issues.push(
        issue(
          id,
          "parameters",
          "ファサード入力が不正です。",
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
      message: `比較案は${MIN_COMPARISON_CASES}〜${MAX_COMPARISON_CASES}案にしてください。`,
    });
  }
  const ids = new Set<string>();
  for (const item of workspace.cases) {
    if (ids.has(item.id)) {
      issues.push(issue(item.id, "id", `案のIDが重複しています: ${item.id}`));
    }
    ids.add(item.id);
    issues.push(...validateComparisonCase(item));
  }
  if (!ids.has(workspace.baselineCaseId)) {
    issues.push({ path: "baselineCaseId", message: "基準案には存在する案を指定してください。" });
  }
  return issues;
}

export function assertComparisonWorkspaceValid(
  workspace: ComparisonWorkspace,
): void {
  const issues = validateComparisonWorkspace(workspace);
  if (issues.length > 0) throw new ComparisonValidationError(issues);
}

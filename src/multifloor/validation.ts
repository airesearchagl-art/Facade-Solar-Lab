import { validateFacadeV2Parameters } from "../engine/facade-v2";
import { finInputIssues } from "../comparison/fin-input";
import {
  MAX_MULTI_FLOOR_CASES,
  MIN_FLOORS_PER_CASE,
  MIN_MULTI_FLOOR_CASES,
} from "./case";
import { floorToFacadeV1Parameters } from "./parameters";
import type {
  MultiFloorCase,
  MultiFloorDefinition,
  MultiFloorValidationIssue,
  MultiFloorWorkspace,
} from "./types";

export class MultiFloorValidationError extends Error {
  readonly issues: readonly MultiFloorValidationIssue[];

  constructor(issues: readonly MultiFloorValidationIssue[]) {
    super("複数階案の入力に不正な値があります。");
    this.name = "MultiFloorValidationError";
    this.issues = issues;
  }
}

function issue(
  caseId: string,
  path: string,
  message: string,
  floorId?: string,
): MultiFloorValidationIssue {
  return { caseId, ...(floorId === undefined ? {} : { floorId }), path, message };
}

function finiteIssue(
  caseId: string,
  path: string,
  value: number,
  floorId?: string,
): MultiFloorValidationIssue | null {
  return Number.isFinite(value)
    ? null
    : issue(caseId, path, `${path}には有限の数値を入力してください。`, floorId);
}

export function validateMultiFloorDefinition(
  caseId: string,
  floor: MultiFloorDefinition,
): readonly MultiFloorValidationIssue[] {
  const issues: MultiFloorValidationIssue[] = [];
  issues.push(...finInputIssues(floor, floor.opening.widthM).map((finding) => ({ ...finding, caseId, floorId: floor.id })));
  if (floor.id.trim() === "") issues.push(issue(caseId, "id", "階IDが必要です。", floor.id));
  if (floor.name.trim() === "") issues.push(issue(caseId, "name", "階名称を入力してください。", floor.id));
  const numericFields: Array<readonly [string, number]> = [
    ["floorHeightM", floor.floorHeightM],
    ["opening.centerXM", floor.opening.centerXM],
    ["opening.widthM", floor.opening.widthM],
    ["opening.heightM", floor.opening.heightM],
    ["opening.sillHeightM", floor.opening.sillHeightM],
    ["solarHeatGainCoefficient", floor.solarHeatGainCoefficient],
  ];
  if (floor.overhang !== undefined) {
    numericFields.push(
      ["overhang.depthM", floor.overhang.depthM],
      ["overhang.elevationM", floor.overhang.elevationM],
      ["overhang.leftExtensionM", floor.overhang.leftExtensionM],
      ["overhang.rightExtensionM", floor.overhang.rightExtensionM],
    );
  }
  for (const [path, value] of numericFields) {
    const finding = finiteIssue(caseId, path, value, floor.id);
    if (finding !== null) issues.push(finding);
  }
  if (Number.isFinite(floor.floorHeightM) && floor.floorHeightM <= 0) {
    issues.push(issue(caseId, "floorHeightM", "階高は0 mより大きい値にしてください。", floor.id));
  }
  if (Number.isFinite(floor.opening.widthM) && floor.opening.widthM <= 0) {
    issues.push(issue(caseId, "opening.widthM", "開口幅は0 mより大きい値にしてください。", floor.id));
  }
  if (Number.isFinite(floor.opening.heightM) && floor.opening.heightM <= 0) {
    issues.push(issue(caseId, "opening.heightM", "開口高さは0 mより大きい値にしてください。", floor.id));
  }
  if (Number.isFinite(floor.opening.sillHeightM) && floor.opening.sillHeightM < 0) {
    issues.push(issue(caseId, "opening.sillHeightM", "腰壁高さは0 m以上にしてください。", floor.id));
  }
  const openingHead = floor.opening.sillHeightM + floor.opening.heightM;
  if (
    Number.isFinite(openingHead) &&
    Number.isFinite(floor.floorHeightM) &&
    openingHead > floor.floorHeightM
  ) {
    issues.push(issue(caseId, "opening.heightM", "開口上端は階高以下にしてください。", floor.id));
  }
  if (
    Number.isFinite(floor.solarHeatGainCoefficient) &&
    (floor.solarHeatGainCoefficient <= 0 || floor.solarHeatGainCoefficient > 1)
  ) {
    issues.push(issue(caseId, "solarHeatGainCoefficient", "日射熱取得率（SHGC）は0より大きく1以下にしてください。", floor.id));
  }
  if (floor.overhang !== undefined) {
    if (Number.isFinite(floor.overhang.depthM) && floor.overhang.depthM < 0) {
      issues.push(issue(caseId, "overhang.depthM", "庇の出は0 m以上にしてください。", floor.id));
    }
    if (Number.isFinite(floor.overhang.leftExtensionM) && floor.overhang.leftExtensionM < 0) {
      issues.push(issue(caseId, "overhang.leftExtensionM", "左側延長は0 m以上にしてください。", floor.id));
    }
    if (Number.isFinite(floor.overhang.rightExtensionM) && floor.overhang.rightExtensionM < 0) {
      issues.push(issue(caseId, "overhang.rightExtensionM", "右側延長は0 m以上にしてください。", floor.id));
    }
    if (Number.isFinite(floor.overhang.elevationM) && Number.isFinite(openingHead) && floor.overhang.elevationM < openingHead) {
      issues.push(issue(caseId, "overhang.elevationM", "庇高さは開口上端以上にしてください。", floor.id));
    }
    if (Number.isFinite(floor.overhang.elevationM) && Number.isFinite(floor.floorHeightM) && floor.overhang.elevationM > floor.floorHeightM) {
      issues.push(issue(caseId, "overhang.elevationM", "庇高さは階高以下にしてください。", floor.id));
    }
  }
  return issues;
}

export function validateMultiFloorCase(
  item: MultiFloorCase,
): readonly MultiFloorValidationIssue[] {
  const issues: MultiFloorValidationIssue[] = [];
  if (item.id.trim() === "") issues.push(issue(item.id, "id", "建物案のIDが必要です。"));
  if (item.name.trim() === "") issues.push(issue(item.id, "name", "建物案の名称を入力してください。"));
  const azimuthIssue = finiteIssue(item.id, "facadeAzimuthDegFromNorth", item.facadeAzimuthDegFromNorth);
  if (azimuthIssue !== null) issues.push(azimuthIssue);
  const groundIssue = finiteIssue(item.id, "groundReflectance", item.groundReflectance);
  if (groundIssue !== null) issues.push(groundIssue);
  if (Number.isFinite(item.groundReflectance) && (item.groundReflectance < 0 || item.groundReflectance > 1)) {
    issues.push(issue(item.id, "groundReflectance", "地面反射率は0以上1以下にしてください。"));
  }
  if (item.floors.length < MIN_FLOORS_PER_CASE) {
    issues.push(issue(item.id, "floors", "各建物案には1階以上が必要です。"));
  }
  const floorIds = new Set<string>();
  for (const floor of item.floors) {
    if (floorIds.has(floor.id)) {
      issues.push(issue(item.id, "id", `階IDが重複しています: ${floor.id}`, floor.id));
    }
    floorIds.add(floor.id);
    const floorIssues = validateMultiFloorDefinition(item.id, floor);
    issues.push(...floorIssues);
    if (floorIssues.length === 0 && Number.isFinite(item.facadeAzimuthDegFromNorth) && Number.isFinite(item.groundReflectance)) {
      try {
        validateFacadeV2Parameters(floorToFacadeV1Parameters(item, floor));
      } catch {
        issues.push(issue(item.id, "parameters", "既存facade-v1へ渡す階形状が不正です。", floor.id));
      }
    }
  }
  return issues;
}

export function validateMultiFloorWorkspace(
  workspace: MultiFloorWorkspace,
): readonly MultiFloorValidationIssue[] {
  const issues: MultiFloorValidationIssue[] = [];
  if (workspace.cases.length < MIN_MULTI_FLOOR_CASES || workspace.cases.length > MAX_MULTI_FLOOR_CASES) {
    issues.push({ path: "cases", message: `建物案は${MIN_MULTI_FLOOR_CASES}〜${MAX_MULTI_FLOOR_CASES}案にしてください。` });
  }
  const caseIds = new Set<string>();
  for (const item of workspace.cases) {
    if (caseIds.has(item.id)) {
      issues.push(issue(item.id, "id", `建物案IDが重複しています: ${item.id}`));
    }
    caseIds.add(item.id);
    issues.push(...validateMultiFloorCase(item));
  }
  if (!caseIds.has(workspace.baselineCaseId)) {
    issues.push({ path: "baselineCaseId", message: "基準案には存在する建物案を指定してください。" });
  }
  return issues;
}

export function assertMultiFloorWorkspaceValid(workspace: MultiFloorWorkspace): void {
  const issues = validateMultiFloorWorkspace(workspace);
  if (issues.length > 0) throw new MultiFloorValidationError(issues);
}

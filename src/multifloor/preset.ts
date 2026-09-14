import {
  MAX_MULTI_FLOOR_CASES,
  addMultiFloorCase,
  cloneMultiFloorCase,
  createMultiFloorWorkspace,
} from "./case";
import type {
  MultiFloorCase,
  MultiFloorDefinition,
  MultiFloorRunResult,
  MultiFloorWorkspace,
} from "./types";
import {
  assertMultiFloorWorkspaceValid,
  validateMultiFloorCase,
} from "./validation";

export const MULTI_FLOOR_PRESET_SCHEMA_VERSION = 1 as const;
export const MULTI_FLOOR_CASE_PRESET_KIND =
  "facade-solar-lab-multifloor-case-preset" as const;
export const MULTI_FLOOR_WORKSPACE_PRESET_KIND =
  "facade-solar-lab-multifloor-workspace-preset" as const;
export const MAX_MULTI_FLOOR_PRESET_BYTES = 256 * 1024;

const MAX_NAME_LENGTH = 120;
const MAX_ID_LENGTH = 128;

export interface MultiFloorCasePresetV1 {
  readonly kind: typeof MULTI_FLOOR_CASE_PRESET_KIND;
  readonly schemaVersion: typeof MULTI_FLOOR_PRESET_SCHEMA_VERSION;
  readonly case: MultiFloorCase;
}
export interface MultiFloorWorkspacePresetV1 {
  readonly kind: typeof MULTI_FLOOR_WORKSPACE_PRESET_KIND;
  readonly schemaVersion: typeof MULTI_FLOOR_PRESET_SCHEMA_VERSION;
  readonly cases: readonly MultiFloorCase[];
  readonly baselineCaseId: string;
  readonly selectedCaseId: string;
  readonly selectedFloorId: string;
}

export type MultiFloorPresetV1 =
  | MultiFloorCasePresetV1
  | MultiFloorWorkspacePresetV1;

export interface AppliedMultiFloorPresetState {
  readonly workspace: MultiFloorWorkspace;
  readonly selectedCaseId: string;
  readonly selectedFloorId: string;
  readonly result: MultiFloorRunResult | null;
  readonly dirty: true;
}

export class MultiFloorPresetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MultiFloorPresetError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new MultiFloorPresetError(`${label}が不正です。`);
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new MultiFloorPresetError(`${label}は空にできません。`);
  }
  if (value.length > MAX_NAME_LENGTH) {
    throw new MultiFloorPresetError(`${label}は${MAX_NAME_LENGTH}文字以内にしてください。`);
  }
  return value;
}

function requireId(value: unknown, label: string): string {
  const id = requireString(value, label);
  if (id.length > MAX_ID_LENGTH) {
    throw new MultiFloorPresetError(`${label}は${MAX_ID_LENGTH}文字以内にしてください。`);
  }
  return id;
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new MultiFloorPresetError(`${label}には有限の数値が必要です。`);
  }
  return value;
}

function readFloor(value: unknown, label: string): MultiFloorDefinition {
  const record = requireRecord(value, label);
  const opening = requireRecord(record.opening, `${label}.opening`);
  const overhangValue = record.overhang;
  const overhang = overhangValue === undefined
    ? undefined
    : (() => {
        const item = requireRecord(overhangValue, `${label}.overhang`);
        return {
          depthM: requireNumber(item.depthM, `${label}.overhang.depthM`),
          elevationM: requireNumber(item.elevationM, `${label}.overhang.elevationM`),
          leftExtensionM: requireNumber(item.leftExtensionM, `${label}.overhang.leftExtensionM`),
          rightExtensionM: requireNumber(item.rightExtensionM, `${label}.overhang.rightExtensionM`),
        };
      })();
  return {
    id: requireId(record.id, `${label}.id`),
    name: requireString(record.name, `${label}.name`),
    floorHeightM: requireNumber(record.floorHeightM, `${label}.floorHeightM`),
    opening: {
      centerXM: requireNumber(opening.centerXM, `${label}.opening.centerXM`),
      widthM: requireNumber(opening.widthM, `${label}.opening.widthM`),
      heightM: requireNumber(opening.heightM, `${label}.opening.heightM`),
      sillHeightM: requireNumber(opening.sillHeightM, `${label}.opening.sillHeightM`),
    },
    ...(overhang === undefined ? {} : { overhang }),
    solarHeatGainCoefficient: requireNumber(
      record.solarHeatGainCoefficient,
      `${label}.solarHeatGainCoefficient`,
    ),
  };
}

function readCase(value: unknown, label: string): MultiFloorCase {
  const record = requireRecord(value, label);
  if (!Array.isArray(record.floors)) {
    throw new MultiFloorPresetError(`${label}.floorsが不正です。`);
  }
  return {
    id: requireId(record.id, `${label}.id`),
    name: requireString(record.name, `${label}.name`),
    facadeAzimuthDegFromNorth: requireNumber(
      record.facadeAzimuthDegFromNorth,
      `${label}.facadeAzimuthDegFromNorth`,
    ),
    groundReflectance: requireNumber(
      record.groundReflectance,
      `${label}.groundReflectance`,
    ),
    floors: record.floors.map((floor, index) => readFloor(floor, `${label}.floors[${index}]`)),
  };
}

function assertCaseValid(item: MultiFloorCase): void {
  const issues = validateMultiFloorCase(item);
  if (issues.length > 0) {
    throw new MultiFloorPresetError(issues.map((item) => item.message).join(" "));
  }
}

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0)!;
    bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
  }
  return bytes;
}

function prettyJson(value: MultiFloorPresetV1): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function copiedCase(item: MultiFloorCase): MultiFloorCase {
  const copied = cloneMultiFloorCase(item);
  return {
    id: requireId(copied.id, "建物案ID"),
    name: requireString(copied.name, "建物案の名称"),
    facadeAzimuthDegFromNorth: copied.facadeAzimuthDegFromNorth,
    groundReflectance: copied.groundReflectance,
    floors: copied.floors,
  };
}

export function createMultiFloorCasePreset(item: MultiFloorCase): MultiFloorCasePresetV1 {
  assertCaseValid(item);
  return {
    kind: MULTI_FLOOR_CASE_PRESET_KIND,
    schemaVersion: MULTI_FLOOR_PRESET_SCHEMA_VERSION,
    case: copiedCase(item),
  };
}

export function createMultiFloorWorkspacePreset(
  workspace: MultiFloorWorkspace,
  selectedCaseId: string,
  selectedFloorId: string,
): MultiFloorWorkspacePresetV1 {
  assertMultiFloorWorkspaceValid(workspace);
  const selectedCase = workspace.cases.find((item) => item.id === selectedCaseId);
  if (selectedCase === undefined) {
    throw new MultiFloorPresetError("selectedCaseIdには存在する建物案を指定してください。");
  }
  if (!selectedCase.floors.some((floor) => floor.id === selectedFloorId)) {
    throw new MultiFloorPresetError("selectedFloorIdには選択案に存在する階を指定してください。");
  }
  return {
    kind: MULTI_FLOOR_WORKSPACE_PRESET_KIND,
    schemaVersion: MULTI_FLOOR_PRESET_SCHEMA_VERSION,
    cases: workspace.cases.map(copiedCase),
    baselineCaseId: workspace.baselineCaseId,
    selectedCaseId,
    selectedFloorId,
  };
}

export function serializeMultiFloorCasePreset(item: MultiFloorCase): string {
  return prettyJson(createMultiFloorCasePreset(item));
}

export function serializeMultiFloorWorkspacePreset(
  workspace: MultiFloorWorkspace,
  selectedCaseId: string,
  selectedFloorId: string,
): string {
  return prettyJson(createMultiFloorWorkspacePreset(workspace, selectedCaseId, selectedFloorId));
}

export function parseMultiFloorPreset(text: string): MultiFloorPresetV1 {
  if (utf8ByteLength(text) > MAX_MULTI_FLOOR_PRESET_BYTES) {
    throw new MultiFloorPresetError("プリセットファイルが大きすぎます（最大256 KB）。");
  }
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new MultiFloorPresetError("JSONを解析できませんでした。");
  }
  const record = requireRecord(value, "プリセット");
  if (record.schemaVersion !== MULTI_FLOOR_PRESET_SCHEMA_VERSION) {
    throw new MultiFloorPresetError("対応していないschemaVersionです。");
  }
  if (record.kind === MULTI_FLOOR_CASE_PRESET_KIND) {
    const item = readCase(record.case, "case");
    assertCaseValid(item);
    return {
      kind: MULTI_FLOOR_CASE_PRESET_KIND,
      schemaVersion: MULTI_FLOOR_PRESET_SCHEMA_VERSION,
      case: item,
    };
  }
  if (record.kind === MULTI_FLOOR_WORKSPACE_PRESET_KIND) {
    if (!Array.isArray(record.cases)) {
      throw new MultiFloorPresetError("casesが不正です。");
    }
    const cases = record.cases.map((item, index) => readCase(item, `cases[${index}]`));
    const preset: MultiFloorWorkspacePresetV1 = {
      kind: MULTI_FLOOR_WORKSPACE_PRESET_KIND,
      schemaVersion: MULTI_FLOOR_PRESET_SCHEMA_VERSION,
      cases,
      baselineCaseId: requireId(record.baselineCaseId, "baselineCaseId"),
      selectedCaseId: requireId(record.selectedCaseId, "selectedCaseId"),
      selectedFloorId: requireId(record.selectedFloorId, "selectedFloorId"),
    };
    try {
      assertMultiFloorWorkspaceValid({ cases, baselineCaseId: preset.baselineCaseId });
    } catch (error) {
      throw new MultiFloorPresetError(error instanceof Error ? error.message : "複数階比較セットが不正です。");
    }
    const selectedCase = cases.find((item) => item.id === preset.selectedCaseId);
    if (selectedCase === undefined) {
      throw new MultiFloorPresetError("selectedCaseIdには存在する建物案を指定してください。");
    }
    if (!selectedCase.floors.some((floor) => floor.id === preset.selectedFloorId)) {
      throw new MultiFloorPresetError("selectedFloorIdには選択案に存在する階を指定してください。");
    }
    return preset;
  }
  throw new MultiFloorPresetError("対応していないプリセットkindです。");
}

export function applyMultiFloorPreset(
  current: MultiFloorWorkspace,
  preset: MultiFloorPresetV1,
  nextCaseId?: string,
): AppliedMultiFloorPresetState {
  if (preset.kind === MULTI_FLOOR_CASE_PRESET_KIND) {
    if (current.cases.length >= MAX_MULTI_FLOOR_CASES) {
      throw new MultiFloorPresetError(`建物案を追加できるのは最大${MAX_MULTI_FLOOR_CASES}案までです。`);
    }
    if (nextCaseId === undefined) {
      throw new MultiFloorPresetError("建物案の読み込みには新しい案IDが必要です。");
    }
    const imported = { ...cloneMultiFloorCase(preset.case), id: requireId(nextCaseId, "新しい建物案ID") };
    return {
      workspace: addMultiFloorCase(current, imported),
      selectedCaseId: imported.id,
      selectedFloorId: imported.floors[0]!.id,
      result: null,
      dirty: true,
    };
  }
  const workspace = createMultiFloorWorkspace(preset.cases[0]!);
  const restored = preset.cases.slice(1).reduce(
    (result, item) => addMultiFloorCase(result, item),
    { ...workspace, baselineCaseId: preset.baselineCaseId },
  );
  return {
    workspace: restored,
    selectedCaseId: preset.selectedCaseId,
    selectedFloorId: preset.selectedFloorId,
    result: null,
    dirty: true,
  };
}

export function nextAvailableMultiFloorCaseId(
  workspace: MultiFloorWorkspace,
  startAt = 2,
): { readonly id: string; readonly sequence: number } {
  const ids = new Set(workspace.cases.map((item) => item.id));
  let sequence = Math.max(1, Math.floor(startAt));
  while (ids.has(`building-${sequence}`)) sequence += 1;
  return { id: `building-${sequence}`, sequence };
}

export function nextAvailableFloorId(
  item: MultiFloorCase,
  startAt = item.floors.length + 1,
): { readonly id: string; readonly sequence: number } {
  const ids = new Set(item.floors.map((floor) => floor.id));
  let sequence = Math.max(1, Math.floor(startAt));
  while (ids.has(`floor-${sequence}`)) sequence += 1;
  return { id: `floor-${sequence}`, sequence };
}

export function createMultiFloorPresetFilename(name: string): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/gu, "_")
    .replace(/[. ]+$/gu, "")
    .trim()
    .slice(0, 80);
  return `${cleaned === "" ? "multifloor-case" : cleaned}.multifloor.json`;
}

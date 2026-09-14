import {
  addComparisonCase,
  assertComparisonWorkspaceValid,
  cloneFacadeV1Parameters,
  createComparisonCase,
  MAX_COMPARISON_CASES,
  validateComparisonCase,
  type ComparisonCase,
  type ComparisonWorkspace,
} from "../comparison";
import type { FacadeV1Parameters } from "../engine/facade-v1";
import {
  CASE_PRESET_KIND,
  MAX_PRESET_BYTES,
  MAX_PRESET_NAME_LENGTH,
  PRESET_SCHEMA_VERSION,
  WORKSPACE_PRESET_KIND,
  type AppliedPresetWorkspace,
  type FacadeCasePresetV1,
  type FacadePresetV1,
  type FacadeWorkspacePresetV1,
} from "./types";

const MAX_PRESET_ID_LENGTH = 128;

export class FacadePresetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FacadePresetError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new FacadePresetError(`${label}が不正です。`);
  return value;
}

function requireString(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new FacadePresetError(`${label}は空にできません。`);
  }
  if (value.length > maxLength) {
    throw new FacadePresetError(`${label}は${maxLength}文字以内にしてください。`);
  }
  return value;
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new FacadePresetError(`${label}には有限の数値が必要です。`);
  }
  return value;
}

function readParameters(value: unknown): FacadeV1Parameters {
  const record = requireRecord(value, "parameters");
  const opening = requireRecord(record.opening, "parameters.opening");
  const overhangValue = record.overhang;
  const overhang = overhangValue === undefined
    ? undefined
    : (() => {
        const item = requireRecord(overhangValue, "parameters.overhang");
        return {
          depthM: requireNumber(item.depthM, "parameters.overhang.depthM"),
          elevationZM: requireNumber(item.elevationZM, "parameters.overhang.elevationZM"),
          leftExtensionM: requireNumber(item.leftExtensionM, "parameters.overhang.leftExtensionM"),
          rightExtensionM: requireNumber(item.rightExtensionM, "parameters.overhang.rightExtensionM"),
        };
      })();
  return {
    facadeAzimuthDegFromNorth: requireNumber(
      record.facadeAzimuthDegFromNorth,
      "parameters.facadeAzimuthDegFromNorth",
    ),
    opening: {
      centerXM: requireNumber(opening.centerXM, "parameters.opening.centerXM"),
      widthM: requireNumber(opening.widthM, "parameters.opening.widthM"),
      sillZM: requireNumber(opening.sillZM, "parameters.opening.sillZM"),
      headZM: requireNumber(opening.headZM, "parameters.opening.headZM"),
    },
    ...(overhang === undefined ? {} : { overhang }),
    solarHeatGainCoefficient: requireNumber(
      record.solarHeatGainCoefficient,
      "parameters.solarHeatGainCoefficient",
    ),
    groundReflectance: requireNumber(
      record.groundReflectance,
      "parameters.groundReflectance",
    ),
  };
}

function readCase(value: unknown, index: number): ComparisonCase {
  const record = requireRecord(value, `cases[${index}]`);
  return {
    id: requireString(record.id, `cases[${index}].id`, MAX_PRESET_ID_LENGTH),
    name: requireString(record.name, `cases[${index}].name`, MAX_PRESET_NAME_LENGTH),
    parameters: readParameters(record.parameters),
  };
}

function assertCaseValid(item: ComparisonCase): void {
  const issues = validateComparisonCase(item);
  if (issues.length > 0) {
    throw new FacadePresetError(issues.map((issue) => issue.message).join(" "));
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

function prettyJson(value: FacadePresetV1): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function createCasePreset(comparisonCase: ComparisonCase): FacadeCasePresetV1 {
  assertCaseValid(comparisonCase);
  requireString(comparisonCase.name, "案の名称", MAX_PRESET_NAME_LENGTH);
  return {
    kind: CASE_PRESET_KIND,
    schemaVersion: PRESET_SCHEMA_VERSION,
    name: comparisonCase.name,
    parameters: cloneFacadeV1Parameters(comparisonCase.parameters),
  };
}

export function createWorkspacePreset(
  workspace: ComparisonWorkspace,
  selectedCaseId: string,
): FacadeWorkspacePresetV1 {
  assertComparisonWorkspaceValid(workspace);
  if (!workspace.cases.some((item) => item.id === selectedCaseId)) {
    throw new FacadePresetError("選択中の案が比較セットに存在しません。");
  }
  const cases = workspace.cases.map((item) => {
    requireString(item.id, "案のID", MAX_PRESET_ID_LENGTH);
    requireString(item.name, "案の名称", MAX_PRESET_NAME_LENGTH);
    return {
      id: item.id,
      name: item.name,
      parameters: cloneFacadeV1Parameters(item.parameters),
    };
  });
  return {
    kind: WORKSPACE_PRESET_KIND,
    schemaVersion: PRESET_SCHEMA_VERSION,
    cases,
    baselineCaseId: workspace.baselineCaseId,
    selectedCaseId,
  };
}

export function serializeCasePreset(comparisonCase: ComparisonCase): string {
  return prettyJson(createCasePreset(comparisonCase));
}

export function serializeWorkspacePreset(
  workspace: ComparisonWorkspace,
  selectedCaseId: string,
): string {
  return prettyJson(createWorkspacePreset(workspace, selectedCaseId));
}

export function parseFacadePreset(text: string): FacadePresetV1 {
  if (utf8ByteLength(text) > MAX_PRESET_BYTES) {
    throw new FacadePresetError("プリセットファイルが大きすぎます（最大256 KB）。");
  }
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new FacadePresetError("JSONを解析できませんでした。");
  }
  const record = requireRecord(value, "プリセット");
  if (record.schemaVersion !== PRESET_SCHEMA_VERSION) {
    throw new FacadePresetError("対応していないschemaVersionです。");
  }
  if (record.kind === CASE_PRESET_KIND) {
    const preset: FacadeCasePresetV1 = {
      kind: CASE_PRESET_KIND,
      schemaVersion: PRESET_SCHEMA_VERSION,
      name: requireString(record.name, "案の名称", MAX_PRESET_NAME_LENGTH),
      parameters: readParameters(record.parameters),
    };
    assertCaseValid({ id: "imported-case", name: preset.name, parameters: preset.parameters });
    return preset;
  }
  if (record.kind === WORKSPACE_PRESET_KIND) {
    if (!Array.isArray(record.cases)) {
      throw new FacadePresetError("casesが不正です。");
    }
    const cases = record.cases.map((item, index) => readCase(item, index));
    const preset: FacadeWorkspacePresetV1 = {
      kind: WORKSPACE_PRESET_KIND,
      schemaVersion: PRESET_SCHEMA_VERSION,
      cases,
      baselineCaseId: requireString(
        record.baselineCaseId,
        "baselineCaseId",
        MAX_PRESET_ID_LENGTH,
      ),
      selectedCaseId: requireString(
        record.selectedCaseId,
        "selectedCaseId",
        MAX_PRESET_ID_LENGTH,
      ),
    };
    try {
      assertComparisonWorkspaceValid({
        cases: preset.cases,
        baselineCaseId: preset.baselineCaseId,
      });
    } catch (error) {
      throw new FacadePresetError(
        error instanceof Error ? error.message : "比較セットが不正です。",
      );
    }
    if (!preset.cases.some((item) => item.id === preset.selectedCaseId)) {
      throw new FacadePresetError("selectedCaseIdには存在する案を指定してください。");
    }
    return preset;
  }
  throw new FacadePresetError("対応していないプリセットkindです。");
}

export function nextAvailableCaseId(
  workspace: ComparisonWorkspace,
  startAt = 2,
): { readonly id: string; readonly sequence: number } {
  const ids = new Set(workspace.cases.map((item) => item.id));
  let sequence = Math.max(1, Math.floor(startAt));
  while (ids.has(`case-${sequence}`)) sequence += 1;
  return { id: `case-${sequence}`, sequence };
}

export function applyPresetToWorkspace(
  current: ComparisonWorkspace,
  preset: FacadePresetV1,
  nextCaseId?: string,
): AppliedPresetWorkspace {
  if (preset.kind === CASE_PRESET_KIND) {
    if (current.cases.length >= MAX_COMPARISON_CASES) {
      throw new FacadePresetError(`単一案を追加できるのは最大${MAX_COMPARISON_CASES}案までです。`);
    }
    if (nextCaseId === undefined) {
      throw new FacadePresetError("単一案の読み込みには新しい案IDが必要です。");
    }
    const nextCase = createComparisonCase(nextCaseId, preset.name, preset.parameters);
    return {
      workspace: addComparisonCase(current, nextCase),
      selectedCaseId: nextCase.id,
    };
  }
  return {
    workspace: {
      cases: preset.cases.map((item) => ({
        id: item.id,
        name: item.name,
        parameters: cloneFacadeV1Parameters(item.parameters),
      })),
      baselineCaseId: preset.baselineCaseId,
    },
    selectedCaseId: preset.selectedCaseId,
  };
}

export function createCasePresetFilename(name: string): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/gu, "_")
    .replace(/[. ]+$/gu, "")
    .trim()
    .slice(0, 80);
  const candidate = cleaned === "" ? "facade-case" : cleaned;
  const base = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(candidate)
    ? `facade-${candidate}`
    : candidate;
  return `${base}.facade.json`;
}

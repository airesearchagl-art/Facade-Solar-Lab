import { describe, expect, it } from "vitest";

import {
  addComparisonCase,
  createComparisonCase,
  createComparisonWorkspace,
  runComparison,
  setBaselineCase,
} from "../src/comparison";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import {
  CASE_PRESET_KIND,
  MAX_PRESET_BYTES,
  PRESET_SCHEMA_VERSION,
  WORKSPACE_PRESET_KIND,
  applyPresetToWorkspace,
  createCasePresetFilename,
  nextAvailableCaseId,
  parseFacadePreset,
  serializeCasePreset,
  serializeWorkspacePreset,
} from "../src/preset";
import { applyPresetToAppState } from "../src/app/preset-state";

const parameters = {
  facadeAzimuthDegFromNorth: 180,
  opening: { centerXM: 0, widthM: 6, sillZM: 0.9, headZM: 3.3 },
  overhang: {
    depthM: 0.8,
    elevationZM: 3.6,
    leftExtensionM: 0.5,
    rightExtensionM: 0.5,
  },
  solarHeatGainCoefficient: 0.5,
  groundReflectance: 0.2,
} as const;

function casePresetJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    kind: CASE_PRESET_KIND,
    schemaVersion: PRESET_SCHEMA_VERSION,
    name: "南面案",
    parameters,
    ...overrides,
  });
}

function workspaceFixture() {
  const first = createComparisonCase("case-a", "案A", parameters);
  const second = createComparisonCase("case-b", "案B", {
    ...parameters,
    overhang: { ...parameters.overhang, depthM: 1.6 },
  });
  return setBaselineCase(
    addComparisonCase(createComparisonWorkspace(first), second),
    "case-b",
  );
}

describe("facade JSON presets", () => {
  it("serializes a pretty versioned single-case whitelist and round-trips it", () => {
    const item = createComparisonCase("private-id", "南面案", parameters) as ReturnType<typeof createComparisonCase> & {
      result?: unknown;
      weather?: unknown;
    };
    item.result = { annual: 999 };
    item.weather = "raw epw";
    const json = serializeCasePreset(item);
    expect(json.endsWith("\n")).toBe(true);
    expect(json).toContain(`\"kind\": \"${CASE_PRESET_KIND}\"`);
    expect(json).not.toContain("private-id");
    expect(json).not.toContain("result");
    expect(json).not.toContain("weather");
    expect(parseFacadePreset(json)).toEqual({
      kind: CASE_PRESET_KIND,
      schemaVersion: 1,
      name: "南面案",
      parameters,
    });
  });

  it("round-trips workspace order, baseline, selected case, and exact numeric inputs", () => {
    const workspace = workspaceFixture();
    const parsed = parseFacadePreset(
      serializeWorkspacePreset(workspace, "case-a"),
    );
    expect(parsed.kind).toBe(WORKSPACE_PRESET_KIND);
    if (parsed.kind !== WORKSPACE_PRESET_KIND) throw new Error("wrong kind");
    expect(parsed.cases.map((item) => item.id)).toEqual(["case-a", "case-b"]);
    expect(parsed.cases.map((item) => item.name)).toEqual(["案A", "案B"]);
    expect(parsed.baselineCaseId).toBe("case-b");
    expect(parsed.selectedCaseId).toBe("case-a");
    expect(parsed.cases[1]!.parameters.overhang?.depthM).toBe(1.6);
  });

  it("preserves an intentionally absent overhang", () => {
    const item = createComparisonCase("case-a", "庇なし", {
      ...parameters,
      overhang: undefined,
    });
    const parsed = parseFacadePreset(serializeCasePreset(item));
    expect(parsed.kind).toBe(CASE_PRESET_KIND);
    if (parsed.kind !== CASE_PRESET_KIND) throw new Error("wrong kind");
    expect(parsed.parameters.overhang).toBeUndefined();
  });

  it("ignores untrusted result, weather, and prototype-shaped fields", () => {
    const parsed = parseFacadePreset(casePresetJson({
      result: { annual: 999 },
      weather: { raw: "EPW" },
      __proto__: { elevated: true },
    }));
    expect("result" in parsed).toBe(false);
    expect("weather" in parsed).toBe(false);
    expect("elevated" in parsed).toBe(false);
  });

  it("adds a single preset under a deterministic non-colliding ID", () => {
    const workspace = addComparisonCase(
      createComparisonWorkspace(createComparisonCase("case-2", "既存", parameters)),
      createComparisonCase("case-3", "既存2", parameters),
    );
    const next = nextAvailableCaseId(workspace, 2);
    expect(next).toEqual({ id: "case-4", sequence: 4 });
    const applied = applyPresetToWorkspace(
      workspace,
      parseFacadePreset(casePresetJson()),
      next.id,
    );
    expect(applied.workspace.cases.map((item) => item.id)).toEqual([
      "case-2",
      "case-3",
      "case-4",
    ]);
    expect(applied.selectedCaseId).toBe("case-4");
    expect(applied.workspace.cases[2]!.name).toBe("南面案");
  });

  it("replaces a workspace and clears the app result until explicit rerun", () => {
    const current = createComparisonWorkspace();
    const result = runComparison(createDemoWeatherDataset(), current);
    expect(result.cases).toHaveLength(1);
    const parsed = parseFacadePreset(serializeWorkspacePreset(workspaceFixture(), "case-a"));
    const next = applyPresetToAppState(current, parsed);
    expect(next.result).toBeNull();
    expect(next.dirty).toBe(true);
    expect(next.workspace.cases.map((item) => item.name)).toEqual(["案A", "案B"]);
    expect(next.workspace.baselineCaseId).toBe("case-b");
    expect(next.selectedCaseId).toBe("case-a");
  });

  it("rejects malformed JSON, missing fields, unknown kind, and unknown version", () => {
    expect(() => parseFacadePreset("{")) .toThrow(/解析/u);
    expect(() => parseFacadePreset(JSON.stringify({ kind: CASE_PRESET_KIND, schemaVersion: 1 }))).toThrow(/名称/u);
    expect(() => parseFacadePreset(JSON.stringify({ kind: "other", schemaVersion: 1 }))).toThrow(/kind/u);
    expect(() => parseFacadePreset(casePresetJson({ schemaVersion: 2 }))).toThrow(/schemaVersion/u);
  });

  it("rejects invalid names and invalid geometry, SHGC, ground, or non-finite-like values", () => {
    expect(() => parseFacadePreset(casePresetJson({ name: "   " }))).toThrow(/空/u);
    expect(() => parseFacadePreset(casePresetJson({ name: "x".repeat(121) }))).toThrow(/120/u);
    expect(() => parseFacadePreset(casePresetJson({ parameters: { ...parameters, opening: { ...parameters.opening, widthM: 0 } } }))).toThrow(/開口幅/u);
    expect(() => parseFacadePreset(casePresetJson({ parameters: { ...parameters, solarHeatGainCoefficient: 0 } }))).toThrow(/SHGC/u);
    expect(() => parseFacadePreset(casePresetJson({ parameters: { ...parameters, groundReflectance: 2 } }))).toThrow(/地面反射率/u);
    expect(() => parseFacadePreset(casePresetJson({ parameters: { ...parameters, facadeAzimuthDegFromNorth: "Infinity" } }))).toThrow(/有限/u);
  });

  it("rejects duplicate IDs, more than four cases, and invalid baseline/selected IDs", () => {
    const workspace = workspaceFixture();
    const base = JSON.parse(serializeWorkspacePreset(workspace, "case-a")) as Record<string, unknown>;
    const cases = base.cases as unknown[];
    expect(() => parseFacadePreset(JSON.stringify({ ...base, cases: [cases[0], cases[0]] }))).toThrow();
    expect(() => parseFacadePreset(JSON.stringify({ ...base, cases: [...cases, cases[0], cases[1], cases[0]] }))).toThrow();
    expect(() => parseFacadePreset(JSON.stringify({ ...base, baselineCaseId: "missing" }))).toThrow();
    expect(() => parseFacadePreset(JSON.stringify({ ...base, selectedCaseId: "missing" }))).toThrow(/selectedCaseId/u);
  });

  it("rejects files above 256 KB by UTF-8 byte count", () => {
    const oversized = JSON.stringify({
      kind: CASE_PRESET_KIND,
      schemaVersion: 1,
      name: "案",
      parameters,
      padding: "あ".repeat(Math.ceil(MAX_PRESET_BYTES / 3)),
    });
    expect(() => parseFacadePreset(oversized)).toThrow(/大きすぎます/u);
  });

  it("creates Windows-safe bounded filenames without changing the internal name", () => {
    expect(createCasePresetFilename(' 南/東:<案>|?* ')).toBe("南_東__案____.facade.json");
    expect(createCasePresetFilename("... ")).toBe("facade-case.facade.json");
    expect(createCasePresetFilename("CON")).toBe("facade-CON.facade.json");
    expect(createCasePresetFilename("a".repeat(200))).toBe(`${"a".repeat(80)}.facade.json`);
  });

  it("rejects a single-case import when the workspace already has four cases", () => {
    let workspace = createComparisonWorkspace(createComparisonCase("a", "A", parameters));
    for (const id of ["b", "c", "d"]) {
      workspace = addComparisonCase(workspace, createComparisonCase(id, id, parameters));
    }
    expect(() => applyPresetToWorkspace(workspace, parseFacadePreset(casePresetJson()), "e")).toThrow(/最大4案/u);
  });
});

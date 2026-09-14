import { describe, expect, it } from "vitest";

import {
  MULTI_FLOOR_CASE_PRESET_KIND,
  MAX_MULTI_FLOOR_PRESET_BYTES,
  MULTI_FLOOR_PRESET_SCHEMA_VERSION,
  MULTI_FLOOR_WORKSPACE_PRESET_KIND,
  applyMultiFloorPreset,
  createMultiFloorCasePreset,
  createMultiFloorDemoWorkspace,
  createMultiFloorWorkspacePreset,
  parseMultiFloorPreset,
  serializeMultiFloorCasePreset,
  serializeMultiFloorWorkspacePreset,
  type MultiFloorCase,
} from "../src/multifloor";

describe("M4.5 multi-floor JSON presets", () => {
  it("round-trips a Building Case and whitelists input-only fields", () => {
    const item = createMultiFloorDemoWorkspace().cases[0]! as MultiFloorCase & {
      result?: unknown;
      rawWeather?: unknown;
    };
    item.result = { annual: 999 };
    item.rawWeather = "EPW bytes";
    const json = serializeMultiFloorCasePreset(item);
    const parsed = parseMultiFloorPreset(json);
    expect(parsed).toEqual(createMultiFloorCasePreset(item));
    expect(json).not.toContain("result");
    expect(json).not.toContain("rawWeather");
  });

  it("round-trips workspace case/floor order, baseline, and selections", () => {
    const workspace = createMultiFloorDemoWorkspace();
    const json = serializeMultiFloorWorkspacePreset(workspace, "building-b", "floor-2");
    const parsed = parseMultiFloorPreset(json);
    expect(parsed).toEqual(createMultiFloorWorkspacePreset(workspace, "building-b", "floor-2"));
    if (parsed.kind !== MULTI_FLOOR_WORKSPACE_PRESET_KIND) throw new Error("wrong kind");
    expect(parsed.cases.map((item) => item.id)).toEqual(["building-a", "building-b"]);
    expect(parsed.cases[1]!.floors.map((floor) => floor.id)).toEqual(["floor-1", "floor-2", "floor-3"]);
    expect(parsed.baselineCaseId).toBe("building-a");
    expect(parsed.selectedCaseId).toBe("building-b");
    expect(parsed.selectedFloorId).toBe("floor-2");
  });

  it("clears results and requires an explicit rerun after import", () => {
    const workspace = createMultiFloorDemoWorkspace();
    const preset = parseMultiFloorPreset(
      serializeMultiFloorWorkspacePreset(workspace, "building-a", "floor-1"),
    );
    const applied = applyMultiFloorPreset(workspace, preset);
    expect(applied.result).toBeNull();
    expect(applied.dirty).toBe(true);
  });

  it("rejects duplicate floor IDs and invalid selections", () => {
    const preset = JSON.parse(
      serializeMultiFloorWorkspacePreset(createMultiFloorDemoWorkspace(), "building-a", "floor-1"),
    ) as Record<string, unknown>;
    const cases = preset.cases as Array<Record<string, unknown>>;
    const floors = cases[0]!.floors as unknown[];
    cases[0]!.floors = [floors[0], floors[0]];
    expect(() => parseMultiFloorPreset(JSON.stringify(preset))).toThrow();

    const clean = JSON.parse(
      serializeMultiFloorWorkspacePreset(createMultiFloorDemoWorkspace(), "building-a", "floor-1"),
    ) as Record<string, unknown>;
    expect(() => parseMultiFloorPreset(JSON.stringify({ ...clean, selectedFloorId: "missing" }))).toThrow(/selectedFloorId/u);
  });

  it("rejects unknown kind/schema and malformed values", () => {
    expect(() => parseMultiFloorPreset("{")).toThrow(/解析/u);
    expect(() => parseMultiFloorPreset(JSON.stringify({ kind: "other", schemaVersion: 1 }))).toThrow(/kind/u);
    expect(() => parseMultiFloorPreset(JSON.stringify({ kind: MULTI_FLOOR_CASE_PRESET_KIND, schemaVersion: 2 }))).toThrow(/schemaVersion/u);
    expect(MULTI_FLOOR_PRESET_SCHEMA_VERSION).toBe(1);
    expect(() => parseMultiFloorPreset(" ".repeat(MAX_MULTI_FLOOR_PRESET_BYTES + 1))).toThrow(/256 KB/u);
  });
});

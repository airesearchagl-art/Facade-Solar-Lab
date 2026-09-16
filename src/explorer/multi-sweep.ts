import type { ComparisonCase } from "../comparison";
import { cloneMultiFloorCase, cloneMultiFloorDefinition } from "../multifloor/case";
import { floorToFacadeV1Parameters } from "../multifloor/parameters";
import { validateMultiFloorCase } from "../multifloor/validation";
import type { MultiFloorCase, MultiFloorDefinition } from "../multifloor/types";
import { applyAxis, axisValues, candidateCount, recommendedSweepAxis, requireAxisAvailable } from "./sweep";
import { MAX_STUDY_CANDIDATES, type AxisKey, type SweepAxis, type SweepDefinition } from "./types";

export type MultiScope = "selected" | "all";
export interface MultiStudyInput {
  readonly source: MultiFloorCase;
  readonly selectedFloorId: string;
  readonly scope: MultiScope;
  readonly sweep: SweepDefinition;
}
export interface MultiCandidateInput {
  readonly id: string;
  readonly indexA: number;
  readonly indexB: number;
  readonly a: number;
  readonly b?: number;
  readonly definition: MultiFloorCase;
  readonly affectedFloorIds: readonly string[];
}
export const isBuildingAxis = (key: AxisKey) => key === "facadeAzimuthDegFromNorth" || key === "groundReflectance";
export function floorSource(source: MultiFloorCase, floor: MultiFloorDefinition): ComparisonCase {
  return { id: floor.id, name: floor.name, parameters: floorToFacadeV1Parameters(source, floor) };
}
export function affectedFloors(source: MultiFloorCase, selectedFloorId: string, scope: MultiScope): readonly MultiFloorDefinition[] {
  if (scope !== "selected" && scope !== "all") throw new RangeError("適用範囲が不正です。");
  const selected = source.floors.find(floor => floor.id === selectedFloorId);
  if (!selected) throw new RangeError("選択階が存在しません。階を選択してください。");
  return scope === "all" ? source.floors : [selected];
}
export function multiIssues(source: MultiFloorCase): readonly string[] {
  return validateMultiFloorCase(source).map(issue => `${source.floors.find(floor => floor.id === issue.floorId)?.name ?? "建物"} (${issue.floorId ?? source.id}): ${issue.message}`);
}
export function validateMultiStudy(input: MultiStudyInput): number {
  const issues = multiIssues(input.source);
  if (issues.length) throw new RangeError(`元の案を修正してください: ${issues.join(" / ")}`);
  const floors = affectedFloors(input.source, input.selectedFloorId, input.scope);
  const count = candidateCount(input.sweep);
  if (count > MAX_STUDY_CANDIDATES) throw new RangeError(`候補数${count} / 最大${MAX_STUDY_CANDIDATES}。stepを大きくしてください。切捨ては行いません。`);
  const unavailable: string[] = [];
  for (const axis of [input.sweep.a, ...(input.sweep.b ? [input.sweep.b] : [])]) {
    if (input.scope === "selected" && isBuildingAxis(axis.key)) unavailable.push("方位角・地面反射率は建物共通入力です。「全階共通」を選択してください。");
    for (const floor of floors) {
      try { requireAxisAvailable(floorToFacadeV1Parameters(input.source, floor), axis.key); }
      catch (error) { unavailable.push(`${floor.name} (${floor.id}): ${error instanceof Error ? error.message : "shape/layoutが不正です。"}`); }
    }
  }
  if (unavailable.length) throw new RangeError(unavailable.join(" / "));
  return count;
}

/** Reuse M9 starter metadata; intersect local recommendations and Multi floor bounds. */
export function recommendedMultiAxis(source: MultiFloorCase, selectedFloorId: string, scope: MultiScope, key: AxisKey): SweepAxis {
  const floors = affectedFloors(source, selectedFloorId, scope);
  const ranges = floors.map(floor => recommendedSweepAxis(floorSource(source, floor), key));
  let min = Math.max(...ranges.map(range => range.min));
  let max = Math.min(...ranges.map(range => range.max));
  // Elevations need not be near every old elevation: start above the highest head.
  if (key === "overhang.elevationZM") max = Math.min((Math.round(min * 1e6) + 600_000) / 1e6, ...floors.map(floor => Math.floor(floor.floorHeightM * 1e6) / 1e6));
  if (key === "opening.sillZM") min = Math.max(0, min);
  if (key === "opening.headZM") max = Math.min(max, ...floors.map(floor => Math.floor(Math.min(floor.floorHeightM, floor.overhang?.elevationM ?? Infinity) * 1e6) / 1e6));
  if (![min, max].every(Number.isFinite) || max < min) throw new RangeError(`安全な共通推奨範囲がありません (${floors.map(floor => floor.name).join(" / ")})。元の案または適用範囲を確認してください。`);
  return { key, min, max, step: ranges[0]!.step };
}

/** Apply only the changed field; preserve untouched floor bytes/values without round-trip arithmetic. */
function applyFloorAxis(source: MultiFloorCase, floor: MultiFloorDefinition, key: AxisKey, value: number): MultiFloorDefinition {
  const parameters = applyAxis(floorToFacadeV1Parameters(source, floor), key, value);
  const next = cloneMultiFloorDefinition(floor);
  if (key === "opening.widthM") return { ...next, opening: { ...next.opening, widthM: parameters.opening.widthM } };
  if (key === "opening.sillZM") return { ...next, opening: { ...next.opening, sillHeightM: value, heightM: parameters.opening.headZM - value } };
  if (key === "opening.headZM") return { ...next, opening: { ...next.opening, heightM: value - next.opening.sillHeightM } };
  if (key === "solarHeatGainCoefficient") return { ...next, solarHeatGainCoefficient: value };
  if (key.startsWith("overhang.")) {
    const property = key === "overhang.elevationZM" ? "elevationM" : key.slice("overhang.".length);
    return { ...next, overhang: { ...next.overhang!, [property]: value } };
  }
  if (key.startsWith("leftFin.")) return { ...next, leftFin: parameters.leftFin! };
  if (key.startsWith("rightFin.")) return { ...next, rightFin: parameters.rightFin! };
  if (key.startsWith("intermediateFins.")) return { ...next, intermediateFins: parameters.intermediateFins! };
  return next;
}
function applyMultiAxis(source: MultiFloorCase, ids: readonly string[], key: AxisKey, value: number): MultiFloorCase {
  if (key === "facadeAzimuthDegFromNorth") return { ...source, facadeAzimuthDegFromNorth: value };
  if (key === "groundReflectance") return { ...source, groundReflectance: value };
  return { ...source, floors: source.floors.map(floor => ids.includes(floor.id) ? applyFloorAxis(source, floor, key, value) : floor) };
}
export function generateMultiCandidates(input: MultiStudyInput): readonly MultiCandidateInput[] {
  validateMultiStudy(input);
  const ids = affectedFloors(input.source, input.selectedFloorId, input.scope).map(floor => floor.id);
  const aValues = axisValues(input.sweep.a), bValues = input.sweep.b ? axisValues(input.sweep.b) : [undefined];
  return bValues.flatMap((b, indexB) => aValues.map((a, indexA) => {
    let definition = applyMultiAxis(cloneMultiFloorCase(input.source), ids, input.sweep.a.key, a);
    if (input.sweep.b && b !== undefined) definition = applyMultiAxis(definition, ids, input.sweep.b.key, b);
    return { id: `multi-candidate-${indexB + 1}-${indexA + 1}`, indexA, indexB, a, ...(b === undefined ? {} : { b }), definition, affectedFloorIds: [...ids] };
  }));
}
export const multiStudyInputKey = (input: MultiStudyInput): string => JSON.stringify([cloneMultiFloorCase(input.source), input.selectedFloorId, input.scope, input.sweep]);

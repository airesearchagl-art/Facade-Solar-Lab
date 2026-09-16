import { deriveFinLayout } from "../geometry/facade-v2";
import { createMultiFloorCasePreset, parseMultiFloorPreset, MULTI_FLOOR_CASE_PRESET_KIND, MAX_MULTI_FLOOR_PRESET_BYTES } from "../multifloor/preset";
import { cell } from "./export";
import { readAxis } from "./preset";
import { validateMultiStudy, type MultiStudyInput } from "./multi-sweep";
import type { MultiStudyResult } from "./multi-study";

const KIND = "facade-solar-multifloor-parametric-study";
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RangeError("複数階探索JSONが不正です。");
  return value as Record<string, unknown>;
}
function byteLength(text: string): number {
  return [...text].reduce((sum, char) => sum + (char.codePointAt(0)! <= 0x7f ? 1 : char.codePointAt(0)! <= 0x7ff ? 2 : char.codePointAt(0)! <= 0xffff ? 3 : 4), 0);
}
export function multiStudyPreset(input: MultiStudyInput): string {
  validateMultiStudy(input);
  const text = JSON.stringify({ kind: KIND, schemaVersion: 1, source: createMultiFloorCasePreset(input.source), scope: input.scope,
    selectedFloorId: input.selectedFloorId, sweep: { a: readAxis(input.sweep.a), ...(input.sweep.b ? { b: readAxis(input.sweep.b) } : {}) } }, null, 2) + "\n";
  if (byteLength(text) > MAX_MULTI_FLOOR_PRESET_BYTES) throw new RangeError("複数階探索JSONは最大256 KBです。");
  return text;
}
export function parseMultiStudyPreset(text: string): MultiStudyInput {
  if (byteLength(text) > MAX_MULTI_FLOOR_PRESET_BYTES) throw new RangeError("複数階探索JSONは最大256 KBです。");
  const value = record(JSON.parse(text));
  if (value.kind !== KIND || value.schemaVersion !== 1) throw new RangeError("未対応の複数階探索JSONです。");
  const source = parseMultiFloorPreset(JSON.stringify(value.source));
  if (source.kind !== MULTI_FLOOR_CASE_PRESET_KIND) throw new RangeError("単一Multi案の入力を指定してください。");
  if ((value.scope !== "selected" && value.scope !== "all") || typeof value.selectedFloorId !== "string") throw new RangeError("適用範囲または選択階が不正です。");
  const axes = record(value.sweep);
  const input: MultiStudyInput = { source: source.case, scope: value.scope, selectedFloorId: value.selectedFloorId, sweep: { a: readAxis(axes.a), ...(axes.b === undefined ? {} : { b: readAxis(axes.b) }) } };
  validateMultiStudy(input);
  return input;
}
export function multiStudyCsv(study: MultiStudyResult): string {
  const s = study.snapshot;
  const metadata = [s.weatherDatasetId, JSON.stringify(s.weatherProvenance), s.coverage, s.intervalCount, s.source.id, s.source.name, s.scope, s.selectedFloorId, JSON.stringify(s.sweep), study.candidates.length, s.executedAt, s.generationVersion];
  const headers = ["weatherDatasetId", "weatherProvenance", "coverage", "intervalCount", "sourceId", "sourceName", "scope", "selectedFloorId", "sweep", "candidateCount", "executedAt", "generationVersion",
    "rowType", "candidateId", "status", "reason", "axisA", "axisB", "floorId", "floorName", "affected", "inputs", "modelVersion", "finLayout", "annual_kWh", "summer_kWh", "winter_kWh", "annualDelta_kWh", "summerDelta_kWh", "winterDelta_kWh", "limitation"];
  const note = "日射熱取得量。HVAC負荷ではありません。M5 external reference NOT_RUN。絶対kWh正式検証未完了。cross-floor shadowなし。partialは読込期間のみ。syntheticは実測ではありません。";
  const rows: (string | number)[][] = [];
  const baseline = { id: "baseline", a: "", b: "", status: "VALID" as const, definition: s.source, affectedFloorIds: [] as string[], result: study.baseline,
    delta: { annual: 0, cooling: 0, heating: 0 }, floorDeltas: Object.fromEntries(s.source.floors.map(floor => [floor.id, { annual: 0, cooling: 0, heating: 0 }])) };
  for (const candidate of [baseline, ...study.candidates]) {
    const valid = candidate.status === "VALID";
    const shared = [candidate.id, candidate.status, valid ? "" : candidate.issues.join(" / "), candidate.a, candidate.b ?? ""];
    rows.push([...metadata, "building", ...shared, "", "", "", JSON.stringify(candidate.definition), valid ? candidate.result.floors.map(floor => floor.simulation.modelVersion).join(" / ") : "", "",
      ...(valid ? [candidate.result.total.annualKWh, candidate.result.total.summerKWh, candidate.result.total.winterKWh, candidate.delta.annual, candidate.delta.cooling, candidate.delta.heating] : Array(6).fill("")), note]);
    for (const floor of candidate.definition.floors) {
      const result = valid ? candidate.result.floors.find(item => item.floorId === floor.id) : undefined;
      const delta = valid ? candidate.floorDeltas[floor.id] : undefined;
      const layout = result?.parameters.intermediateFins ? deriveFinLayout(result.parameters.opening.widthM, result.parameters.intermediateFins.layout) : null;
      rows.push([...metadata, "floor", ...shared, floor.id, floor.name, candidate.affectedFloorIds.includes(floor.id) ? "yes" : "no", JSON.stringify(floor), result?.simulation.modelVersion ?? "", layout ? JSON.stringify(layout) : "",
        ...(result && delta ? [result.simulation.summary.annual.withOverhangKWh, result.simulation.summary.cooling.withOverhangKWh, result.simulation.summary.heating.withOverhangKWh, delta.annual, delta.cooling, delta.heating] : Array(6).fill("")), note]);
    }
  }
  return `\uFEFF${[headers, ...rows].map(row => row.map(cell).join(",")).join("\r\n")}\r\n`;
}

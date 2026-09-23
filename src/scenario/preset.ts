import { createWorkspacePreset, parseFacadePreset, WORKSPACE_PRESET_KIND } from "../preset";
import { createMultiFloorWorkspacePreset, parseMultiFloorPreset, MULTI_FLOOR_WORKSPACE_PRESET_KIND } from "../multifloor/preset";
import { METRICS, type ScenarioInput, type ScenarioMetric, type ScenarioSource, type SlotDescriptor } from "./types";
import { describeWeather, type WeatherDescriptor } from "./weather";
import { owned, validateScenario } from "./study";
import type { WeatherDataset } from "../weather";
const KIND = "facade-solar-weather-scenario";
export const MAX_SCENARIO_PRESET_BYTES = 256 * 1024;
export interface RestoredScenario { readonly source: ScenarioSource; readonly slots: readonly (SlotDescriptor & { readonly status: "UNRESOLVED" })[];
  readonly referenceId: string; readonly metric: ScenarioMetric }
function record(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new RangeError("シナリオJSONの構造が不正です。");
  return v as Record<string, unknown>;
}
function text(v: unknown, maximum = 512): string {
  if (typeof v !== "string" || !v.trim() || v.length > maximum || /(?:[A-Za-z]:[\\/]|\\\\|file:\/\/)/i.test(v)) throw new RangeError("文字列またはlocal pathが不正です。");
  return v;
}
function descriptor(v: unknown): WeatherDescriptor {
  const d = record(v), p = record(d.provenance);
  if (p.sourceType !== "epw" && p.sourceType !== "synthetic") throw new RangeError("weather sourceTypeが不正です。");
  if (!["partial", "full-year-8760", "full-leap-year-8784", "full-year-subhour"].includes(String(d.coverage)) || d.validation !== "PASS"
    || !Number.isSafeInteger(d.intervalCount) || (d.intervalCount as number) < 1) throw new RangeError("weather descriptorが不正です。");
  const fingerprint = text(d.fingerprint), temporalFingerprint = text(d.temporalFingerprint);
  if (!/^weather-v1-[a-f0-9]{16}$/.test(fingerprint) || !/^slots-v1-[a-f0-9]{16}$/.test(temporalFingerprint)) throw new RangeError("fingerprint形式が不正です。");
  const provenance: WeatherDescriptor["provenance"] = { sourceType: p.sourceType, sourceName: text(p.sourceName),
    ...(p.sourceReference === undefined ? {} : { sourceReference: text(p.sourceReference) }),
    ...(p.retrievedOn === undefined ? {} : { retrievedOn: text(p.retrievedOn) }),
    ...(p.sourceSha256 === undefined ? {} : { sourceSha256: text(p.sourceSha256) }),
    ...(p.notes === undefined ? {} : { notes: (Array.isArray(p.notes) ? p.notes : []).map(n => text(n, 2048)) }) };
  return { datasetId: text(d.datasetId), fingerprint, temporalFingerprint, coverage: d.coverage as WeatherDescriptor["coverage"],
    intervalCount: d.intervalCount as number, provenance, validation: "PASS" };
}
function byteLength(s: string): number { return [...s].reduce((n, c) => n + (c.codePointAt(0)! <= 127 ? 1 : c.codePointAt(0)! <= 2047 ? 2 : c.codePointAt(0)! <= 65535 ? 3 : 4), 0); }
export function scenarioPreset(input: ScenarioInput, metric: ScenarioMetric): string {
  validateScenario(input);
  const first = input.workspace.cases[0]!;
  const design = input.mode === "single" ? createWorkspacePreset(input.workspace, first.id)
    : createMultiFloorWorkspacePreset(input.workspace, first.id, input.workspace.cases[0]!.floors[0]!.id);
  const value = { kind: KIND, schemaVersion: 1, mode: input.mode, design, referenceId: input.referenceId, metric,
    slots: input.slots.map(s => ({ id: s.id, label: s.label, weather: descriptor(describeWeather(s.dataset)) })) };
  const result = JSON.stringify(value, null, 2) + "\n";
  // Exercise the same canonical validators/whitelists as import.
  parseScenarioPreset(result);
  return result;
}
export function parseScenarioPreset(serialized: string): RestoredScenario {
  if (byteLength(serialized) > MAX_SCENARIO_PRESET_BYTES) throw new RangeError("シナリオJSONは最大256 KBです。");
  const v = record(JSON.parse(serialized));
  if (v.kind !== KIND || v.schemaVersion !== 1 || (v.mode !== "single" && v.mode !== "multi")) throw new RangeError("未対応のシナリオJSONです。");
  // Reject raw-data / result / sensitive payloads rather than retaining unknown fields.
  function forbidden(value: unknown): void {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (/^(?:intervals|result|results|raw|rawEpw|epwBytes|path|localPath|fileHandle|token|auth|secret|credential)$/i.test(key)) throw new RangeError(`入力専用JSONに${key}は保存できません。`);
      forbidden(child);
    }
  }
  forbidden(v);
  let source: ScenarioSource;
  if (v.mode === "single") {
    const p = parseFacadePreset(JSON.stringify(v.design));
    if (p.kind !== WORKSPACE_PRESET_KIND) throw new RangeError("Single workspace presetが必要です。");
    source = { mode: "single", workspace: { cases: p.cases, baselineCaseId: p.baselineCaseId } };
  } else {
    const p = parseMultiFloorPreset(JSON.stringify(v.design));
    if (p.kind !== MULTI_FLOOR_WORKSPACE_PRESET_KIND) throw new RangeError("Multi workspace presetが必要です。");
    source = { mode: "multi", workspace: { cases: p.cases, baselineCaseId: p.baselineCaseId } };
  }
  if (!Array.isArray(v.slots) || v.slots.length < 1 || v.slots.length > 4) throw new RangeError("気象slotは1〜4件です。");
  const slots = v.slots.map(value => { const s = record(value); return { id: text(s.id, 128), label: text(s.label, 120), weather: descriptor(s.weather), status: "UNRESOLVED" as const }; });
  if (slots[0]!.id !== "current" || new Set(slots.map(s => s.id)).size !== slots.length || new Set(slots.map(s => s.weather.fingerprint)).size !== slots.length) throw new RangeError("気象slot ID・fingerprintが不正・重複です。");
  const referenceId = text(v.referenceId);
  if (!slots.some(s => s.id === referenceId) || !METRICS.includes(v.metric as ScenarioMetric)) throw new RangeError("参照気象またはmetricが不正です。");
  return owned({ source, slots, referenceId, metric: v.metric as ScenarioMetric });
}
export function bindScenarioWeather(expected: WeatherDescriptor, dataset: WeatherDataset): WeatherDataset {
  if (describeWeather(dataset).fingerprint !== expected.fingerprint) throw new RangeError("気象fingerprintが一致しません。対応するEPWを再選択してください。無確認では置換しません。");
  return dataset;
}

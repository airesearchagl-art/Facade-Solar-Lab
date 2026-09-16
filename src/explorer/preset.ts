import { createComparisonCase, type ComparisonCase } from "../comparison";
import { CASE_PRESET_KIND, createCasePreset, MAX_PRESET_BYTES, parseFacadePreset } from "../preset";
import { AXES, validateStudyDefinition } from "./sweep";
import type { AxisKey, SweepAxis, SweepDefinition } from "./types";

export const STUDY_PRESET_KIND = "facade-solar-parametric-study";
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RangeError("探索JSONの形式が不正です。");
  return value as Record<string, unknown>;
}
function readAxis(value: unknown): SweepAxis {
  const axis = record(value);
  if (!AXES.some(item => item.key === axis.key) || ![axis.min, axis.max, axis.step].every(item => typeof item === "number" && Number.isFinite(item))) throw new RangeError("探索軸が不正です。");
  return { key: axis.key as AxisKey, min: axis.min as number, max: axis.max as number, step: axis.step as number };
}
export function studyPreset(source: ComparisonCase, sweep: SweepDefinition): string {
  validateStudyDefinition(source, sweep);
  return JSON.stringify({ kind: STUDY_PRESET_KIND, schemaVersion: 1, source: createCasePreset(source), sweep: { a: readAxis(sweep.a), ...(sweep.b ? { b: readAxis(sweep.b) } : {}) } }, null, 2) + "\n";
}
export function parseStudyPreset(text: string): { source: ComparisonCase; sweep: SweepDefinition } {
  const bytes = [...text].reduce((sum, char) => sum + (char.codePointAt(0)! <= 0x7f ? 1 : char.codePointAt(0)! <= 0x7ff ? 2 : char.codePointAt(0)! <= 0xffff ? 3 : 4), 0);
  if (bytes > MAX_PRESET_BYTES) throw new RangeError("探索JSONは最大256 KBです。");
  const input = record(JSON.parse(text));
  if (input.kind !== STUDY_PRESET_KIND || input.schemaVersion !== 1) throw new RangeError("未対応の探索JSONです。");
  const parsed = parseFacadePreset(JSON.stringify(input.source));
  if (parsed.kind !== CASE_PRESET_KIND) throw new RangeError("探索JSONには単一案の入力だけを指定してください。");
  const source = createComparisonCase("imported-study-source", parsed.name, parsed.parameters);
  const axes = record(input.sweep);
  const sweep = { a: readAxis(axes.a), ...(axes.b === undefined ? {} : { b: readAxis(axes.b) }) };
  validateStudyDefinition(source, sweep);
  return { source, sweep };
}

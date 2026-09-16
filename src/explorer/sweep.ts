import { cloneFacadeV1Parameters, validateComparisonCase, type ComparisonCase } from "../comparison";
import type { FacadeV2Parameters } from "../engine/facade-v2";
import { MAX_STUDY_CANDIDATES, type AxisKey, type CandidateInput, type SweepAxis, type SweepDefinition } from "./types";

type StarterRange = Omit<SweepAxis, "key">;
const SCALE = 1_000_000;
const fixedRange = (min: number, max: number, step: number) => (): StarterRange => ({ min, max, step });
// Only generated recommendations are quantized. Manual input still uses strict decimalUnits validation.
function latticeRange(min: number, max: number, step: number): StarterRange {
  if (![min, max, step].every(Number.isSafeInteger) || max < min) return { min: NaN, max: NaN, step: step / SCALE };
  return { min: min / SCALE, max: max / SCALE, step: step / SCALE };
}
function around(value: number, lower = -Number.MAX_SAFE_INTEGER, upper = Number.MAX_SAFE_INTEGER): StarterRange {
  const center = Math.round(value * SCALE);
  return latticeRange(Math.max(lower, center - 600_000), Math.min(upper, center + 600_000), 200_000);
}
export const AXES: readonly { key: AxisKey; label: string; unit: string; recommended: (source: ComparisonCase) => StarterRange }[] = [
  { key: "overhang.depthM", label: "庇の出", unit: "m", recommended: fixedRange(.8, 2, .2) },
  { key: "overhang.elevationZM", label: "庇高さ", unit: "m", recommended: source => {
    const min = Math.ceil(source.parameters.opening.headZM * SCALE);
    return latticeRange(min, min + 600_000, 100_000);
  } },
  { key: "overhang.leftExtensionM", label: "庇・左側延長", unit: "m", recommended: fixedRange(0, 1.5, .25) },
  { key: "overhang.rightExtensionM", label: "庇・右側延長", unit: "m", recommended: fixedRange(0, 1.5, .25) },
  { key: "intermediateFins.depthM", label: "中間フィンの出", unit: "m", recommended: fixedRange(0, 1.2, .2) },
  { key: "intermediateFins.layout.pitchM", label: "中間フィン中心ピッチ", unit: "m", recommended: fixedRange(.5, 3, .5) },
  { key: "intermediateFins.layout.count", label: "中間フィン枚数", unit: "枚", recommended: fixedRange(1, 8, 1) },
  { key: "leftFin.depthM", label: "左端部フィンの出", unit: "m", recommended: fixedRange(0, 1.2, .2) },
  { key: "rightFin.depthM", label: "右端部フィンの出", unit: "m", recommended: fixedRange(0, 1.2, .2) },
  { key: "opening.widthM", label: "開口幅", unit: "m", recommended: source => around(source.parameters.opening.widthM, 1) },
  { key: "opening.sillZM", label: "開口下端", unit: "m", recommended: source => around(source.parameters.opening.sillZM, -Number.MAX_SAFE_INTEGER, Math.ceil(source.parameters.opening.headZM * SCALE) - 1) },
  { key: "opening.headZM", label: "開口上端", unit: "m", recommended: source => around(source.parameters.opening.headZM, Math.floor(source.parameters.opening.sillZM * SCALE) + 1) },
  { key: "facadeAzimuthDegFromNorth", label: "方位角（北0・時計回り）", unit: "°", recommended: fixedRange(0, 315, 45) },
  { key: "solarHeatGainCoefficient", label: "SHGC", unit: "-", recommended: fixedRange(.2, .8, .1) },
  { key: "groundReflectance", label: "地面反射率", unit: "-", recommended: fixedRange(0, .6, .1) },
];
export const axisMetadata = (key: AxisKey) => AXES.find(axis => axis.key === key)!;
export const axisLabel = (key: AxisKey) => axisMetadata(key).label;
/** UI starter ranges, not a validity claim. Never insert shapes or modify the source. */
export function recommendedSweepAxis(source: ComparisonCase, key: AxisKey): SweepAxis {
  return { key, ...axisMetadata(key).recommended(source) };
}
export function recommendedSecondaryAxis(source: ComparisonCase, primary: AxisKey): SweepAxis {
  return recommendedSweepAxis(source, primary === "solarHeatGainCoefficient" ? "facadeAzimuthDegFromNorth" : "solarHeatGainCoefficient");
}

/** Fixed decimal lattice: reject >6 decimals, never silently round an input. */
function decimalUnits(value: number): number {
  const scaled = value * 1_000_000;
  const rounded = Math.round(scaled);
  if (!Number.isFinite(value) || !Number.isSafeInteger(rounded) ||
      Math.abs(scaled - rounded) > 4 * Number.EPSILON * Math.max(1, Math.abs(scaled))) {
    throw new RangeError("範囲には有限値・小数6桁以内・安全な数値範囲を指定してください。");
  }
  return rounded;
}
export function rangeSize(axis: SweepAxis): number {
  if (!AXES.some(item => item.key === axis.key)) throw new RangeError("未対応の探索パラメータです。");
  const min = decimalUnits(axis.min), max = decimalUnits(axis.max), step = decimalUnits(axis.step);
  if (step <= 0 || max < min || !Number.isSafeInteger(max - min)) throw new RangeError("step > 0、max >= minの範囲が必要です。");
  if (axis.key === "intermediateFins.layout.count" && ![axis.min, axis.max, axis.step].every(Number.isSafeInteger)) throw new RangeError("枚数軸はmin / max / stepすべて整数にしてください。");
  const count = Math.floor((max - min) / step) + 1;
  if (!Number.isSafeInteger(count)) throw new RangeError("範囲が大きすぎます。");
  return count;
}
export function axisValues(axis: SweepAxis): readonly number[] {
  const count = rangeSize(axis);
  if (count > MAX_STUDY_CANDIDATES) throw new RangeError(`候補数${count} / 最大${MAX_STUDY_CANDIDATES}。stepを大きくしてください。切り捨ては行いません。`);
  const min = decimalUnits(axis.min), step = decimalUnits(axis.step);
  return Array.from({ length: count }, (_, index) => (min + index * step) / 1_000_000);
}
export function candidateCount(sweep: SweepDefinition): number {
  if (sweep.b?.key === sweep.a.key) throw new RangeError("Axis A / Bに同じパラメータは指定できません。");
  const count = rangeSize(sweep.a) * (sweep.b ? rangeSize(sweep.b) : 1);
  if (!Number.isSafeInteger(count)) throw new RangeError("候補数が大きすぎます。");
  return count;
}
export function requireAxisAvailable(parameters: FacadeV2Parameters, key: AxisKey): void {
  if (key.startsWith("overhang.") && !parameters.overhang) throw new RangeError("水平庇を有効にしてから探索してください。");
  if (key.startsWith("leftFin.") && !parameters.leftFin) throw new RangeError("左端部フィンを有効にしてから探索してください。");
  if (key.startsWith("rightFin.") && !parameters.rightFin) throw new RangeError("右端部フィンを有効にしてから探索してください。");
  if (key.startsWith("intermediateFins.") && !parameters.intermediateFins) throw new RangeError("中間フィンを有効にしてから探索してください。");
  if (key === "intermediateFins.layout.pitchM" && parameters.intermediateFins?.layout.mode !== "pitch") throw new RangeError("元の案の中間フィンをピッチ指定にしてから探索してください。");
  if (key === "intermediateFins.layout.count" && parameters.intermediateFins?.layout.mode !== "count") throw new RangeError("元の案の中間フィンを枚数指定にしてから探索してください。");
}
export function validateStudyDefinition(source: ComparisonCase, sweep: SweepDefinition): number {
  const issues = validateComparisonCase(source);
  if (issues.length) throw new RangeError(`元の案を修正してください: ${issues.map(item => item.message).join(" / ")}`);
  const count = candidateCount(sweep);
  if (count > MAX_STUDY_CANDIDATES) throw new RangeError(`候補数: ${count} / 最大${MAX_STUDY_CANDIDATES}。stepを大きくしてください。切り捨ては行いません。`);
  requireAxisAvailable(source.parameters, sweep.a.key);
  if (sweep.b) requireAxisAvailable(source.parameters, sweep.b.key);
  return count;
}
export function parameterValue(parameters: FacadeV2Parameters, key: AxisKey): number {
  requireAxisAvailable(parameters, key);
  return key.split(".").reduce<unknown>((item, part) => (item as Record<string, unknown>)[part], parameters) as number;
}
/** Assign only an allowlisted, existing field on a deep clone. No shape insertion. */
export function applyAxis(parameters: FacadeV2Parameters, key: AxisKey, value: number): FacadeV2Parameters {
  if (!AXES.some(axis => axis.key === key)) throw new RangeError("未対応の探索パラメータです。");
  requireAxisAvailable(parameters, key);
  const next = cloneFacadeV1Parameters(parameters);
  const parts = key.split(".");
  let target = next as unknown as Record<string, unknown>;
  for (const part of parts.slice(0, -1)) target = target[part] as Record<string, unknown>;
  target[parts.at(-1)!] = value;
  return next;
}
export function generateCandidates(source: ComparisonCase, sweep: SweepDefinition): readonly CandidateInput[] {
  validateStudyDefinition(source, sweep);
  const aValues = axisValues(sweep.a), bValues = sweep.b ? axisValues(sweep.b) : [undefined];
  return bValues.flatMap((b, indexB) => aValues.map((a, indexA) => {
    let parameters = applyAxis(source.parameters, sweep.a.key, a);
    if (sweep.b && b !== undefined) parameters = applyAxis(parameters, sweep.b.key, b);
    return { id: `candidate-${indexB + 1}-${indexA + 1}`, indexA, indexB, a, ...(b === undefined ? {} : { b }), parameters };
  }));
}

import { validateVerticalFin, type VerticalFins } from "../geometry/facade-v2";

export interface ShadingPresetVersion {
  readonly schemaVersion: 1 | 2;
  readonly geometryVersion?: "facade-v2";
}
/** Keep overhang-only files byte/schema compatible; fin-bearing files require v2. */
export function shadingPresetVersion(inputs: readonly VerticalFins[]): ShadingPresetVersion {
  return inputs.some((input) => input.leftFin !== undefined || input.rightFin !== undefined)
    ? { schemaVersion: 2, geometryVersion: "facade-v2" }
    : { schemaVersion: 1 };
}
export function readShadingPresetVersion(record: Record<string, unknown>, ErrorType: new (message: string) => Error): ShadingPresetVersion {
  if (record.schemaVersion === 1) return { schemaVersion: 1 };
  if (record.schemaVersion === 2 && record.geometryVersion === "facade-v2") return { schemaVersion: 2, geometryVersion: "facade-v2" };
  throw new ErrorType("対応していないschemaVersion / geometryVersionです。");
}
export function readPresetFins(record: Record<string, unknown>, version: 1 | 2, ErrorType: new (message: string) => Error): VerticalFins {
  const result: { leftFin?: VerticalFins["leftFin"]; rightFin?: VerticalFins["rightFin"] } = {};
  for (const key of ["leftFin", "rightFin"] as const) {
    const value = record[key];
    if (value === undefined) continue;
    if (version !== 2) throw new ErrorType("フィンにはschemaVersion 2 / geometryVersion facade-v2が必要です。");
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new ErrorType(`${key}が不正です。`);
    const fields = value as Record<string, unknown>;
    if (![fields.depthM, fields.bottomZM, fields.topZM].every((field) => typeof field === "number" && Number.isFinite(field))) throw new ErrorType(`${key}には有限の数値が必要です。`);
    const fin = { depthM: fields.depthM as number, bottomZM: fields.bottomZM as number, topZM: fields.topZM as number };
    try { validateVerticalFin(fin); } catch { throw new ErrorType(`${key}の出・上端・下端が不正です。`); }
    result[key] = fin;
  }
  return result;
}

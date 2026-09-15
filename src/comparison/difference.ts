import { normalizeAzimuthDeg } from "../geometry";
import type { ComparisonCase, InputDifference, InputDifferenceValue } from "./types";

function appendNumber(
  differences: InputDifference[],
  key: string,
  label: string,
  baselineValue: number,
  caseValue: number,
  unit?: "m" | "°",
): void {
  if (Object.is(baselineValue, caseValue)) return;
  differences.push({
    key,
    label,
    baselineValue,
    caseValue,
    ...(unit === undefined ? {} : { unit }),
  });
}

export function comparisonInputDifferences(
  baseline: ComparisonCase,
  selected: ComparisonCase,
): readonly InputDifference[] {
  const differences: InputDifference[] = [];
  const before = baseline.parameters;
  const after = selected.parameters;
  appendNumber(
    differences,
    "facadeAzimuthDegFromNorth",
    "ファサード方位角",
    normalizeAzimuthDeg(before.facadeAzimuthDegFromNorth),
    normalizeAzimuthDeg(after.facadeAzimuthDegFromNorth),
    "°",
  );
  appendNumber(differences, "opening.widthM", "開口幅", before.opening.widthM, after.opening.widthM, "m");
  appendNumber(differences, "opening.sillZM", "開口下端高さ", before.opening.sillZM, after.opening.sillZM, "m");
  appendNumber(differences, "opening.headZM", "開口上端高さ", before.opening.headZM, after.opening.headZM, "m");

  const beforeEnabled = before.overhang !== undefined;
  const afterEnabled = after.overhang !== undefined;
  if (beforeEnabled !== afterEnabled) {
    differences.push({
      key: "overhang.enabled",
      label: "水平庇",
      baselineValue: beforeEnabled,
      caseValue: afterEnabled,
    });
  } else if (before.overhang !== undefined && after.overhang !== undefined) {
    appendNumber(differences, "overhang.depthM", "庇の出", before.overhang.depthM, after.overhang.depthM, "m");
    appendNumber(differences, "overhang.elevationZM", "庇高さ", before.overhang.elevationZM, after.overhang.elevationZM, "m");
    appendNumber(differences, "overhang.leftExtensionM", "左側の張り出し", before.overhang.leftExtensionM, after.overhang.leftExtensionM, "m");
    appendNumber(differences, "overhang.rightExtensionM", "右側の張り出し", before.overhang.rightExtensionM, after.overhang.rightExtensionM, "m");
  }
  appendNumber(differences, "solarHeatGainCoefficient", "SHGC", before.solarHeatGainCoefficient, after.solarHeatGainCoefficient);
  for (const key of ["leftFin", "rightFin"] as const) {
    const left = before[key];
    const right = after[key];
    const label = key === "leftFin" ? "左フィン" : "右フィン";
    if ((left !== undefined) !== (right !== undefined)) differences.push({ key: `${key}.enabled`, label, baselineValue: left !== undefined, caseValue: right !== undefined });
    if (left !== undefined || right !== undefined) {
      for (const [field, suffix] of [["depthM", "出"], ["bottomZM", "下端"], ["topZM", "上端"]] as const) {
        if (left === undefined || right === undefined) differences.push({ key: `${key}.${field}`, label: `${label} ${suffix}`, baselineValue: left?.[field] ?? "—", caseValue: right?.[field] ?? "—", unit: "m" });
        else appendNumber(differences, `${key}.${field}`, `${label} ${suffix}`, left[field], right[field], "m");
      }
    }
  }
  appendNumber(differences, "groundReflectance", "地面反射率", before.groundReflectance, after.groundReflectance);
  const a = before.intermediateFins, b = after.intermediateFins;
  const add = (key: string, label: string, baselineValue: InputDifferenceValue, caseValue: InputDifferenceValue, unit?: "m") => {
    if (!Object.is(baselineValue, caseValue)) differences.push({ key: `intermediateFins.${key}`, label: `中間フィン ${label}`, baselineValue, caseValue, ...(unit ? { unit } : {}) });
  };
  add("enabled", "あり/なし", a !== undefined, b !== undefined);
  add("layout.mode", "配置方式", a ? a.layout.mode === "pitch" ? "ピッチ指定" : "枚数指定" : "—", b ? b.layout.mode === "pitch" ? "ピッチ指定" : "枚数指定" : "—");
  add("layout.pitchM", "指定中心ピッチ", a?.layout.mode === "pitch" ? a.layout.pitchM : "—", b?.layout.mode === "pitch" ? b.layout.pitchM : "—", "m");
  add("layout.count", "指定枚数", a?.layout.mode === "count" ? a.layout.count : "—", b?.layout.mode === "count" ? b.layout.count : "—");
  for (const [field, label] of [["depthM", "出"], ["bottomZM", "下端"], ["topZM", "上端"]] as const) add(field, label, a?.[field] ?? "—", b?.[field] ?? "—", "m");
  return differences;
}

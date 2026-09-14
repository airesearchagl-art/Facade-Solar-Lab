import { normalizeAzimuthDeg } from "../geometry";
import type { ComparisonCase, InputDifference } from "./types";

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
  appendNumber(differences, "groundReflectance", "地面反射率", before.groundReflectance, after.groundReflectance);
  return differences;
}

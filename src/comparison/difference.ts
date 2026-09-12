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
    "Facade azimuth",
    normalizeAzimuthDeg(before.facadeAzimuthDegFromNorth),
    normalizeAzimuthDeg(after.facadeAzimuthDegFromNorth),
    "°",
  );
  appendNumber(differences, "opening.widthM", "Opening width", before.opening.widthM, after.opening.widthM, "m");
  appendNumber(differences, "opening.sillZM", "Sill elevation", before.opening.sillZM, after.opening.sillZM, "m");
  appendNumber(differences, "opening.headZM", "Head elevation", before.opening.headZM, after.opening.headZM, "m");

  const beforeEnabled = before.overhang !== undefined;
  const afterEnabled = after.overhang !== undefined;
  if (beforeEnabled !== afterEnabled) {
    differences.push({
      key: "overhang.enabled",
      label: "Overhang",
      baselineValue: beforeEnabled,
      caseValue: afterEnabled,
    });
  } else if (before.overhang !== undefined && after.overhang !== undefined) {
    appendNumber(differences, "overhang.depthM", "Overhang depth", before.overhang.depthM, after.overhang.depthM, "m");
    appendNumber(differences, "overhang.elevationZM", "Overhang elevation", before.overhang.elevationZM, after.overhang.elevationZM, "m");
    appendNumber(differences, "overhang.leftExtensionM", "Left extension", before.overhang.leftExtensionM, after.overhang.leftExtensionM, "m");
    appendNumber(differences, "overhang.rightExtensionM", "Right extension", before.overhang.rightExtensionM, after.overhang.rightExtensionM, "m");
  }
  appendNumber(differences, "solarHeatGainCoefficient", "SHGC", before.solarHeatGainCoefficient, after.solarHeatGainCoefficient);
  appendNumber(differences, "groundReflectance", "Ground reflectance", before.groundReflectance, after.groundReflectance);
  return differences;
}

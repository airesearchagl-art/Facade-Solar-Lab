import {
  addComparisonCase,
  createComparisonCase,
  createComparisonWorkspace,
  type ComparisonWorkspace,
} from "../comparison";
import type { FacadeV1Parameters } from "../engine";

export const DEMO_BASELINE_PARAMETERS: FacadeV1Parameters = Object.freeze({
  facadeAzimuthDegFromNorth: 180,
  opening: Object.freeze({
    centerXM: 0,
    widthM: 6,
    sillZM: 0.9,
    headZM: 3.3,
  }),
  overhang: Object.freeze({
    depthM: 0.8,
    elevationZM: 3.6,
    leftExtensionM: 0.5,
    rightExtensionM: 0.5,
  }),
  solarHeatGainCoefficient: 0.5,
  groundReflectance: 0.2,
});

export const DEMO_DEEPER_OVERHANG_PARAMETERS: FacadeV1Parameters = Object.freeze({
  ...DEMO_BASELINE_PARAMETERS,
  opening: Object.freeze({ ...DEMO_BASELINE_PARAMETERS.opening }),
  overhang: Object.freeze({
    ...DEMO_BASELINE_PARAMETERS.overhang!,
    depthM: 1.6,
  }),
});

export function createDemoComparisonWorkspace(): ComparisonWorkspace {
  const baseline = createComparisonCase(
    "case-a",
    "案A・基準案",
    DEMO_BASELINE_PARAMETERS,
  );
  return addComparisonCase(
    createComparisonWorkspace(baseline),
    createComparisonCase(
      "case-b",
      "案B・庇を深くした案",
      DEMO_DEEPER_OVERHANG_PARAMETERS,
    ),
  );
}

/** Separate synthetic comparison, keeping the established overhang demo intact. */
export function createFinArrayDemoWorkspace(): ComparisonWorkspace {
  const cases = [undefined, 2, 1].map((pitchM, i) => createComparisonCase(`case-${["a","b","c"][i]}`, ["案A・中間フィンなし", "案B・中心ピッチ2m", "案C・中心ピッチ1m"][i]!, {
    ...DEMO_BASELINE_PARAMETERS,
    ...(pitchM === undefined ? {} : { intermediateFins: { depthM: .6, bottomZM: .9, topZM: 3.3, layout: { mode: "pitch" as const, pitchM } } }),
  }));
  return { cases, baselineCaseId: cases[0]!.id };
}

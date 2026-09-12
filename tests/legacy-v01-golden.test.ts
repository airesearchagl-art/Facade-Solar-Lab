import { describe, expect, it } from "vitest";

import {
  simulateLegacyV01,
  type LegacyV01Parameters,
  type LegacyV01SimulationResult,
} from "../src/engine";
import fixture from "./fixtures/legacy-v01-golden.json";

const ABSOLUTE_TOLERANCE = 1e-9;

interface ReferenceParameters {
  readonly H: number;
  readonly D: number;
  readonly O: number;
  readonly W: number;
  readonly lat: number;
  readonly surfAz: number;
  readonly eta: number;
  readonly rho: number;
  readonly sky: number;
}

interface ReferencePeriodSummary {
  readonly w: number;
  readonly n: number;
  readonly cut: number;
}

interface ReferenceCase {
  readonly id: string;
  readonly parameters: ReferenceParameters;
  readonly monthly: readonly { readonly withOH: number; readonly noOH: number }[];
  readonly summary: {
    readonly year: ReferencePeriodSummary;
    readonly cool: ReferencePeriodSummary;
    readonly heat: ReferencePeriodSummary;
  };
}

const referenceCases = fixture.cases as readonly ReferenceCase[];

function mapParameters(parameters: ReferenceParameters): LegacyV01Parameters {
  return {
    windowHeightM: parameters.H,
    overhangDepthM: parameters.D,
    overhangToWindowHeadM: parameters.O,
    windowWidthM: parameters.W,
    latitudeDeg: parameters.lat,
    surfaceAzimuthDeg: parameters.surfAz,
    solarHeatGainCoefficient: parameters.eta,
    groundReflectance: parameters.rho,
    legacySkyFactor: parameters.sky,
  };
}

function findReferenceCase(id: string): ReferenceCase {
  const found = referenceCases.find((candidate) => candidate.id === id);
  if (!found) {
    throw new Error(`Missing reference case: ${id}`);
  }
  return found;
}

function runCase(id: string): LegacyV01SimulationResult {
  return simulateLegacyV01(mapParameters(findReferenceCase(id).parameters));
}

function expectWithinTolerance(actual: number, expected: number, label: string): void {
  const difference = Math.abs(actual - expected);
  if (difference > ABSOLUTE_TOLERANCE) {
    throw new Error(
      `${label}: expected ${expected}, received ${actual}, absolute difference ${difference}`,
    );
  }
}

function comparePeriod(
  actual: { withOverhangKWh: number; withoutOverhangKWh: number; reductionPercent: number },
  expected: ReferencePeriodSummary,
  label: string,
): void {
  expectWithinTolerance(actual.withOverhangKWh, expected.w, `${label}.withOverhangKWh`);
  expectWithinTolerance(actual.withoutOverhangKWh, expected.n, `${label}.withoutOverhangKWh`);
  expectWithinTolerance(actual.reductionPercent, expected.cut, `${label}.reductionPercent`);
}

describe("legacy v0.1 Golden baseline", () => {
  for (const referenceCase of referenceCases) {
    it(`${referenceCase.id} matches every monthly and summary value`, () => {
      const actual = simulateLegacyV01(mapParameters(referenceCase.parameters));
      expect(actual.monthly).toHaveLength(12);
      referenceCase.monthly.forEach((expectedMonth, monthIndex) => {
        const actualMonth = actual.monthly[monthIndex]!;
        expectWithinTolerance(
          actualMonth.withOverhangKWh,
          expectedMonth.withOH,
          `${referenceCase.id}.month[${monthIndex}].withOverhangKWh`,
        );
        expectWithinTolerance(
          actualMonth.withoutOverhangKWh,
          expectedMonth.noOH,
          `${referenceCase.id}.month[${monthIndex}].withoutOverhangKWh`,
        );
      });
      comparePeriod(actual.summary.annual, referenceCase.summary.year, `${referenceCase.id}.annual`);
      comparePeriod(actual.summary.cooling, referenceCase.summary.cool, `${referenceCase.id}.cooling`);
      comparePeriod(actual.summary.heating, referenceCase.summary.heat, `${referenceCase.id}.heating`);
    });
  }

  it("G2 produces zero reduction with no overhang", () => {
    const result = runCase("G2_NO_OVERHANG");
    for (const month of result.monthly) {
      expectWithinTolerance(month.withOverhangKWh, month.withoutOverhangKWh, "G2 monthly");
    }
    expect(result.summary.annual.reductionPercent).toBe(0);
    expect(result.summary.cooling.reductionPercent).toBe(0);
    expect(result.summary.heating.reductionPercent).toBe(0);
  });

  it("G3 preserves legacy azimuth symmetry", () => {
    const negative = runCase("G3_AZIMUTH_NEGATIVE_30");
    const positive = runCase("G3_AZIMUTH_POSITIVE_30");
    negative.monthly.forEach((month, monthIndex) => {
      expectWithinTolerance(
        month.withOverhangKWh,
        positive.monthly[monthIndex]!.withOverhangKWh,
        `G3 month[${monthIndex}].withOverhangKWh`,
      );
      expectWithinTolerance(
        month.withoutOverhangKWh,
        positive.monthly[monthIndex]!.withoutOverhangKWh,
        `G3 month[${monthIndex}].withoutOverhangKWh`,
      );
    });
  });

  it("G4 scales absolute values with width and preserves reduction", () => {
    const baseline = runCase("G1_DEFAULT");
    const halfWidth = runCase("G4_WIDTH_HALF");
    expectWithinTolerance(
      halfWidth.summary.annual.withOverhangKWh,
      baseline.summary.annual.withOverhangKWh / 2,
      "G4 annual with-overhang scaling",
    );
    expectWithinTolerance(
      halfWidth.summary.annual.withoutOverhangKWh,
      baseline.summary.annual.withoutOverhangKWh / 2,
      "G4 annual without-overhang scaling",
    );
    expectWithinTolerance(
      halfWidth.summary.annual.reductionPercent,
      baseline.summary.annual.reductionPercent,
      "G4 annual reduction",
    );
  });

  it("G5 scales absolute values with eta and preserves reduction", () => {
    const baseline = runCase("G1_DEFAULT");
    const halfEta = runCase("G5_ETA_HALF");
    expectWithinTolerance(
      halfEta.summary.annual.withOverhangKWh,
      baseline.summary.annual.withOverhangKWh / 2,
      "G5 annual with-overhang scaling",
    );
    expectWithinTolerance(
      halfEta.summary.annual.withoutOverhangKWh,
      baseline.summary.annual.withoutOverhangKWh / 2,
      "G5 annual without-overhang scaling",
    );
    expectWithinTolerance(
      halfEta.summary.annual.reductionPercent,
      baseline.summary.annual.reductionPercent,
      "G5 annual reduction",
    );
  });

  it("G6 requires both D/H and O/H for geometric similarity", () => {
    const baseline = runCase("G1_DEFAULT");
    const similar = runCase("G6_DH_OH_SIMILARITY_HALF_HEIGHT");
    const fixedOffset = runCase("G6_DH_ONLY_FIXED_O_UNSCALED");

    for (const period of ["annual", "cooling", "heating"] as const) {
      expectWithinTolerance(
        similar.summary[period].reductionPercent,
        baseline.summary[period].reductionPercent,
        `G6 ${period} similarity`,
      );
    }
    expectWithinTolerance(
      similar.summary.annual.withOverhangKWh,
      baseline.summary.annual.withOverhangKWh / 2,
      "G6 similar annual area scaling",
    );
    expect(fixedOffset.summary.annual.reductionPercent).not.toBeCloseTo(
      baseline.summary.annual.reductionPercent,
      6,
    );
  });
});

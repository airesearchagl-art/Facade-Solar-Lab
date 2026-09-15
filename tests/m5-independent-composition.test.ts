import { describe, expect, it } from "vitest";
import { simulateFacadeV1, type FacadeV1Parameters } from "../src/engine";
import { runMultiFloorComparison } from "../src/multifloor";
import { independentCase, syntheticYear } from "../scripts/validation/m5-completion/fixtures";

const full = syntheticYear();
const weather = { ...full, coverage: "partial" as const, intervals: full.intervals.filter(i => i.time.day === 21 && i.time.rawHour >= 9 && i.time.rawHour <= 15) };
describe("M5 independent Single/Multi composition", () => {
  it.each([1, 3, 5])("matches independently built Singles with %i floors, both baselines", floorCount => {
    const cases = [independentCase(floorCount, 0), independentCase(floorCount, 1)];
    const singles = cases.map(item => item.floors.map(floor => {
      // Floor-local calculation contract; absolute building datum is visualization only.
      // Intentionally no floorToFacadeV1Parameters / Multi creation helper.
      const input: FacadeV1Parameters = {
        facadeAzimuthDegFromNorth: item.facadeAzimuthDegFromNorth,
        opening: { centerXM: floor.opening.centerXM, widthM: floor.opening.widthM, sillZM: 0.6, headZM: 0.6 + floor.opening.heightM },
        ...(floor.overhang ? { overhang: { depthM: floor.overhang.depthM, elevationZM: 3.2, leftExtensionM: 0.2, rightExtensionM: 0.7 } } : {}),
        solarHeatGainCoefficient: floor.solarHeatGainCoefficient, groundReflectance: item.groundReflectance,
      };
      return simulateFacadeV1(weather, input);
    }));
    const expected = singles.map(results => ({
      annualKWh: results.reduce((s, r) => s + r.summary.annual.withOverhangKWh, 0),
      summerKWh: results.reduce((s, r) => s + r.summary.cooling.withOverhangKWh, 0),
      winterKWh: results.reduce((s, r) => s + r.summary.heating.withOverhangKWh, 0),
      monthlyKWh: Array.from({ length: 12 }, (_, m) => results.reduce((s, r) => s + r.monthly[m]!.withOverhangKWh, 0)),
    }));
    for (const baselineIndex of [0, 1]) {
      const result = runMultiFloorComparison(weather, { cases, baselineCaseId: cases[baselineIndex]!.id });
      result.cases.forEach((item, c) => {
        item.floors.forEach((floor, f) => {
          expect(floor.simulation.monthly).toEqual(singles[c]![f]!.monthly);
          expect(floor.simulation.summary).toEqual(singles[c]![f]!.summary);
          expect(floor.absoluteBaseZM).toBe(cases[c]!.floors.slice(0, f).reduce((s, v) => s + v.floorHeightM, 0));
        });
        expect(item.total).toEqual(expected[c]);
        const delta = (value: number, base: number) => ({ kWh: value - base, percent: base === 0 ? null : (value - base) / base * 100 });
        expect(item.deltaFromBaseline.annual).toEqual(delta(expected[c]!.annualKWh, expected[baselineIndex]!.annualKWh));
        expect(item.deltaFromBaseline.summer).toEqual(delta(expected[c]!.summerKWh, expected[baselineIndex]!.summerKWh));
        expect(item.deltaFromBaseline.winter).toEqual(delta(expected[c]!.winterKWh, expected[baselineIndex]!.winterKWh));
        expect(item.deltaFromBaseline.monthly).toEqual(expected[c]!.monthlyKWh.map((value, m) => ({ month: m + 1, ...delta(value, expected[baselineIndex]!.monthlyKWh[m]!) })));
      });
    }
  });
});

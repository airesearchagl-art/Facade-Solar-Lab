import { calculateSolarPosition, simulateFacadeV1 } from "../../../src/engine";
import { runMultiFloorComparison } from "../../../src/multifloor";
import { independentCase, parameters, syntheticYear } from "./fixtures";

export function timezoneProbe() {
  const positions = [0, 70, -70].flatMap(latitudeDeg => [0, 9, -5].flatMap(timeZoneOffsetHours =>
    [[2024, 2, 29], [2024, 12, 31], [2025, 6, 21], [2025, 12, 21]].map(([year, month, day]) => calculateSolarPosition({
      location: { latitudeDeg, longitudeDeg: 139, timeZoneOffsetHours }, localStandardTime: { year: year!, month: month!, day: day!, minuteOfDay: 720 },
    })),
  ));
  return { positions, annual: simulateFacadeV1(syntheticYear(2024), parameters).summary };
}

export function timeStepProbe(step: number) {
  const data = syntheticYear(2025, step);
  const isolated = (component: "directNormalWhPerM2" | "diffuseHorizontalWhPerM2" | "globalHorizontalWhPerM2") => ({ ...data, intervals: data.intervals.map(interval => ({ ...interval, radiation: { directNormalWhPerM2: 0, diffuseHorizontalWhPerM2: 0, globalHorizontalWhPerM2: 0, [component]: interval.radiation[component] } })) });
  return {
    stepMinutes: step, intervalCount: data.intervals.length,
    direct: simulateFacadeV1(isolated("directNormalWhPerM2"), parameters).summary.annual,
    diffuse: simulateFacadeV1(isolated("diffuseHorizontalWhPerM2"), parameters).summary.annual,
    ground: simulateFacadeV1(isolated("globalHorizontalWhPerM2"), parameters).summary.annual,
  };
}

export function workload(floors: number, count: number, year: number, step: number) {
  const dataset = syntheticYear(year, step);
  const cases = Array.from({ length: count }, (_, i) => independentCase(floors, i));
  return { intervalCount: dataset.intervals.length, run: () => runMultiFloorComparison(dataset, { cases, baselineCaseId: cases[0]!.id }) };
}

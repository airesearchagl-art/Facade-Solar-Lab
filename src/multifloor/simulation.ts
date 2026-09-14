import { simulateFacadeV1 } from "../engine/facade-v1";
import type { WeatherDataset } from "../weather";
import { floorToFacadeV1Parameters } from "./parameters";
import type {
  MultiFloorBuildingDelta,
  MultiFloorBuildingSummary,
  MultiFloorCase,
  MultiFloorCaseResult,
  MultiFloorDefinition,
  MultiFloorFloorResult,
  MultiFloorPeriodDelta,
  MultiFloorRunResult,
  MultiFloorWorkspace,
} from "./types";
import { assertMultiFloorWorkspaceValid } from "./validation";

function sum(values: readonly number[]): number {
  if (values.length === 1) return values[0]!;
  let total = 0;
  for (const value of values) total += value;
  return total;
}

export function aggregateMultiFloorResults(
  floors: readonly MultiFloorFloorResult[],
): MultiFloorBuildingSummary {
  if (floors.length === 0) throw new RangeError("Building aggregation requires at least one floor");
  for (const floor of floors) {
    if (floor.simulation.monthly.length !== 12) {
      throw new RangeError("Each floor requires twelve monthly values");
    }
  }
  return {
    annualKWh: sum(floors.map((floor) => floor.simulation.summary.annual.withOverhangKWh)),
    summerKWh: sum(floors.map((floor) => floor.simulation.summary.cooling.withOverhangKWh)),
    winterKWh: sum(floors.map((floor) => floor.simulation.summary.heating.withOverhangKWh)),
    monthlyKWh: Array.from({ length: 12 }, (_, monthIndex) =>
      sum(floors.map((floor) => floor.simulation.monthly[monthIndex]!.withOverhangKWh)),
    ),
  };
}

export function calculateMultiFloorDelta(
  valueKWh: number,
  baselineKWh: number,
): MultiFloorPeriodDelta {
  return {
    kWh: valueKWh - baselineKWh,
    percent: baselineKWh === 0 ? null : ((valueKWh - baselineKWh) / baselineKWh) * 100,
  };
}

function buildingDelta(
  value: MultiFloorBuildingSummary,
  baseline: MultiFloorBuildingSummary,
): MultiFloorBuildingDelta {
  if (value.monthlyKWh.length !== 12 || baseline.monthlyKWh.length !== 12) {
    throw new RangeError("Building comparison requires twelve aligned monthly values");
  }
  return {
    annual: calculateMultiFloorDelta(value.annualKWh, baseline.annualKWh),
    summer: calculateMultiFloorDelta(value.summerKWh, baseline.summerKWh),
    winter: calculateMultiFloorDelta(value.winterKWh, baseline.winterKWh),
    monthly: value.monthlyKWh.map((monthValue, index) => ({
      month: index + 1,
      ...calculateMultiFloorDelta(monthValue, baseline.monthlyKWh[index]!),
    })),
  };
}

export function simulateMultiFloorCase(
  dataset: WeatherDataset,
  item: MultiFloorCase,
): Omit<MultiFloorCaseResult, "deltaFromBaseline"> {
  let absoluteBaseZM = 0;
  const floors = item.floors.map((floor): MultiFloorFloorResult => {
    const parameters = floorToFacadeV1Parameters(item, floor);
    const result = {
      floorId: floor.id,
      name: floor.name,
      absoluteBaseZM,
      definition: floor,
      parameters,
      simulation: simulateFacadeV1(dataset, parameters),
    };
    absoluteBaseZM += floor.floorHeightM;
    return result;
  });
  return {
    caseId: item.id,
    name: item.name,
    definition: item,
    floors,
    total: aggregateMultiFloorResults(floors),
  };
}

export function runMultiFloorComparison(
  dataset: WeatherDataset,
  workspace: MultiFloorWorkspace,
): MultiFloorRunResult {
  assertMultiFloorWorkspaceValid(workspace);
  const simulations = workspace.cases.map((item) => simulateMultiFloorCase(dataset, item));
  const baseline = simulations.find((item) => item.caseId === workspace.baselineCaseId);
  if (baseline === undefined) throw new RangeError("Baseline must reference an existing building case");
  return {
    weatherDatasetId: dataset.id,
    baselineCaseId: workspace.baselineCaseId,
    cases: simulations.map((item) => ({
      ...item,
      deltaFromBaseline: buildingDelta(item.total, baseline.total),
    })),
  };
}

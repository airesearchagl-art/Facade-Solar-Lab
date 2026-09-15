import { simulateFacade, type FacadeSimulationResult } from "../engine/facade-v2";
import type {
  FacadeV1PeriodSummary,
} from "../engine/facade-v1";
import type { WeatherDataset } from "../weather";
import type {
  ComparisonCaseDelta,
  ComparisonPeriodDelta,
  ComparisonRunResult,
  ComparisonWorkspace,
} from "./types";
import { assertComparisonWorkspaceValid } from "./validation";

export function calculateComparisonDelta(
  valueKWh: number,
  baselineKWh: number,
): ComparisonPeriodDelta {
  return {
    kWh: valueKWh - baselineKWh,
    percent:
      baselineKWh === 0
        ? null
        : ((valueKWh - baselineKWh) / baselineKWh) * 100,
  };
}

function periodDelta(
  value: FacadeV1PeriodSummary,
  baseline: FacadeV1PeriodSummary,
): ComparisonPeriodDelta {
  return calculateComparisonDelta(
    value.withOverhangKWh,
    baseline.withOverhangKWh,
  );
}

function comparisonDelta(
  simulation: FacadeSimulationResult,
  baseline: FacadeSimulationResult,
): ComparisonCaseDelta {
  if (simulation.monthly.length !== 12 || baseline.monthly.length !== 12) {
    throw new RangeError("Comparison requires twelve aligned monthly values");
  }
  const monthly = simulation.monthly.map((item, index) => {
    const baselineItem = baseline.monthly[index]!;
    if (item.month !== index + 1 || baselineItem.month !== item.month) {
      throw new RangeError("Comparison monthly values are not aligned to months 1–12");
    }
    return {
      month: item.month,
      ...calculateComparisonDelta(
        item.withOverhangKWh,
        baselineItem.withOverhangKWh,
      ),
    };
  });
  return {
    annual: periodDelta(simulation.summary.annual, baseline.summary.annual),
    cooling: periodDelta(simulation.summary.cooling, baseline.summary.cooling),
    heating: periodDelta(simulation.summary.heating, baseline.summary.heating),
    monthly,
  };
}

export function runComparison(
  dataset: WeatherDataset,
  workspace: ComparisonWorkspace,
): ComparisonRunResult {
  assertComparisonWorkspaceValid(workspace);
  const simulations = workspace.cases.map((item) => ({
    item,
    simulation: simulateFacade(dataset, item.parameters),
  }));
  const baseline = simulations.find(
    ({ item }) => item.id === workspace.baselineCaseId,
  );
  if (baseline === undefined) {
    throw new RangeError("Baseline must reference an existing case");
  }
  return {
    weatherDatasetId: dataset.id,
    baselineCaseId: workspace.baselineCaseId,
    cases: simulations.map(({ item, simulation }) => ({
      caseId: item.id,
      name: item.name,
      parameters: item.parameters,
      simulation,
      deltaFromBaseline: comparisonDelta(simulation, baseline.simulation),
    })),
  };
}

import { addComparisonCase, cloneFacadeV1Parameters, createComparisonCase, MAX_COMPARISON_CASES, validateComparisonCase, type ComparisonCase, type ComparisonWorkspace } from "../comparison";
import { simulateFacade } from "../engine/facade-v2";
import { deriveFinLayout } from "../geometry/facade-v2";
import { assertWeatherDatasetUsable, type WeatherDataset } from "../weather";
import { generateCandidates } from "./sweep";
import { CANDIDATE_GENERATION_VERSION, type Metric, type StudyCandidate, type StudyResult, type SweepDefinition } from "./types";

export function freezeDeep<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}
export function studyInputKey(source: ComparisonCase, sweep: SweepDefinition): string {
  return JSON.stringify([source.id, source.name, cloneFacadeV1Parameters(source.parameters), sweep]);
}
/** Pure deterministic calculation; timestamp and optional monotonic clock are supplied by adapters. */
export function runStudy(dataset: WeatherDataset, source: ComparisonCase, sweep: SweepDefinition, executedAt: string,
  progress: (completed: number, total: number, candidate?: StudyCandidate) => void = () => {}, clock: () => number = () => 0): StudyResult {
  assertWeatherDatasetUsable(dataset);
  const inputs = generateCandidates(source, sweep);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(executedAt)) throw new RangeError("実行日時はISO UTC文字列が必要です。");
  const started = clock();
  progress(0, inputs.length);
  const baseline = simulateFacade(dataset, cloneFacadeV1Parameters(source.parameters));
  const snapshot = freezeDeep({
    weatherDatasetId: dataset.id, weatherProvenance: { ...dataset.provenance, ...(dataset.provenance.notes ? { notes: [...dataset.provenance.notes] } : {}) },
    coverage: dataset.coverage, intervalCount: dataset.intervals.length,
    source: { id: source.id, name: source.name, parameters: cloneFacadeV1Parameters(source.parameters) },
    sweep: { a: { ...sweep.a }, ...(sweep.b ? { b: { ...sweep.b } } : {}) }, executedAt,
    generationVersion: CANDIDATE_GENERATION_VERSION,
    modelIds: { modelVersion: baseline.modelVersion, geometryVersion: baseline.geometryVersion, solarPositionAlgorithm: baseline.solarPositionAlgorithm,
      directShadingModel: baseline.directShadingModel, diffuseShadingModel: baseline.diffuseShadingModel, groundReflectionModel: baseline.groundReflectionModel },
  });
  const candidates = inputs.map((input, index): StudyCandidate => {
    const start = clock();
    const issues = validateComparisonCase({ id: input.id, name: input.id, parameters: input.parameters }).map(item => item.message);
    let candidate: StudyCandidate;
    if (issues.length) candidate = { ...input, status: "INVALID", issues, runtimeMs: clock() - start };
    else {
      try {
        const simulation = simulateFacade(dataset, input.parameters);
        const delta = {
          annual: simulation.summary.annual.withOverhangKWh - baseline.summary.annual.withOverhangKWh,
          cooling: simulation.summary.cooling.withOverhangKWh - baseline.summary.cooling.withOverhangKWh,
          heating: simulation.summary.heating.withOverhangKWh - baseline.summary.heating.withOverhangKWh,
        };
        if (!Object.values(delta).every(Number.isFinite)) throw new RangeError("差分が有限値範囲を超えました。");
        candidate = { ...input, status: "VALID", simulation, delta, runtimeMs: clock() - start,
          fins: input.parameters.intermediateFins ? deriveFinLayout(input.parameters.opening.widthM, input.parameters.intermediateFins.layout) : null };
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        candidate = { ...input, status: "INVALID", issues: [error.message], runtimeMs: clock() - start };
      }
    }
    progress(index + 1, inputs.length, candidate);
    return candidate;
  });
  // Engine results may share provenance with the caller. Own the result graph
  // before freezing, without freezing/mutating the input dataset or source case.
  return freezeDeep(cloneResult({ snapshot, baseline, candidates, runtimeMs: clock() - started }));
}
function cloneResult<T>(value: T): T {
  if (Array.isArray(value)) return value.map(cloneResult) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, cloneResult(child)])) as T;
  return value;
}
export function metricValue(candidate: StudyCandidate, metric: Metric): number | null {
  if (candidate.status === "INVALID") return null;
  if (metric === "annualDelta") return candidate.delta.annual;
  if (metric === "coolingDelta") return candidate.delta.cooling;
  if (metric === "heatingDelta") return candidate.delta.heating;
  return candidate.simulation.summary[metric].withOverhangKWh;
}
export function transferCandidate(workspace: ComparisonWorkspace, candidate: StudyCandidate, current: boolean): ComparisonWorkspace {
  if (!current || candidate.status !== "VALID") throw new RangeError("現在の完了済み・有効な候補だけを追加できます。");
  if (workspace.cases.length >= MAX_COMPARISON_CASES) throw new RangeError(`比較案は最大${MAX_COMPARISON_CASES}案です。不要な案を削除してから追加してください。`);
  let sequence = 1;
  while (workspace.cases.some(item => item.id === `explorer-case-${sequence}`)) sequence++;
  return addComparisonCase(workspace, createComparisonCase(`explorer-case-${sequence}`, `探索候補 ${candidate.id} · ${candidate.a}${candidate.b === undefined ? "" : ` / ${candidate.b}`}`, candidate.parameters));
}

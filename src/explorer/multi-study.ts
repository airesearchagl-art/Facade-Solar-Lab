import { addMultiFloorCase, cloneMultiFloorCase, MAX_MULTI_FLOOR_CASES } from "../multifloor/case";
import { runMultiFloorComparison } from "../multifloor/simulation";
import type { MultiFloorCaseResult, MultiFloorWorkspace } from "../multifloor/types";
import { assertWeatherDatasetUsable, type WeatherDataset } from "../weather";
import { freezeDeep } from "./study";
import { generateMultiCandidates, multiIssues, type MultiCandidateInput, type MultiStudyInput } from "./multi-sweep";
import { CANDIDATE_GENERATION_VERSION, type StudyDeltas, type StudySnapshot } from "./types";

export type MultiCandidate = MultiCandidateInput & (
  | { readonly status: "VALID"; readonly result: MultiFloorCaseResult; readonly delta: StudyDeltas; readonly floorDeltas: Readonly<Record<string, StudyDeltas>>; readonly runtimeMs: number }
  | { readonly status: "INVALID"; readonly issues: readonly string[]; readonly runtimeMs: number }
);
export interface MultiStudyResult {
  readonly snapshot: MultiStudyInput & Omit<StudySnapshot, "source" | "modelIds"> & { readonly modelIds: Readonly<Record<string, Readonly<Record<string, string>>>> };
  readonly baseline: MultiFloorCaseResult;
  readonly candidates: readonly MultiCandidate[];
  readonly runtimeMs: number;
}
function owned<T>(value: T): T {
  if (Array.isArray(value)) return value.map(owned) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, owned(child)])) as T;
  return value;
}
export function runMultiStudy(dataset: WeatherDataset, input: MultiStudyInput, executedAt: string,
  progress: (completed: number, total: number, candidate?: MultiCandidate) => void = () => {}, clock: () => number = () => 0): MultiStudyResult {
  assertWeatherDatasetUsable(dataset);
  const inputs = generateMultiCandidates(input);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(executedAt)) throw new RangeError("実行日時はISO UTC文字列が必要です。");
  const started = clock();
  progress(0, inputs.length);
  const baseline = runMultiFloorComparison(dataset, { cases: [input.source], baselineCaseId: input.source.id }).cases[0]!;
  const candidates = inputs.map((candidate, index): MultiCandidate => {
    const start = clock();
    const issues = multiIssues(candidate.definition);
    let completed: MultiCandidate;
    if (issues.length) completed = { ...candidate, status: "INVALID", issues, runtimeMs: clock() - start };
    else {
      try {
        const result = runMultiFloorComparison(dataset, { cases: [candidate.definition], baselineCaseId: candidate.definition.id }).cases[0]!;
        const delta = { annual: result.total.annualKWh - baseline.total.annualKWh, cooling: result.total.summerKWh - baseline.total.summerKWh, heating: result.total.winterKWh - baseline.total.winterKWh };
        const floorDeltas = Object.fromEntries(result.floors.map((floor, i) => [floor.floorId, {
          annual: floor.simulation.summary.annual.withOverhangKWh - baseline.floors[i]!.simulation.summary.annual.withOverhangKWh,
          cooling: floor.simulation.summary.cooling.withOverhangKWh - baseline.floors[i]!.simulation.summary.cooling.withOverhangKWh,
          heating: floor.simulation.summary.heating.withOverhangKWh - baseline.floors[i]!.simulation.summary.heating.withOverhangKWh,
        }]));
        if (![...Object.values(delta), ...Object.values(floorDeltas).flatMap(Object.values)].every(Number.isFinite)) throw new RangeError("差分が有限値範囲を超えました。");
        completed = { ...candidate, status: "VALID", result, delta, floorDeltas, runtimeMs: clock() - start };
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        completed = { ...candidate, status: "INVALID", issues: [`対象階 ${candidate.definition.floors.map(floor => `${floor.name} (${floor.id})`).join(" / ")}: ${error.message}`], runtimeMs: clock() - start };
      }
    }
    progress(index + 1, inputs.length, completed);
    return completed;
  });
  return freezeDeep(owned({ snapshot: { ...input, source: cloneMultiFloorCase(input.source), weatherDatasetId: dataset.id, weatherProvenance: dataset.provenance,
    coverage: dataset.coverage, intervalCount: dataset.intervals.length, executedAt, generationVersion: CANDIDATE_GENERATION_VERSION,
    modelIds: Object.fromEntries(baseline.floors.map(floor => [floor.floorId, { modelVersion: floor.simulation.modelVersion, geometryVersion: floor.simulation.geometryVersion,
      solarPositionAlgorithm: floor.simulation.solarPositionAlgorithm, directShadingModel: floor.simulation.directShadingModel, diffuseShadingModel: floor.simulation.diffuseShadingModel, groundReflectionModel: floor.simulation.groundReflectionModel }])) },
    baseline, candidates, runtimeMs: clock() - started }));
}
export function transferMultiCandidate(workspace: MultiFloorWorkspace, candidate: MultiCandidate, current: boolean): MultiFloorWorkspace {
  if (!current || candidate.status !== "VALID") throw new RangeError("現在の完了済み・有効な候補だけを追加できます。");
  if (workspace.cases.length >= MAX_MULTI_FLOOR_CASES) throw new RangeError(`建物案は最大${MAX_MULTI_FLOOR_CASES}案です。上書き・自動削除はしません。`);
  let sequence = 1;
  while (workspace.cases.some(item => item.id === `multi-explorer-${sequence}`)) sequence++;
  return addMultiFloorCase(workspace, { ...cloneMultiFloorCase(candidate.definition), id: `multi-explorer-${sequence}`, name: `探索候補 ${candidate.id} · ${candidate.a}${candidate.b === undefined ? "" : ` / ${candidate.b}`}` });
}

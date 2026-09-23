import { validateComparisonCase } from "../comparison";
import { simulateFacade, type FacadeSimulationResult } from "../engine/facade-v2";
import { freezeDeep } from "../explorer/study";
import { calculateMultiFloorDelta, runMultiFloorComparison } from "../multifloor/simulation";
import { validateMultiFloorWorkspace } from "../multifloor/validation";
import { describeWeather, weatherCoverageCompatibility } from "./weather";
import { SCENARIO_LIMIT, SCENARIO_VERSION, type Delta, type MetricReading, type ScenarioCell, type ScenarioInput, type ScenarioMetric, type ScenarioResult, type Values } from "./types";

export function owned<T>(value: T): T {
  if (Array.isArray(value)) return value.map(owned) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, owned(child)])) as T;
  return value;
}
export function scenarioInputKey(input: ScenarioInput): string {
  // Preserve nonfinite invalid inputs distinctly from null, including in stale keys.
  return JSON.stringify([input.mode, input.workspace, input.referenceId, input.slots.map(s => [s.id, s.label, describeWeather(s.dataset)])],
    (_key, value: unknown) => typeof value === "number" && !Number.isFinite(value) ? String(value) : value);
}
function uniqueIds(items: readonly { readonly id: string }[], kind: string): void {
  if (items.length < 1 || items.length > SCENARIO_LIMIT) throw new RangeError(`${kind}は1〜4件です。`);
  if (items.some(item => !item.id.trim()) || new Set(items.map(i => i.id)).size !== items.length) throw new RangeError(`${kind}のIDが空または重複しています。`);
}
export function validateScenario(input: ScenarioInput): void {
  uniqueIds(input.workspace.cases, "設計案"); uniqueIds(input.slots, "気象");
  if (!input.workspace.cases.some(c => c.id === input.workspace.baselineCaseId)) throw new RangeError("基準案がありません。");
  if (!input.slots.some(s => s.id === input.referenceId)) throw new RangeError("参照気象がありません。");
  const fingerprints = input.slots.map(s => describeWeather(s.dataset).fingerprint);
  if (new Set(fingerprints).size !== fingerprints.length) throw new RangeError("同一気象データの重複追加はできません。");
  if (input.slots.some(s => !s.label.trim())) throw new RangeError("気象ラベルを入力してください。");
}
export function simulationValues(result: FacadeSimulationResult): Values {
  return { annual: result.summary.annual.withOverhangKWh, summer: result.summary.cooling.withOverhangKWh, winter: result.summary.heating.withOverhangKWh };
}
export function difference(value: Values, reference: Values | undefined, comparable = true): Delta {
  if (!comparable) return { status: "NOT_COMPARABLE", reason: "期間・時間区間が不一致。補間・年間換算はしません。" };
  if (!reference) return { status: "INVALID", reason: "基準セルまたは対応階が無効・未存在です。" };
  const values = { annual: value.annual - reference.annual, summer: value.summer - reference.summer, winter: value.winter - reference.winter };
  return Object.values(values).every(Number.isFinite) ? { status: "VALID", values } : { status: "INVALID", reason: "差分が有限値範囲を超えました。" };
}
const pending: Delta = { status: "INVALID", reason: "差分集計前" };
/** Weather-major / design-minor ordering. A canonical validation failure is local to a cell. */
export function runScenario(input: ScenarioInput, executedAt: string,
  progress: (completed: number, total: number, cell?: ScenarioCell) => void = () => {}, clock: () => number = () => 0): ScenarioResult {
  validateScenario(input);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(executedAt)) throw new RangeError("ISO UTC実行日時が必要です。");
  const started = clock();
  const slots = input.slots.map(s => ({ id: s.id, label: s.label, weather: describeWeather(s.dataset) }));
  const total = input.slots.length * input.workspace.cases.length;
  const raw: ScenarioCell[] = [];
  progress(0, total);
  for (const slot of input.slots) for (let i = 0; i < input.workspace.cases.length; i++) {
    const designId = input.workspace.cases[i]!.id;
    const start = clock();
    let result: ScenarioCell;
    try {
      if (input.mode === "single") {
        const item = input.workspace.cases[i]!;
        const issues = validateComparisonCase(item);
        if (issues.length) throw new RangeError(issues.map(v => `${v.path}: ${v.message}`).join(" / "));
        const simulation = simulateFacade(slot.dataset, item.parameters);
        result = { designId, weatherId: slot.id, status: "VALID", simulation, values: simulationValues(simulation),
          model: simulation.modelVersion, floors: [], designDelta: pending, weatherDelta: pending, runtimeMs: clock() - start };
      } else {
        const item = input.workspace.cases[i]!;
        const workspace = { cases: [item], baselineCaseId: item.id };
        const issues = validateMultiFloorWorkspace(workspace);
        if (issues.length) throw new RangeError(issues.map(v => `${v.floorId ?? "Building"} / ${v.path}: ${v.message}`).join(" / "));
        // One isolated canonical comparison per combination: an invalid baseline
        // must not suppress another valid building. Study deltas are added below.
        const building = runMultiFloorComparison(slot.dataset, workspace).cases[0]!;
        result = { designId, weatherId: slot.id, status: "VALID", building,
          values: { annual: building.total.annualKWh, summer: building.total.summerKWh, winter: building.total.winterKWh },
          model: [...new Set(building.floors.map(f => f.simulation.modelVersion))].join(" / "),
          floors: building.floors.map(f => ({ id: f.floorId, name: f.name, model: f.simulation.modelVersion,
            values: simulationValues(f.simulation), designDelta: pending, weatherDelta: pending })),
          designDelta: pending, weatherDelta: pending, runtimeMs: clock() - start };
      }
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      const floors = input.mode === "multi" ? `対象階: ${input.workspace.cases[i]!.floors.map(f => f.id).join(", ")} / ` : "";
      result = { designId, weatherId: slot.id, status: "INVALID", reason: floors + error.message, runtimeMs: clock() - start };
    }
    raw.push(result); progress(raw.length, total, result);
  }
  const cells = raw.map((c): ScenarioCell => {
    if (c.status === "INVALID") return c;
    const baseline = raw.find(b => b.designId === input.workspace.baselineCaseId && b.weatherId === c.weatherId);
    const reference = raw.find(b => b.designId === c.designId && b.weatherId === input.referenceId);
    const compatible = weatherCoverageCompatibility(slots.find(s => s.id === c.weatherId)!.weather, slots.find(s => s.id === input.referenceId)!.weather) !== "NOT_COMPARABLE";
    const building = c.building && baseline?.status === "VALID" && baseline.building ? { ...c.building,
      deltaFromBaseline: {
        annual: calculateMultiFloorDelta(c.building.total.annualKWh, baseline.building.total.annualKWh),
        summer: calculateMultiFloorDelta(c.building.total.summerKWh, baseline.building.total.summerKWh),
        winter: calculateMultiFloorDelta(c.building.total.winterKWh, baseline.building.total.winterKWh),
        monthly: c.building.total.monthlyKWh.map((v, i) => ({ month: i + 1, ...calculateMultiFloorDelta(v, baseline.building!.total.monthlyKWh[i]!) })),
      } } : c.building;
    return { ...c, ...(building ? { building } : {}), designDelta: difference(c.values, baseline?.status === "VALID" ? baseline.values : undefined),
      weatherDelta: difference(c.values, reference?.status === "VALID" ? reference.values : undefined, compatible),
      // Floor position from bottom, identical to canonical story comparison, not IDs/names.
      floors: c.floors.map((f, i) => ({ ...f,
        designDelta: difference(f.values, baseline?.status === "VALID" ? baseline.floors[i]?.values : undefined),
        weatherDelta: difference(f.values, reference?.status === "VALID" ? reference.floors[i]?.values : undefined, compatible) })) };
  });
  return freezeDeep(owned({ snapshot: { mode: input.mode, workspace: input.workspace, slots, referenceId: input.referenceId,
    inputKey: scenarioInputKey(input), executedAt, generationVersion: SCENARIO_VERSION,
    modelIds: [...new Set(cells.flatMap(c => c.status === "VALID" ? (c.simulation ? [c.simulation] : c.building!.floors.map(f => f.simulation))
      .flatMap(r => [r.modelVersion, r.geometryVersion, r.solarPositionAlgorithm, r.directShadingModel, r.diffuseShadingModel, r.groundReflectionModel]) : []))] }, cells, runtimeMs: clock() - started } as ScenarioResult));
}
export function scenarioMetric(cell: ScenarioCell, metric: ScenarioMetric): MetricReading {
  if (cell.status === "INVALID") return { status: "INVALID", value: null, reason: cell.reason };
  const [kind, period] = metric.split(".");
  if (!period) return { status: "VALID", value: cell.values[kind as keyof Values] };
  const delta = kind === "design" ? cell.designDelta : cell.weatherDelta;
  return delta.status === "VALID" ? { status: "VALID", value: delta.values[period as keyof Values] } : { ...delta, value: null };
}

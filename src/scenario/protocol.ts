import { runScenario } from "./study";
import type { ScenarioCell, ScenarioInput, ScenarioResult } from "./types";
export type ScenarioRequest = { readonly type: "run"; readonly runId: number; readonly input: ScenarioInput; readonly executedAt: string };
export type ScenarioMessage =
  | { readonly type: "progress"; readonly runId: number; readonly completed: number; readonly total: number; readonly cell?: ScenarioCell }
  | { readonly type: "complete"; readonly runId: number; readonly result: ScenarioResult }
  | { readonly type: "error"; readonly runId: number; readonly message: string };
export function handleScenario(request: ScenarioRequest, send: (message: ScenarioMessage) => void, clock: () => number = () => 0): void {
  try {
    const result = runScenario(request.input, request.executedAt, (completed, total, cell) =>
      send({ type: "progress", runId: request.runId, completed, total, ...(cell ? { cell } : {}) }), clock);
    send({ type: "complete", runId: request.runId, result });
  } catch (error) { send({ type: "error", runId: request.runId, message: error instanceof Error ? error.message : "気象シナリオ計算に失敗しました。" }); }
}

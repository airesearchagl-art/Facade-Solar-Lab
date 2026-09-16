import type { WeatherDataset } from "../weather";
import type { MultiStudyInput } from "./multi-sweep";
import { runMultiStudy, type MultiCandidate, type MultiStudyResult } from "./multi-study";
export interface MultiStudyRequest { readonly type: "run"; readonly runId: number; readonly dataset: WeatherDataset; readonly input: MultiStudyInput; readonly executedAt: string }
export type MultiStudyMessage =
  | { readonly type: "progress"; readonly runId: number; readonly completed: number; readonly total: number; readonly candidate?: MultiCandidate }
  | { readonly type: "complete"; readonly runId: number; readonly result: MultiStudyResult }
  | { readonly type: "error"; readonly runId: number; readonly message: string };
export function executeMultiStudyRequest(request: MultiStudyRequest, send: (message: MultiStudyMessage) => void, clock?: () => number): void {
  try {
    if (request.type !== "run" || !Number.isSafeInteger(request.runId) || request.runId <= 0) throw new RangeError("探索messageが不正です。");
    const result = runMultiStudy(request.dataset, request.input, request.executedAt,
      (completed, total, candidate) => send({ type: "progress", runId: request.runId, completed, total, candidate }), clock);
    send({ type: "complete", runId: request.runId, result });
  } catch (error) { send({ type: "error", runId: request.runId, message: error instanceof Error ? error.message : "複数階探索を完了できませんでした。" }); }
}

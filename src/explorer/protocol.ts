import type { ComparisonCase } from "../comparison";
import type { WeatherDataset } from "../weather";
import { runStudy } from "./study";
import type { StudyCandidate, StudyResult, SweepDefinition } from "./types";

export interface StudyRequest { readonly type: "run"; readonly runId: number; readonly dataset: WeatherDataset; readonly source: ComparisonCase; readonly sweep: SweepDefinition; readonly executedAt: string }
export type StudyMessage =
  | { readonly type: "progress"; readonly runId: number; readonly completed: number; readonly total: number; readonly candidate?: StudyCandidate }
  | { readonly type: "complete"; readonly runId: number; readonly result: StudyResult }
  | { readonly type: "error"; readonly runId: number; readonly message: string };

export function executeStudyRequest(request: StudyRequest, send: (message: StudyMessage) => void, clock?: () => number): void {
  try {
    if (request.type !== "run" || !Number.isSafeInteger(request.runId) || request.runId <= 0) throw new RangeError("探索messageが不正です。");
    const result = runStudy(request.dataset, request.source, request.sweep, request.executedAt,
      (completed, total, candidate) => send({ type: "progress", runId: request.runId, completed, total, candidate }), clock);
    send({ type: "complete", runId: request.runId, result });
  } catch (error) {
    send({ type: "error", runId: request.runId, message: error instanceof Error ? error.message : "探索を完了できませんでした。" });
  }
}

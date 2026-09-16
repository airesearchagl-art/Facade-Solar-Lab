import type { StudyMessage, StudyRequest } from "../explorer/protocol";

export interface StudyWorker {
  onmessage: ((event: MessageEvent<StudyMessage>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage(message: StudyRequest): void;
  terminate(): void;
}
/** One worker per run. Termination plus generation check rejects queued stale messages. */
export class StudyClient {
  private worker: StudyWorker | null = null;
  private generation = 0;
  constructor(private readonly factory: () => StudyWorker) {}
  cancel(): void {
    this.generation++;
    this.worker?.terminate();
    this.worker = null;
  }
  run(input: Omit<StudyRequest, "type" | "runId">, receive: (message: StudyMessage) => void): number {
    this.cancel();
    const runId = this.generation;
    const worker = this.factory();
    this.worker = worker;
    const fail = () => {
      if (this.generation !== runId || this.worker !== worker) return;
      this.cancel();
      receive({ type: "error", runId, message: "Workerを実行できませんでした。再実行してください（main-thread計算への自動切替はしません）。" });
    };
    worker.onerror = fail;
    worker.onmessageerror = fail;
    worker.onmessage = event => {
      if (this.generation !== runId || this.worker !== worker || event.data.runId !== runId) return;
      if (event.data.type !== "progress") { worker.terminate(); this.worker = null; }
      receive(event.data);
    };
    try { worker.postMessage({ ...input, type: "run", runId }); } catch { fail(); }
    return runId;
  }
}

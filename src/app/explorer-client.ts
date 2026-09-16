import type { StudyMessage, StudyRequest } from "../explorer/protocol";
import type { MultiStudyMessage, MultiStudyRequest } from "../explorer/multi-protocol";

export interface RunWorker<Request, Message> {
  onmessage: ((event: MessageEvent<Message>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage(message: Request): void;
  terminate(): void;
}
/** One worker per run. Termination plus generation check rejects queued stale messages. */
type RunRequest = { readonly type: "run"; readonly runId: number };
type RunMessage = { readonly type: "progress" | "complete" | "error"; readonly runId: number };
export type StudyWorker = RunWorker<StudyRequest, StudyMessage>;
export type MultiStudyWorker = RunWorker<MultiStudyRequest, MultiStudyMessage>;
export class RunClient<Request extends RunRequest, Message extends RunMessage> {
  private worker: RunWorker<Request, Message> | null = null;
  private generation = 0;
  constructor(private readonly factory: () => RunWorker<Request, Message>, private readonly failure: (runId: number) => Message) {}
  cancel(): void {
    this.generation++;
    this.worker?.terminate();
    this.worker = null;
  }
  run(input: Omit<Request, "type" | "runId">, receive: (message: Message) => void): number {
    this.cancel();
    const runId = this.generation;
    const worker = this.factory();
    this.worker = worker;
    const fail = () => {
      if (this.generation !== runId || this.worker !== worker) return;
      this.cancel();
      receive(this.failure(runId));
    };
    worker.onerror = fail;
    worker.onmessageerror = fail;
    worker.onmessage = event => {
      if (this.generation !== runId || this.worker !== worker || event.data.runId !== runId) return;
      if (event.data.type !== "progress") { worker.terminate(); this.worker = null; }
      receive(event.data);
    };
    try { worker.postMessage({ ...input, type: "run", runId } as Request); } catch { fail(); }
    return runId;
  }
}
const failureMessage = (runId: number) => ({ type: "error" as const, runId, message: "Workerを実行できませんでした。再実行してください（main-thread計算への自動切替はしません）。" });
export class StudyClient extends RunClient<StudyRequest, StudyMessage> {
  constructor(factory: () => StudyWorker) { super(factory, failureMessage); }
}
export class MultiStudyClient extends RunClient<MultiStudyRequest, MultiStudyMessage> {
  constructor(factory: () => MultiStudyWorker) { super(factory, failureMessage); }
}

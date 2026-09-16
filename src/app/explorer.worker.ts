import { executeStudyRequest, type StudyRequest } from "../explorer/protocol";

// Browser boundary only. No DOM/UI dependency enters the pure explorer or engine.
self.onmessage = (event: MessageEvent<StudyRequest>) => {
  executeStudyRequest(event.data, message => self.postMessage(message), () => performance.now());
};

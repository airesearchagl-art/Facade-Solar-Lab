import { executeMultiStudyRequest, type MultiStudyRequest } from "../explorer/multi-protocol";
self.onmessage = (event: MessageEvent<MultiStudyRequest>) => executeMultiStudyRequest(event.data, message => self.postMessage(message), () => performance.now());

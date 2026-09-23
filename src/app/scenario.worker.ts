import { handleScenario, type ScenarioRequest } from "../scenario/protocol";
self.onmessage = (event: MessageEvent<ScenarioRequest>) => handleScenario(event.data, message => self.postMessage(message), () => performance.now());

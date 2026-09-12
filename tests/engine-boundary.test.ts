import { describe, expect, it } from "vitest";

import { engineManifest } from "../src/engine";

describe("M1 engine manifest", () => {
  it("identifies the legacy baseline without claiming physical validation", () => {
    expect(engineManifest.milestone).toBe("M1");
    expect(engineManifest.frameworkDependencies).toEqual([]);
    expect(engineManifest.calculationStatus).toBe("legacy-baseline");
    expect(engineManifest.modelStatus).toBe("not-validated-physical-model");
    expect(engineManifest.runtimeTargets).toContain("node");
  });
});

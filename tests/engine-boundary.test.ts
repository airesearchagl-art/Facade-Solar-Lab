import { describe, expect, it } from "vitest";

import { engineManifest } from "../src/engine";

describe("M0 engine boundary", () => {
  it("is framework-independent and exposes no calculation implementation", () => {
    expect(engineManifest.frameworkDependencies).toEqual([]);
    expect(engineManifest.calculationStatus).toBe("not-implemented");
    expect(engineManifest.runtimeTargets).toContain("node");
  });
});

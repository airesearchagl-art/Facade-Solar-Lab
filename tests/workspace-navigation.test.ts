import { describe, expect, it } from "vitest";

import { workspaceHash, workspaceModeFromHash } from "../src/app/workspace-navigation";

describe("M8 hash navigation contract", () => {
  it.each([
    ["", "single"], ["#single", "single"], ["#multi", "multi"],
    ["#guide", "guide"], ["#guide-parameters", "guide"], ["#guide-technical", "guide"],
  ] as const)("maps %j to %s", (hash, mode) => {
    expect(workspaceModeFromHash(hash)).toBe(mode);
  });

  it.each(["#unknown", "multi", "#guidance", "#multi-extra", "#", "  #invalid  "])("fails safe to Single for %j", (hash) => {
    expect(workspaceModeFromHash(hash)).toBe("single");
  });

  it("creates server-independent hashes for all workspace tabs", () => {
    expect([workspaceHash("single"), workspaceHash("multi"), workspaceHash("guide")]).toEqual(["#single", "#multi", "#guide"]);
  });
});

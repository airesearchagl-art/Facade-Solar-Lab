import { describe, expect, it } from "vitest";

import { engineManifest } from "../src/engine";
import { dependencyFindings, resolveCoreModule } from "./helpers/dependency-guard";

const engineSources = import.meta.glob(
  [
    "../src/engine/**/*.{ts,tsx}",
    "../src/models/**/*.{ts,tsx}",
    "../src/geometry/**/*.{ts,tsx}",
    "../src/weather/**/*.{ts,tsx}",
    "../src/comparison/**/*.{ts,tsx}",
    "../src/solar-reference/**/*.{ts,tsx}",
    "../src/export/**/*.{ts,tsx}",
    "../src/preset/**/*.{ts,tsx}",
    "../src/multifloor/**/*.{ts,tsx}",
    "../src/explorer/**/*.{ts,tsx}",
  ],
  {
  eager: true,
  import: "default",
  query: "?raw",
  },
) as Record<string, string>;

describe("M4.5 engine, geometry, weather, comparison, and multi-floor boundary", () => {
  it("identifies all model paths without claiming physical validation", () => {
    expect(engineManifest.milestone).toBe("M4.5");
    expect(engineManifest.frameworkDependencies).toEqual([]);
    expect(engineManifest.calculationStatus).toBe(
      "multifloor-composition-over-facade-v1-weather",
    );
    expect(engineManifest.modelStatus).toBe("weather-backed-not-validated");
    expect(engineManifest.runtimeTargets).toContain("node");
  });

  it("mechanically rejects UI, filesystem, DOM, Canvas, and browser-global dependencies", () => {
    const paths = Object.keys(engineSources);
    expect(paths.length).toBeGreaterThan(0);

    const findings: string[] = [];
    for (const [path, source] of Object.entries(engineSources)) {
      const result = dependencyFindings(source);
      findings.push(...result.findings.map(finding => `${path}: ${finding}`));
      for (const dependency of result.relativeModules) {
        const resolved = resolveCoreModule(path, dependency);
        if (![resolved, `${resolved}.ts`, `${resolved}.tsx`, `${resolved}/index.ts`, `${resolved}/index.tsx`].some(candidate => candidate in engineSources)) findings.push(`${path}: escapes inspected core graph: ${dependency}`);
      }
    }

    expect(findings).toEqual([]);
  });

  it.each([
    'import { readFile } from "fs/promises";',
    'export { readFile } from "node:fs/promises";',
    'const f = await import("node:fs/promises");',
    'const f = await import(packageName);',
    'export * from "child_process";',
    'const p = require("path");',
    'import fs = require("fs");',
    'type X = import("node:stream").Readable;',
    'window.location.href;', 'globalThis["document"];', 'self.navigator;',
    'const input: File = file;', 'new FileReader();', 'const node: HTMLElement = value;',
    'const context: CanvasRenderingContext2D = value;', 'new OffscreenCanvas(2, 2);',
    'const x: HTMLInputElement = value;', 'import db from "better-sqlite3";',
    'process.env.TZ;', 'Buffer.from("x");', 'new Date();',
  ])("rejects negative fixture: %s", source => {
    expect(dependencyFindings(source).findings.length).toBeGreaterThan(0);
  });
  it("ignores strings/comments while following relative re-export/import edges", () => {
    expect(dependencyFindings('// window\n/* process */\nconst text = "File fs/promises https://example.test";').findings).toEqual([]);
    expect(dependencyFindings('export * from "./pure"; const x = import("../other");').relativeModules).toEqual(["./pure", "../other"]);
    expect(resolveCoreModule("../src/engine/a.ts", "../app/browser")).toBe("../src/app/browser");
  });
});

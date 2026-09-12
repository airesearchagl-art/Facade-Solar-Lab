import { describe, expect, it } from "vitest";

import { engineManifest } from "../src/engine";

const engineSources = import.meta.glob(
  ["../src/engine/**/*.ts", "../src/weather/**/*.ts"],
  {
  eager: true,
  import: "default",
  query: "?raw",
  },
) as Record<string, string>;

const forbiddenDependencies = [
  {
    name: "react module",
    pattern: /(?:from\s*|import\s*\(?\s*|require\s*\(\s*)["']react(?:\/[^"']*)?["']/u,
  },
  {
    name: "Node.js built-in module",
    pattern: /(?:from\s*|import\s*\(?\s*|require\s*\(\s*)["'](?:node:)?(?:fs|path|process)["']/u,
  },
  {
    name: "react-dom module",
    pattern: /(?:from\s*|import\s*\(?\s*|require\s*\(\s*)["']react-dom(?:\/[^"']*)?["']/u,
  },
  { name: "window global", pattern: /\bwindow\b/u },
  { name: "document global", pattern: /\bdocument\b/u },
  { name: "navigator global", pattern: /\bnavigator\b/u },
  { name: "HTML canvas element", pattern: /\bHTMLCanvasElement\b/u },
  { name: "canvas rendering context", pattern: /\bCanvasRenderingContext2D\b/u },
  { name: "File API", pattern: /\bFileReader\b|\bFile\b/u },
] as const;

describe("M1 engine boundary", () => {
  it("identifies the legacy baseline without claiming physical validation", () => {
    expect(engineManifest.milestone).toBe("M1");
    expect(engineManifest.frameworkDependencies).toEqual([]);
    expect(engineManifest.calculationStatus).toBe("legacy-baseline");
    expect(engineManifest.modelStatus).toBe("not-validated-physical-model");
    expect(engineManifest.runtimeTargets).toContain("node");
  });

  it("mechanically rejects UI, filesystem, DOM, Canvas, and browser-global dependencies", () => {
    const paths = Object.keys(engineSources);
    expect(paths.length).toBeGreaterThan(0);

    const findings: string[] = [];
    for (const [path, source] of Object.entries(engineSources)) {
      const executableSource = source
        .replace(/\/\*[\s\S]*?\*\//gu, "")
        .replace(/\/\/.*$/gmu, "");
      for (const dependency of forbiddenDependencies) {
        if (dependency.pattern.test(executableSource)) {
          findings.push(`${path}: ${dependency.name}`);
        }
      }
    }

    expect(findings).toEqual([]);
  });
});

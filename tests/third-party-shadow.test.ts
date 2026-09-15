import { describe, expect, it } from "vitest";

import protocol from "../scripts/validation/radiance-direct-shadow/protocol.json";
import evidence from "../scripts/validation/radiance-direct-shadow/comparison.json";
import { fslFraction } from "../scripts/validation/radiance-direct-shadow/fsl-adapter";
import {
  compareFraction, rayLine, sampleFraction, sceneText, sunDirection, surfaceHit, validateCase, worldPoint,
  type BenchmarkCase, type HitQuery,
} from "../scripts/validation/radiance-direct-shadow/reference";

const cases = protocol.cases as BenchmarkCase[];
const sources = import.meta.glob("../scripts/validation/radiance-direct-shadow/*.{ts,mjs,json}", {
  eager: true, import: "default", query: "?raw",
}) as Record<string, string>;
const source = (name: string) => sources[`../scripts/validation/radiance-direct-shadow/${name}`]!.replace(/\r\n/g, "\n");
const hash = async (value: string) => Array.from(new Uint8Array(
  await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
)).map((n) => n.toString(16).padStart(2, "0")).join("");

describe("P0-B protocol and evidence integrity (not external solver execution)", () => {
  it("locks the pre-run case list, tolerance, sampling and source digests", async () => {
    expect(cases).toHaveLength(10);
    expect(new Set(cases.map((c) => c.id)).size).toBe(10);
    expect(protocol.tolerances).toEqual({ regular: 1e-6, boundary: 1e-5 });
    expect(protocol.sampling.bisectionSteps).toEqual([24, 32, 40]);
    expect(evidence.protocolSha256).toBe(await hash(source("protocol.json")));
    expect(evidence.harnessSha256).toBe(await hash(["reference.ts", "fsl-adapter.ts", "run.mjs"].map(source).join("\n--file--\n")));
    expect(evidence.cases.map((c) => c.id)).toEqual(cases.map((c) => c.id));
    cases.forEach((c) => expect(() => validateCase(c)).not.toThrow());
  });

  it("keeps FSL imports out of the reference implementation", () => {
    expect(source("reference.ts")).not.toMatch(/\b(?:import|require)\s*[("'{*]|calculateDirectShadow|clipPolygonToRectangle|facadeLocalSunVector/u);
    expect(source("fsl-adapter.ts")).toContain('from "../../../src/geometry"');
  });

  it.each(cases)("$id recorded FSL value is a checkpoint, not an external expected value", async (c) => {
    const recorded = evidence.cases.find((item) => item.id === c.id)!;
    expect(recorded.sceneSha256).toBe(await hash(sceneText(c)));
    expect(recorded.tolerance).toBe(protocol.tolerances[c.toleranceClass]);
    expect(fslFraction(c)).toBe(recorded.fslFraction);
  });

  it("never reports missing references as zero-error PASS", () => {
    const unrun = evidence.cases.filter((c) => c.status === "NOT_RUN");
    unrun.forEach((c) => {
      expect(c.referenceFraction).toBeNull();
      expect(c.absoluteError).toBeNull();
      expect(c.samples).toEqual([]);
    });
    for (const status of ["PASS", "FAIL", "UNRESOLVED", "NOT_RUN"] as const) {
      expect(evidence.counts[status]).toBe(evidence.cases.filter((c) => c.status === status).length);
    }
    if (unrun.length === cases.length) expect(evidence.maxAbsoluteError).toBeNull();
  });
});

describe("Radiance comparison (explicitly skipped until reference evidence exists)", () => {
  for (const c of cases) {
    const result = evidence.cases.find((item) => item.id === c.id)!;
    it.skipIf(result.status === "NOT_RUN")(`${c.id}: external ray-intersection comparison`, () => {
      expect(evidence.toolchain.status).toBe("AVAILABLE");
      expect(evidence.toolchain.version).toEqual(expect.any(String));
      expect(evidence.toolchain.rtraceSha256).toMatch(/^[a-f0-9]{64}$/u);
      expect(evidence.toolchain.oconvSha256).toMatch(/^[a-f0-9]{64}$/u);
      expect(result.samples.map((s: { steps: number }) => s.steps)).toEqual(protocol.sampling.bisectionSteps);
      const fresh = compareFraction(fslFraction(c), result.samples, result.tolerance, protocol.sampling.referenceBudgetShare);
      expect(fresh.status).toBe(result.status);
      expect(fresh.referenceFraction).toBe(result.referenceFraction);
      expect(fresh.absoluteError).toBe(result.absoluteError);
      expect(result.status).toBe("PASS");
      expect(result.referenceFraction).not.toBeNull();
      expect(result.absoluteError).toBeLessThanOrEqual(protocol.tolerances[c.toleranceClass]);
    });
  }
});

describe("independent world scene and ray contract", () => {
  it.each([
    [0, [-1, 2, 3]], [90, [2, 1, 3]], [180, [1, -2, 3]], [270, [-2, -1, 3]],
  ] as const)("maps facade %d to hand-fixed ENU coordinates", (azimuth, expected) => {
    const actual = worldPoint({ ...cases[0]!, facadeAzimuthDeg: azimuth }, 1, 2, 3);
    actual.forEach((n, i) => expect(n).toBeCloseTo(expected[i]!, 12));
  });

  it("emits only an opaque canopy, not a receiving wall or a light/sky model", () => {
    expect(sceneText(cases[0]!)).not.toContain(" polygon ");
    expect(sceneText(cases[2]!).match(/ polygon /gu)).toHaveLength(1);
    expect(sceneText(cases[2]!)).not.toMatch(/\n!|\b(?:source|glass|sky)\b/u);
    expect(sunDirection(cases[0]!)[2]).toBeCloseTo(Math.SQRT1_2, 12);
    expect(surfaceHit("overhang\t")).toBe(true);
    expect(surfaceHit("*\t")).toBe(false);
    expect(() => surfaceHit("wall")).toThrow();
    expect(() => validateCase({ ...cases[0]!, id: "../outside" })).toThrow();
  });
});

describe("sampler/comparator unit tests — mocks are NOT Radiance evidence", () => {
  const queryProfile = (height: (x: number) => number): HitQuery => async (points) =>
    points.map(([u, v]) => v > 1 - height(u));

  it.each([0, 0.25, 0.9995, 1])("integrates the constant profile %f", async (height) => {
    const sample = await sampleFraction(queryProfile(() => height), 32, 1e-8);
    expect(Math.abs(sample.fraction - height)).toBeLessThan(sample.integrationBound);
  });

  it.each([false, true])("integrates a clipped affine ramp and its mirror (%s)", async (mirror) => {
    const query = queryProfile((u) => Math.max(0, Math.min(0.8, 1.5 * (mirror ? 1 - u : u) - 0.25)));
    const sample = await sampleFraction(query, 32, 1e-8);
    // Ramp width 8/15 at average height .4 plus plateau width .3 at height .8.
    expect(Math.abs(sample.fraction - (8 / 15 * 0.4 + 0.3 * 0.8))).toBeLessThan(sample.integrationBound);
  });

  it("rejects invalid shape assumptions and incomplete ray output", async () => {
    await expect(sampleFraction(queryProfile((x) => 1 - Math.abs(2 * x - 1)), 32, 1e-8)).rejects.toThrow(/monotonicity/u);
    await expect(sampleFraction(queryProfile((x) => x * x), 32, 1e-8)).rejects.toThrow(/affine/u);
    await expect(sampleFraction(async () => [], 32, 1e-8)).rejects.toThrow(/Incomplete/u);
  });

  it("auto-classifies PASS, FAIL, and insufficient convergence without widening tolerance", () => {
    const samples = [32, 40].map((steps) => ({ steps, fraction: 0.5, integrationBound: 2e-8 }));
    expect(compareFraction(0.5, samples, 1e-6, 0.25).status).toBe("PASS");
    expect(compareFraction(0.500002, samples, 1e-6, 0.25).status).toBe("FAIL");
    expect(compareFraction(0.500002, samples, 1e-5, 0.25).status).toBe("PASS");
    expect(compareFraction(0.50000099, samples, 1e-6, 0.25).status).toBe("UNRESOLVED");
    expect(compareFraction(0.5, samples.map((s) => ({ ...s, integrationBound: 0.01 })), 1e-6, 0.25).status).toBe("UNRESOLVED");
    expect(() => compareFraction(NaN, samples, 1e-6, 0.25)).toThrow();
    expect(() => compareFraction(0.5, [], 1e-6, 0.25)).toThrow();
    expect(() => compareFraction(0.5, samples, NaN, 0.25)).toThrow();
    expect(() => compareFraction(0.5, [samples[0]!, samples[0]!], 1e-6, 0.25)).toThrow();
  });
});

// Generic 3D ray/plane + convex-face containment test double. It exercises the
// generated scene and sampler, but is neither Radiance nor benchmark evidence.
function sceneTestDouble(c: BenchmarkCase): HitQuery {
  const scene = sceneText(c);
  const coordinateText = scene.split("\n12\n")[1];
  if (coordinateText === undefined) return async (points) => points.map(() => false);
  const vertices = coordinateText.trim().split("\n").map((line) => line.split(" ").map(Number));
  const sub = (a: number[], b: number[]) => a.map((v, i) => v - b[i]!);
  const dot = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i]!, 0);
  const cross = (a: number[], b: number[]) => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
  const normal = cross(sub(vertices[1]!, vertices[0]!), sub(vertices[2]!, vertices[0]!));
  return async (points) => points.map((p) => {
    const ray = rayLine(c, p).split(" ").map(Number);
    const origin = ray.slice(0, 3);
    const direction = ray.slice(3);
    const denominator = dot(normal, direction);
    if (Math.abs(denominator) < 1e-15) return false;
    const distance = dot(normal, sub(vertices[0]!, origin)) / denominator;
    if (distance <= 0) return false;
    const hit = origin.map((v, i) => v + distance * direction[i]!);
    return vertices.every((v, i) => dot(cross(sub(vertices[(i + 1) % 4]!, v), sub(hit, v)), normal) >= -1e-14);
  });
}

describe("3D scene/sampler dry-run with test double, NOT external benchmark PASS", () => {
  it.each(cases)("$id produces a finite, converged sampler result", async (c) => {
    const samples = [];
    for (const steps of [32, 40]) samples.push(await sampleFraction(sceneTestDouble(c), steps, 1e-8));
    expect(Math.abs(samples[1]!.fraction - samples[0]!.fraction)).toBeLessThan(samples[1]!.integrationBound + samples[0]!.integrationBound);
    if (c.controlFraction !== undefined) expect(Math.abs(samples[1]!.fraction - c.controlFraction)).toBeLessThan(samples[1]!.integrationBound);
  });
});

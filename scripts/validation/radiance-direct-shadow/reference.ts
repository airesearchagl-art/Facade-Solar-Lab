// Independent reference: no FSL imports, projected polygons, or clipping routines.
export interface BenchmarkCase {
  id: string;
  category: string;
  toleranceClass: "regular" | "boundary";
  controlFraction?: number;
  facadeAzimuthDeg: number;
  sunAzimuthDeg: number;
  sunAltitudeDeg: number;
  opening: { centerXM: number; widthM: number; sillM: number; headM: number };
  overhang: null | { depthM: number; elevationM: number; leftExtensionM: number; rightExtensionM: number };
}

export interface Sampling {
  bisectionSteps: number[];
  edgeInsetFraction: number;
  referenceBudgetShare: number;
}

type Vector = readonly [number, number, number];
type Point = readonly [number, number];
export type HitQuery = (points: readonly Point[]) => Promise<readonly boolean[]>;

/** East/North/Up scene construction, independently from the declared bearings. */
export function worldPoint(c: BenchmarkCase, x: number, depth: number, z: number): Vector {
  const bearing = c.facadeAzimuthDeg * Math.PI / 180;
  const outward: Vector = [Math.sin(bearing), Math.cos(bearing), 0];
  // Up cross outward is the external viewer's right, not outward cross up.
  const right: Vector = [-outward[1], outward[0], 0];
  return [right[0] * x + outward[0] * depth, right[1] * x + outward[1] * depth, z];
}

export function sunDirection(c: BenchmarkCase): Vector {
  const azimuth = c.sunAzimuthDeg * Math.PI / 180;
  const altitude = c.sunAltitudeDeg * Math.PI / 180;
  return [Math.cos(altitude) * Math.sin(azimuth), Math.cos(altitude) * Math.cos(azimuth), Math.sin(altitude)];
}

export function rayLine(c: BenchmarkCase, [u, v]: Point): string {
  const o = c.opening;
  const origin = worldPoint(c, o.centerXM + (u - 0.5) * o.widthM, 0, o.sillM + v * (o.headM - o.sillM));
  return [...origin, ...sunDirection(c)].map((n) => n.toPrecision(17)).join(" ");
}

export function sceneText(c: BenchmarkCase): string {
  let scene = "# FSL P0-B: ENU metres; opaque horizontal canopy only\nvoid plastic opaque\n0\n0\n5 0 0 0 0 0\n";
  if (c.overhang === null || c.overhang.depthM === 0) return scene;
  const o = c.opening;
  const h = c.overhang;
  const left = o.centerXM - o.widthM / 2 - h.leftExtensionM;
  const right = o.centerXM + o.widthM / 2 + h.rightExtensionM;
  const vertices = [[left, 0], [right, 0], [right, h.depthM], [left, h.depthM]];
  scene += "opaque polygon overhang\n0\n0\n12\n";
  for (const [x, depth] of vertices) {
    scene += worldPoint(c, x!, depth!, h.elevationM).map((n) => n.toPrecision(17)).join(" ") + "\n";
  }
  return scene;
}

export function surfaceHit(line: string): boolean {
  if (line.trim() === "overhang") return true;
  if (line.trim() === "*") return false;
  throw new Error("Unexpected rtrace surface identifier / malformed output");
}

export function validateCase(c: BenchmarkCase): void {
  const numbers = [c.facadeAzimuthDeg, c.sunAzimuthDeg, c.sunAltitudeDeg, ...Object.values(c.opening),
    ...(c.overhang === null ? [] : Object.values(c.overhang))];
  if (!/^[A-Z][A-Z0-9_]*$/u.test(c.id) || !numbers.every(Number.isFinite) || c.opening.widthM <= 0 || c.opening.headM <= c.opening.sillM ||
    c.sunAltitudeDeg <= 0 || c.sunAltitudeDeg >= 90 ||
    Math.cos((c.sunAzimuthDeg - c.facadeAzimuthDeg) * Math.PI / 180) <= 0 ||
    (c.overhang !== null && (c.overhang.depthM < 0 || c.overhang.elevationM < c.opening.headM ||
      c.overhang.leftExtensionM < 0 || c.overhang.rightExtensionM < 0))) {
    throw new Error("Case lies outside the fixed single-canopy/front-facing protocol");
  }
}

/**
 * A single rectangular horizontal canopy spans the opening at its rear edge.
 * Its vertical hit columns are top-connected; their heights form a monotone
 * clipped affine profile. Obtain ALL boundaries from external ray hit queries.
 * Between endpoint heights, horizontal hit width is affine, so its midpoint
 * integrates that band. Quarter-band probes and interior columns guard this
 * restricted shape assumption. See README for the integration error budget.
 */
export async function sampleFraction(query: HitQuery, steps: number, inset: number) {
  if (!Number.isInteger(steps) || steps < 16 || steps > 48 || inset <= 0 || inset >= 0.001) {
    throw new Error("Invalid fixed sampling parameters");
  }
  const epsilon = 2 ** -steps;
  const xs = [inset, 0.25, 0.5, 0.75, 1 - inset];
  const low = xs.map(() => 0);
  const high = xs.map(() => 1);
  for (let step = 0; step < steps; step += 1) {
    const mids = low.map((lo, i) => (lo + high[i]!) / 2);
    const hits = await query(xs.map((x, i) => [x, mids[i]!]));
    if (hits.length !== xs.length) throw new Error("Incomplete ray response");
    hits.forEach((hit, i) => { if (hit) high[i] = mids[i]!; else low[i] = mids[i]!; });
  }
  const heights = low.map((lo, i) => 1 - (lo + high[i]!) / 2);
  const first = heights[0]!;
  const last = heights.at(-1)!;
  const minimum = Math.min(first, last);
  const maximum = Math.max(first, last);
  const hitOnLeft = first > last;
  for (let i = 0; i < heights.length; i += 1) {
    if (heights[i]! < minimum - 2 * epsilon || heights[i]! > maximum + 2 * epsilon ||
      (i > 0 && (hitOnLeft ? heights[i]! - heights[i - 1]! : heights[i - 1]! - heights[i]!) > 2 * epsilon)) {
      throw new Error("Ray profile violates the single-canopy monotonicity contract");
    }
  }
  const span = maximum - minimum;
  let fraction = (minimum + maximum) / 2;
  if (span > 4 * epsilon) {
    const levels = [0.25, 0.5, 0.75].map((t) => 1 - (minimum + t * span));
    const left = levels.map(() => inset);
    const right = levels.map(() => 1 - inset);
    for (let step = 0; step < steps; step += 1) {
      const mids = left.map((lo, i) => (lo + right[i]!) / 2);
      const hits = await query(levels.map((z, i) => [mids[i]!, z]));
      if (hits.length !== levels.length) throw new Error("Incomplete ray response");
      hits.forEach((hit, i) => { if (hit === hitOnLeft) left[i] = mids[i]!; else right[i] = mids[i]!; });
    }
    const widths = left.map((lo, i) => {
      const boundary = (lo + right[i]!) / 2;
      return (hitOnLeft ? boundary - inset : 1 - inset - boundary) / (1 - 2 * inset);
    });
    if (span * Math.abs((widths[0]! + widths[2]!) / 2 - widths[1]!) > 16 * epsilon) {
      throw new Error("Ray profile is not affine inside the transition band");
    }
    fraction = minimum + span * widths[1]!;
  }
  return { steps, fraction, integrationBound: 2 * inset + 16 * epsilon };
}

export type ReferenceMeasurement = Awaited<ReturnType<typeof sampleFraction>>;

export function compareFraction(fsl: number, samples: readonly ReferenceMeasurement[], tolerance: number, budgetShare: number) {
  if (!Number.isFinite(tolerance) || tolerance <= 0 || !Number.isFinite(budgetShare) || budgetShare <= 0 || budgetShare >= 1 ||
    !Number.isFinite(fsl) || fsl < 0 || fsl > 1 || samples.some((s, i) =>
    !Number.isInteger(s.steps) || s.steps < 16 || s.steps > 48 || (i > 0 && s.steps <= samples[i - 1]!.steps) ||
    !Number.isFinite(s.fraction) || s.fraction < 0 || s.fraction > 1 ||
    !Number.isFinite(s.integrationBound) || s.integrationBound < 0)) throw new Error("Invalid measured fraction");
  if (samples.length < 2) throw new Error("Two refinement levels required");
  const last = samples.at(-1)!;
  const prior = samples.at(-2)!;
  const error = Math.abs(fsl - last.fraction);
  const refinementDelta = Math.abs(last.fraction - prior.fraction);
  const converged = last.integrationBound <= tolerance * budgetShare &&
    prior.integrationBound <= tolerance * budgetShare &&
    refinementDelta <= last.integrationBound + prior.integrationBound;
  return {
    referenceFraction: last.fraction, absoluteError: error, refinementDelta,
    integrationBound: last.integrationBound,
    // No exclusion or enlarged tolerance: unconverged reference remains unresolved.
    status: !converged ? "UNRESOLVED" : error > tolerance ? "FAIL" :
      error + last.integrationBound <= tolerance ? "PASS" : "UNRESOLVED",
  };
}

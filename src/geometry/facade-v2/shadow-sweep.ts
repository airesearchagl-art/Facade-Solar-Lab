import { GEOMETRY_EPSILON, deduplicatePolygonVertices, polygonAreaM2, type Point2 } from "../facade-v1";

interface Edge { x0: number; x1: number; z0: number; z1: number; polygon: number }
const finite = (n: number): number => { if (!Number.isFinite(n)) throw new RangeError("shadow sweep exceeds finite geometry range"); return n; };
const height = (e: Edge, x: number): number => finite(e.z0 + ((x - e.x0) / (e.x1 - e.x0)) * (e.z1 - e.z0));

/** Analytic vertical-slab union of any finite set of convex polygons, not sampling.
 * Vertex/intersection x values partition linear edge order; interval-union length
 * is linear on each open slab, so midpoint length * slab width is its exact integral.
 */
export function sweepShadowUnionArea(polygons: readonly (readonly Point2[])[]): number {
  const origin = polygons.find((p) => p.length)?.[0];
  if (!origin) return 0;
  const edges: Edge[] = [], xs: number[] = [];
  let polygonCount = 0;
  for (const polygon of polygons) {
    const points = deduplicatePolygonVertices(polygon.map((p) => ({ xM: finite(p.xM - origin.xM), zM: finite(p.zM - origin.zM) })));
    if (polygonAreaM2(points) === 0) continue;
    let winding = 0;
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i]!, b = points[(i + 1) % points.length]!, c = points[(i + 2) % points.length]!;
      const cross = finite((b.xM - a.xM) * (c.zM - b.zM) - (b.zM - a.zM) * (c.xM - b.xM));
      if (cross !== 0) {
        if (winding && Math.sign(cross) !== winding && Math.abs(cross) > GEOMETRY_EPSILON) throw new RangeError("shadow sweep requires convex polygons");
        if (Math.abs(cross) > GEOMETRY_EPSILON) winding = Math.sign(cross);
      }
      xs.push(a.xM);
      // Vertical edges already contribute their x breakpoint, never divide by dx=0.
      if (a.xM !== b.xM) {
        const [l, r] = a.xM < b.xM ? [a, b] : [b, a];
        edges.push({ x0: l.xM, x1: r.xM, z0: l.zM, z1: r.zM, polygon: polygonCount });
      }
    }
    polygonCount += 1;
  }
  if (!edges.length) return 0;
  for (let i = 0; i < edges.length; i += 1) {
    const a = edges[i]!;
    for (let j = i + 1; j < edges.length; j += 1) {
      const b = edges[j]!;
      if (a.polygon === b.polygon) continue;
      const lo = Math.max(a.x0, b.x0), hi = Math.min(a.x1, b.x1);
      if (lo >= hi) continue;
      const d0 = finite(height(a, lo) - height(b, lo)), d1 = finite(height(a, hi) - height(b, hi));
      if ((d0 < 0 && d1 > 0) || (d0 > 0 && d1 < 0)) {
        // Scale before adding to avoid overflow in the interpolation denominator.
        const scale = Math.max(Math.abs(d0), Math.abs(d1));
        const t = (Math.abs(d0) / scale) / (Math.abs(d0) / scale + Math.abs(d1) / scale);
        xs.push(finite(lo + t * (hi - lo)));
      }
    }
  }
  xs.sort((a, b) => a - b);
  // Deduplicate only roundoff-equivalent x values, capped by the existing epsilon.
  // Do not erase a narrow real slab just because its width is < 1e-9 metres.
  const tolerance = Math.min(GEOMETRY_EPSILON, Number.EPSILON * Math.max(1, xs.at(-1)! - xs[0]!) * 2);
  const breaks: number[] = [];
  for (const x of xs) if (!breaks.length || x - breaks.at(-1)! > tolerance) breaks.push(x);
  let area = 0, correction = 0;
  for (let i = 1; i < breaks.length; i += 1) {
    const lo = breaks[i - 1]!, hi = breaks[i]!, x = lo + (hi - lo) / 2;
    if (x <= lo || x >= hi) throw new RangeError("unresolved shadow sweep slab");
    const lows = Array<number>(polygonCount).fill(Infinity), highs = Array<number>(polygonCount).fill(-Infinity);
    for (const e of edges) if (e.x0 < x && e.x1 > x) {
      const z = height(e, x);
      lows[e.polygon] = Math.min(lows[e.polygon]!, z);
      highs[e.polygon] = Math.max(highs[e.polygon]!, z);
    }
    const intervals: [number, number][] = [];
    for (let p = 0; p < polygonCount; p += 1) if (highs[p]! > lows[p]!) intervals.push([lows[p]!, highs[p]!]);
    intervals.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let length = 0, bottom = 0, top = 0, started = false;
    for (const [a, b] of intervals) {
      if (!started) { bottom = a; top = b; started = true; }
      else if (a <= top) top = Math.max(top, b);
      else { length += top - bottom; bottom = a; top = b; }
    }
    if (started) length += top - bottom;
    const add = finite(length * (hi - lo)) - correction;
    const next = finite(area + add);
    correction = (next - area) - add;
    area = next;
  }
  return area <= GEOMETRY_EPSILON ? 0 : area;
}

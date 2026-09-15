import {
  calculateDirectShadow, clipPolygonToRectangle, deduplicatePolygonVertices as deduplicatePolygon,
  GEOMETRY_EPSILON, openingGeometryMetrics, overhangGeometryMetrics, polygonAreaM2,
  type DirectShadowInput, type DirectShadowResult, type Point2,
} from "../facade-v1";

/** Fin at the opening's left/right jamb. All dimensions in facade-local metres. */
export interface VerticalFinGeometry {
  readonly depthM: number;
  readonly bottomZM: number;
  readonly topZM: number;
}
export interface VerticalFins {
  readonly leftFin?: VerticalFinGeometry;
  readonly rightFin?: VerticalFinGeometry;
}
export interface DirectShadowV2Input extends DirectShadowInput, VerticalFins {}
export interface SurfaceShadow {
  readonly surface: "overhang" | "leftFin" | "rightFin";
  /** Clipped coordinates relative to opening center x / sill z, not world datum. */
  readonly polygon: readonly Point2[];
  readonly areaM2: number;
}
export interface DirectShadowV2Result extends DirectShadowResult {
  /** Inherited singular polygon fields describe the overhang, NOT the union. */
  readonly surfaceShadows: readonly SurfaceShadow[];
}

export function validateVerticalFin(fin: VerticalFinGeometry): void {
  if (![fin.depthM, fin.bottomZM, fin.topZM, fin.topZM - fin.bottomZM].every(Number.isFinite) ||
      fin.depthM < 0 || fin.topZM <= fin.bottomZM) {
    throw new RangeError("fin requires finite depth >= 0 and top > bottom [m]");
  }
}
export function validateVerticalFins(fins: VerticalFins): void {
  if (fins.leftFin !== undefined) validateVerticalFin(fins.leftFin);
  if (fins.rightFin !== undefined) validateVerticalFin(fins.rightFin);
}
export function hasActiveFins(fins: VerticalFins): boolean {
  return (fins.leftFin?.depthM ?? 0) > 0 || (fins.rightFin?.depthM ?? 0) > 0;
}

/** Convex intersection in opening-local coordinates. Either polygon winding works. */
export function intersectConvexPolygons(subject: readonly Point2[], clip: readonly Point2[]): readonly Point2[] {
  if (polygonAreaM2(subject) === 0 || polygonAreaM2(clip) === 0) return [];
  // Work about the first vertex to avoid absolute-datum cancellation.
  const origin = clip[0]!;
  let signed = 0;
  for (let i = 1; i + 1 < clip.length; i += 1) {
    const a = clip[i]!;
    const b = clip[i + 1]!;
    signed += (a.xM - origin.xM) * (b.zM - origin.zM) - (a.zM - origin.zM) * (b.xM - origin.xM);
  }
  if (!Number.isFinite(signed) || signed === 0) throw new RangeError("unresolved convex orientation");
  const sign = Math.sign(signed);
  let output = [...subject];
  for (let i = 0; i < clip.length && output.length > 0; i += 1) {
    const a = clip[i]!;
    const b = clip[(i + 1) % clip.length]!;
    const length = Math.hypot(b.xM - a.xM, b.zM - a.zM);
    if (!Number.isFinite(length)) throw new RangeError("convex edge exceeds finite range");
    if (length <= GEOMETRY_EPSILON) continue;
    const dx = (b.xM - a.xM) / length;
    const dz = (b.zM - a.zM) / length;
    const distance = (p: Point2): number => sign * (dx * (p.zM - a.zM) - dz * (p.xM - a.xM));
    const input = output;
    output = [];
    let previous = input[input.length - 1]!;
    let before = distance(previous);
    for (const current of input) {
      const after = distance(current);
      if (![before, after].every(Number.isFinite)) throw new RangeError("non-finite convex distance");
      if ((before >= 0) !== (after >= 0)) {
        const denominator = before - after;
        if (!Number.isFinite(denominator) || denominator === 0) throw new RangeError("unresolved convex intersection");
        const t = before / denominator;
        output.push({ xM: (1 - t) * previous.xM + t * current.xM, zM: (1 - t) * previous.zM + t * current.zM });
      }
      if (after >= 0) output.push(current);
      previous = current;
      before = after;
    }
    output = [...deduplicatePolygon(output)];
  }
  return output;
}

/** At most three convex polygons: sum singles - pairs + triple. No raster estimate. */
export function convexShadowUnionArea(polygons: readonly (readonly Point2[])[]): number {
  if (polygons.length > 3) throw new RangeError("direct shadow union supports at most three surfaces");
  let area = polygons.reduce((sum, polygon) => sum + polygonAreaM2(polygon), 0);
  for (let i = 0; i < polygons.length; i += 1) {
    for (let j = i + 1; j < polygons.length; j += 1) {
      area -= polygonAreaM2(intersectConvexPolygons(polygons[i]!, polygons[j]!));
    }
  }
  if (polygons.length === 3) {
    area += polygonAreaM2(intersectConvexPolygons(intersectConvexPolygons(polygons[0]!, polygons[1]!), polygons[2]!));
  }
  if (!Number.isFinite(area)) throw new RangeError("shadow union area must remain finite");
  return area;
}

export function calculateDirectShadowV2(input: DirectShadowV2Input): DirectShadowV2Result {
  validateVerticalFins(input);
  // Preserve v1 exactly, including its geometry validation and epsilon contract.
  if (!hasActiveFins(input)) return { ...calculateDirectShadow(input), surfaceShadows: [] };
  const metrics = openingGeometryMetrics(input.opening);
  if (input.overhang !== undefined) overhangGeometryMetrics(input.opening, input.overhang);
  const opening = { centerXM: 0, widthM: input.opening.widthM, sillZM: 0, headZM: metrics.heightM };
  const localOverhang = input.overhang === undefined ? undefined : {
    ...input.overhang, elevationZM: input.overhang.elevationZM - input.opening.sillZM,
  };
  const local = calculateDirectShadow({ ...input, opening, overhang: localOverhang });
  // Project once in a small local frame; restore legacy singular polygons for callers.
  const worldPolygon = (polygon: readonly Point2[]) => polygon.map((p) => {
    const point = { xM: p.xM + input.opening.centerXM, zM: p.zM + input.opening.sillZM };
    if (!Number.isFinite(point.xM) || !Number.isFinite(point.zM)) throw new RangeError("world projection exceeds finite geometry range");
    return point;
  });
  const original = { ...local, shadowPolygon: worldPolygon(local.shadowPolygon), clippedShadowPolygon: worldPolygon(local.clippedShadowPolygon) };
  if (!local.frontFacing) return { ...original, surfaceShadows: [] };
  const bounds = openingGeometryMetrics(opening).bounds;
  const shadows: SurfaceShadow[] = [];
  if (local.clippedShadowPolygon.length >= 3) shadows.push({ surface: "overhang", polygon: local.clippedShadowPolygon, areaM2: polygonAreaM2(local.clippedShadowPolygon) });
  const sun = original.facadeLocalSunVector;
  for (const surface of ["leftFin", "rightFin"] as const) {
    const fin = input[surface];
    if (fin === undefined || fin.depthM === 0) continue;
    const x = surface === "leftFin" ? bounds.leftM : bounds.rightM;
    const bottom = fin.bottomZM - input.opening.sillZM;
    const top = fin.topZM - input.opening.sillZM;
    const offsetX = fin.depthM * sun.x / sun.y;
    const dropZ = fin.depthM * sun.z / sun.y;
    const projected = [
      { xM: x, zM: bottom }, { xM: x, zM: top },
      { xM: x - offsetX, zM: top - dropZ }, { xM: x - offsetX, zM: bottom - dropZ },
    ];
    if (!projected.every((p) => Number.isFinite(p.xM) && Number.isFinite(p.zM))) throw new RangeError("fin projection exceeds finite geometry range");
    const polygon = clipPolygonToRectangle(projected, bounds);
    const areaM2 = polygonAreaM2(polygon);
    if (areaM2 > 0) shadows.push({ surface, polygon, areaM2 });
  }
  const unionArea = convexShadowUnionArea(shadows.map((shadow) => shadow.polygon));
  const fraction = unionArea / metrics.areaM2;
  if (!Number.isFinite(fraction) || fraction < -GEOMETRY_EPSILON || fraction > 1 + GEOMETRY_EPSILON) {
    throw new RangeError("direct shadow union outside opening area");
  }
  // Only the existing documented epsilon boundary is snapped, never arbitrary clamp.
  const shaded = fraction <= GEOMETRY_EPSILON ? 0 : fraction >= 1 - GEOMETRY_EPSILON ? 1 : fraction;
  return { ...original, shadedAreaM2: shaded * metrics.areaM2, directShadedFraction: shaded, directLitFraction: 1 - shaded, surfaceShadows: shadows };
}

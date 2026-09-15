import type { Point2, Rectangle2 } from "./types";

export const GEOMETRY_EPSILON = 1e-9;

function assertFinitePoint(point: Point2): void {
  if (!Number.isFinite(point.xM) || !Number.isFinite(point.zM)) {
    throw new RangeError("polygon coordinates must be finite");
  }
}

function pointsEqual(a: Point2, b: Point2): boolean {
  return (
    Math.abs(a.xM - b.xM) <= GEOMETRY_EPSILON &&
    Math.abs(a.zM - b.zM) <= GEOMETRY_EPSILON
  );
}

export function deduplicatePolygonVertices(
  polygon: readonly Point2[],
): readonly Point2[] {
  const result: Point2[] = [];
  for (const point of polygon) {
    assertFinitePoint(point);
    const previous = result.at(-1);
    if (previous === undefined || !pointsEqual(previous, point)) {
      result.push({ xM: point.xM, zM: point.zM });
    }
  }
  if (
    result.length > 1 &&
    result[0] !== undefined &&
    result.at(-1) !== undefined &&
    pointsEqual(result[0], result.at(-1)!)
  ) {
    result.pop();
  }
  return result;
}

export function polygonAreaM2(polygon: readonly Point2[]): number {
  const points = deduplicatePolygonVertices(polygon);
  if (points.length < 3) return 0;
  let twiceSignedArea = 0;
  let absoluteProducts = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!;
    const next = points[(index + 1) % points.length]!;
    twiceSignedArea += current.xM * next.zM - next.xM * current.zM;
    absoluteProducts += Math.abs(current.xM * next.zM) + Math.abs(next.xM * current.zM);
  }
  // Preserve existing normal-scale arithmetic exactly. If its conservative
  // roundoff estimate exceeds the unchanged area resolution, evaluate the
  // same translation-invariant shoelace formula about a local origin instead.
  const roundoffBoundM2 = Number.EPSILON * (points.length + 2) * absoluteProducts / 2;
  if (roundoffBoundM2 > GEOMETRY_EPSILON || !Number.isFinite(twiceSignedArea)) {
    const origin = points[0]!;
    twiceSignedArea = 0;
    for (let index = 0; index < points.length; index += 1) {
      const current = points[index]!;
      const next = points[(index + 1) % points.length]!;
      twiceSignedArea += (current.xM - origin.xM) * (next.zM - origin.zM) -
        (next.xM - origin.xM) * (current.zM - origin.zM);
    }
  }
  const area = Math.abs(twiceSignedArea) / 2;
  if (!Number.isFinite(area)) throw new RangeError("polygon area must remain finite");
  return area <= GEOMETRY_EPSILON ? 0 : area;
}

type Boundary = {
  readonly inside: (point: Point2) => boolean;
  readonly intersect: (start: Point2, end: Point2) => Point2;
};

function clipAgainstBoundary(
  polygon: readonly Point2[],
  boundary: Boundary,
): readonly Point2[] {
  if (polygon.length === 0) return [];
  const output: Point2[] = [];
  let start = polygon.at(-1)!;
  let startInside = boundary.inside(start);
  for (const end of polygon) {
    const endInside = boundary.inside(end);
    if (endInside) {
      if (!startInside) output.push(boundary.intersect(start, end));
      output.push(end);
    } else if (startInside) {
      output.push(boundary.intersect(start, end));
    }
    start = end;
    startInside = endInside;
  }
  return deduplicatePolygonVertices(output);
}

function interpolateAtX(start: Point2, end: Point2, xM: number): Point2 {
  const deltaX = end.xM - start.xM;
  if (Math.abs(deltaX) <= GEOMETRY_EPSILON) {
    return { xM, zM: start.zM };
  }
  const ratio = (xM - start.xM) / deltaX;
  return { xM, zM: start.zM + ratio * (end.zM - start.zM) };
}

function interpolateAtZ(start: Point2, end: Point2, zM: number): Point2 {
  const deltaZ = end.zM - start.zM;
  if (Math.abs(deltaZ) <= GEOMETRY_EPSILON) {
    return { xM: start.xM, zM };
  }
  const ratio = (zM - start.zM) / deltaZ;
  return { xM: start.xM + ratio * (end.xM - start.xM), zM };
}

function validateRectangle(rectangle: Rectangle2): void {
  const values = [
    rectangle.leftM,
    rectangle.rightM,
    rectangle.bottomM,
    rectangle.topM,
  ];
  if (values.some((value) => !Number.isFinite(value))) {
    throw new RangeError("clip rectangle coordinates must be finite");
  }
  if (
    rectangle.rightM <= rectangle.leftM ||
    rectangle.topM <= rectangle.bottomM
  ) {
    throw new RangeError("clip rectangle must have positive width and height");
  }
}

export function clipPolygonToRectangle(
  polygon: readonly Point2[],
  rectangle: Rectangle2,
): readonly Point2[] {
  validateRectangle(rectangle);
  let clipped = deduplicatePolygonVertices(polygon);
  const boundaries: readonly Boundary[] = [
    {
      inside: (point) => point.xM >= rectangle.leftM - GEOMETRY_EPSILON,
      intersect: (start, end) => interpolateAtX(start, end, rectangle.leftM),
    },
    {
      inside: (point) => point.xM <= rectangle.rightM + GEOMETRY_EPSILON,
      intersect: (start, end) => interpolateAtX(start, end, rectangle.rightM),
    },
    {
      inside: (point) => point.zM >= rectangle.bottomM - GEOMETRY_EPSILON,
      intersect: (start, end) => interpolateAtZ(start, end, rectangle.bottomM),
    },
    {
      inside: (point) => point.zM <= rectangle.topM + GEOMETRY_EPSILON,
      intersect: (start, end) => interpolateAtZ(start, end, rectangle.topM),
    },
  ];
  for (const boundary of boundaries) {
    clipped = clipAgainstBoundary(clipped, boundary);
  }
  return deduplicatePolygonVertices(clipped);
}

import { describe, expect, it } from "vitest";

import {
  clipPolygonToRectangle,
  deduplicatePolygonVertices,
  polygonAreaM2,
} from "../src/geometry";

const UNIT_RECTANGLE = {
  leftM: 0,
  rightM: 1,
  bottomM: 0,
  topM: 1,
} as const;

describe("facade-v1 polygon primitives", () => {
  it("P1 computes polygon area using the shoelace formula", () => {
    expect(
      polygonAreaM2([
        { xM: 0, zM: 0 },
        { xM: 2, zM: 0 },
        { xM: 2, zM: 2 },
        { xM: 0, zM: 2 },
      ]),
    ).toBe(4);
  });

  it("P2 clips a polygon to an axis-aligned rectangle", () => {
    const clipped = clipPolygonToRectangle(
      [
        { xM: -1, zM: 0.25 },
        { xM: 2, zM: 0.25 },
        { xM: 2, zM: 0.75 },
        { xM: -1, zM: 0.75 },
      ],
      UNIT_RECTANGLE,
    );
    expect(polygonAreaM2(clipped)).toBeCloseTo(0.5, 12);
  });

  it("P3 returns an empty intersection for separated polygons", () => {
    const clipped = clipPolygonToRectangle(
      [
        { xM: 2, zM: 2 },
        { xM: 3, zM: 2 },
        { xM: 3, zM: 3 },
        { xM: 2, zM: 3 },
      ],
      UNIT_RECTANGLE,
    );
    expect(clipped).toEqual([]);
    expect(polygonAreaM2(clipped)).toBe(0);
  });

  it("P4 preserves a full intersection", () => {
    const polygon = [
      { xM: 0.2, zM: 0.2 },
      { xM: 0.8, zM: 0.2 },
      { xM: 0.8, zM: 0.8 },
      { xM: 0.2, zM: 0.8 },
    ];
    expect(polygonAreaM2(clipPolygonToRectangle(polygon, UNIT_RECTANGLE))).toBeCloseTo(
      0.36,
      12,
    );
  });

  it("P5 treats edge-only contact as zero area", () => {
    const clipped = clipPolygonToRectangle(
      [
        { xM: 1, zM: 0 },
        { xM: 2, zM: 0 },
        { xM: 2, zM: 1 },
        { xM: 1, zM: 1 },
      ],
      UNIT_RECTANGLE,
    );
    expect(polygonAreaM2(clipped)).toBe(0);
  });

  it("P6 removes numerically duplicate adjacent and closing vertices", () => {
    const deduplicated = deduplicatePolygonVertices([
      { xM: 0, zM: 0 },
      { xM: 1e-10, zM: -1e-10 },
      { xM: 1, zM: 0 },
      { xM: 1, zM: 1 },
      { xM: 0, zM: 1 },
      { xM: 0, zM: 0 },
    ]);
    expect(deduplicated).toHaveLength(4);
    expect(polygonAreaM2(deduplicated)).toBe(1);
  });
});

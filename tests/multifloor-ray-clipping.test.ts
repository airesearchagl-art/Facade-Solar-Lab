import { describe, expect, it } from "vitest";

import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import { clipFloorReferenceRay, createMultiFloorDemoWorkspace, createMultiFloorReferences, positionFloors } from "../src/multifloor";

describe("floor-local reference ray display clipping (not simulation)", () => {
  it("retains an in-band wall intersection, including horizontal and zero-depth rays", () => {
    for (const depth of [0, 2]) {
      for (const raw of [6, 8, 9, 10]) {
        expect(clipFloorReferenceRay(depth, 9, raw, 6, 10)).toEqual({
          displayEndZM: raw, displayEndDepthM: 0, wasFloorClipped: false,
        });
      }
    }
  });

  it("clips at the floor base along the original line, not at wall depth zero", () => {
    // Hand-derived: (depth,z)=(2,9) -> (0,3), base=6: t=1/2 -> (1,6).
    const end = clipFloorReferenceRay(2, 9, 3, 6, 10)!;
    expect(end).toEqual({ displayEndZM: 6, displayEndDepthM: 1, wasFloorClipped: true });
    expect((end.displayEndZM - 9) / (end.displayEndDepthM - 2)).toBe((3 - 9) / (0 - 2));
  });

  it("also respects the upper band and a tip exactly on the lower boundary", () => {
    expect(clipFloorReferenceRay(2, 9, 11, 6, 10)).toEqual({ displayEndZM: 10, displayEndDepthM: 1, wasFloorClipped: true });
    expect(clipFloorReferenceRay(2, 6, 3, 6, 10)).toEqual({ displayEndZM: 6, displayEndDepthM: 2, wasFloorClipped: true });
  });

  it("rejects non-finite/invalid bands and out-of-band tips rather than emitting NaN or extrapolating", () => {
    const valid = [2, 9, 3, 6, 10] as const;
    for (let index = 0; index < valid.length; index++) {
      for (const bad of [NaN, Infinity, -Infinity]) {
        const values: [number, number, number, number, number] = [...valid];
        values[index] = bad;
        expect(clipFloorReferenceRay(...values)).toBeNull();
      }
    }
    expect(clipFloorReferenceRay(2, 3, 1, 6, 10)).toBeNull(); // Would require t < 0.
    expect(clipFloorReferenceRay(2, 3, 5, 6, 10)).toBeNull(); // Would require t > 1.
    expect(clipFloorReferenceRay(2, 3, 3, 6, 10)).toBeNull(); // Horizontal outside band.
    expect(clipFloorReferenceRay(2, 9, 3, 6, 6)).toBeNull();
    expect(clipFloorReferenceRay(2, 9, 3, 10, 6)).toBeNull();
    expect(clipFloorReferenceRay(-1, 9, 3, 6, 10)).toBeNull();
    expect(clipFloorReferenceRay(2, 1e308, -1e308, 0, 1e308)).toBeNull(); // Overflowing denominator.
  });

  const dataset = createDemoWeatherDataset();
  const original = createMultiFloorDemoWorkspace().cases[1]!;
  const deep = { ...original, floors: original.floors.map((floor, index) => ({ ...floor, overhang: { ...floor.overhang!, depthM: 10 + index * 5 } })) };

  it.each([0, 1, 2])("keeps both solstice rays of story index %i inside that floor, with slope preserved", (index) => {
    const before = JSON.stringify(deep);
    const { floor, baseZM, topZM } = positionFloors(deep)[index]!;
    const rays = createMultiFloorReferences(dataset, deep).filter(ray => ray.floorId === floor.id);
    expect(rays.map(ray => ray.reference.dateLabel)).toEqual(["6/21", "12/21"]);
    for (const ray of rays) {
      expect(ray.wasFloorClipped).toBe(true);
      expect(ray.rawIntersectionZM).toBeLessThan(baseZM);
      expect(ray.startZM).toBeGreaterThanOrEqual(baseZM);
      expect(ray.startZM).toBeLessThanOrEqual(topZM);
      expect(ray.displayEndZM).toBe(baseZM);
      expect(ray.displayEndDepthM).toBeGreaterThan(0);
      expect(ray.displayEndDepthM).toBeLessThan(ray.depthM);
      const t = (ray.depthM - ray.displayEndDepthM) / ray.depthM;
      expect(ray.startZM + t * (ray.rawIntersectionZM - ray.startZM)).toBeCloseTo(baseZM, 10);
      expect(ray.rawIntersectionZM).toBe(baseZM + ray.reference.overhangTipFacadeIntersectionZM!);
    }
    expect(JSON.stringify(deep)).toBe(before);
  });

  it("omits only the no-overhang floor and leaves normal winter references uncut", () => {
    const noMiddle = { ...original, floors: original.floors.map((floor, index) => index === 1 ? { ...floor, overhang: undefined } : floor) };
    const rays = createMultiFloorReferences(dataset, noMiddle);
    expect(rays.map(ray => ray.floorId)).toEqual(["floor-1", "floor-1", "floor-3", "floor-3"]);
    expect(rays.filter(ray => ray.reference.dateLabel === "12/21").every(ray => !ray.wasFloorClipped && ray.displayEndZM === ray.rawIntersectionZM && ray.displayEndDepthM === 0)).toBe(true);
  });
});

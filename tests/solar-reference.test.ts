import { describe, expect, it } from "vitest";

import { DEMO_BASELINE_PARAMETERS } from "../src/demo/demo-scenario";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import {
  createFacadeSolsticeReferences,
  findReferenceSolarNoon,
} from "../src/solar-reference";

const dataset = createDemoWeatherDataset();

describe("facade-relative solstice references", () => {
  it("deterministically finds finite June and December reference solar noons", () => {
    const first = createFacadeSolsticeReferences({
      dataset,
      facadeAzimuthDegFromNorth: 180,
      overhang: DEMO_BASELINE_PARAMETERS.overhang,
    });
    const second = createFacadeSolsticeReferences({
      dataset,
      facadeAzimuthDegFromNorth: 180,
      overhang: DEMO_BASELINE_PARAMETERS.overhang,
    });

    expect(first).toEqual(second);
    expect(first.map((item) => [item.dateLabel, item.solarNoon.month, item.solarNoon.day])).toEqual([
      ["6/21", 6, 21],
      ["12/21", 12, 21],
    ]);
    for (const item of first) {
      expect(item.solarNoon.minuteOfDay % 5).toBe(0);
      expect(Number.isFinite(item.solarNoon.position.elevationDeg)).toBe(true);
      expect(Number.isFinite(item.solarNoon.position.azimuthDeg)).toBe(true);
      expect(item.frontFacing).toBe(true);
      expect(Number.isFinite(item.profileAngleDeg)).toBe(true);
      expect(Number.isFinite(item.overhangTipFacadeIntersectionZM)).toBe(true);
    }
    expect(first[0]!.solarNoon.position.elevationDeg).toBeGreaterThan(
      first[1]!.solarNoon.position.elevationDeg,
    );
  });

  it("finds the maximum elevation within the bounded five-minute scan", () => {
    const solarNoon = findReferenceSolarNoon(dataset.location, 2001, 6, 21);
    const previous = findReferenceSolarNoon(dataset.location, 2001, 6, 21, 10);

    expect(solarNoon.minuteOfDay).toBeGreaterThan(0);
    expect(solarNoon.minuteOfDay).toBeLessThan(1440);
    expect(solarNoon.position.elevationDeg).toBeGreaterThanOrEqual(
      previous.position.elevationDeg,
    );
  });

  it("marks north-facing noon sun as back-facing", () => {
    const references = createFacadeSolsticeReferences({
      dataset,
      facadeAzimuthDegFromNorth: 0,
      overhang: DEMO_BASELINE_PARAMETERS.overhang,
    });

    for (const item of references) {
      expect(item.frontFacing).toBe(false);
      expect(item.profileAngleDeg).toBeNull();
      expect(item.overhangTipFacadeIntersectionZM).toBeNull();
    }
  });

  it("moves the facade intersection downward as overhang depth increases", () => {
    const shallow = createFacadeSolsticeReferences({
      dataset,
      facadeAzimuthDegFromNorth: 180,
      overhang: { ...DEMO_BASELINE_PARAMETERS.overhang!, depthM: 0.8 },
    });
    const deep = createFacadeSolsticeReferences({
      dataset,
      facadeAzimuthDegFromNorth: 180,
      overhang: { ...DEMO_BASELINE_PARAMETERS.overhang!, depthM: 1.6 },
    });

    for (let index = 0; index < shallow.length; index += 1) {
      expect(deep[index]!.overhangTipFacadeIntersectionZM!).toBeLessThan(
        shallow[index]!.overhangTipFacadeIntersectionZM!,
      );
    }
  });
});

import { describe, expect, it } from "vitest";

import {
  calculateFacadeV1IntervalIrradiance,
  calculateWeatherIntervalIrradiance,
  simulateFacadeV1,
  simulateWeatherV1,
  type FacadeV1Parameters,
  type WeatherV1Parameters,
} from "../src/engine";
import { parseEpw } from "../src/weather";
import subhourFixture from "./fixtures/weather/synthetic-subhour.epw?raw";

const FACADE_PARAMETERS: FacadeV1Parameters = {
  facadeAzimuthDegFromNorth: 180,
  opening: { centerXM: 0, widthM: 1, sillZM: 0, headZM: 2 },
  solarHeatGainCoefficient: 0.5,
  groundReflectance: 0.2,
};

const WEATHER_PARAMETERS: WeatherV1Parameters = {
  surfaceAzimuthDegFromNorth: 180,
  windowWidthM: 1,
  windowHeightM: 2,
  overhangDepthM: 0,
  overhangToWindowHeadM: 0,
  solarHeatGainCoefficient: 0.5,
  groundReflectance: 0.2,
};

describe("facade-v1 weather integration", () => {
  it("C1 exactly preserves M2 interval accounting when D=0", () => {
    const dataset = parseEpw(subhourFixture, { sourceName: "synthetic-subhour" });
    const m2 = simulateWeatherV1(dataset, WEATHER_PARAMETERS);
    const m3 = simulateFacadeV1(dataset, FACADE_PARAMETERS);

    expect(m3.summary).toEqual(m2.summary);
    expect(m3.monthly).toEqual(m2.monthly);
    expect(m3.weatherSource).toBe(dataset.provenance);
    expect(m3.weatherDatasetId).toBe(dataset.id);
    expect(m3.modelVersion).toBe("facade-v1-weather");
    expect(m3.geometryVersion).toBe("facade-v1");
    expect(m3.directShadingModel).toBe(
      "finite-rectangular-overhang-shadow-polygon-v1",
    );
    expect(m3.diffuseShadingModel).toBe("isotropic-2d-infinite-width-v1");
    expect(m3.groundReflectionModel).toBe("ghi-ground-reflection-0.5-v1");
  });

  it("sets direct gain to zero for an above-horizon sun behind the facade", () => {
    const irradiance = calculateFacadeV1IntervalIrradiance(
      FACADE_PARAMETERS,
      {
        globalHorizontalWhPerM2: 0,
        directNormalWhPerM2: 500,
        diffuseHorizontalWhPerM2: 0,
      },
      { azimuthDeg: 0, elevationDeg: 45 },
    );
    expect(irradiance.factors.directShadow.frontFacing).toBe(false);
    expect(irradiance.factors.beamIncidenceFactor).toBe(0);
    expect(irradiance.directWithOverhangWhPerM2).toBe(0);
    expect(irradiance.directWithoutOverhangWhPerM2).toBe(0);
  });

  it("uses finite direct shade while retaining the explicit diffuse/ground boundary", () => {
    const irradiance = calculateFacadeV1IntervalIrradiance(
      {
        ...FACADE_PARAMETERS,
        overhang: {
          depthM: 1,
          elevationZM: 2,
          leftExtensionM: 0,
          rightExtensionM: 0,
        },
      },
      {
        globalHorizontalWhPerM2: 100,
        directNormalWhPerM2: 100,
        diffuseHorizontalWhPerM2: 100,
      },
      { azimuthDeg: 180, elevationDeg: 45 },
    );
    expect(irradiance.factors.directShadow.directShadedFraction).toBeCloseTo(0.5, 12);
    expect(irradiance.directWithOverhangWhPerM2).toBeCloseTo(
      irradiance.directWithoutOverhangWhPerM2 * 0.5,
      12,
    );
    expect(irradiance.diffuseWithOverhangWhPerM2).toBeLessThan(
      irradiance.diffuseWithoutOverhangWhPerM2,
    );
    expect(irradiance.groundReflectedWhPerM2).toBe(10);
  });

  it("C2 distinguishes exact infinite-width geometry from M2 strip discretization", () => {
    const radiation = {
      globalHorizontalWhPerM2: 0,
      directNormalWhPerM2: 100,
      diffuseHorizontalWhPerM2: 0,
    };
    const solar = {
      algorithm: "noaa-fractional-year-v1" as const,
      fractionalYearDays: 365 as const,
      equationOfTimeMinutes: 0,
      declinationDeg: 0,
      trueSolarMinuteOfDay: 720,
      hourAngleDeg: 0,
      zenithDeg: 45,
      elevationDeg: 45,
      apparentElevationDeg: 45,
      azimuthDeg: 135,
      cosineOfZenith: Math.SQRT1_2,
      isAboveHorizon: true,
    };
    const m2 = calculateWeatherIntervalIrradiance(
      {
        ...WEATHER_PARAMETERS,
        windowWidthM: 2,
        overhangDepthM: 1,
      },
      radiation,
      solar,
    );
    const m3 = calculateFacadeV1IntervalIrradiance(
      {
        ...FACADE_PARAMETERS,
        opening: { centerXM: 0, widthM: 2, sillZM: 0, headZM: 2 },
        overhang: {
          depthM: 1,
          elevationZM: 2,
          leftExtensionM: 100,
          rightExtensionM: 100,
        },
      },
      radiation,
      solar,
    );

    expect(m2.factors.directLitFraction).toBe(0.3);
    expect(m3.factors.directShadow.directShadedFraction).toBeCloseTo(
      Math.SQRT2 / 2,
      12,
    );
    expect(m3.directWithOverhangWhPerM2).not.toBe(
      m2.directWithOverhangWhPerM2,
    );
  });

  it("C3 records a direct-gain difference between finite and very wide overhangs", () => {
    const base = {
      ...FACADE_PARAMETERS,
      opening: { centerXM: 0, widthM: 2, sillZM: 0, headZM: 2 },
    };
    const radiation = {
      globalHorizontalWhPerM2: 0,
      directNormalWhPerM2: 100,
      diffuseHorizontalWhPerM2: 0,
    };
    const solar = { azimuthDeg: 135, elevationDeg: 45 };
    const finite = calculateFacadeV1IntervalIrradiance(
      {
        ...base,
        overhang: {
          depthM: 1,
          elevationZM: 2,
          leftExtensionM: 0,
          rightExtensionM: 0,
        },
      },
      radiation,
      solar,
    );
    const wide = calculateFacadeV1IntervalIrradiance(
      {
        ...base,
        overhang: {
          depthM: 1,
          elevationZM: 2,
          leftExtensionM: 100,
          rightExtensionM: 100,
        },
      },
      radiation,
      solar,
    );

    expect(finite.directWithOverhangWhPerM2).toBeGreaterThan(
      wide.directWithOverhangWhPerM2,
    );
    expect(finite.factors.directShadow.directShadedFraction).toBeLessThan(
      wide.factors.directShadow.directShadedFraction,
    );
  });

  it("rejects invalid facade material inputs and intersecting geometry", () => {
    const radiation = {
      globalHorizontalWhPerM2: 0,
      directNormalWhPerM2: 0,
      diffuseHorizontalWhPerM2: 0,
    };
    expect(() =>
      calculateFacadeV1IntervalIrradiance(
        { ...FACADE_PARAMETERS, solarHeatGainCoefficient: 1.1 },
        radiation,
        { azimuthDeg: 180, elevationDeg: 45 },
      ),
    ).toThrow(/solarHeatGainCoefficient/u);
    expect(() =>
      calculateFacadeV1IntervalIrradiance(
        {
          ...FACADE_PARAMETERS,
          overhang: {
            depthM: 0,
            elevationZM: 1.9,
            leftExtensionM: 0,
            rightExtensionM: 0,
          },
        },
        radiation,
        { azimuthDeg: 180, elevationDeg: 45 },
      ),
    ).toThrow(/elevationZM/u);
  });
});

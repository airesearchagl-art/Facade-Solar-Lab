import { describe, expect, it } from "vitest";

import {
  calculateFacadeV1IntervalIrradiance,
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

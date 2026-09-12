import { describe, expect, it } from "vitest";

import {
  calculateSolarPosition,
  calculateWeatherIntervalGain,
  calculateWeatherIntervalIrradiance,
  resolveWeatherV1SolarTime,
  simulateWeatherV1,
  type SolarPosition,
  type WeatherV1Parameters,
} from "../src/engine";
import { parseEpw, WeatherDataError } from "../src/weather";
import subhourFixture from "./fixtures/weather/synthetic-subhour.epw?raw";

const PARAMETERS: WeatherV1Parameters = {
  windowHeightM: 2,
  windowWidthM: 1,
  overhangDepthM: 0,
  overhangToWindowHeadM: 0,
  surfaceAzimuthDegFromNorth: 180,
  solarHeatGainCoefficient: 0.5,
  groundReflectance: 0.2,
};

function solar(
  elevationDeg: number,
  azimuthDeg = 180,
  isAboveHorizon = elevationDeg > 0,
): SolarPosition {
  const zenithDeg = 90 - elevationDeg;
  return {
    algorithm: "noaa-fractional-year-v1",
    fractionalYearDays: 365,
    equationOfTimeMinutes: 0,
    declinationDeg: 0,
    trueSolarMinuteOfDay: 720,
    hourAngleDeg: 0,
    zenithDeg,
    elevationDeg,
    apparentElevationDeg: elevationDeg,
    azimuthDeg,
    cosineOfZenith: Math.cos((zenithDeg * Math.PI) / 180),
    isAboveHorizon,
  };
}

describe("weather-v1 interval irradiance and energy", () => {
  it("projects DNI onto a vertical surface with a known incidence factor", () => {
    const result = calculateWeatherIntervalIrradiance(
      { ...PARAMETERS, groundReflectance: 0 },
      {
        globalHorizontalWhPerM2: 0,
        directNormalWhPerM2: 100,
        diffuseHorizontalWhPerM2: 0,
      },
      solar(30),
    );
    expect(result.factors.beamIncidenceFactor).toBeCloseTo(Math.cos(Math.PI / 6));
    expect(result.directWithoutOverhangWhPerM2).toBeCloseTo(86.6025403784);
  });

  it("accounts independently for DNI-only, DHI-only, and GHI ground reflection", () => {
    const dni = calculateWeatherIntervalIrradiance(
      { ...PARAMETERS, groundReflectance: 0 },
      {
        globalHorizontalWhPerM2: 0,
        directNormalWhPerM2: 100,
        diffuseHorizontalWhPerM2: 0,
      },
      solar(0, 180, true),
    );
    const dhi = calculateWeatherIntervalIrradiance(
      { ...PARAMETERS, groundReflectance: 0 },
      {
        globalHorizontalWhPerM2: 0,
        directNormalWhPerM2: 0,
        diffuseHorizontalWhPerM2: 100,
      },
      solar(30),
    );
    const ghi = calculateWeatherIntervalIrradiance(
      PARAMETERS,
      {
        globalHorizontalWhPerM2: 100,
        directNormalWhPerM2: 0,
        diffuseHorizontalWhPerM2: 0,
      },
      solar(-10, 180, false),
    );
    expect(dni.totalWithoutOverhangWhPerM2).toBe(100);
    expect(dhi.totalWithoutOverhangWhPerM2).toBe(50);
    expect(ghi.groundReflectedWhPerM2).toBe(10);
  });

  it("makes D=0 exactly equivalent with and without an overhang", () => {
    const result = calculateWeatherIntervalGain(
      PARAMETERS,
      {
        globalHorizontalWhPerM2: 200,
        directNormalWhPerM2: 300,
        diffuseHorizontalWhPerM2: 50,
      },
      solar(45),
    );
    expect(result.withOverhangKWh).toBe(result.withoutOverhangKWh);
  });

  it("shades direct beam for a sufficiently deep overhang", () => {
    const result = calculateWeatherIntervalIrradiance(
      { ...PARAMETERS, overhangDepthM: 2, groundReflectance: 0 },
      {
        globalHorizontalWhPerM2: 0,
        directNormalWhPerM2: 100,
        diffuseHorizontalWhPerM2: 0,
      },
      solar(60),
    );
    expect(result.factors.directLitFraction).toBe(0);
    expect(result.directWithOverhangWhPerM2).toBe(0);
    expect(result.directWithoutOverhangWhPerM2).toBeGreaterThan(0);
  });

  it("does not multiply sub-hour Wh/m2 interval values by duration again", () => {
    const dataset = parseEpw(subhourFixture, { sourceName: "synthetic-subhour" });
    const result = simulateWeatherV1(dataset, {
      ...PARAMETERS,
      groundReflectance: 0,
    });

    // 4 × 7.5 Wh/m2 DHI × 0.5 sky × 2 m2 × 0.5 SHGC / 1000.
    expect(result.summary.annual.withoutOverhangKWh).toBeCloseTo(0.015, 12);
    expect(result.summary.annual.withOverhangKWh).toBeCloseTo(0.015, 12);
    expect(result.intervalCount).toBe(4);
    expect(result.weatherDatasetId).toBe(dataset.id);
    expect(result.weatherSource).toBe(dataset.provenance);
  });

  it("rejects a dataset with required solar missing", () => {
    const invalid = subhourFixture.replace(",25,50,7.5", ",25,9999,7.5");
    const dataset = parseEpw(invalid, { sourceName: "synthetic-missing" });
    expect(() => simulateWeatherV1(dataset, PARAMETERS)).toThrow(WeatherDataError);
  });

  it("uses year structure rather than mixed EPW source years for a typical-year solar calendar", () => {
    const dataset = parseEpw(subhourFixture, {
      sourceName: "synthetic-subhour",
      sourceType: "synthetic",
    });
    const intervalTime = dataset.intervals[0]!.time;

    expect(
      resolveWeatherV1SolarTime(
        { ...dataset, coverage: "full-year-8760" },
        { ...intervalTime, year: 1988 },
      ).year,
    ).toBe(2001);
    const leapSolarTime = resolveWeatherV1SolarTime(
      { ...dataset, coverage: "full-leap-year-8784" },
      { ...intervalTime, year: 1987 },
    );
    expect(leapSolarTime.year).toBe(2000);
    expect(
      calculateSolarPosition({
        location: dataset.location,
        localStandardTime: leapSolarTime,
      }).fractionalYearDays,
    ).toBe(366);
  });
});

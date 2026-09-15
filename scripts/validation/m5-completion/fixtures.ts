import { createDemoWeatherDataset } from "../../../src/demo/demo-weather";
import { createWeatherIntervalTime, type WeatherDataset, type WeatherInterval } from "../../../src/weather";
import type { MultiFloorCase } from "../../../src/multifloor";
import type { FacadeV1Parameters } from "../../../src/engine";

// Synthetic fixed calendar/radiation, not measured data or a solar-position oracle.
export function syntheticYear(year = 2025, step = 60): WeatherDataset {
  const template = createDemoWeatherDataset();
  const monthDays = [31, year === 2024 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const intervals: WeatherInterval[] = [];
  for (const [index, days] of monthDays.entries()) {
    for (let day = 1; day <= days; day++) {
      for (let end = step; end <= 1440; end += step) {
        intervals.push({
          time: createWeatherIntervalTime(year, index + 1, day, Math.ceil(end / 60), end % 60 || 60, step),
          radiation: { globalHorizontalWhPerM2: 300 * step / 60, directNormalWhPerM2: 500 * step / 60, diffuseHorizontalWhPerM2: 120 * step / 60 },
          dataSourceAndUncertaintyFlags: "SYNTHETIC-VALIDATION", sourceLine: intervals.length + 1,
        });
      }
    }
  }
  return { ...template, id: `synthetic-${year}-${step}`, intervals, recordsPerHour: 60 / step, intervalMinutes: step,
    coverage: step !== 60 ? "full-year-subhour" : year === 2024 ? "full-leap-year-8784" : "full-year-8760" };
}

// Deliberately no multi-floor factory/conversion helper in these independent inputs.
export function independentCase(floorCount: number, variant = 0): MultiFloorCase {
  return {
    id: `case-${variant}`, name: `Case ${variant}`, facadeAzimuthDegFromNorth: 135 + variant * 35,
    groundReflectance: 0.15 + variant * 0.05,
    floors: Array.from({ length: floorCount }, (_, floor) => ({
      id: `f-${floor}`, name: `${floor + 1}F`, floorHeightM: 4 + floor * 0.1,
      opening: { centerXM: floor * 0.3, widthM: 2 + floor * 0.2, heightM: 2 + variant * 0.1, sillHeightM: 0.6 },
      ...(floor % 3 === 1 ? {} : { overhang: { depthM: 0.5 + variant * 0.4 + floor * 0.1, elevationM: 3.2, leftExtensionM: 0.2, rightExtensionM: 0.7 } }),
      solarHeatGainCoefficient: 0.3 + variant * 0.1 + floor * 0.01,
    })),
  };
}

export const parameters: FacadeV1Parameters = {
  facadeAzimuthDegFromNorth: 180,
  opening: { centerXM: 0, widthM: 2, sillZM: 0, headZM: 2 },
  overhang: { depthM: 1, elevationZM: 2, leftExtensionM: 0, rightExtensionM: 0 },
  solarHeatGainCoefficient: 0.5, groundReflectance: 0.2,
};

import type { WeatherDataset, WeatherInterval } from "../weather";
import { createWeatherIntervalTime, daysInMonth } from "../weather";

export const DEMO_WEATHER_DATASET_ID = "synthetic-demo-weather-v1";

const YEAR = 2025;
const MONTHLY_PROFILE = [
  0.58, 0.66, 0.78, 0.9, 1, 0.98, 0.92, 0.88, 0.8, 0.7, 0.6, 0.54,
] as const;
const HOURLY_PROFILE = [
  0, 0, 0, 0, 0, 0.01, 0.06, 0.2, 0.42, 0.66, 0.84, 0.96,
  1, 0.94, 0.8, 0.59, 0.36, 0.16, 0.04, 0, 0, 0, 0, 0,
] as const;

function createRadiation(month: number, rawHour: number) {
  const profile = MONTHLY_PROFILE[month - 1]! * HOURLY_PROFILE[rawHour - 1]!;
  const directNormalWhPerM2 = 680 * profile;
  const diffuseHorizontalWhPerM2 = 105 * profile;
  return {
    globalHorizontalWhPerM2:
      directNormalWhPerM2 * 0.52 + diffuseHorizontalWhPerM2,
    directNormalWhPerM2,
    diffuseHorizontalWhPerM2,
  };
}

function createIntervals(): readonly WeatherInterval[] {
  const intervals: WeatherInterval[] = [];
  for (let month = 1; month <= 12; month += 1) {
    for (let day = 1; day <= daysInMonth(YEAR, month); day += 1) {
      for (let rawHour = 1; rawHour <= 24; rawHour += 1) {
        intervals.push({
          time: createWeatherIntervalTime(YEAR, month, day, rawHour, 60, 60),
          radiation: createRadiation(month, rawHour),
          dataSourceAndUncertaintyFlags: "DEMO",
          sourceLine: intervals.length + 1,
        });
      }
    }
  }
  return intervals;
}

/**
 * Creates a deterministic canonical dataset for product demonstration only.
 * The fixed monthly/hourly profile is not measured weather and performs no
 * solar-position or facade calculation; those remain in facade-v1-weather.
 */
export function createDemoWeatherDataset(): WeatherDataset {
  return {
    id: DEMO_WEATHER_DATASET_ID,
    format: "epw",
    location: {
      city: "デモ地点",
      region: "合成気象データ",
      country: "デモ",
      source: "ローカル生成の合成プロファイル",
      stationId: "SYNTHETIC-DEMO",
      latitudeDeg: 35,
      longitudeDeg: 139,
      timeZoneOffsetHours: 9,
      elevationM: 0,
    },
    recordsPerHour: 1,
    intervalMinutes: 60,
    dataPeriods: [
      {
        name: "デモ用合成気象年",
        startDayOfWeek: "月曜日",
        startMonth: 1,
        startDay: 1,
        endMonth: 12,
        endDay: 31,
      },
    ],
    intervals: createIntervals(),
    coverage: "full-year-8760",
    provenance: {
      sourceType: "synthetic",
      sourceName: "デモ用合成気象データ",
      sourceReference: "generated:facade-solar-lab/demo-weather-v1",
      notes: [
        "UIデモ専用の決定論的な生成プロファイルです。",
        "実測気象ではなく、性能検証用データではありません。",
      ],
    },
    issues: [],
  };
}

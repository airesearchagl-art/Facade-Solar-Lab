import type { WeatherDataPeriod, WeatherLocation } from "../canonical";

export interface EpwHeaders {
  readonly location: WeatherLocation;
  readonly recordsPerHour: number;
  readonly intervalMinutes: number;
  readonly dataPeriods: readonly WeatherDataPeriod[];
  readonly raw: readonly string[];
}

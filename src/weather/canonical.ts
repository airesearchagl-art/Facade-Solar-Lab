import type { WeatherParseIssue } from "./issues";
import type { WeatherSourceProvenance } from "./provenance";
import type { WeatherIntervalTime } from "./time";

export interface WeatherLocation {
  readonly city: string;
  readonly region: string;
  readonly country: string;
  readonly source: string;
  readonly stationId?: string;
  /** North positive [deg]. */
  readonly latitudeDeg: number;
  /** East positive [deg]. */
  readonly longitudeDeg: number;
  /** Hours added to UTC to obtain local standard time. */
  readonly timeZoneOffsetHours: number;
  readonly elevationM: number;
}

export interface WeatherRadiation {
  /** Global horizontal interval energy [Wh/m2 interval]. */
  readonly globalHorizontalWhPerM2: number | null;
  /** Direct-normal interval energy [Wh/m2 interval]. */
  readonly directNormalWhPerM2: number | null;
  /** Diffuse-horizontal interval energy [Wh/m2 interval]. */
  readonly diffuseHorizontalWhPerM2: number | null;
}

export interface WeatherInterval {
  readonly time: WeatherIntervalTime;
  readonly radiation: WeatherRadiation;
  readonly dataSourceAndUncertaintyFlags: string;
  readonly sourceLine: number;
}

export interface WeatherDataPeriod {
  readonly name: string;
  readonly startDayOfWeek: string;
  readonly startMonth: number;
  readonly startDay: number;
  readonly endMonth: number;
  readonly endDay: number;
}

export type WeatherCoverage =
  | "partial"
  | "full-year-8760"
  | "full-leap-year-8784"
  | "full-year-subhour";

export interface WeatherDataset {
  readonly id: string;
  readonly format: "epw";
  readonly location: WeatherLocation;
  readonly recordsPerHour: number;
  readonly intervalMinutes: number;
  readonly dataPeriods: readonly WeatherDataPeriod[];
  readonly intervals: readonly WeatherInterval[];
  readonly coverage: WeatherCoverage;
  readonly provenance: WeatherSourceProvenance;
  readonly issues: readonly WeatherParseIssue[];
}

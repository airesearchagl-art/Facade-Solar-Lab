import type { FacadeLocalSunVector, HorizontalOverhangGeometry } from "../geometry";
import type { SolarPosition } from "../engine/weather-v1";
import type { WeatherDataset, WeatherLocation } from "../weather";

export type SolarReferenceSeason = "summer" | "winter";

export interface SolarReferenceLocation
  extends Pick<
    WeatherLocation,
    "latitudeDeg" | "longitudeDeg" | "timeZoneOffsetHours"
  > {}

export interface SolarNoonReference {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly minuteOfDay: number;
  readonly position: SolarPosition;
}

export interface FacadeSolarReference {
  readonly season: SolarReferenceSeason;
  readonly label: string;
  readonly dateLabel: string;
  readonly solarNoon: SolarNoonReference;
  readonly localSunVector: FacadeLocalSunVector;
  readonly frontFacing: boolean;
  readonly profileAngleDeg: number | null;
  readonly overhangTipFacadeIntersectionZM: number | null;
}

export interface FacadeSolarReferenceInput {
  readonly dataset: Pick<WeatherDataset, "coverage" | "intervals" | "location">;
  readonly facadeAzimuthDegFromNorth: number;
  readonly overhang?: HorizontalOverhangGeometry;
  readonly scanStepMinutes?: number;
}

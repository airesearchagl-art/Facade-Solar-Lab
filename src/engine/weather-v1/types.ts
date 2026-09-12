import type { WeatherLocation } from "../../weather";
import type { LocalStandardTime } from "../../weather/time";

export interface SolarPositionInput {
  readonly location: Pick<
    WeatherLocation,
    "latitudeDeg" | "longitudeDeg" | "timeZoneOffsetHours"
  >;
  readonly localStandardTime: LocalStandardTime;
}

export interface SolarPosition {
  readonly algorithm: "noaa-fractional-year-v1";
  readonly equationOfTimeMinutes: number;
  readonly declinationDeg: number;
  readonly trueSolarMinuteOfDay: number;
  readonly hourAngleDeg: number;
  readonly zenithDeg: number;
  /** Geometric elevation; this drives incidence and shading. */
  readonly elevationDeg: number;
  /** NOAA piecewise approximate atmospheric-refraction correction. */
  readonly apparentElevationDeg: number;
  /** Degrees clockwise from north in [0, 360). */
  readonly azimuthDeg: number;
  readonly cosineOfZenith: number;
  readonly isAboveHorizon: boolean;
}

import { assertWeatherDatasetUsable, type WeatherDataset } from "../weather";

/** Non-cryptographic, versioned 64-bit pair, streamed over canonical values.
 * Not a security digest. Source SHA is retained separately as provenance.
 * Names/IDs do not define content: renaming the same EPW cannot evade duplicates.
 */
function fingerprint() {
  let a = 0x811c9dc5, b = 0x9e3779b9;
  return {
    add(value: unknown) {
      const text = JSON.stringify(value);
      for (let i = 0; i < text.length; i++) {
        a = Math.imul(a ^ text.charCodeAt(i), 0x01000193);
        b = Math.imul(b ^ text.charCodeAt(i), 0x85ebca6b);
      }
      a = Math.imul(a ^ 255, 0x01000193); b = Math.imul(b ^ 255, 0x85ebca6b);
    },
    value: () => `${(a >>> 0).toString(16).padStart(8, "0")}${(b >>> 0).toString(16).padStart(8, "0")}`,
  };
}
export function temporalFingerprint(dataset: WeatherDataset): string {
  const hash = fingerprint();
  hash.add([dataset.recordsPerHour, dataset.intervalMinutes, dataset.intervals.length]);
  for (const { time: t } of dataset.intervals) hash.add([t.month, t.day, t.rawHour, t.rawMinute, t.intervalMinutes]);
  return `slots-v1-${hash.value()}`;
}
export function weatherFingerprint(dataset: WeatherDataset): string {
  const hash = fingerprint();
  const l = dataset.location;
  hash.add([l.latitudeDeg, l.longitudeDeg, l.timeZoneOffsetHours, l.elevationM, dataset.provenance.sourceType,
    dataset.recordsPerHour, dataset.intervalMinutes, dataset.coverage]);
  for (const { time: t, radiation: r } of dataset.intervals) {
    hash.add([t.year, t.month, t.day, t.rawHour, t.rawMinute, t.intervalMinutes,
      t.midpointLocalStandardTime.year, t.midpointLocalStandardTime.month, t.midpointLocalStandardTime.day, t.midpointLocalStandardTime.minuteOfDay,
      r.globalHorizontalWhPerM2, r.directNormalWhPerM2, r.diffuseHorizontalWhPerM2]);
  }
  return `weather-v1-${hash.value()}`;
}
export type Compatibility = "COMPARABLE_FULL_YEAR" | "COMPARABLE_PARTIAL" | "NOT_COMPARABLE";
/** Exact temporal sequence (no year) plus duration, never filename or count alone.
 * Full 8760 vs leap 8784, or hourly vs sub-hour, are deliberately incompatible.
 */
export function weatherCoverageCompatibility(a: Pick<WeatherDescriptor, "coverage" | "temporalFingerprint">,
  b: Pick<WeatherDescriptor, "coverage" | "temporalFingerprint">): Compatibility {
  if (a.temporalFingerprint !== b.temporalFingerprint || (a.coverage === "partial") !== (b.coverage === "partial")) return "NOT_COMPARABLE";
  return a.coverage === "partial" ? "COMPARABLE_PARTIAL" : "COMPARABLE_FULL_YEAR";
}
export interface WeatherDescriptor {
  readonly datasetId: string;
  readonly fingerprint: string;
  readonly temporalFingerprint: string;
  readonly coverage: WeatherDataset["coverage"];
  readonly intervalCount: number;
  readonly provenance: WeatherDataset["provenance"];
  readonly validation: "PASS";
}
export function describeWeather(dataset: WeatherDataset): WeatherDescriptor {
  assertWeatherDatasetUsable(dataset);
  return { datasetId: dataset.id, fingerprint: weatherFingerprint(dataset), temporalFingerprint: temporalFingerprint(dataset),
    coverage: dataset.coverage, intervalCount: dataset.intervals.length,
    provenance: { ...dataset.provenance, ...(dataset.provenance.notes ? { notes: [...dataset.provenance.notes] } : {}) }, validation: "PASS" };
}

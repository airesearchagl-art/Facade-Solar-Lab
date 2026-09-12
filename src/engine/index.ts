/**
 * Framework-independent engine entry point.
 *
 * M0 deliberately exposes metadata only. Solar geometry and weather-backed
 * calculations begin in M1 and must remain free of browser or React imports.
 */
export const engineManifest = Object.freeze({
  milestone: "M0",
  calculationStatus: "not-implemented",
  runtimeTargets: ["browser", "node", "batch"] as const,
  frameworkDependencies: [] as const,
});

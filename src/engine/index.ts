export * from "./facade-v1";
export * from "./legacy-v01";
export * from "./weather-v1";

export const engineManifest = Object.freeze({
  milestone: "M3",
  calculationStatus: "legacy-weather-and-facade-geometry-foundations",
  modelStatus: "weather-backed-not-validated",
  runtimeTargets: ["browser", "node", "batch"] as const,
  frameworkDependencies: [] as const,
});

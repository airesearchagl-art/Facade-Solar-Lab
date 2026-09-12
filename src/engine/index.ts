export * from "./legacy-v01";
export * from "./weather-v1";

export const engineManifest = Object.freeze({
  milestone: "M2",
  calculationStatus: "legacy-and-weather-foundations",
  modelStatus: "weather-backed-not-validated",
  runtimeTargets: ["browser", "node", "batch"] as const,
  frameworkDependencies: [] as const,
});

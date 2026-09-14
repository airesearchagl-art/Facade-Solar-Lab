export * from "./facade-v1";
export * from "./legacy-v01";
export * from "./weather-v1";

export const engineManifest = Object.freeze({
  milestone: "M4.5",
  calculationStatus: "multifloor-composition-over-facade-v1-weather",
  modelStatus: "weather-backed-not-validated",
  runtimeTargets: ["browser", "node", "batch"] as const,
  frameworkDependencies: [] as const,
});

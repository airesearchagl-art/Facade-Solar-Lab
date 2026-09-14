export * from "./facade-v1";
export * from "./legacy-v01";
export * from "./weather-v1";

export const engineManifest = Object.freeze({
  milestone: "M4",
  calculationStatus: "facade-comparison-workspace",
  modelStatus: "weather-backed-not-validated",
  runtimeTargets: ["browser", "node", "batch"] as const,
  frameworkDependencies: [] as const,
});

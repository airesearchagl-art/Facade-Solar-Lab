export * from "./facade-v1";
export * from "./facade-v2";
export * from "./legacy-v01";
export * from "./weather-v1";

export const engineManifest = Object.freeze({
  advancedFacade: { milestone: "M7", modelVersion: "facade-v2-weather", directGeometry: "overhang-vertical-fin-array-shadow-union-v2", physicalValidation: "NOT_RUN" },
  milestone: "M4.5",
  calculationStatus: "multifloor-composition-over-facade-v1-weather",
  modelStatus: "weather-backed-not-validated",
  runtimeTargets: ["browser", "node", "batch"] as const,
  frameworkDependencies: [] as const,
});

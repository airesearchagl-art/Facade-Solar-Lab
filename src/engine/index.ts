export * from "./legacy-v01";
export * from "./weather-v1";

export const engineManifest = Object.freeze({
  milestone: "M1",
  calculationStatus: "legacy-baseline",
  modelStatus: "not-validated-physical-model",
  runtimeTargets: ["browser", "node", "batch"] as const,
  frameworkDependencies: [] as const,
});

import type { ComparisonCase } from "../comparison";
import type { FacadeSimulationResult, FacadeV2Parameters } from "../engine/facade-v2";
import type { FinLayoutResult } from "../geometry/facade-v2";
import type { WeatherCoverage, WeatherSourceProvenance } from "../weather";

export const MAX_STUDY_CANDIDATES = 64;
export const CANDIDATE_GENERATION_VERSION = "decimal-grid-v1" as const;
export type AxisKey = "facadeAzimuthDegFromNorth" | "opening.widthM" | "opening.sillZM" | "opening.headZM"
  | "solarHeatGainCoefficient" | "groundReflectance" | "overhang.depthM" | "overhang.elevationZM"
  | "overhang.leftExtensionM" | "overhang.rightExtensionM" | "leftFin.depthM" | "rightFin.depthM"
  | "intermediateFins.depthM" | "intermediateFins.layout.pitchM" | "intermediateFins.layout.count";
export interface SweepAxis { readonly key: AxisKey; readonly min: number; readonly max: number; readonly step: number }
export interface SweepDefinition { readonly a: SweepAxis; readonly b?: SweepAxis }
export interface StudySnapshot {
  readonly weatherDatasetId: string;
  readonly weatherProvenance: WeatherSourceProvenance;
  readonly coverage: WeatherCoverage;
  readonly intervalCount: number;
  readonly source: ComparisonCase;
  readonly sweep: SweepDefinition;
  readonly executedAt: string;
  readonly generationVersion: typeof CANDIDATE_GENERATION_VERSION;
  readonly modelIds: Readonly<Record<string, string>>;
}
export interface CandidateInput {
  readonly id: string;
  readonly indexA: number;
  readonly indexB: number;
  readonly a: number;
  readonly b?: number;
  readonly parameters: FacadeV2Parameters;
}
export type StudyDeltas = Readonly<Record<"annual" | "cooling" | "heating", number>>;
export type StudyCandidate = CandidateInput & (
  | { readonly status: "VALID"; readonly simulation: FacadeSimulationResult; readonly delta: StudyDeltas; readonly fins: FinLayoutResult | null; readonly runtimeMs: number }
  | { readonly status: "INVALID"; readonly issues: readonly string[]; readonly runtimeMs: number }
);
export interface StudyResult {
  readonly snapshot: StudySnapshot;
  readonly baseline: FacadeSimulationResult;
  readonly candidates: readonly StudyCandidate[];
  readonly runtimeMs: number;
}
export type Metric = "annual" | "cooling" | "heating" | "annualDelta" | "coolingDelta" | "heatingDelta";

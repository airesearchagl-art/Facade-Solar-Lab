import type { ComparisonWorkspace } from "../comparison";
import type { FacadeSimulationResult } from "../engine/facade-v2";
import type { MultiFloorCaseResult, MultiFloorWorkspace } from "../multifloor/types";
import type { WeatherDataset } from "../weather";
import type { Compatibility, WeatherDescriptor } from "./weather";

export const SCENARIO_VERSION = "weather-scenario-v1";
export const SCENARIO_LIMIT = 4;
export type ScenarioSource = { readonly mode: "single"; readonly workspace: ComparisonWorkspace }
  | { readonly mode: "multi"; readonly workspace: MultiFloorWorkspace };
export interface WeatherSlot { readonly id: string; readonly label: string; readonly dataset: WeatherDataset }
export interface SlotDescriptor { readonly id: string; readonly label: string; readonly weather: WeatherDescriptor }
export type ScenarioInput = ScenarioSource & { readonly slots: readonly WeatherSlot[]; readonly referenceId: string };
export type ScenarioSnapshot = ScenarioSource & { readonly slots: readonly SlotDescriptor[]; readonly referenceId: string;
  readonly executedAt: string; readonly generationVersion: typeof SCENARIO_VERSION; readonly inputKey: string; readonly modelIds: readonly string[] };
export interface Values { readonly annual: number; readonly summer: number; readonly winter: number }
export type Delta = { readonly status: "VALID"; readonly values: Values } | { readonly status: "NOT_COMPARABLE" | "INVALID"; readonly reason: string };
export interface ScenarioFloor { readonly id: string; readonly name: string; readonly model: string; readonly values: Values;
  readonly designDelta: Delta; readonly weatherDelta: Delta }
interface CellIdentity { readonly designId: string; readonly weatherId: string; readonly runtimeMs: number }
export type ScenarioBuildingResult = Omit<MultiFloorCaseResult, "deltaFromBaseline"> & {
  /** Present only after a valid scenario baseline is resolved, never an isolated self-delta. */
  readonly deltaFromBaseline?: MultiFloorCaseResult["deltaFromBaseline"];
};
export type ScenarioCell = CellIdentity & (
  | { readonly status: "INVALID"; readonly reason: string }
  | { readonly status: "VALID"; readonly values: Values; readonly simulation?: FacadeSimulationResult; readonly building?: ScenarioBuildingResult;
      readonly model: string; readonly designDelta: Delta; readonly weatherDelta: Delta; readonly floors: readonly ScenarioFloor[] }
);
export interface ScenarioResult { readonly snapshot: ScenarioSnapshot; readonly cells: readonly ScenarioCell[]; readonly runtimeMs: number }
export const METRICS = ["annual", "summer", "winter", "design.annual", "design.summer", "design.winter", "weather.annual", "weather.summer", "weather.winter"] as const;
export type ScenarioMetric = typeof METRICS[number];
export interface MetricReading { readonly status: "VALID" | "INVALID" | "NOT_COMPARABLE"; readonly value: number | null; readonly reason?: string }
export type SlotCompatibility = Readonly<Record<string, Compatibility>>;

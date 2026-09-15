import type {
  FacadeV2Parameters,
  FacadeSimulationResult,
} from "../engine/facade-v2";

export interface ComparisonCase {
  readonly id: string;
  readonly name: string;
  readonly parameters: FacadeV2Parameters;
}

export interface ComparisonWorkspace {
  readonly cases: readonly ComparisonCase[];
  readonly baselineCaseId: string;
}

export interface ComparisonValidationIssue {
  readonly caseId?: string;
  readonly path: string;
  readonly message: string;
}

export interface ComparisonPeriodDelta {
  /** Case minus baseline [kWh]. */
  readonly kWh: number;
  /** Case minus baseline divided by baseline. Null when baseline is zero. */
  readonly percent: number | null;
}

export interface ComparisonMonthlyDelta extends ComparisonPeriodDelta {
  readonly month: number;
}

export interface ComparisonCaseDelta {
  readonly annual: ComparisonPeriodDelta;
  readonly cooling: ComparisonPeriodDelta;
  readonly heating: ComparisonPeriodDelta;
  readonly monthly: readonly ComparisonMonthlyDelta[];
}

export interface ComparisonCaseResult {
  readonly caseId: string;
  readonly name: string;
  readonly parameters: FacadeV2Parameters;
  readonly simulation: FacadeSimulationResult;
  readonly deltaFromBaseline: ComparisonCaseDelta;
}

export interface ComparisonRunResult {
  readonly weatherDatasetId: string;
  readonly baselineCaseId: string;
  readonly cases: readonly ComparisonCaseResult[];
}

export type InputDifferenceValue = number | boolean | "—";

export interface InputDifference {
  readonly key: string;
  readonly label: string;
  readonly baselineValue: InputDifferenceValue;
  readonly caseValue: InputDifferenceValue;
  readonly unit?: "m" | "°";
}

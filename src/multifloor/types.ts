import type {
  FacadeV2Parameters,
  FacadeSimulationResult,
} from "../engine/facade-v2";
import type { VerticalFins } from "../geometry/facade-v2";

export interface MultiFloorOpening {
  readonly centerXM: number;
  readonly widthM: number;
  readonly heightM: number;
  readonly sillHeightM: number;
}
export interface MultiFloorOverhang {
  readonly depthM: number;
  /** Floor-local elevation [m]. */
  readonly elevationM: number;
  readonly leftExtensionM: number;
  readonly rightExtensionM: number;
}

export interface MultiFloorDefinition extends VerticalFins {
  readonly id: string;
  readonly name: string;
  readonly floorHeightM: number;
  readonly opening: MultiFloorOpening;
  readonly overhang?: MultiFloorOverhang;
  readonly solarHeatGainCoefficient: number;
}

export interface MultiFloorCase {
  readonly id: string;
  readonly name: string;
  readonly facadeAzimuthDegFromNorth: number;
  readonly groundReflectance: number;
  /** Ordered from the lowest floor to the highest floor. */
  readonly floors: readonly MultiFloorDefinition[];
}

export interface MultiFloorWorkspace {
  readonly cases: readonly MultiFloorCase[];
  readonly baselineCaseId: string;
}

export interface MultiFloorValidationIssue {
  readonly caseId?: string;
  readonly floorId?: string;
  readonly path: string;
  readonly message: string;
}

export interface MultiFloorPeriodDelta {
  /** Case minus baseline [kWh]. */
  readonly kWh: number;
  /** Case minus baseline divided by baseline. Null when baseline is zero. */
  readonly percent: number | null;
}

export interface MultiFloorMonthlyDelta extends MultiFloorPeriodDelta {
  readonly month: number;
}

export interface MultiFloorBuildingSummary {
  readonly annualKWh: number;
  readonly summerKWh: number;
  readonly winterKWh: number;
  /** Month 1 through 12 [kWh]. */
  readonly monthlyKWh: readonly number[];
}

export interface MultiFloorBuildingDelta {
  readonly annual: MultiFloorPeriodDelta;
  readonly summer: MultiFloorPeriodDelta;
  readonly winter: MultiFloorPeriodDelta;
  readonly monthly: readonly MultiFloorMonthlyDelta[];
}

export interface MultiFloorFloorResult {
  readonly floorId: string;
  readonly name: string;
  readonly absoluteBaseZM: number;
  readonly definition: MultiFloorDefinition;
  readonly parameters: FacadeV2Parameters;
  readonly simulation: FacadeSimulationResult;
}

export interface MultiFloorCaseResult {
  readonly caseId: string;
  readonly name: string;
  readonly definition: MultiFloorCase;
  readonly floors: readonly MultiFloorFloorResult[];
  readonly total: MultiFloorBuildingSummary;
  readonly deltaFromBaseline: MultiFloorBuildingDelta;
}

export interface MultiFloorRunResult {
  readonly weatherDatasetId: string;
  readonly baselineCaseId: string;
  readonly cases: readonly MultiFloorCaseResult[];
}

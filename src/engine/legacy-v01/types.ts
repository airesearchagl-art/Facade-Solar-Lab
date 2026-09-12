export interface LegacyV01Parameters {
  /** Window height [m]. Legacy parameter: H. */
  readonly windowHeightM: number;
  /** Horizontal overhang depth [m]. Legacy parameter: D. */
  readonly overhangDepthM: number;
  /** Vertical distance from overhang to window head [m]. Legacy parameter: O. */
  readonly overhangToWindowHeadM: number;
  /** Window width [m]. Legacy parameter: W. */
  readonly windowWidthM: number;
  /** North latitude [deg]. Legacy parameter: L. */
  readonly latitudeDeg: number;
  /** Surface azimuth [deg], south = 0 and west positive. Legacy parameter: A. */
  readonly surfaceAzimuthDeg: number;
  /** Constant solar heat gain coefficient [-]. Legacy parameter: G. */
  readonly solarHeatGainCoefficient: number;
  /** Ground reflectance [-]. Legacy parameter: R. */
  readonly groundReflectance: number;
  /** Empirical diffuse-sky multiplier [-]. Legacy parameter: SKY. */
  readonly legacySkyFactor: number;
}

export interface LegacyV01HourlyGain {
  readonly withOverhangWPerM2: number;
  readonly withoutOverhangWPerM2: number;
}

export interface LegacyV01MonthlyGain {
  readonly withOverhangKWh: number;
  readonly withoutOverhangKWh: number;
}

export interface LegacyV01PeriodSummary {
  readonly withOverhangKWh: number;
  readonly withoutOverhangKWh: number;
  readonly reductionPercent: number;
}

export interface LegacyV01Summary {
  readonly annual: LegacyV01PeriodSummary;
  readonly cooling: LegacyV01PeriodSummary;
  readonly heating: LegacyV01PeriodSummary;
}

export interface LegacyV01SimulationResult {
  readonly monthly: readonly LegacyV01MonthlyGain[];
  readonly summary: LegacyV01Summary;
}

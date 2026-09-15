export type WeatherIssueSeverity = "warning" | "error";

export type WeatherIssueCode =
  | "HEADER_MISSING"
  | "HEADER_INVALID"
  | "DATA_PERIOD_UNSUPPORTED"
  | "INTERVAL_METADATA_INVALID"
  | "INTERVAL_DUPLICATE"
  | "INTERVAL_MISSING"
  | "INTERVAL_OUT_OF_ORDER"
  | "INTERVAL_OUT_OF_PERIOD"
  | "ROW_MALFORMED"
  | "DATE_INVALID"
  | "TIME_INVALID"
  | "RADIATION_MISSING"
  | "RADIATION_INVALID";

export interface WeatherParseIssue {
  readonly severity: WeatherIssueSeverity;
  readonly code: WeatherIssueCode;
  readonly message: string;
  /** One-based source line, when the issue originates in EPW text. */
  readonly line?: number;
  readonly field?: string;
  readonly rawValue?: string;
}

export function hasWeatherErrors(issues: readonly WeatherParseIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}

export class WeatherDataError extends Error {
  readonly issues: readonly WeatherParseIssue[];

  constructor(message: string, issues: readonly WeatherParseIssue[]) {
    super(message);
    this.name = "WeatherDataError";
    this.issues = issues;
  }
}

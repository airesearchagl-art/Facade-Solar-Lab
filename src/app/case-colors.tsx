import { useState } from "react";

/** Presentation-only session state; never part of a calculation or preset. */
export type CaseColors = Readonly<Record<string, string>>;
export const DEFAULT_CASE_COLORS: CaseColors = {};
const SERIES = [
  { color: "#ca5a2e", dash: undefined },
  { color: "#176b73", dash: "10 5" },
  { color: "#7f5aa2", dash: "3 5" },
  { color: "#647438", dash: "14 4 3 4" },
] as const;

export function getCaseStyle(colors: CaseColors, caseId: string, index: number) {
  const fallback = SERIES[index % SERIES.length]!;
  const color = Object.hasOwn(colors, caseId) ? colors[caseId] : undefined;
  return { ...fallback, color: typeof color === "string" && /^#[\da-f]{6}$/i.test(color) ? color : fallback.color };
}

export function useCaseColors() {
  const [colors, setColors] = useState<CaseColors>(DEFAULT_CASE_COLORS);
  return {
    colors,
    setColor: (caseId: string, color: string) => {
      if (/^#[\da-f]{6}$/i.test(color)) setColors((current) => ({ ...current, [caseId]: color }));
    },
    resetColors: () => setColors(DEFAULT_CASE_COLORS),
  };
}

export function CaseColorPicker({ caseName, value, onChange }: {
  readonly caseName: string;
  readonly value: string;
  readonly onChange: (color: string) => void;
}) {
  return <label className="case-color-picker no-print">
    <span>表示色</span>
    <input type="color" aria-label={`${caseName}の表示色`} value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    <small>このセッションのみ</small>
  </label>;
}

export function CaseMarker({ colors = DEFAULT_CASE_COLORS, caseId, index }: {
  readonly colors?: CaseColors;
  readonly caseId: string;
  readonly index: number;
}) {
  // Keep the letter readable even for white/pale user colors.
  return <span className="case-marker" style={{ borderColor: getCaseStyle(colors, caseId, index).color }}>
    {String.fromCharCode(65 + index)}
  </span>;
}

export function CaseLegendLine({ colors = DEFAULT_CASE_COLORS, caseId, index }: {
  readonly colors?: CaseColors;
  readonly caseId: string;
  readonly index: number;
}) {
  const style = getCaseStyle(colors, caseId, index);
  return <svg className="case-legend-line" width="30" height="12" aria-hidden="true">
    <line x1="0" y1="6" x2="30" y2="6" stroke={style.color} strokeDasharray={style.dash} strokeWidth="3" />
  </svg>;
}

import { GEOMETRY_EPSILON } from "../facade-v1";

/** Covers 12 m / 0.1 m pitch (120 fins), while bounding interactive work. */
export const MAX_INTERMEDIATE_FINS = 128;
export type FinLayout = { readonly mode: "pitch"; readonly pitchM: number } | { readonly mode: "count"; readonly count: number };
export interface FinLayoutResult {
  readonly count: number;
  readonly pitchM: number | null;
  readonly edgeMarginM: number | null;
  /** Metres from the opening left edge; never persisted in presets. */
  readonly positionsFromLeftM: readonly number[];
}

export function validateFinLayout(layout: FinLayout): void {
  if (layout?.mode === "pitch") {
    if (!Number.isFinite(layout.pitchM) || layout.pitchM <= 0) throw new RangeError("中心ピッチは正の有限値にしてください。");
  } else if (layout?.mode === "count") {
    if (!Number.isSafeInteger(layout.count) || layout.count < 1 || layout.count > MAX_INTERMEDIATE_FINS) throw new RangeError(`中間フィン枚数は1〜${MAX_INTERMEDIATE_FINS}の整数にしてください。`);
  } else throw new RangeError("中間フィン配置方式が不正です。");
}

/** CENTERED, zero thickness, strict interior. Pitch is centre pitch, not clear gap. */
export function deriveFinLayout(widthM: number, layout: FinLayout): FinLayoutResult {
  validateFinLayout(layout);
  if (!Number.isFinite(widthM) || widthM <= 0) throw new RangeError("中間フィンの開口幅は正の有限値が必要です。");
  const count = layout.mode === "count" ? layout.count : Math.floor(widthM / layout.pitchM);
  if (!Number.isSafeInteger(count) || count > MAX_INTERMEDIATE_FINS) throw new RangeError(`中間フィンは最大${MAX_INTERMEDIATE_FINS}枚です。切り捨ては行いません。`);
  if (count === 0) return { count, pitchM: null, edgeMarginM: null, positionsFromLeftM: [] };
  const pitchM = layout.mode === "pitch" ? layout.pitchM : widthM / (count + 1);
  const edgeMarginM = layout.mode === "pitch" ? (widthM - (count - 1) * pitchM) / 2 : pitchM;
  const positionsFromLeftM = Array.from({ length: count }, (_, i) => layout.mode === "pitch" ? edgeMarginM + i * pitchM : widthM * ((i + 1) / (count + 1)));
  if (![pitchM, edgeMarginM, ...positionsFromLeftM].every(Number.isFinite) || edgeMarginM <= GEOMETRY_EPSILON ||
      (count > 1 && pitchM <= GEOMETRY_EPSILON) || positionsFromLeftM.some((x, i) => x <= 0 || x >= widthM || (i > 0 && x <= positionsFromLeftM[i - 1]!))) {
    throw new RangeError("中間フィン位置を形状許容差内で解決できません。");
  }
  return { count, pitchM, edgeMarginM, positionsFromLeftM };
}

import { deriveFinLayout, type VerticalFins } from "../geometry/facade-v2";

export const FIN_CSV_HEADERS = ["左フィンあり", "左フィン出幅_m", "左フィン下端_m", "左フィン上端_m", "右フィンあり", "右フィン出幅_m", "右フィン下端_m", "右フィン上端_m"];
export function finCsvValues(fins: VerticalFins): (number | string)[] {
  return [fins.leftFin, fins.rightFin].flatMap((fin) => [fin === undefined ? "いいえ" : "はい", fin?.depthM ?? "", fin?.bottomZM ?? "", fin?.topZM ?? ""]);
}
export const ARRAY_CSV_HEADERS = ["中間フィンあり", "配置方式", "指定中心ピッチ_m", "指定枚数", "実配置枚数", "実中心ピッチ_m", "左右端部余白_m", "中間フィン出幅_m", "中間フィン下端_m", "中間フィン上端_m"];
export function arrayCsvValues(fins: VerticalFins, widthM: number): (number | string)[] {
  const fin = fins.intermediateFins;
  if (!fin) return ["いいえ", ...Array<string>(9).fill("")];
  const derived = deriveFinLayout(widthM, fin.layout);
  return ["はい", fin.layout.mode === "pitch" ? "ピッチ指定" : "枚数指定", fin.layout.mode === "pitch" ? fin.layout.pitchM : "", fin.layout.mode === "count" ? fin.layout.count : "", derived.count, derived.pitchM ?? "", derived.edgeMarginM ?? "", fin.depthM, fin.bottomZM, fin.topZM];
}

import type { VerticalFins } from "../geometry/facade-v2";

export const FIN_CSV_HEADERS = ["左フィンあり", "左フィン出幅_m", "左フィン下端_m", "左フィン上端_m", "右フィンあり", "右フィン出幅_m", "右フィン下端_m", "右フィン上端_m"];
export function finCsvValues(fins: VerticalFins): (number | string)[] {
  return [fins.leftFin, fins.rightFin].flatMap((fin) => [fin === undefined ? "いいえ" : "はい", fin?.depthM ?? "", fin?.bottomZM ?? "", fin?.topZM ?? ""]);
}

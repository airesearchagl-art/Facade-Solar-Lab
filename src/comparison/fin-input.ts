import { deriveFinLayout, validateFinLayout, type VerticalFins } from "../geometry/facade-v2";

/** Shared UI/preset boundary; no temporal or energy logic. */
export function finInputIssues(fins: VerticalFins, widthM?: number): readonly { path: string; message: string }[] {
  const issues: { path: string; message: string }[] = [];
  for (const key of ["leftFin", "rightFin", "intermediateFins"] as const) {
    const fin = fins[key];
    if (fin === undefined) continue;
    const label = key === "leftFin" ? "左フィン" : key === "rightFin" ? "右フィン" : "中間フィン";
    for (const field of ["depthM", "bottomZM", "topZM"] as const) {
      if (!Number.isFinite(fin[field])) issues.push({ path: `${key}.${field}`, message: `${label}には有限の数値を入力してください。` });
    }
    if (fin.depthM < 0) issues.push({ path: `${key}.depthM`, message: `${label}の出は0 m以上にしてください。` });
    if (fin.topZM <= fin.bottomZM || !Number.isFinite(fin.topZM - fin.bottomZM)) issues.push({ path: `${key}.topZM`, message: `${label}の上端は下端より高く、差が有限になる値にしてください。` });
  }
  if (fins.intermediateFins !== undefined) {
    try {
      validateFinLayout(fins.intermediateFins.layout);
      if (widthM !== undefined) deriveFinLayout(widthM, fins.intermediateFins.layout);
    } catch (error) { issues.push({ path: "intermediateFins.layout", message: error instanceof Error ? error.message : "中間フィン配置を確認してください。" }); }
  }
  return issues;
}

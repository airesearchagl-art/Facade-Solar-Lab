import type { StudyResult } from "./types";

function cell(value: string | number): string {
  if (typeof value === "number" && !Number.isFinite(value)) throw new RangeError("CSV値は有限値が必要です。");
  const text = typeof value === "string" && /^\s*[=+\-@]/u.test(value) ? `'${value}` : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
export function studyCsv(study: StudyResult): string {
  const s = study.snapshot;
  const metadata = [s.weatherDatasetId, s.weatherProvenance.sourceType, s.weatherProvenance.sourceName, s.coverage,
    s.intervalCount, s.source.id, s.source.name, s.executedAt, s.generationVersion, JSON.stringify(s.sweep), study.candidates.length];
  const headers = ["weatherDatasetId", "weatherType", "weatherSource", "coverage", "intervalCount", "sourceCaseId", "sourceCaseName", "executedAt", "generationVersion", "sweep", "candidateCount",
    "candidateId", "status", "reason", "axisA", "axisB", "parameters", "actualFinCount", "actualPitch_m", "edgeMargin_m", "modelVersion",
    "annual_kWh", "summer_kWh", "winter_kWh", "annualDelta_kWh", "summerDelta_kWh", "winterDelta_kWh", "limitation"];
  const note = "日射熱取得量。HVAC負荷・正式な絶対kWh物理validationではありません。partialは読込区間のみ。syntheticは実測/性能検証ではありません。";
  const b = study.baseline.summary;
  const baseline = [...metadata, "baseline", "VALID", "", "", "", JSON.stringify(s.source.parameters), "", "", "", study.baseline.modelVersion,
    b.annual.withOverhangKWh, b.cooling.withOverhangKWh, b.heating.withOverhangKWh, 0, 0, 0, note];
  const rows = study.candidates.map(candidate => [...metadata, candidate.id, candidate.status,
    candidate.status === "INVALID" ? candidate.issues.join(" / ") : "", candidate.a, candidate.b ?? "", JSON.stringify(candidate.parameters),
    ...(candidate.status === "VALID" ? [candidate.fins?.count ?? 0, candidate.fins?.pitchM ?? "", candidate.fins?.edgeMarginM ?? "", candidate.simulation.modelVersion,
      candidate.simulation.summary.annual.withOverhangKWh, candidate.simulation.summary.cooling.withOverhangKWh, candidate.simulation.summary.heating.withOverhangKWh,
      candidate.delta.annual, candidate.delta.cooling, candidate.delta.heating] : Array.from({ length: 10 }, () => "")), note]);
  return `\uFEFF${[headers, baseline, ...rows].map(row => row.map(cell).join(",")).join("\r\n")}\r\n`;
}

import { cell } from "../explorer/export";
import type { Delta, ScenarioResult, Values } from "./types";
import { weatherCoverageCompatibility } from "./weather";
const values = (v: Values | undefined): (string | number)[] => v ? [v.annual, v.summer, v.winter] : ["", "", ""];
const delta = (d: Delta | undefined): (string | number)[] => [d?.status ?? "INVALID", ...values(d?.status === "VALID" ? d.values : undefined)];
export const SCENARIO_LIMITATION = "日射熱取得量。HVAC負荷・気象予測・自動最適化ではありません。partialは読込区間のみ。syntheticは実測ではありません。M5外部参照NOT_RUN、絶対kWh正式検証未完了。cross-floor physical shadingなし。";
export function scenarioCsv(study: ScenarioResult): string {
  const s = study.snapshot;
  const rows: (string | number)[][] = [["mode", "baselineDesignId", "referenceWeatherId", "combinations", "generationVersion", "executedAt",
    "weatherSlot", "weatherLabel", "datasetId", "fingerprint", "temporalFingerprint", "provenance", "coverage", "intervalCount", "compatibility",
    "rowType", "designId", "designName", "floorId", "floorName", "status", "reason", "model", "annualOrReadPeriod_kWh", "summerOrReadPeriod_kWh", "winterOrReadPeriod_kWh",
    "designDeltaStatus", "designDeltaAnnual_kWh", "designDeltaSummer_kWh", "designDeltaWinter_kWh", "weatherDeltaStatus", "weatherDeltaAnnual_kWh", "weatherDeltaSummer_kWh", "weatherDeltaWinter_kWh", "limitation"]];
  for (const c of study.cells) {
    const slot = s.slots.find(w => w.id === c.weatherId)!;
    const w = slot.weather;
    const metadata = [s.mode, s.workspace.baselineCaseId, s.referenceId, study.cells.length, s.generationVersion, s.executedAt,
      slot.id, slot.label, w.datasetId, w.fingerprint, w.temporalFingerprint, JSON.stringify(w.provenance), w.coverage, w.intervalCount,
      weatherCoverageCompatibility(w, s.slots.find(w => w.id === s.referenceId)!.weather)];
    const design = s.workspace.cases.find(d => d.id === c.designId)!;
    rows.push([...metadata, s.mode === "multi" ? "building" : "single", design.id, design.name, "", "", c.status,
      c.status === "INVALID" ? c.reason : "", c.status === "VALID" ? c.model : "", ...values(c.status === "VALID" ? c.values : undefined),
      ...delta(c.status === "VALID" ? c.designDelta : undefined), ...delta(c.status === "VALID" ? c.weatherDelta : undefined), SCENARIO_LIMITATION]);
    if (s.mode === "multi") {
      const definitions = s.workspace.cases.find(d => d.id === c.designId)!.floors;
      for (const [i, floor] of definitions.entries()) {
        const f = c.status === "VALID" ? c.floors[i] : undefined;
        rows.push([...metadata, "floor", design.id, design.name, floor.id, floor.name, f ? "VALID" : "INVALID", c.status === "INVALID" ? c.reason : "", f?.model ?? "",
          ...values(f?.values), ...delta(f?.designDelta), ...delta(f?.weatherDelta), SCENARIO_LIMITATION]);
      }
    }
  }
  return `\uFEFF${rows.map(row => row.map(cell).join(",")).join("\r\n")}\r\n`;
}

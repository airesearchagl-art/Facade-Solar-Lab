import type { MultiFloorBuildingSummary } from "../../multifloor/types";
import type { MultiStudyResult, MultiCandidate } from "../../explorer/multi-study";
import type { Metric } from "../../explorer/types";
import { deriveFinLayout } from "../../geometry/facade-v2";
import { ExplorerCharts, type ChartStudy } from "./ExplorerCharts";
import { weatherPeriodLabels } from "../weather-coverage";

const chartSummary = (total: MultiFloorBuildingSummary) => ({ annual: { withOverhangKWh: total.annualKWh }, cooling: { withOverhangKWh: total.summerKWh }, heating: { withOverhangKWh: total.winterKWh } });
export function multiChartStudy(study: MultiStudyResult): ChartStudy {
  return { snapshot: { sweep: study.snapshot.sweep }, baseline: { summary: chartSummary(study.baseline.total) }, candidates: study.candidates.map(candidate => candidate.status === "INVALID" ? candidate : {
    id: candidate.id, a: candidate.a, ...(candidate.b === undefined ? {} : { b: candidate.b }), status: "VALID", simulation: { summary: chartSummary(candidate.result.total) }, delta: candidate.delta,
  }) };
}
export function MultiParametricResults({ study, selected, onSelect, metric, metricLabel }: { study: MultiStudyResult; selected: string; onSelect: (id: string) => void; metric: Metric; metricLabel: string }) {
  const labels = weatherPeriodLabels(study.snapshot.coverage);
  return <>
    <h3>Building Total · 建物全体の感度</h3>
    <ExplorerCharts study={multiChartStudy(study)} selected={selected} onSelect={onSelect} metric={metric} metricLabel={metricLabel} />
    <div className="table-scroll"><table className="explorer-table"><caption>Building Total · 正確な計算値 [kWh]（差分 = 候補 − 元の建物案）</caption>
      <thead><tr>{["候補", "A", "B", "状態 / 理由", labels.annual, labels.summer, labels.winter, "Δ合計", "Δ夏期", "Δ冬期"].map(label => <th key={label}>{label}</th>)}</tr></thead>
      <tbody>{study.candidates.map(candidate => <tr key={candidate.id} aria-selected={selected === candidate.id}>
        <td><button type="button" onClick={() => onSelect(candidate.id)} aria-pressed={selected === candidate.id}>{candidate.id}</button></td><td>{candidate.a}</td><td>{candidate.b ?? "—"}</td>
        <td>{candidate.status}{candidate.status === "INVALID" ? `: ${candidate.issues.join(" / ")}` : ""}</td>
        {candidate.status === "VALID" ? [candidate.result.total.annualKWh, candidate.result.total.summerKWh, candidate.result.total.winterKWh, candidate.delta.annual, candidate.delta.cooling, candidate.delta.heating].map((value, i) => <td key={i}>{String(value)}</td>) : <td colSpan={6}>—（計算値なし・0ではありません）</td>}
      </tr>)}</tbody>
    </table></div>
  </>;
}
export function FloorContribution({ candidate, study }: { candidate: Extract<MultiCandidate, { status: "VALID" }>; study: MultiStudyResult }) {
  const labels = weatherPeriodLabels(study.snapshot.coverage);
  return <section aria-label="階別寄与"><h3>Floor Breakdown · 各階の寄与</h3>
    <p>Building Totalは下記Floor値の単純和です。差分は各階の元入力に対する差。表示丸めなし（浮動小数の加算順による末尾差はあり得ます）。</p>
    <div className="table-scroll"><table className="explorer-table"><caption>Floor contribution [kWh]</caption>
      <thead><tr>{["Floor", "適用", labels.annual, labels.summer, labels.winter, "Δ合計", "Δ夏期", "Δ冬期", "modelVersion", "実フィン / pitch / 余白 [m]"].map(label => <th key={label}>{label}</th>)}</tr></thead>
      <tbody>{candidate.result.floors.map(floor => {
        const s = floor.simulation.summary, d = candidate.floorDeltas[floor.floorId]!;
        const fins = floor.parameters.intermediateFins ? deriveFinLayout(floor.parameters.opening.widthM, floor.parameters.intermediateFins.layout) : null;
        return <tr key={floor.floorId}><th>{floor.name} ({floor.floorId})</th><td>{candidate.affectedFloorIds.includes(floor.floorId) ? "変更対象" : "固定"}</td>
          {[s.annual.withOverhangKWh, s.cooling.withOverhangKWh, s.heating.withOverhangKWh, d.annual, d.cooling, d.heating].map((value, i) => <td key={i}>{String(value)}</td>)}
          <td>{floor.simulation.modelVersion}</td><td>{fins?.count ?? 0} / {fins?.pitchM ?? "—"} / {fins?.edgeMarginM ?? "—"}</td></tr>;
      })}</tbody>
      <tfoot><tr><th>Building Total</th><td>Floor和</td>{[candidate.result.total.annualKWh, candidate.result.total.summerKWh, candidate.result.total.winterKWh, candidate.delta.annual, candidate.delta.cooling, candidate.delta.heating].map((value, i) => <td key={i}>{String(value)}</td>)}<td colSpan={2}>canonical Multi aggregation</td></tr></tfoot>
    </table></div>
  </section>;
}

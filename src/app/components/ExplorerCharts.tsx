import { metricValue } from "../../explorer/study";
import { axisLabel } from "../../explorer/sweep";
import type { Metric, StudyCandidate, StudyResult } from "../../explorer/types";

const WIDTH = 660, HEIGHT = 270, LEFT = 66, TOP = 22;
function scale(values: readonly number[], start: number, end: number) {
  const min = Math.min(...values), max = Math.max(...values);
  return { min, max, at: (value: number) => max === min ? (start + end) / 2 : start + (value - min) / (max - min) * (end - start) };
}
function pointTitle(candidate: StudyCandidate): string {
  return candidate.status === "INVALID" ? `${candidate.id}: INVALID ${candidate.issues.join(" / ")}`
    : `${candidate.id} · A=${candidate.a}${candidate.b === undefined ? "" : ` B=${candidate.b}`} · 合計=${candidate.simulation.summary.annual.withOverhangKWh} · 夏期=${candidate.simulation.summary.cooling.withOverhangKWh} · 冬期=${candidate.simulation.summary.heating.withOverhangKWh} · Δ=${candidate.delta.annual}/${candidate.delta.cooling}/${candidate.delta.heating} kWh`;
}
function Dot({ candidate, x, y, selected, onSelect }: { candidate: StudyCandidate; x: number; y: number; selected: string; onSelect: (id: string) => void }) {
  return <circle cx={x} cy={y} r={selected === candidate.id ? 7 : 5} className={selected === candidate.id ? "explorer-point selected" : "explorer-point"}
    role="button" tabIndex={0} aria-label={pointTitle(candidate)} aria-pressed={selected === candidate.id}
    onClick={() => onSelect(candidate.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(candidate.id); } }}><title>{pointTitle(candidate)}</title></circle>;
}
export function ExplorerCharts({ study, metric, metricLabel, selected, onSelect }: { study: StudyResult; metric: Metric; metricLabel: string; selected: string; onSelect: (id: string) => void }) {
  const candidates = study.candidates;
  const valid = candidates.filter(candidate => candidate.status === "VALID");
  const period = metric.replace("Delta", "") as "annual" | "cooling" | "heating";
  const baseline = metric.endsWith("Delta") ? 0 : study.baseline.summary[period].withOverhangKWh;
  const y = scale([baseline, ...valid.map(candidate => metricValue(candidate, metric)!)], HEIGHT - 48, TOP);
  const x = scale(candidates.map(candidate => candidate.a), LEFT, WIDTH - 22);
  const heatValues = valid.map(candidate => metricValue(candidate, metric)!);
  const heat = scale(heatValues.length ? heatValues : [0], 92, 35);
  const aValues = [...new Set(candidates.map(candidate => candidate.a))];
  const bValues = [...new Set(candidates.map(candidate => candidate.b))];
  const sx = scale([0, ...valid.map(candidate => candidate.delta.cooling)], LEFT, WIDTH - 22);
  const sy = scale([0, ...valid.map(candidate => candidate.delta.heating)], HEIGHT - 48, TOP);
  return <div className="explorer-charts">
    {!study.snapshot.sweep.b ? <figure>
      <figcaption>1D · {metricLabel} [kWh] — 破線は基準案（元の案・範囲外でも表示）</figcaption>
      <div className="explorer-chart-scroll"><svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="group" aria-label="1D感度グラフ・候補を選択">
        <line x1={LEFT} x2={WIDTH - 22} y1={HEIGHT - 48} y2={HEIGHT - 48} className="explorer-axis" />
        <line x1={LEFT} x2={LEFT} y1={TOP} y2={HEIGHT - 48} className="explorer-axis" />
        <text x={LEFT - 8} y={TOP + 5} textAnchor="end">{y.max.toFixed(1)}</text><text x={LEFT - 8} y={HEIGHT - 48} textAnchor="end">{y.min.toFixed(1)}</text>
        <line x1={LEFT} x2={WIDTH - 22} y1={y.at(baseline)} y2={y.at(baseline)} stroke="#707575" strokeDasharray="6 4" />
        {candidates.slice(1).map((candidate, i) => {
          const previous = candidates[i]!;
          return candidate.status === "VALID" && previous.status === "VALID" ? <line key={candidate.id} x1={x.at(previous.a)} x2={x.at(candidate.a)} y1={y.at(metricValue(previous, metric)!)} y2={y.at(metricValue(candidate, metric)!)} stroke="#176b73" strokeWidth="2" /> : null;
        })}
        {valid.map(candidate => <Dot key={candidate.id} candidate={candidate} x={x.at(candidate.a)} y={y.at(metricValue(candidate, metric)!)} selected={selected} onSelect={onSelect} />)}
        <text x={LEFT} y={HEIGHT - 28}>{x.min}</text><text x={WIDTH - 22} y={HEIGHT - 28} textAnchor="end">{x.max}</text>
        <text x={WIDTH / 2} y={HEIGHT - 7} textAnchor="middle">{axisLabel(study.snapshot.sweep.a.key)}</text>
      </svg></div>
      <p>基準値: {String(baseline)} kWh。INVALID位置は線をつながず、下表に理由を表示します。</p>
    </figure> : <>
      <figure><figcaption>2D Heatmap · {metricLabel} [kWh]</figcaption>
        <p>淡→濃: {String(heat.min)} → {String(heat.max)}。色は数値の大小のみ。優劣の判定ではありません。</p>
        <div className="table-scroll"><table className="explorer-heatmap"><caption>{axisLabel(study.snapshot.sweep.b.key)}（行） × {axisLabel(study.snapshot.sweep.a.key)}（列）</caption>
          <thead><tr><th>B ＼ A</th>{aValues.map(a => <th key={a}>{a}</th>)}</tr></thead>
          <tbody>{bValues.map((b, indexB) => <tr key={indexB}><th>{b}</th>{aValues.map((a, indexA) => {
            const candidate = candidates[indexB * aValues.length + indexA]!;
            const value = metricValue(candidate, metric);
            return <td key={a}><button type="button" className={candidate.status === "INVALID" ? "invalid-cell" : ""} aria-pressed={selected === candidate.id}
              style={value === null ? undefined : { background: `hsl(187 34% ${heat.at(value)}%)`, color: heat.at(value) < 55 ? "white" : "#183133" }}
              onClick={() => onSelect(candidate.id)} title={pointTitle(candidate)}>{value === null ? "INVALID" : String(value)}</button></td>;
          })}</tr>)}</tbody>
        </table></div>
      </figure>
      <figure><figcaption>Trade-off · 元の案との差 [kWh]</figcaption>
        <div className="explorer-chart-scroll"><svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="group" aria-label="夏期差と冬期差・候補を選択">
          <line x1={LEFT} x2={WIDTH - 22} y1={sy.at(0)} y2={sy.at(0)} className="explorer-axis" strokeDasharray="4 4" />
          <line x1={sx.at(0)} x2={sx.at(0)} y1={TOP} y2={HEIGHT - 48} className="explorer-axis" strokeDasharray="4 4" />
          {valid.map(candidate => <Dot key={candidate.id} candidate={candidate} x={sx.at(candidate.delta.cooling)} y={sy.at(candidate.delta.heating)} selected={selected} onSelect={onSelect} />)}
          <path d={`M ${sx.at(0)-7} ${sy.at(0)} h 14 M ${sx.at(0)} ${sy.at(0)-7} v 14`} stroke="#563b26" strokeWidth="2"><title>基準案 0 / 0</title></path>
          <text x={LEFT} y={HEIGHT - 28}>{sx.min.toFixed(1)}</text><text x={WIDTH - 22} y={HEIGHT - 28} textAnchor="end">{sx.max.toFixed(1)}</text>
          <text x={LEFT - 5} y={TOP} textAnchor="end">{sy.max.toFixed(1)}</text><text x={LEFT - 5} y={HEIGHT - 48} textAnchor="end">{sy.min.toFixed(1)}</text>
          <text x={WIDTH / 2} y={HEIGHT - 6} textAnchor="middle">夏期差 [kWh] → ／ 縦軸: 冬期差 [kWh]</text>
        </svg></div><p>十字は基準案 0 / 0。各点を選択すると全期間・差分・入力を確認できます。</p>
      </figure>
    </>}
  </div>;
}

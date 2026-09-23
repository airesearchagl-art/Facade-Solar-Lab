import { scenarioMetric } from "../../scenario/study";
import { METRICS, type Delta, type ScenarioMetric, type ScenarioResult } from "../../scenario/types";
import { weatherCoverageCompatibility, type WeatherDescriptor } from "../../scenario/weather";
import { SCENARIO_LIMITATION } from "../../scenario/export";
import { weatherPeriodLabels } from "../weather-coverage";
import { getCaseStyle, type CaseColors } from "../case-colors";

export function scenarioMetricLabels(partial: boolean): Record<ScenarioMetric, string> {
  const l = weatherPeriodLabels(partial ? "partial" : "full-year-8760");
  return { annual: l.annual, summer: l.summer, winter: l.winter,
    "design.annual": `Design Δ ${l.annual}`, "design.summer": `Design Δ ${l.summer}`, "design.winter": `Design Δ ${l.winter}`,
    "weather.annual": `Weather Δ ${l.annual}`, "weather.summer": `Weather Δ ${l.summer}`, "weather.winter": `Weather Δ ${l.winter}` };
}
export function WeatherDescriptorView({ weather: w }: { weather: WeatherDescriptor }) {
  return <dl className="scenario-provenance">
    <dt>dataset ID</dt><dd>{w.datasetId}</dd><dt>出典</dt><dd>{w.provenance.sourceName} · {w.provenance.sourceType}</dd>
    <dt>provenance</dt><dd>{[w.provenance.sourceReference, w.provenance.retrievedOn, w.provenance.sourceSha256, ...(w.provenance.notes ?? [])].filter(Boolean).join(" / ") || "追加出典情報なし"}</dd>
    <dt>coverage / 区間数</dt><dd>{w.coverage} / {w.intervalCount}</dd><dt>validation</dt><dd>{w.validation}</dd>
    <dt>identity</dt><dd>{w.fingerprint}</dd><dt>temporal coverage</dt><dd>{w.temporalFingerprint}</dd>
  </dl>;
}
const deltaText = (d: Delta, period: "annual" | "summer" | "winter") => d.status === "VALID" ? String(d.values[period]) : d.status;
export function WeatherScenarioResults({ result, metric, selected, onSelect, colors }: {
  result: ScenarioResult; metric: ScenarioMetric; selected: string; onSelect: (id: string) => void; colors: CaseColors;
}) {
  const s = result.snapshot;
  const labels = scenarioMetricLabels(s.slots.some(w => w.weather.coverage === "partial"));
  const reading = (designId: string, weatherId: string) => scenarioMetric(result.cells.find(c => c.designId === designId && c.weatherId === weatherId)!, metric);
  const values = result.cells.map(c => scenarioMetric(c, metric).value).filter((v): v is number => v !== null);
  const maximum = Math.max(1e-12, ...values.map(Math.abs));
  const selectedCell = result.cells.find(c => JSON.stringify([c.designId, c.weatherId]) === selected) ?? result.cells[0]!;
  const selectedLabels = weatherPeriodLabels(s.slots.find(w => w.id === selectedCell.weatherId)!.weather.coverage);
  return <div className="scenario-results">
    <h3>気象シナリオ結果 · {s.mode === "single" ? "Single" : "Multi Building Total"}</h3>
    <p><strong>基準設計: {s.workspace.cases.find(c => c.id === s.workspace.baselineCaseId)!.name} / 参照気象: {s.slots.find(w => w.id === s.referenceId)!.label}</strong></p>
    <p>Design Δ = 同じ気象内の設計 − 基準設計。Weather Δ = 同じ設計の気象 − 参照気象。負値は日射熱取得が少ない意味で、優劣判定ではありません。</p>
    <p>{s.executedAt} / {s.generationVersion} / {result.cells.length}組合せ / {result.runtimeMs.toFixed(0)} ms</p>
    <div className="scenario-cards">{s.slots.map(w => <article key={w.id}><h4>{w.label}</h4><WeatherDescriptorView weather={w.weather} /><p>{weatherCoverageCompatibility(w.weather, s.slots.find(r => r.id === s.referenceId)!.weather)}</p>
      {w.weather.coverage === "partial" ? <strong>部分期間 — この気象の値は通年結果ではありません。</strong> : null}
      {w.weather.provenance.sourceType === "synthetic" ? <strong>合成気象。実測・性能検証ではありません。</strong> : null}</article>)}</div>
    <h4>Scenario Heatmap · {labels[metric]} [kWh]</h4>
    <div className="table-scroll"><table className="data-table scenario-matrix"><caption>設計 × 気象（セルを選択して詳細表示）</caption><thead><tr><th scope="col">設計 / 気象</th>{s.slots.map(w => <th scope="col" key={w.id}>{w.label}{w.id === s.referenceId ? " · 参照" : ""}</th>)}</tr></thead>
      <tbody>{s.workspace.cases.map((design, index) => <tr key={design.id}><th scope="row"><span style={{ color: getCaseStyle(colors, design.id, index).color }}>●</span> {design.name}{design.id === s.workspace.baselineCaseId ? " · 基準" : ""}</th>{s.slots.map(w => {
        const value = reading(design.id, w.id), key = JSON.stringify([design.id, w.id]);
        return <td key={w.id}><button type="button" aria-pressed={selected === key} onClick={() => onSelect(key)} title={value.reason}
          style={value.value === null ? undefined : { backgroundColor: `rgba(37, 116, 138, ${0.07 + 0.45 * Math.abs(value.value) / maximum})` }}>
          {value.value === null ? `N/A · ${value.status}` : String(value.value)}</button></td>;
      })}</tr>)}</tbody></table></div>
    <h4>Weather × Design grouped comparison · {labels[metric]} [kWh]</h4>
    <p>各気象グループ内は設計順。0を中心に左が負・右が正。同じ色と設計名を併記します。</p>
    <div className="scenario-chart" aria-label="気象別設計比較グラフ">{s.slots.map(w => <section key={w.id} aria-label={`${w.label} の比較`}><h5>{w.label}</h5>{s.workspace.cases.map((d, i) => {
      const r = reading(d.id, w.id), color = getCaseStyle(colors, d.id, i).color;
      return <button className="scenario-bar-row" type="button" key={d.id} onClick={() => onSelect(JSON.stringify([d.id, w.id]))}><span>{d.name}</span><span className="scenario-bar-track" aria-hidden="true"><i style={{ background: color, width: `${r.value === null ? 0 : Math.abs(r.value) / maximum * 50}%`, left: `${r.value !== null && r.value < 0 ? 50 - Math.abs(r.value) / maximum * 50 : 50}%` }} /></span><span>{r.value === null ? r.status : String(r.value)}</span></button>;
    })}</section>)}</div>
    <div className="table-scroll"><table className="data-table scenario-exact"><caption>全指標のexact values [kWh]（partialは各読込区間のみ）</caption><thead><tr><th>設計</th><th>気象</th><th>status / reason / model</th>{METRICS.map(m => <th key={m}>{labels[m]}</th>)}</tr></thead><tbody>{result.cells.map(c => <tr key={JSON.stringify([c.designId, c.weatherId])}>
      <th>{s.workspace.cases.find(d => d.id === c.designId)!.name}</th><th>{s.slots.find(w => w.id === c.weatherId)!.label}</th><td>{c.status} / {c.status === "VALID" ? c.model : c.reason}</td>{METRICS.map(m => { const r = scenarioMetric(c, m); return <td key={m}>{r.value === null ? r.status : String(r.value)}</td>; })}</tr>)}</tbody></table></div>
    <section className="scenario-detail" aria-label="選択セル詳細"><h4>選択セル: {s.workspace.cases.find(d => d.id === selectedCell.designId)!.name} × {s.slots.find(w => w.id === selectedCell.weatherId)!.label}</h4>
      {selectedCell.status === "INVALID" ? <p role="status">INVALID: {selectedCell.reason}</p> : <>
        <p>Building / Single Total [kWh]: {Object.entries(selectedCell.values).map(([k,v]) => `${selectedLabels[k as keyof typeof selectedLabels]}: ${v}`).join(" / ")}</p>
        <p>model: {selectedCell.model}</p>
        {selectedCell.floors.length ? <div className="table-scroll"><table className="data-table scenario-exact"><caption>Floor Breakdown（下階からの位置対応、欠けた基準階はINVALID）</caption><thead><tr><th>階</th><th>modelVersion</th>{METRICS.map(m => <th key={m}>{labels[m]}</th>)}</tr></thead><tbody>{selectedCell.floors.map(f => <tr key={f.id}><th>{f.name} / {f.id}</th><td>{f.model}</td>{["annual", "summer", "winter"].map(p => <td key={p}>{String(f.values[p as keyof typeof f.values])}</td>)}{[f.designDelta, f.weatherDelta].flatMap((d, i) => (["annual", "summer", "winter"] as const).map(p => <td key={`${i}-${p}`}>{deltaText(d,p)}</td>))}</tr>)}</tbody></table></div> : null}
      </>}
      <details><summary>実行時の完全設計入力 / model identities</summary><pre>{JSON.stringify({ source: s.workspace, models: s.modelIds }, null, 2)}</pre></details>
    </section><p className="critical-warning">{SCENARIO_LIMITATION}</p>
  </div>;
}

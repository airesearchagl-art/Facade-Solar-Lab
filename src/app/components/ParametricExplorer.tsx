import { useEffect, useMemo, useRef, useState } from "react";
import { MAX_COMPARISON_CASES, type ComparisonCase } from "../../comparison";
import { AXES, axisLabel, candidateCount, parameterValue, validateStudyDefinition } from "../../explorer/sweep";
import { freezeDeep, studyInputKey } from "../../explorer/study";
import { studyCsv } from "../../explorer/export";
import { parseStudyPreset, studyPreset } from "../../explorer/preset";
import { MAX_STUDY_CANDIDATES, type AxisKey, type Metric, type StudyCandidate, type StudyResult, type SweepAxis, type SweepDefinition } from "../../explorer/types";
import { hasWeatherErrors, type WeatherDataset } from "../../weather";
import { MAX_PRESET_BYTES } from "../../preset";
import { StudyClient } from "../explorer-client";
import { WeatherCoverageNotice, weatherPeriodLabels } from "../weather-coverage";
import { GeometryPreview } from "./GeometryPreview";
import { ExplorerCharts } from "./ExplorerCharts";

const DEFAULT_SWEEP: SweepDefinition = { a: { key: "overhang.depthM", min: 0.8, max: 2, step: 0.2 } };
function saveText(name: string, value: string, type: string) {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name;
  document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function AxisEditor({ axis, name, onChange }: { axis: SweepAxis; name: string; onChange: (axis: SweepAxis) => void }) {
  return <fieldset className="explorer-axis-editor"><legend>Axis {name}</legend>
    <label className="field"><span>探索パラメータ {name}</span><select value={axis.key} onChange={event => onChange({ ...axis, key: event.target.value as AxisKey })}>
      {AXES.map(item => <option key={item.key} value={item.key}>{item.label} [{item.unit}]</option>)}
    </select></label>
    <div className="explorer-range">{([['min','最小'],['max','最大'],['step','刻み']] as const).map(([key, label]) =>
      <label className="field" key={key}><span>{label} {name}</span><input type="number" step="any" value={Number.isFinite(axis[key]) ? axis[key] : ""} onChange={event => onChange({ ...axis, [key]: event.target.valueAsNumber })} /></label>)}</div>
  </fieldset>;
}
export function ExplorerResults({ study, selected, onSelect, metric, metricLabel }: { study: StudyResult; selected: string; onSelect: (id: string) => void; metric: Metric; metricLabel: string }) {
  const labels = weatherPeriodLabels(study.snapshot.coverage);
  return <>
    <ExplorerCharts study={study} selected={selected} onSelect={onSelect} metric={metric} metricLabel={metricLabel} />
    <div className="table-scroll"><table className="explorer-table"><caption>候補の正確な計算値 [kWh]（表示用丸めなし） · 差分 = 候補 − 元の案</caption>
      <thead><tr>{["候補", "Axis A", "Axis B", "状態 / 理由", labels.annual, labels.summer, labels.winter, "Δ合計", "Δ夏期", "Δ冬期", "実フィン枚数", "中心ピッチ [m]", "端部余白 [m]", "modelVersion"].map(label => <th key={label}>{label}</th>)}</tr></thead>
      <tbody>{study.candidates.map(candidate => <tr key={candidate.id} aria-selected={selected === candidate.id}>
        <td><button type="button" onClick={() => onSelect(candidate.id)} aria-pressed={selected === candidate.id}>{candidate.id}</button></td><td>{candidate.a}</td><td>{candidate.b ?? "—"}</td>
        <td>{candidate.status}{candidate.status === "INVALID" ? `: ${candidate.issues.join(" / ")}` : ""}</td>
        {candidate.status === "VALID" ? <>{[candidate.simulation.summary.annual.withOverhangKWh, candidate.simulation.summary.cooling.withOverhangKWh, candidate.simulation.summary.heating.withOverhangKWh,
          candidate.delta.annual, candidate.delta.cooling, candidate.delta.heating, candidate.fins?.count ?? 0, candidate.fins?.pitchM ?? "—", candidate.fins?.edgeMarginM ?? "—", candidate.simulation.modelVersion].map((value, i) => <td key={i}>{String(value)}</td>)}</> : <td colSpan={10}>—（計算値なし・0ではありません）</td>}
      </tr>)}</tbody>
    </table></div>
  </>;
}
export function ParametricExplorer({ dataset, source, caseCount, weatherLoading, onTransfer, onImport }: {
  dataset: WeatherDataset | null; source: ComparisonCase; caseCount: number; weatherLoading: boolean;
  onTransfer: (candidate: StudyCandidate) => void;
  onImport: (source: ComparisonCase) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [sweep, setSweep] = useState<SweepDefinition>(DEFAULT_SWEEP);
  const [result, setResult] = useState<StudyResult | null>(null);
  const [binding, setBinding] = useState<{ dataset: WeatherDataset; inputKey: string } | null>(null);
  const [invalidated, setInvalidated] = useState(true);
  const [status, setStatus] = useState<"idle" | "running" | "complete" | "canceled" | "error">("idle");
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState("");
  const [metric, setMetric] = useState<Metric>("annual");
  const [pendingPreset, setPendingPreset] = useState<ReturnType<typeof parseStudyPreset> | null>(null);
  const root = useRef<HTMLElement>(null);
  const client = useMemo(() => new StudyClient(() => new Worker(new URL("../explorer.worker.ts", import.meta.url), { type: "module" })), []);
  const inputKey = studyInputKey(source, sweep);
  useEffect(() => {
    client.cancel(); setInvalidated(true); setStatus(previous => previous === "running" ? "canceled" : previous);
  }, [client, dataset, inputKey, weatherLoading]);
  useEffect(() => () => client.cancel(), [client]);
  useEffect(() => {
    const cleanup = () => root.current?.closest("main")?.classList.remove("explorer-print");
    window.addEventListener("afterprint", cleanup);
    return () => { window.removeEventListener("afterprint", cleanup); cleanup(); };
  }, []);
  const definition = useMemo(() => {
    try { return { count: validateStudyDefinition(source, sweep), error: null }; }
    catch (error) { let count: number | null = null; try { count = candidateCount(sweep); } catch { /* invalid range has no count */ }
      return { count, error: error instanceof Error ? error.message : "探索定義が不正です。" }; }
  }, [source, sweep]);
  const weatherUsable = dataset !== null && dataset.intervals.length > 0 && !hasWeatherErrors(dataset.issues) && !weatherLoading;
  const stale = invalidated || binding?.dataset !== dataset || binding?.inputKey !== inputKey || weatherLoading;
  const current = result !== null && !stale && status === "complete";
  const candidate = result?.candidates.find(item => item.id === selected);
  const labels = weatherPeriodLabels(result?.snapshot.coverage ?? dataset?.coverage);
  const metrics: Record<Metric, string> = { annual: `${labels.annual}の日射熱取得`, cooling: `${labels.summer}の日射熱取得`, heating: `${labels.winter}の日射熱取得`, annualDelta: `${labels.annual}の基準案差`, coolingDelta: `${labels.summer}の基準案差`, heatingDelta: `${labels.winter}の基準案差` };
  const run = () => {
    if (!dataset || !weatherUsable || definition.error) return;
    setStatus("running"); setInvalidated(true); setProgress({ completed: 0, total: definition.count! }); setMessage(null);
    try {
      client.run({ dataset, source, sweep, executedAt: new Date().toISOString() }, event => {
        if (event.type === "progress") setProgress({ completed: event.completed, total: event.total });
        else if (event.type === "error") { setStatus("error"); setMessage(event.message); }
        else { setResult(freezeDeep(event.result)); setBinding({ dataset, inputKey }); setInvalidated(false); setStatus("complete"); setSelected(event.result.candidates[0]?.id ?? ""); }
      });
    } catch { client.cancel(); setStatus("error"); setMessage("Web Workerを起動できませんでした。Worker対応ブラウザで再実行してください。"); }
  };
  const importPreset = async (file: File) => {
    try { if (file.size > MAX_PRESET_BYTES) throw new RangeError("探索JSONは最大256 KBです。"); setPendingPreset(parseStudyPreset(await file.text())); setMessage(null); }
    catch (error) { setMessage(error instanceof Error ? error.message : "探索JSONを読めませんでした。"); }
  };
  return <section ref={root} className="panel explorer-panel" aria-labelledby="explorer-title">
    <div className="section-heading"><div><p className="section-kicker">M9 · DESIGN EXPLORER</p><h2 id="explorer-title">パラメトリック探索</h2><p>選択中の案「{source.name}」とSingleの気象を基準に、範囲を広げて感度とトレードオフを見ます。</p></div>
      <button type="button" className="secondary-button no-print" aria-expanded={expanded} aria-controls="explorer-content" onClick={() => setExpanded(!expanded)}>{expanded ? "探索を閉じる" : "探索を設定する"}</button></div>
    {expanded ? <div id="explorer-content">
      <p className="result-reading">自動最適化・ランキングではありません。小さい値が自動的に最良とは限りません。計算値は日射熱取得量で、HVAC負荷・正式な絶対kWh性能評価ではありません。</p>
      {!weatherUsable ? <p role="status">Singleで有効な気象データを読み込むか、デモを選んでください。比較結果が未計算でも探索できます。</p> : null}
      <div className="explorer-controls no-print">
        <AxisEditor name="A" axis={sweep.a} onChange={a => setSweep({ ...sweep, a })} />
        <div><label className="switch-row"><input type="checkbox" checked={!!sweep.b} onChange={event => setSweep(event.target.checked ? { ...sweep, b: { key: "solarHeatGainCoefficient", min: 0.3, max: 0.6, step: 0.1 } } : { a: sweep.a })} />2D探索（Axis Bを追加）</label>
          {sweep.b ? <AxisEditor name="B" axis={sweep.b} onChange={b => setSweep({ ...sweep, b })} /> : <p>まずは1パラメータの変化を確認します。</p>}</div>
      </div>
      <div className="explorer-run no-print"><strong>候補数: {definition.count ?? "—"} / 最大{MAX_STUDY_CANDIDATES}</strong>
        <button type="button" className="run-button" disabled={!weatherUsable || !!definition.error || status === "running"} onClick={run}>探索を実行</button>
        <button type="button" className="secondary-button" disabled={status !== "running"} onClick={() => { client.cancel(); setStatus("canceled"); setInvalidated(true); setMessage("キャンセルしました。未完了runは結果として採用していません。"); }}>キャンセル</button>
      </div>
      {definition.error ? <p role="alert" className="field-error no-print">{definition.error}</p> : null}
      <p className="no-print">小数6桁以内。min + index × stepの格子でmax以下まで（端点を勝手に追加しません）。shapeや配置方式は元の案で先に有効化してください。</p>
      <div className="explorer-progress no-print" role="status" aria-live="polite"><progress max={Math.max(1, progress.total)} value={progress.completed} aria-label="探索進捗" /> {progress.completed} / {progress.total} · {status}</div>
      {message ? <p role="status" className="message no-print">{message}</p> : null}
      <div className="explorer-exports no-print">
        <button type="button" disabled={!current} onClick={() => { if (current && result) saveText("facade-solar-parametric-study.csv", studyCsv(result), "text/csv;charset=utf-8"); }}>探索CSV</button>
        <button type="button" disabled={!current} onClick={() => { if (current) { root.current?.closest("main")?.classList.add("explorer-print"); window.print(); } }}>探索を印刷 / PDF</button>
        <button type="button" disabled={!!definition.error} onClick={() => { try { saveText("facade-solar-parametric-study.json", studyPreset(source, sweep), "application/json"); } catch (error) { setMessage(String(error)); } }}>探索入力JSONを保存</button>
        <label className="file-button">探索JSONを読み込む<input type="file" accept=".json" onChange={event => { const file = event.currentTarget.files?.[0]; if (file) void importPreset(file); event.currentTarget.value = ""; }} /></label>
      </div>
      {pendingPreset ? <div role="dialog" aria-label="探索入力の適用確認" className="message no-print"><p>選択中のSingle案の名称・入力と探索範囲をJSONの内容で置き換えます。気象・計算結果は読み込みません。気象を用意し、明示的に再実行してください。</p>
        <button type="button" onClick={() => setPendingPreset(null)}>読込を取り消す</button><button type="button" onClick={() => { onImport(pendingPreset.source); setSweep(pendingPreset.sweep); setPendingPreset(null); setInvalidated(true); }}>選択中の案へ入力を適用</button></div> : null}
      {result ? <div className="explorer-results" aria-label="探索結果">
        {stale || status !== "complete" ? <aside role="status" className="stale-banner">STALE — 前回実行時のsnapshotです。再実行まで比較案追加・CSV・印刷は無効です。</aside> : <p className="success-line">完了済みのStudy Snapshot · {result.candidates.length}候補</p>}
        <WeatherCoverageNotice coverage={result.snapshot.coverage} />
        <p>気象: {result.snapshot.weatherDatasetId} / {result.snapshot.weatherProvenance.sourceName} ({result.snapshot.weatherProvenance.sourceType}) · {result.snapshot.intervalCount}区間 · {result.snapshot.coverage}</p>
        <p>基準: {result.snapshot.source.name} / {result.snapshot.source.id} · 実行日時: {result.snapshot.executedAt} · {result.snapshot.generationVersion}</p>
        {result.snapshot.weatherProvenance.sourceType === "synthetic" ? <p><strong>合成気象データ。実測・性能検証用ではありません。</strong></p> : null}
        <p>Axis A: {axisLabel(result.snapshot.sweep.a.key)} {result.snapshot.sweep.a.min}〜{result.snapshot.sweep.a.max} / step {result.snapshot.sweep.a.step}
          {result.snapshot.sweep.b ? ` · Axis B: ${axisLabel(result.snapshot.sweep.b.key)} ${result.snapshot.sweep.b.min}〜${result.snapshot.sweep.b.max} / step ${result.snapshot.sweep.b.step}` : ""}</p>
        <p>基準案 [kWh]: {labels.annual} {String(result.baseline.summary.annual.withOverhangKWh)} / {labels.summer} {String(result.baseline.summary.cooling.withOverhangKWh)} / {labels.winter} {String(result.baseline.summary.heating.withOverhangKWh)}。
          基準パラメータ A={parameterValue(result.snapshot.source.parameters, result.snapshot.sweep.a.key)}{result.snapshot.sweep.b ? ` / B=${parameterValue(result.snapshot.source.parameters, result.snapshot.sweep.b.key)}` : ""}（範囲外でも基準として維持）。</p>
        <details><summary>基準案の完全入力・model identity</summary><pre>{JSON.stringify({ parameters: result.snapshot.source.parameters, modelIds: result.snapshot.modelIds }, null, 2)}</pre></details>
        <label className="field no-print"><span>表示指標</span><select value={metric} onChange={event => setMetric(event.target.value as Metric)}>{Object.entries(metrics).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <ExplorerResults study={result} selected={selected} onSelect={setSelected} metric={metric} metricLabel={metrics[metric]} />
        {candidate ? <section className="explorer-detail" aria-label="選択候補の詳細"><h3>候補詳細 · {candidate.id}</h3>
          <p>{axisLabel(result.snapshot.sweep.a.key)} = {candidate.a}{result.snapshot.sweep.b ? ` / ${axisLabel(result.snapshot.sweep.b.key)} = ${candidate.b}` : ""}</p>
          {candidate.status === "INVALID" ? <p className="field-error">INVALID: {candidate.issues.join(" / ")}</p> : <>
            <p>{candidate.simulation.modelVersion} / {candidate.simulation.geometryVersion} / {candidate.simulation.directShadingModel}</p>
            <p>{labels.annual} {String(candidate.simulation.summary.annual.withOverhangKWh)} / {labels.summer} {String(candidate.simulation.summary.cooling.withOverhangKWh)} / {labels.winter} {String(candidate.simulation.summary.heating.withOverhangKWh)} kWh</p>
            <p>基準案差: {String(candidate.delta.annual)} / {String(candidate.delta.cooling)} / {String(candidate.delta.heating)} kWh</p>
            <p>実フィン: {candidate.fins?.count ?? 0}枚 / 中心ピッチ {candidate.fins?.pitchM ?? "—"} m / 左右余白 {candidate.fins?.edgeMarginM ?? "—"} m</p>
            <GeometryPreview comparisonCase={{ id: `explorer-${candidate.id}`, name: candidate.id, parameters: candidate.parameters }} dataset={stale ? null : dataset} />
          </>}
          <details open><summary>候補の完全入力</summary><pre>{JSON.stringify(candidate.parameters, null, 2)}</pre></details>
          <button type="button" className="run-button no-print" disabled={!current || candidate.status !== "VALID" || caseCount >= MAX_COMPARISON_CASES} onClick={() => { if (current && candidate.status === "VALID") { onTransfer(candidate); setMessage("比較案へ追加しました。Singleで比較計算を明示実行してください。"); } }}>比較案に追加</button>
          {caseCount >= MAX_COMPARISON_CASES ? <p className="no-print">比較案は最大{MAX_COMPARISON_CASES}案です。不要な案を削除してから追加してください。</p> : null}
        </section> : null}
        <p>計算時間: {result.runtimeMs.toFixed(1)} ms（この端末・このrun）。fin diffuse / cross-floor遮蔽なし。M5 external reference NOT_RUN。絶対kWhの正式物理validationではありません。</p>
      </div> : <p>探索を実行すると、1D感度グラフまたは2D Heatmap / Trade-offと正確な数値表を表示します。</p>}
    </div> : null}
  </section>;
}

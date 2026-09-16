import { useEffect, useMemo, useRef, useState } from "react";
import type { MultiFloorCase } from "../../multifloor/types";
import { MAX_MULTI_FLOOR_CASES } from "../../multifloor/case";
import { MAX_MULTI_FLOOR_PRESET_BYTES } from "../../multifloor/preset";
import { floorSource, multiStudyInputKey, recommendedMultiAxis, validateMultiStudy, type MultiScope, type MultiStudyInput } from "../../explorer/multi-sweep";
import type { MultiCandidate, MultiStudyResult } from "../../explorer/multi-study";
import { multiStudyCsv, multiStudyPreset, parseMultiStudyPreset } from "../../explorer/multi-export";
import { axisLabel, candidateCount } from "../../explorer/sweep";
import { freezeDeep } from "../../explorer/study";
import { MAX_STUDY_CANDIDATES, type AxisKey, type Metric, type SweepAxis, type SweepDefinition } from "../../explorer/types";
import { hasWeatherErrors, type WeatherDataset } from "../../weather";
import { MultiStudyClient } from "../explorer-client";
import { WeatherCoverageNotice, weatherPeriodLabels } from "../weather-coverage";
import { AxisEditor, saveText } from "./ParametricExplorer";
import { GeometryPreview } from "./GeometryPreview";
import { FloorContribution, MultiParametricResults } from "./MultiParametricResults";

export function MultiParametricExplorer({ dataset, source, selectedFloorId, caseCount, weatherLoading, onTransfer, onImport }: {
  dataset: WeatherDataset | null; source: MultiFloorCase; selectedFloorId: string; caseCount: number; weatherLoading: boolean;
  onTransfer: (candidate: MultiCandidate) => void; onImport: (input: MultiStudyInput) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [scope, setScope] = useState<MultiScope>("selected");
  const [sweep, setSweep] = useState<SweepDefinition>(() => ({ a: recommendedMultiAxis(source, selectedFloorId, "selected", "overhang.depthM") }));
  const [result, setResult] = useState<MultiStudyResult | null>(null);
  const [binding, setBinding] = useState<{ dataset: WeatherDataset; inputKey: string } | null>(null);
  const [invalidated, setInvalidated] = useState(true);
  const [status, setStatus] = useState<"idle" | "running" | "complete" | "canceled" | "error">("idle");
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState("");
  const [geometryFloorId, setGeometryFloorId] = useState(selectedFloorId);
  const [metric, setMetric] = useState<Metric>("annual");
  const [pendingPreset, setPendingPreset] = useState<MultiStudyInput | null>(null);
  const root = useRef<HTMLElement>(null);
  const client = useMemo(() => new MultiStudyClient(() => new Worker(new URL("../multi-explorer.worker.ts", import.meta.url), { type: "module" })), []);
  const input = useMemo(() => ({ source, selectedFloorId, scope, sweep }), [source, selectedFloorId, scope, sweep]);
  const inputKey = multiStudyInputKey(input);
  useEffect(() => { client.cancel(); setInvalidated(true); setStatus(previous => previous === "running" ? "canceled" : previous); }, [client, dataset, inputKey, weatherLoading]);
  useEffect(() => () => client.cancel(), [client]);
  useEffect(() => {
    const cleanup = () => root.current?.closest("main")?.classList.remove("explorer-print");
    window.addEventListener("afterprint", cleanup);
    return () => { window.removeEventListener("afterprint", cleanup); cleanup(); };
  }, []);
  const definition = useMemo(() => {
    try { return { count: validateMultiStudy(input), error: null }; }
    catch (error) { let count: number | null = null; try { count = candidateCount(sweep); } catch { /* no count */ }
      return { count, error: error instanceof Error ? error.message : "探索定義が不正です。" }; }
  }, [input, sweep]);
  const currentFloor = source.floors.find(floor => floor.id === selectedFloorId) ?? source.floors[0]!;
  const weatherUsable = dataset !== null && dataset.intervals.length > 0 && !hasWeatherErrors(dataset.issues) && !weatherLoading;
  const stale = invalidated || binding?.dataset !== dataset || binding?.inputKey !== inputKey || weatherLoading;
  const current = result !== null && !stale && status === "complete";
  const candidate = result?.candidates.find(item => item.id === selected);
  const candidateFloor = candidate?.definition.floors.find(floor => floor.id === (result?.snapshot.scope === "selected" ? result.snapshot.selectedFloorId : geometryFloorId)) ?? candidate?.definition.floors[0];
  const labels = weatherPeriodLabels(result?.snapshot.coverage ?? dataset?.coverage);
  const metrics: Record<Metric, string> = { annual: labels.annual, cooling: labels.summer, heating: labels.winter, annualDelta: `${labels.annual}の基準案差`, coolingDelta: `${labels.summer}の基準案差`, heatingDelta: `${labels.winter}の基準案差` };
  const recommend = (key: AxisKey): SweepAxis => {
    try { const next = recommendedMultiAxis(source, selectedFloorId, scope, key); setMessage(null); return next; }
    catch (error) { setMessage(String(error)); return { key, min: NaN, max: NaN, step: NaN }; }
  };
  const run = () => {
    if (!dataset || !weatherUsable || definition.error) return;
    setStatus("running"); setInvalidated(true); setProgress({ completed: 0, total: definition.count! }); setMessage(null);
    try {
      client.run({ dataset, input, executedAt: new Date().toISOString() }, event => {
        if (event.type === "progress") setProgress({ completed: event.completed, total: event.total });
        else if (event.type === "error") { setStatus("error"); setMessage(event.message); }
        else { setResult(freezeDeep(event.result)); setBinding({ dataset, inputKey }); setInvalidated(false); setStatus("complete"); setSelected(event.result.candidates[0]?.id ?? ""); setGeometryFloorId(selectedFloorId); }
      });
    } catch { client.cancel(); setStatus("error"); setMessage("Web Workerを起動できませんでした。main-threadへの自動切替はしません。"); }
  };
  const importPreset = async (file: File) => {
    try { if (file.size > MAX_MULTI_FLOOR_PRESET_BYTES) throw new RangeError("探索JSONは最大256 KBです。"); setPendingPreset(parseMultiStudyPreset(await file.text())); setMessage(null); }
    catch (error) { setMessage(String(error)); }
  };
  return <section ref={root} className="panel explorer-panel multi-explorer-panel" aria-labelledby="multi-explorer-title">
    <div className="section-heading"><div><p className="section-kicker">M10 · MULTI-FLOOR EXPLORER</p><h2 id="multi-explorer-title">複数階パラメトリック探索</h2><p>選択中の建物案「{source.name}」と同じ気象を使用。各階の変更が建物全体へ与える影響を見ます。</p></div>
      <button type="button" className="secondary-button no-print" aria-expanded={expanded} aria-controls="multi-explorer-content" onClick={() => setExpanded(!expanded)}>{expanded ? "複数階探索を閉じる" : "複数階探索を設定する"}</button></div>
    {expanded ? <div id="multi-explorer-content">
      <p className="result-reading">自動最適化・順位付けではありません。Building Totalは全Floorのcanonical結果の和。上下階相互の物理的な影は計算しません。日射熱取得量であり、HVAC負荷・正式な絶対kWh性能評価ではありません。</p>
      <fieldset className="multi-explorer-scope no-print"><legend>適用範囲</legend>
        <label><input type="radio" name="multi-explorer-scope" value="selected" checked={scope === "selected"} onChange={() => setScope("selected")} />選択階のみ</label>
        <label><input type="radio" name="multi-explorer-scope" value="all" checked={scope === "all"} onChange={() => setScope("all")} />全階共通</label>
        <p>{scope === "selected" ? `対象: ${currentFloor.name} (${selectedFloorId})。他階の入力は固定。` : `全${source.floors.length}階へ同じ値を適用。階ごとの独立組合せ探索ではありません。`}</p>
      </fieldset>
      <p className="no-print">方位角・地面反射率は既存Multiの建物共通入力のため「全階共通」のみ。階の切替・入力変更では手入力範囲を保持し、必要なら「推奨値に戻す」で再設定します。</p>
      {!weatherUsable ? <p role="status">Multiで有効なEPWまたは複数階デモを読み込んでください。通常比較が未計算でも探索できます。</p> : null}
      <div className="explorer-controls no-print">
        <AxisEditor name="A" source={floorSource(source, currentFloor)} axis={sweep.a} otherKey={sweep.b?.key} recommend={recommend} unavailable={scope === "selected" ? ["facadeAzimuthDegFromNorth", "groundReflectance"] : []} onChange={a => setSweep(previous => ({ ...previous, a }))} />
        <div><label className="switch-row"><input type="checkbox" checked={!!sweep.b} onChange={event => { const b = event.target.checked ? recommend(sweep.a.key === "solarHeatGainCoefficient" ? "overhang.depthM" : "solarHeatGainCoefficient") : undefined; setSweep(previous => b ? { ...previous, b } : { a: previous.a }); }} />複数階2D探索（Axis Bを追加）</label>
          {sweep.b ? <AxisEditor name="B" source={floorSource(source, currentFloor)} axis={sweep.b} otherKey={sweep.a.key} recommend={recommend} unavailable={scope === "selected" ? ["facadeAzimuthDegFromNorth", "groundReflectance"] : []} onChange={b => setSweep(previous => ({ ...previous, b }))} /> : <p>1Dから始め、必要な場合だけ2軸を組み合わせます。</p>}</div>
      </div>
      <div className="explorer-run no-print"><strong>候補数: {definition.count ?? "—"} / 最大{MAX_STUDY_CANDIDATES}</strong>
        <button type="button" className="run-button" disabled={!weatherUsable || !!definition.error || status === "running"} onClick={run}>複数階探索を実行</button>
        <button type="button" disabled={status !== "running"} onClick={() => { client.cancel(); setStatus("canceled"); setInvalidated(true); setMessage("キャンセルしました。未完了runは採用しません。"); }}>複数階探索をキャンセル</button></div>
      {definition.error ? <p role="alert" className="field-error no-print">{definition.error}</p> : null}
      <p className="no-print">小数6桁以内。最大64候補を切捨てません。推奨範囲は安全な共通範囲を優先しますが、2軸同時変更を含む全形状の成立・物理的妥当性を保証しません。</p>
      <div className="explorer-progress no-print" role="status" aria-live="polite"><progress max={Math.max(1, progress.total)} value={progress.completed} aria-label="複数階探索進捗" /> {progress.completed} / {progress.total} · {status}</div>
      {message ? <p role="status" className="message no-print">{message}</p> : null}
      <div className="explorer-exports no-print">
        <button type="button" disabled={!current} onClick={() => { if (current && result) saveText("facade-solar-multi-study.csv", multiStudyCsv(result), "text/csv;charset=utf-8"); }}>複数階探索CSV</button>
        <button type="button" disabled={!current} onClick={() => { if (current) { root.current?.closest("main")?.classList.add("explorer-print"); window.print(); } }}>複数階探索を印刷 / PDF</button>
        <button type="button" disabled={!!definition.error} onClick={() => { try { saveText("facade-solar-multi-study.json", multiStudyPreset(input), "application/json"); } catch (error) { setMessage(String(error)); } }}>複数階探索入力JSONを保存</button>
        <label className="file-button">複数階探索JSONを読み込む<input type="file" accept=".json" onChange={event => { const file = event.currentTarget.files?.[0]; if (file) void importPreset(file); event.currentTarget.value = ""; }} /></label>
      </div>
      {pendingPreset ? <div role="dialog" aria-label="複数階探索入力の適用確認" className="message no-print"><p>選択中のMulti案の名称・全Floor入力とscope・選択階・探索範囲をJSONの内容で置き換えます。気象・結果は読み込みません。weatherを用意し明示rerunしてください。</p>
        <button type="button" onClick={() => setPendingPreset(null)}>読込を取り消す</button><button type="button" onClick={() => { client.cancel(); onImport(pendingPreset); setScope(pendingPreset.scope); setSweep(pendingPreset.sweep); setPendingPreset(null); setInvalidated(true); }}>選択中のMulti案へ入力を適用</button></div> : null}
      {result ? <div className="explorer-results" aria-label="複数階探索結果">
        {!current ? <aside role="status" className="stale-banner">STALE — 前回実行時のsnapshot。再実行まで比較案追加・CSV・印刷は無効です。</aside> : <p className="success-line">完了済みMulti Study Snapshot · {result.candidates.length}候補</p>}
        <WeatherCoverageNotice coverage={result.snapshot.coverage} />
        <p>気象: {result.snapshot.weatherDatasetId} / {result.snapshot.weatherProvenance.sourceName} ({result.snapshot.weatherProvenance.sourceType}) · {result.snapshot.intervalCount}区間。syntheticは実測・性能検証ではありません。</p>
        <p>基準: {result.snapshot.source.name} / {result.snapshot.source.id} · {result.snapshot.scope === "selected" ? `選択階のみ: ${result.snapshot.source.floors.find(floor => floor.id === result.snapshot.selectedFloorId)?.name}` : `全${result.snapshot.source.floors.length}階共通`} · 選択階ID {result.snapshot.selectedFloorId}</p>
        <p>実行日時: {result.snapshot.executedAt} / {result.snapshot.generationVersion}</p>
        <p>Axis A: {axisLabel(result.snapshot.sweep.a.key)} {result.snapshot.sweep.a.min}〜{result.snapshot.sweep.a.max} / step {result.snapshot.sweep.a.step}{result.snapshot.sweep.b ? ` · Axis B: ${axisLabel(result.snapshot.sweep.b.key)} ${result.snapshot.sweep.b.min}〜${result.snapshot.sweep.b.max} / step ${result.snapshot.sweep.b.step}` : ""}</p>
        <p>基準Building Total [kWh]: {labels.annual} {String(result.baseline.total.annualKWh)} / {labels.summer} {String(result.baseline.total.summerKWh)} / {labels.winter} {String(result.baseline.total.winterKWh)}</p>
        <details><summary>基準案の完全入力・model identity</summary><pre>{JSON.stringify({ source: result.snapshot.source, modelIds: result.snapshot.modelIds }, null, 2)}</pre></details>
        <label className="field no-print"><span>建物表示指標</span><select value={metric} onChange={event => setMetric(event.target.value as Metric)}>{Object.entries(metrics).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <MultiParametricResults study={result} selected={selected} onSelect={setSelected} metric={metric} metricLabel={metrics[metric]} />
        {candidate ? <section className="explorer-detail" aria-label="複数階候補の詳細"><h3>候補詳細 · {candidate.id}</h3><p>A={candidate.a} / B={candidate.b ?? "—"} · 変更対象: {candidate.affectedFloorIds.join(" / ")}</p>
          {candidate.status === "INVALID" ? <p className="field-error">INVALID: {candidate.issues.join(" / ")}。建物・全Floorの計算値なし（0ではありません）。</p> : <>
            <FloorContribution candidate={candidate} study={result} />
            {result.snapshot.scope === "all" ? <label className="field no-print"><span>候補形状の表示階</span><select value={candidateFloor?.id} onChange={event => setGeometryFloorId(event.target.value)}>{candidate.definition.floors.map(floor => <option key={floor.id} value={floor.id}>{floor.name}</option>)}</select></label> : null}
            {candidateFloor ? <><h4>候補時の形状 · {candidateFloor.name}</h4><GeometryPreview comparisonCase={floorSource(candidate.definition, candidateFloor)} dataset={current ? dataset : null} /></> : null}
          </>}
          <details open><summary>候補の完全Multi入力</summary><pre>{JSON.stringify(candidate.definition, null, 2)}</pre></details>
          <button type="button" className="run-button no-print" disabled={!current || candidate.status !== "VALID" || caseCount >= MAX_MULTI_FLOOR_CASES} onClick={() => { if (current && candidate.status === "VALID") { onTransfer(candidate); setMessage("複数階比較案に追加しました。通常の「複数階比較を実行」で再計算してください。"); } }}>複数階比較案に追加</button>
          {caseCount >= MAX_MULTI_FLOOR_CASES ? <p className="no-print">建物案は最大{MAX_MULTI_FLOOR_CASES}案です。上書き・自動削除はしません。</p> : null}
        </section> : null}
        <p>計算時間: {result.runtimeMs.toFixed(1)} ms（この端末・runのみ）。fin diffuse / cross-floor physical shading未実装。M5外部参照NOT_RUN。絶対kWh正式validation未完了。</p>
      </div> : <p>実行後にBuilding Totalの1D／Heatmap／Trade-offと、各候補のFloor Breakdown・形状を表示します。</p>}
    </div> : null}
  </section>;
}

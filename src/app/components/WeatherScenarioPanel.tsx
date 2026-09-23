import { useEffect, useMemo, useRef, useState } from "react";
import type { WeatherDataset } from "../../weather";
import { describeWeather, type WeatherDescriptor } from "../../scenario/weather";
import { scenarioInputKey, validateScenario } from "../../scenario/study";
import { freezeDeep } from "../../explorer/study";
import { METRICS, type ScenarioInput, type ScenarioMetric, type ScenarioResult, type ScenarioSource, type WeatherSlot } from "../../scenario/types";
import { scenarioCsv } from "../../scenario/export";
import { bindScenarioWeather, MAX_SCENARIO_PRESET_BYTES, parseScenarioPreset, scenarioPreset, type RestoredScenario } from "../../scenario/preset";
import type { ScenarioMessage, ScenarioRequest } from "../../scenario/protocol";
import { RunClient } from "../explorer-client";
import { parseBrowserEpwFile } from "../weather-file";
import type { CaseColors } from "../case-colors";
import { saveText } from "./ParametricExplorer";
import { scenarioMetricLabels, WeatherDescriptorView, WeatherScenarioResults } from "./WeatherScenarioResults";
import "../scenario.css";

interface ExtraSlot { readonly id: string; readonly label: string; readonly dataset: WeatherDataset | null; readonly expected?: WeatherDescriptor }
export function WeatherScenarioPanel({ source, dataset, loadingWeather, active = true, colors, onImport, onCurrentWeather, onBaseline }: {
  source: ScenarioSource; dataset: WeatherDataset | null; loadingWeather: boolean; active?: boolean; colors: CaseColors;
  onImport: (source: ScenarioSource) => void; onCurrentWeather: (dataset: WeatherDataset) => void; onBaseline: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [extras, setExtras] = useState<readonly ExtraSlot[]>([]);
  const [currentLabel, setCurrentLabel] = useState("現在の気象");
  const [currentExpected, setCurrentExpected] = useState<WeatherDescriptor | null>(null);
  const [referenceId, setReferenceId] = useState("current");
  const [metric, setMetric] = useState<ScenarioMetric>("annual");
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [invalidated, setInvalidated] = useState(true);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [message, setMessage] = useState("");
  const [parsing, setParsing] = useState(false);
  const [selected, setSelected] = useState("");
  const [pending, setPending] = useState<RestoredScenario | null>(null);
  const sequence = useRef(1), fileGeneration = useRef(0);
  const root = useRef<HTMLElement>(null);
  const client = useMemo(() => new RunClient<ScenarioRequest, ScenarioMessage>(
    () => new Worker(new URL("../scenario.worker.ts", import.meta.url), { type: "module" }),
    runId => ({ type: "error", runId, message: "Workerに失敗しました。main-thread計算への自動切替はしません。" })), []);
  const descriptors = useMemo(() => {
    const describe = (d: WeatherDataset | null) => { try { return d ? describeWeather(d) : null; } catch { return null; } };
    return [describe(dataset), ...extras.map(s => describe(s.dataset))];
  }, [dataset, extras]);
  const slots = useMemo((): readonly WeatherSlot[] => [
    ...(dataset && !currentExpected ? [{ id: "current", label: currentLabel, dataset }] : []),
    ...extras.flatMap(s => s.dataset ? [{ id: s.id, label: s.label, dataset: s.dataset }] : []),
  ], [dataset, currentExpected, currentLabel, extras]);
  const input = useMemo(() => ({ ...source, slots, referenceId } as ScenarioInput), [source.mode, source.workspace, slots, referenceId]);
  const definition = useMemo(() => {
    try {
      if (slots.length !== extras.length + 1) throw new RangeError("UNRESOLVED: 対応するEPWを再度読み込んでください。");
      validateScenario(input); return { key: scenarioInputKey(input), error: "" };
    } catch (e) { return { key: "invalid", error: e instanceof Error ? e.message : "入力が不正です。" }; }
  }, [input, extras.length]);
  useEffect(() => { client.cancel(); setInvalidated(true); setStatus(old => old === "running" ? "canceled" : old); },
    [client, source.mode, source.workspace, dataset, extras, currentLabel, currentExpected, referenceId, loadingWeather, active]);
  useEffect(() => () => { client.cancel(); fileGeneration.current++; }, [client]);
  useEffect(() => {
    const cleanup = () => root.current?.closest("main")?.classList.remove("scenario-print");
    window.addEventListener("afterprint", cleanup);
    return () => { window.removeEventListener("afterprint", cleanup); cleanup(); };
  }, []);
  const current = result !== null && !invalidated && !definition.error && result.snapshot.inputKey === definition.key && status === "complete" && !loadingWeather && !parsing && active;
  const invalidate = () => { client.cancel(); setInvalidated(true); setStatus(old => old === "running" ? "canceled" : old); };
  const loadWeather = async (file: File, id?: string) => {
    invalidate(); setParsing(true); setMessage(""); const generation = ++fileGeneration.current;
    try {
      const parsed = await parseBrowserEpwFile(file); const d = describeWeather(parsed);
      if (generation !== fileGeneration.current) return;
      const expected = id === "current" ? currentExpected : extras.find(s => s.id === id)?.expected;
      if (expected) bindScenarioWeather(expected, parsed);
      if (slots.some(s => s.id !== id && describeWeather(s.dataset).fingerprint === d.fingerprint)) throw new RangeError("同一気象の重複です。別のEPWを選択してください。");
      if (id === "current") { onCurrentWeather(parsed); setCurrentExpected(null); }
      else if (id) setExtras(old => old.map(s => s.id === id ? { id: s.id, label: s.label, dataset: parsed } : s));
      else {
        while (extras.some(s => s.id === `weather-${sequence.current}`)) sequence.current++;
        const id = `weather-${sequence.current++}`;
        setExtras(old => old.length >= 3 ? old : [...old, { id, label: parsed.location.city || file.name, dataset: parsed }]);
      }
      setMessage("EPWを読み込みました。比較は明示的に再実行してください。");
    } catch (e) { if (generation === fileGeneration.current) setMessage(e instanceof Error ? e.message : "EPW読込に失敗しました。"); }
    finally { if (generation === fileGeneration.current) setParsing(false); }
  };
  const run = () => {
    if (definition.error || loadingWeather || parsing || !active) return;
    setInvalidated(true); setStatus("running"); setProgress({ completed: 0, total: slots.length * source.workspace.cases.length }); setMessage("");
    try { client.run({ input, executedAt: new Date().toISOString() }, event => {
      if (event.type === "progress") { setProgress({ completed: event.completed, total: event.total }); if (event.cell) setMessage(`${event.cell.designId} × ${event.cell.weatherId}: ${event.cell.status}`); }
      else if (event.type === "error") { setStatus("error"); setMessage(event.message); }
      else { setResult(freezeDeep(event.result)); setInvalidated(false); setStatus("complete"); setSelected(JSON.stringify([event.result.cells[0]!.designId, event.result.cells[0]!.weatherId])); }
    }); } catch { client.cancel(); setStatus("error"); setMessage("Workerを開始できません。main-thread fallbackはありません。"); }
  };
  const importJson = async (file: File) => {
    try {
      if (file.size > MAX_SCENARIO_PRESET_BYTES) throw new RangeError("入力JSONは最大256 KBです。");
      const p = parseScenarioPreset(await file.text());
      if (p.source.mode !== source.mode) throw new RangeError("JSONのSingle/Multiと同じWorkspaceで読み込んでください。");
      setPending(p);
    } catch (e) { setMessage(String(e)); }
  };
  const prefix = `${source.mode}-scenario`;
  const labels = scenarioMetricLabels((result?.snapshot.slots ?? []).some(s => s.weather.coverage === "partial"));
  return <section ref={root} className="panel scenario-panel" aria-labelledby={`${prefix}-title`}>
    <div className="section-heading"><div><p className="section-kicker">M11 · CLIMATE / WEATHER SCENARIO MATRIX</p><h2 id={`${prefix}-title`}>気象シナリオ比較</h2><p>現在の{source.mode === "single" ? "Single設計案" : "Multi建物案"} × 最大4気象。パラメトリック探索とは組み合わせません。</p></div>
      <button type="button" className="secondary-button no-print" aria-expanded={expanded} aria-controls={`${prefix}-content`} onClick={() => setExpanded(!expanded)}>{expanded ? "気象シナリオを閉じる" : "気象シナリオを設定する"}</button></div>
    {expanded ? <div id={`${prefix}-content`}>
      <p>同じ設計の気象感度を見る比較です。raw EPWはこのブラウザ内のみ。予測・最適化・正式な物理性能評価ではありません。<a href="#guide-weather-scenario">複数気象で比較するガイド</a></p>
      <div className="scenario-cards no-print"><article><h3>Slot 1 · 現在の気象（Workspace live source）</h3><label className="field">気象ラベル 1<input maxLength={120} value={currentLabel} onChange={e => { invalidate(); setCurrentLabel(e.target.value); }} /></label>
        {currentExpected ? <><p role="status">UNRESOLVED — 対応するEPWを再度読み込んでください。</p><WeatherDescriptorView weather={currentExpected} />
          <button type="button" disabled={!dataset || parsing} onClick={() => { try { if (dataset) { bindScenarioWeather(currentExpected, dataset); setCurrentExpected(null); invalidate(); } } catch(e) { setMessage(String(e)); } }}>現在の気象を照合してbind</button></> : descriptors[0] ? <WeatherDescriptorView weather={descriptors[0]} /> : <p>Workspaceで有効な気象を選択してください。</p>}
        <label className="file-button">現在の気象をEPWで置換<input type="file" accept=".epw" disabled={parsing} onChange={e => { const f=e.target.files?.[0]; if(f) void loadWeather(f,"current"); e.target.value=""; }} /></label>
      </article>{extras.map((s,i) => <article key={s.id}><h3>Slot {i+2}</h3><label className="field">気象ラベル {i+2}<input maxLength={120} value={s.label} onChange={e => { invalidate(); setExtras(old => old.map(w => w.id === s.id ? {...w,label:e.target.value}:w)); }} /></label>
        {s.expected ? <><p role="status">UNRESOLVED — 対応するEPWを再度読み込んでください。</p><WeatherDescriptorView weather={s.expected} /></> : descriptors[i+1] ? <WeatherDescriptorView weather={descriptors[i+1]!} /> : <p>未読込</p>}
        <label className="file-button">Slot {i+2} EPWを{ s.expected ? "再選択" : "置換"}<input type="file" accept=".epw" disabled={parsing} onChange={e => { const f=e.target.files?.[0]; if(f) void loadWeather(f,s.id); e.target.value=""; }} /></label>
        <button type="button" disabled={parsing} onClick={() => { invalidate(); setExtras(old => old.filter(w => w.id!==s.id)); if(referenceId===s.id) setReferenceId("current"); }}>Slot {i+2}を削除</button>
      </article>)}</div>
      <div className="scenario-controls no-print"><label className="file-button">EPWを追加（{extras.length+1}/4）<input type="file" accept=".epw" disabled={extras.length>=3 || parsing} onChange={e => { const f=e.target.files?.[0]; if(f) void loadWeather(f); e.target.value=""; }} /></label>
        <label className="field">基準設計<select value={source.workspace.baselineCaseId} onChange={e => { invalidate(); onBaseline(e.target.value); }}>{source.workspace.cases.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="field">参照気象<select value={referenceId} onChange={e=>{invalidate();setReferenceId(e.target.value);}}><option value="current">{currentLabel}</option>{extras.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      </div>
      <div className="scenario-controls no-print"><strong>{source.workspace.cases.length}設計 × {extras.length+1}気象 / 最大16組合せ</strong><button type="button" className="run-button" disabled={!!definition.error || loadingWeather || parsing || status==="running"} onClick={run}>気象シナリオ比較を実行</button><button type="button" disabled={status!=="running"} onClick={()=>{invalidate();setStatus("canceled");setMessage("キャンセルしました。未完了runは採用しません。");}}>気象比較をキャンセル</button></div>
      {definition.error ? <p role="status" className="no-print">{definition.error}</p>:null}
      <div role="status" aria-live="polite" className="no-print"><progress aria-label="気象比較の進捗" value={progress.completed} max={Math.max(1,progress.total)} /> {progress.completed}/{progress.total} · {status} {parsing?"EPW読込中":""}<p>{message}</p></div>
      <div className="scenario-controls no-print"><button type="button" disabled={!current} onClick={()=>{if(current&&result)saveText("facade-weather-scenario.csv",scenarioCsv(result),"text/csv;charset=utf-8");}}>気象比較CSV</button>
        <button type="button" disabled={!current} onClick={()=>{if(current){root.current?.closest("main")?.classList.add("scenario-print");window.print();}}}>気象比較を印刷 / PDF</button>
        <button type="button" disabled={!!definition.error || parsing || status==="running" || (result!==null&&!current)} onClick={()=>{try{saveText("facade-weather-scenario.json",scenarioPreset(input,metric),"application/json");}catch(e){setMessage(String(e));}}}>気象比較入力JSONを保存</button>
        <label className="file-button">気象比較JSONを読み込む<input type="file" accept=".json" disabled={parsing} onChange={e=>{const f=e.target.files?.[0];if(f)void importJson(f);e.target.value="";}} /></label>
      </div>
      {pending ? <div role="dialog" aria-modal="false" aria-label="気象シナリオ入力の適用確認" className="message no-print"><p>現在の全設計案・基準設計と気象slotを置換します。raw気象・結果は復元しません。全slotはUNRESOLVEDになり、対応するEPWの再選択が必要です。</p><button type="button" onClick={()=>setPending(null)}>読込を取り消す</button><button type="button" onClick={()=>{
        invalidate(); onImport(pending.source);setCurrentLabel(pending.slots[0]!.label);setCurrentExpected(pending.slots[0]!.weather);
        setExtras(pending.slots.slice(1).map(s=>({id:s.id,label:s.label,dataset:null,expected:s.weather})));sequence.current=100;
        setReferenceId(pending.referenceId);setMetric(pending.metric);setResult(null);setPending(null);setStatus("idle");setProgress({completed:0,total:0});
      }}>設計と気象シナリオ入力を適用</button></div>:null}
      {result ? <>{!current ? <aside role="status" className="stale-banner">STALE — 前回のsnapshotは参考表示のみ。入力を元に戻しても、明示的な再実行までCSV / JSON / 印刷は無効です。</aside>:<p role="status" className="success-line">気象シナリオ計算完了</p>}
        <label className="field no-print">気象比較の表示指標<select value={metric} onChange={e=>setMetric(e.target.value as ScenarioMetric)}>{METRICS.map(m=><option key={m} value={m}>{labels[m]}</option>)}</select></label>
        <WeatherScenarioResults result={result} metric={metric} selected={selected} onSelect={setSelected} colors={colors} /></>:null}
    </div>:null}
  </section>;
}

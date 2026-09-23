import { useMemo, useRef, useState } from "react";

import { formatKWh } from "../../comparison";
import { createDemoWeatherDataset, DEMO_WEATHER_DATASET_ID } from "../../demo/demo-weather";
import { createMultiFloorFinArrayDemoWorkspace } from "../../multifloor/demo";
import {
  MAX_MULTI_FLOOR_CASES,
  MAX_MULTI_FLOOR_PRESET_BYTES,
  MULTI_FLOOR_CASE_PRESET_KIND,
  MULTI_FLOOR_CSV_FILENAME,
  addFloor,
  addMultiFloorCase,
  applyMultiFloorPreset,
  createMultiFloorCase,
  createMultiFloorCsv,
  createMultiFloorDefinition,
  createMultiFloorDemoWorkspace,
  createMultiFloorPresetFilename,
  createMultiFloorWorkspace,
  deleteFloor,
  deleteMultiFloorCase,
  duplicateFloor,
  duplicateMultiFloorCase,
  nextAvailableFloorId,
  nextAvailableMultiFloorCaseId,
  parseMultiFloorPreset,
  replaceMultiFloorCase,
  runMultiFloorComparison,
  serializeMultiFloorCasePreset,
  serializeMultiFloorWorkspacePreset,
  setMultiFloorBaseline,
  validateMultiFloorWorkspace,
  type MultiFloorCase,
  type MultiFloorPresetV1,
  type MultiFloorRunResult,
  type MultiFloorWorkspace as MultiFloorWorkspaceState,
} from "../../multifloor";
import {
  hasWeatherErrors,
  WeatherDataError,
  type WeatherDataset,
  type WeatherParseIssue,
} from "../../weather";
import { parseBrowserEpwFile } from "../weather-file";
import { WeatherCoverageNotice, weatherPeriodLabels } from "../weather-coverage";
import { MultiFloorCaseEditor } from "./MultiFloorCaseEditor";
import { MultiFloorGeometryPreview } from "./MultiFloorGeometryPreview";
import { FloorInputDifferences } from "./FloorInputDifferences";
import { MultiFloorResults } from "./MultiFloorResults";
import { CaseColorPicker, CaseMarker, getCaseStyle, useCaseColors } from "../case-colors";
import { MultiParametricExplorer } from "./MultiParametricExplorer";
import { WeatherScenarioPanel } from "./WeatherScenarioPanel";
import { transferMultiCandidate } from "../../explorer/multi-study";

const WEATHER_ISSUE_MESSAGES: Record<WeatherParseIssue["code"], string> = {
  HEADER_MISSING: "必要なヘッダーがありません。",
  HEADER_INVALID: "ヘッダーの内容が不正です。",
  DATA_PERIOD_UNSUPPORTED: "対応していないデータ期間です。",
  INTERVAL_METADATA_INVALID: "時間間隔の設定が不正です。",
  INTERVAL_DUPLICATE: "気象データの時間区間が重複しています。",
  INTERVAL_MISSING: "気象データの時間区間が欠けています。",
  INTERVAL_OUT_OF_ORDER: "気象データが時系列順に並んでいません。",
  INTERVAL_OUT_OF_PERIOD: "気象データが宣言された期間外です。",
  ROW_MALFORMED: "気象データ行の形式が不正です。",
  DATE_INVALID: "日付が不正です。",
  TIME_INVALID: "時刻が不正です。",
  RADIATION_MISSING: "必要な日射量が欠損しています。",
  RADIATION_INVALID: "日射量が不正です。",
};

function downloadTextFile(filename: string, contents: string, mediaType: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: mediaType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function initialWorkspace(): MultiFloorWorkspaceState {
  const demo = createMultiFloorDemoWorkspace();
  return createMultiFloorWorkspace({ ...demo.cases[0]!, name: "建物案A" });
}

export function WeatherPanel({
  dataset,
  loading,
  failure,
  onDemo,
  onFinDemo,
  onFile,
}: {
  readonly dataset: WeatherDataset | null;
  readonly loading: boolean;
  readonly failure: { readonly message: string; readonly issues: readonly WeatherParseIssue[] } | null;
  readonly onDemo: () => void;
  readonly onFinDemo?: () => void;
  readonly onFile: (file: File) => void;
}) {
  const isDemo = dataset?.id === DEMO_WEATHER_DATASET_ID;
  return (
    <section className="panel weather-panel" aria-labelledby="multifloor-weather-title">
      <div className="section-heading compact-heading">
        <div><p className="section-kicker">01 · 気象データ</p><h2 id="multifloor-weather-title">複数階比較に使う気象データ</h2></div>
        <div className="weather-actions">
          <button type="button" className="demo-button" disabled={loading} onClick={onDemo}>複数階デモを試す</button>
          {onFinDemo ? <button type="button" className="demo-button" disabled={loading} onClick={onFinDemo}>複数階フィンのピッチ比較</button> : null}
          <label className="file-button"><span>{loading ? "読込中…" : "EPWファイルを読み込む"}</span><input type="file" accept=".epw" disabled={loading} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file !== undefined) onFile(file); event.currentTarget.value = ""; }} /></label>
        </div>
      </div>
      <div className={isDemo ? "demo-disclosure active" : "demo-disclosure"} role={isDemo ? "status" : undefined}>
        <div><strong>{isDemo ? "複数階デモ · 合成気象データを使用中" : "複数階デモ · 合成気象データ"}</strong><span>通常デモは3階建て2案。フィンのピッチ比較は、各階の幅6 mの開口で「なし・出0.6 m／中心ピッチ2 m・出0.6 m／中心ピッチ1 m」の3案を比較します。</span></div>
        <p><strong>synthetic / 実測気象ではありません。</strong> 性能検証用データではありません。</p>
      </div>
      {failure === null ? null : <div className="message error-message" role="alert"><strong>EPWファイルを使用できません。</strong><span>{failure.message}</span><ul>{failure.issues.slice(0, 6).map((item, index) => <li key={`${item.code}-${index}`}>{item.code}: {WEATHER_ISSUE_MESSAGES[item.code]}</li>)}</ul></div>}
      <WeatherCoverageNotice coverage={dataset?.coverage} />
      {dataset === null ? <div className="weather-empty"><strong>気象データは未読込です</strong><span>入力と積層形状を編集できます。計算にはEPWまたはデモ気象が必要です。</span></div> : (
        <div className="weather-content"><div className="weather-place"><strong>{dataset.location.city || "地点名なし"}</strong><span>{[dataset.location.region, dataset.location.country].filter(Boolean).join(" / ")}</span></div><dl className="metadata-grid"><div><dt>データ出典</dt><dd>{dataset.provenance.sourceName}</dd></div><div><dt>データ区分</dt><dd>{isDemo ? "Synthetic Demo Weather" : "EPW"}</dd></div><div><dt>時間区間数</dt><dd>{dataset.intervals.length.toLocaleString("ja-JP")}</dd></div><div><dt>データセットID</dt><dd><code>{dataset.id}</code></dd></div></dl></div>
      )}
    </section>
  );
}

export function MultiFloorPrintSummary({ result, dataset }: { readonly result: MultiFloorRunResult; readonly dataset: WeatherDataset }) {
  return (
    <section className="print-only multifloor-print-summary">
      <p>Facade Solar Lab · M7 Multi-floor Mode</p>
      <h1>複数階ファサード 日射熱取得比較レポート</h1>
      <dl className="print-weather-grid"><div><dt>地点</dt><dd>{[dataset.location.city, dataset.location.region, dataset.location.country].filter(Boolean).join(" / ")}</dd></div><div><dt>出典</dt><dd>{dataset.provenance.sourceName}</dd></div><div><dt>データセット</dt><dd>{dataset.id}</dd></div><div><dt>基準案</dt><dd>{result.cases.find((item) => item.caseId === result.baselineCaseId)?.name}</dd></div></dl>
      <p className="print-critical-warning"><strong>表示値は開口からの日射熱取得量であり、HVAC冷房・暖房負荷ではありません。絶対値は正式な物理性能検証前です。</strong></p>
      <WeatherCoverageNotice coverage={dataset.coverage} />
    </section>
  );
}

export function MultiFloorWorkspace({ active = true }: { active?: boolean } = {}) {
  const { colors, setColor, resetColors } = useCaseColors();
  const [workspace, setWorkspace] = useState<MultiFloorWorkspaceState>(() => initialWorkspace());
  const [selectedCaseId, setSelectedCaseId] = useState("building-a");
  const [selectedFloorId, setSelectedFloorId] = useState("floor-1");
  const [dataset, setDataset] = useState<WeatherDataset | null>(null);
  const [weatherFailure, setWeatherFailure] = useState<{ readonly message: string; readonly issues: readonly WeatherParseIssue[] } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [result, setResult] = useState<MultiFloorRunResult | null>(null);
  const [dirty, setDirty] = useState(true);
  const [runError, setRunError] = useState<string | null>(null);
  const [presetMessage, setPresetMessage] = useState<string | null>(null);
  const [presetError, setPresetError] = useState<string | null>(null);
  const caseSequence = useRef(2);

  const selectedCase = workspace.cases.find((item) => item.id === selectedCaseId) ?? workspace.cases[0]!;
  const selectedFloor = selectedCase.floors.find((floor) => floor.id === selectedFloorId) ?? selectedCase.floors[0]!;
  const validationIssues = useMemo(() => validateMultiFloorWorkspace(workspace), [workspace]);
  const selectedIssues = validationIssues.filter((issue) => issue.caseId === selectedCase.id);
  const weatherUsable = dataset !== null && dataset.intervals.length > 0 && !hasWeatherErrors(dataset.issues);
  const canRun = weatherUsable && validationIssues.length === 0;

  const markChanged = () => {
    setDirty(true);
    setRunError(null);
    setPresetMessage(null);
  };

  const mutateWorkspace = (
    updater: (current: MultiFloorWorkspaceState) => MultiFloorWorkspaceState,
    selection?: { readonly caseId?: string; readonly floorId?: string },
  ) => {
    setWorkspace((current) => updater(current));
    if (selection?.caseId !== undefined) setSelectedCaseId(selection.caseId);
    if (selection?.floorId !== undefined) setSelectedFloorId(selection.floorId);
    markChanged();
  };

  const replaceSelectedCase = (next: MultiFloorCase) => mutateWorkspace(
    (current) => replaceMultiFloorCase(current, next),
  );

  const selectCase = (caseId: string) => {
    const item = workspace.cases.find((candidate) => candidate.id === caseId);
    if (item === undefined) return;
    setSelectedCaseId(item.id);
    setSelectedFloorId(item.floors[0]!.id);
  };

  const loadWeather = async (file: File) => {
    setLoadingWeather(true);
    setWeatherFailure(null);
    try {
      const parsed = await parseBrowserEpwFile(file);
      setDataset(parsed);
      setResult(null);
      setDirty(true);
      if (hasWeatherErrors(parsed.issues)) setWeatherFailure({ message: "必須日射量にエラーがあるため計算できません。", issues: parsed.issues });
    } catch (error) {
      setDataset(null);
      setResult(null);
      setWeatherFailure({ message: error instanceof Error ? error.message : "EPWを解析できませんでした。", issues: error instanceof WeatherDataError ? error.issues : [] });
    } finally {
      setLoadingWeather(false);
    }
  };

  const loadDemo = (array = false) => {
    try {
      const nextDataset = createDemoWeatherDataset();
      const nextWorkspace = array ? createMultiFloorFinArrayDemoWorkspace() : createMultiFloorDemoWorkspace();
      const nextResult = runMultiFloorComparison(nextDataset, nextWorkspace);
      setWorkspace(nextWorkspace);
      resetColors();
      setSelectedCaseId("building-b");
      setSelectedFloorId("floor-3");
      setDataset(nextDataset);
      setResult(nextResult);
      setDirty(false);
      setWeatherFailure(null);
      setRunError(null);
      setPresetMessage("決定論的な複数階デモを読み込み、比較計算を実行しました。");
      caseSequence.current = array ? 4 : 3;
    } catch {
      setRunError("複数階デモの実行に失敗しました。");
    }
  };

  const run = () => {
    if (!canRun || dataset === null) return;
    try {
      setResult(runMultiFloorComparison(dataset, workspace));
      setDirty(false);
      setRunError(null);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "複数階比較を実行できませんでした。");
    }
  };

  const saveCase = () => {
    try {
      downloadTextFile(createMultiFloorPresetFilename(selectedCase.name), serializeMultiFloorCasePreset(selectedCase), "application/json;charset=utf-8");
      setPresetMessage(`${selectedCase.name}の入力専用JSONを保存しました。`);
      setPresetError(null);
    } catch (error) {
      setPresetError(error instanceof Error ? error.message : "建物案を保存できませんでした。");
    }
  };

  const saveWorkspace = () => {
    try {
      downloadTextFile("facade-multifloor-workspace.json", serializeMultiFloorWorkspacePreset(workspace, selectedCase.id, selectedFloor.id), "application/json;charset=utf-8");
      setPresetMessage("複数階比較セットの入力専用JSONを保存しました。");
      setPresetError(null);
    } catch (error) {
      setPresetError(error instanceof Error ? error.message : "比較セットを保存できませんでした。");
    }
  };

  const applyPreset = (preset: MultiFloorPresetV1) => {
    const nextIdentity = nextAvailableMultiFloorCaseId(workspace, caseSequence.current);
    const applied = applyMultiFloorPreset(
      workspace,
      preset,
      preset.kind === MULTI_FLOOR_CASE_PRESET_KIND ? nextIdentity.id : undefined,
    );
    if (preset.kind === MULTI_FLOOR_CASE_PRESET_KIND) caseSequence.current = nextIdentity.sequence + 1;
    setWorkspace(applied.workspace);
    if (preset.kind !== MULTI_FLOOR_CASE_PRESET_KIND) resetColors();
    setSelectedCaseId(applied.selectedCaseId);
    setSelectedFloorId(applied.selectedFloorId);
    setResult(applied.result);
    setDirty(applied.dirty);
    setPresetMessage("入力条件を読み込みました。結果は含まれないため、比較計算を実行してください。");
    setPresetError(null);
  };

  const loadPreset = async (file: File) => {
    setPresetMessage(null);
    setPresetError(null);
    try {
      if (!file.name.toLowerCase().endsWith(".json")) throw new RangeError("JSONファイルを選択してください。");
      if (file.size > MAX_MULTI_FLOOR_PRESET_BYTES) throw new RangeError("プリセットファイルが大きすぎます（最大256 KB）。");
      applyPreset(parseMultiFloorPreset(await file.text()));
    } catch (error) {
      setPresetError(error instanceof Error ? error.message : "複数階JSONを読み込めませんでした。");
    }
  };

  return (
    <main className="app-shell multifloor-shell">
      <header className="app-header"><div><p className="eyebrow">M7 · 複数階モード</p><h1>Facade Solar Lab</h1><p className="lede">単一階計算を各Floorへ再利用し、庇・左右端部フィン・中間フィン配列による建物全体と階別の日射熱取得を比較します。</p></div><div className="model-chip"><span aria-hidden="true" />各階で facade-v1 / v2-weather</div></header>
      <aside className="critical-warning" aria-label="計算モデルの検証に関する注意"><strong>設計比較用 — 正式な物理性能評価には使用できません</strong><p>表示値は開口を通して室内へ入る日射熱取得量です。HVAC冷房・暖房負荷、BEI、空調容量、保証値ではありません。</p></aside>
      <WeatherPanel dataset={dataset} loading={loadingWeather} failure={weatherFailure} onDemo={() => loadDemo()} onFinDemo={() => loadDemo(true)} onFile={(file) => void loadWeather(file)} />

      <section className="panel multifloor-case-panel" aria-labelledby="multifloor-cases-title">
        <div className="section-heading"><div><p className="section-kicker">02 · Building Case</p><h2 id="multifloor-cases-title">複数階の建物案</h2></div><div className="case-actions"><button type="button" className="secondary-button" disabled={workspace.cases.length >= MAX_MULTI_FLOOR_CASES} onClick={() => { const next = nextAvailableMultiFloorCaseId(workspace, caseSequence.current); caseSequence.current = next.sequence + 1; const item = createMultiFloorCase(next.id, `建物案${String.fromCharCode(64 + next.sequence)}`); mutateWorkspace((current) => addMultiFloorCase(current, item), { caseId: item.id, floorId: item.floors[0]!.id }); }}>建物案を追加</button><button type="button" className="secondary-button" disabled={workspace.cases.length >= MAX_MULTI_FLOOR_CASES} onClick={() => { const next = nextAvailableMultiFloorCaseId(workspace, caseSequence.current); caseSequence.current = next.sequence + 1; mutateWorkspace((current) => duplicateMultiFloorCase(current, selectedCase.id, next.id, `建物案${String.fromCharCode(64 + next.sequence)}`), { caseId: next.id, floorId: selectedCase.floors[0]!.id }); }}>建物案を複製</button></div></div>
        <div className="case-tabs" role="group" aria-label="比較する複数階建物案">{workspace.cases.map((item, index) => <button key={item.id} type="button" aria-pressed={item.id === selectedCase.id} className={item.id === selectedCase.id ? "case-tab active" : "case-tab"} onClick={() => selectCase(item.id)}><CaseMarker colors={colors} caseId={item.id} index={index} /><span>{item.name}</span>{item.id === workspace.baselineCaseId ? <small>基準案</small> : null}</button>)}</div>
        <CaseColorPicker caseName={selectedCase.name} value={getCaseStyle(colors, selectedCase.id, workspace.cases.indexOf(selectedCase)).color} onChange={(color) => setColor(selectedCase.id, color)} />
        <div className="case-toolbar"><label className="field name-field" htmlFor={`${selectedCase.id}-building-name`}><span>建物案の名称</span><input id={`${selectedCase.id}-building-name`} value={selectedCase.name} onChange={(event) => replaceSelectedCase({ ...selectedCase, name: event.currentTarget.value })} /></label><button type="button" className="text-button" disabled={selectedCase.id === workspace.baselineCaseId} onClick={() => mutateWorkspace((current) => setMultiFloorBaseline(current, selectedCase.id))}>基準案に設定</button><button type="button" className="text-button danger" disabled={workspace.cases.length === 1} onClick={() => { const remaining = workspace.cases.filter((item) => item.id !== selectedCase.id); const next = remaining[0]!; mutateWorkspace((current) => deleteMultiFloorCase(current, selectedCase.id), { caseId: next.id, floorId: next.floors[0]!.id }); }}>建物案を削除</button><span className="case-count">{workspace.cases.length} / {MAX_MULTI_FLOOR_CASES}</span></div>
        <div className="multifloor-workspace-grid">
          <MultiFloorCaseEditor buildingCase={selectedCase} selectedFloorId={selectedFloor.id} issues={selectedIssues} onCaseChange={replaceSelectedCase} onSelectFloor={setSelectedFloorId} onAddFloor={() => { const next = nextAvailableFloorId(selectedCase); const added = createMultiFloorDefinition(next.id, `${next.sequence}F`); replaceSelectedCase(addFloor(selectedCase, added)); setSelectedFloorId(added.id); }} onDuplicateFloor={() => { const next = nextAvailableFloorId(selectedCase); replaceSelectedCase(duplicateFloor(selectedCase, selectedFloor.id, next.id, `${next.sequence}F`)); setSelectedFloorId(next.id); }} onDeleteFloor={() => { const remaining = selectedCase.floors.filter((floor) => floor.id !== selectedFloor.id); replaceSelectedCase(deleteFloor(selectedCase, selectedFloor.id)); setSelectedFloorId(remaining[0]!.id); }} />
          <section className="preview-workspace" aria-labelledby="multifloor-geometry-title"><div className="subsection-heading"><div><p className="section-kicker">03 · 積層形状</p><h2 id="multifloor-geometry-title">{selectedCase.name}</h2></div><span>{selectedCase.floors.length} Floors</span></div><MultiFloorGeometryPreview buildingCase={selectedCase} selectedFloorId={selectedFloor.id} dataset={dataset} /><FloorInputDifferences selected={selectedCase} baseline={workspace.cases.find((item) => item.id === workspace.baselineCaseId)!} floorId={selectedFloor.id} /></section>
        </div>
      </section>

      <section className="panel preset-panel no-print" aria-labelledby="multifloor-preset-title"><div><p className="section-kicker">入力専用JSON</p><h2 id="multifloor-preset-title">複数階条件を保存・再利用</h2><p>Case / Floors / baseline / selectedを保存します。計算結果、raw weather、EPW bytes、ブラウザlocal pathは含みません。</p></div><div className="preset-actions"><button type="button" className="secondary-button" onClick={saveCase}>この建物案を保存</button><button type="button" className="secondary-button" onClick={saveWorkspace}>複数階比較セットを保存</button><label className="file-button preset-file-button"><span>複数階JSONを読み込む</span><input type="file" accept=".json,.multifloor.json" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file !== undefined) void loadPreset(file); event.currentTarget.value = ""; }} /></label></div>{presetMessage === null ? null : <div className="message success-message" role="status">{presetMessage}</div>}{presetError === null ? null : <div className="message error-message" role="alert">{presetError}</div>}</section>

      <WeatherScenarioPanel source={{ mode: "multi", workspace }} dataset={dataset} loadingWeather={loadingWeather} active={active} colors={colors}
        onBaseline={id => mutateWorkspace(current => setMultiFloorBaseline(current, id))}
        onCurrentWeather={next => { setDataset(next); setWeatherFailure(null); setDirty(true); }}
        onImport={next => { if (next.mode === "multi") { mutateWorkspace(() => next.workspace, { caseId: next.workspace.cases[0]!.id, floorId: next.workspace.cases[0]!.floors[0]!.id }); resetColors(); } }} />
      <MultiParametricExplorer dataset={dataset} source={selectedCase} selectedFloorId={selectedFloor.id} caseCount={workspace.cases.length} weatherLoading={loadingWeather}
        onTransfer={candidate => mutateWorkspace(current => transferMultiCandidate(current, candidate, true))}
        onImport={input => mutateWorkspace(current => replaceMultiFloorCase(current, { ...input.source, id: selectedCase.id }), { floorId: input.selectedFloorId })} />
      <section className="run-panel" aria-labelledby="multifloor-run-title"><div><p className="section-kicker">明示的に計算を実行</p><h2 id="multifloor-run-title">複数階比較を実行</h2><p>{dataset === null ? "EPWまたは複数階デモ気象を読み込んでください。" : validationIssues.length > 0 ? "不正な入力を修正してください。" : dirty ? "入力変更は未計算です。" : "現在の入力と気象データが反映されています。"}</p></div><button type="button" className="run-button" disabled={!canRun} onClick={run}>複数階比較を実行 <span>→</span></button></section>
      {runError === null ? null : <div className="message error-message" role="alert">{runError}</div>}
      {result === null || dataset === null ? <section className="panel results-empty"><span>複数階比較結果</span><strong>気象データと入力を確認し、比較計算を実行してください</strong><p>Building Total、Floor Breakdown、月別値、基準案との差を表示します。</p></section> : <>{dirty ? <div className="stale-banner" role="status">入力変更は未計算です。表示中の結果は前回実行時のsnapshotです。出力は再実行まで無効です。</div> : null}<MultiFloorPrintSummary result={result} dataset={dataset} /><MultiFloorResults result={result} dataset={dataset} colors={colors} selectedCaseId={selectedCaseId} selectedFloorId={selectedFloorId} onSelectCase={selectCase} onSelectFloor={setSelectedFloorId} /><section className="panel export-panel no-print"><div><p className="section-kicker">複数階結果の共有</p><h2>PDF / CSV</h2><p>{dirty ? "再計算後に出力できます。" : "全建物案・全階の結果と積層形状を出力します。"}</p></div><div className="export-actions"><button type="button" className="secondary-button" disabled={dirty} onClick={() => { if (!dirty) window.print(); }}>PDFとして保存 / 印刷</button><button type="button" className="secondary-button" disabled={dirty} onClick={() => { if (!dirty) downloadTextFile(MULTI_FLOOR_CSV_FILENAME, createMultiFloorCsv(result, dataset), "text/csv;charset=utf-8"); }}>複数階CSVを書き出す</button></div></section></>}

      <section className="panel assumptions-panel"><div className="section-heading"><div><p className="section-kicker">モデル情報</p><h2>複数階計算の前提</h2></div></div><div className="assumption-grid"><article><h3>canonical engine reuse</h3><p>各Floorを既存の入力contract＋任意フィンへ変換し、<code>simulateFacade()</code>を1回だけ実行。フィンなし・出0は<code>facade-v1-weather</code>、有効なフィンありは<code>facade-v2-weather</code>。solar / weather / SHGC / 集計は共有します。</p></article><article><h3>Building Total</h3><p>各Floorの年間・夏期・冬期・月別の日射熱取得量を単純合算します。階数や開口面積の差も建物全体差に含まれます。</p></article><article className="limitation-card"><h3>適用範囲</h3><p>庇＋左右端部・中間フィン配列は直達影のみ。天空日射は庇のみ2D無限幅近似、地面反射は従来どおり。cross-floor physical shading未実装。M5外部参照はNOT_RUN、絶対kWhの正式な物理validationは未完了です。</p></article></div></section>
      <footer><span>Facade Solar Lab · M7 Multi-floor Mode</span><span>{result === null ? "未計算" : `建物案 ${result.cases.length} · ${formatKWh(result.cases[0]!.total.annualKWh)} kWh（基準案${weatherPeriodLabels(dataset?.coverage).annual}）`}</span></footer>
    </main>
  );
}

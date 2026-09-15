import { useMemo, useRef, useState } from "react";

import {
  addComparisonCase,
  comparisonInputDifferences,
  createComparisonCase,
  createComparisonWorkspace,
  deleteComparisonCase,
  duplicateComparisonCase,
  formatInputValue,
  formatKWh,
  formatPercent,
  formatSignedKWh,
  MAX_COMPARISON_CASES,
  renameComparisonCase,
  replaceComparisonCase,
  runComparison,
  setBaselineCase,
  validateComparisonWorkspace,
  type ComparisonRunResult,
  type ComparisonWorkspace,
} from "../comparison";
import {
  FACADE_V1_DIFFUSE_SHADING_MODEL,
  FACADE_V1_DIRECT_SHADING_MODEL,
  FACADE_V1_GROUND_REFLECTION_MODEL,
} from "../engine";
import { FACADE_V2_DIRECT_SHADING_MODEL, type FacadeV2Parameters } from "../engine/facade-v2";
import { hasActiveFins } from "../geometry/facade-v2";
import { FinEditor, FinSummary } from "./components/FinEditor";
import {
  COMPARISON_CSV_FILENAME,
  createComparisonCsv,
} from "../export";
import {
  CASE_PRESET_KIND,
  MAX_PRESET_BYTES,
  WORKSPACE_PRESET_KIND,
  createCasePresetFilename,
  nextAvailableCaseId,
  parseFacadePreset,
  serializeCasePreset,
  serializeWorkspacePreset,
  type FacadePresetV1,
  type FacadeWorkspacePresetV1,
} from "../preset";
import { createDemoComparisonWorkspace } from "../demo/demo-scenario";
import {
  DEMO_WEATHER_DATASET_ID,
  createDemoWeatherDataset,
} from "../demo/demo-weather";
import {
  hasWeatherErrors,
  WeatherDataError,
  type WeatherCoverage,
  type WeatherDataset,
  type WeatherParseIssue,
} from "../weather";
import { GeometryPreview } from "./components/GeometryPreview";
import { MonthlyChart } from "./components/MonthlyChart";
import { MultiFloorWorkspace } from "./components/MultiFloorWorkspace";
import { applyPresetToAppState } from "./preset-state";
import { parseBrowserEpwFile } from "./weather-file";
import { WeatherCoverageNotice, weatherPeriodLabels } from "./weather-coverage";
import { CaseColorPicker, CaseMarker, DEFAULT_CASE_COLORS, getCaseStyle, useCaseColors, type CaseColors } from "./case-colors";

const ORIENTATION_PRESETS = [
  ["北", 0], ["北東", 45], ["東", 90], ["南東", 135],
  ["南", 180], ["南西", 225], ["西", 270], ["北西", 315],
] as const;

const PERIODS = [
  { key: "annual", labelKey: "annual", months: "1〜12月" },
  { key: "cooling", labelKey: "summer", months: "4〜9月" },
  { key: "heating", labelKey: "winter", months: "10〜3月" },
] as const;

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

function formatWeatherIssue(issue: WeatherParseIssue): string {
  const line = issue.line === undefined ? "" : `（${issue.line}行目）`;
  return `${issue.code}${line}: ${WEATHER_ISSUE_MESSAGES[issue.code]}`;
}

interface NumberFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly unit?: string;
  readonly step?: number;
  readonly issue?: string;
  readonly onChange: (value: number) => void;
}

function NumberField({ id, label, value, unit, step = 0.1, issue, onChange }: NumberFieldProps) {
  const issueId = `${id}-issue`;
  return (
    <label className="field" htmlFor={id}>
      <span>{label} {unit === undefined ? null : <small>[{unit}]</small>}</span>
      <input
        id={id}
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : ""}
        aria-invalid={issue === undefined ? undefined : true}
        aria-describedby={issue === undefined ? undefined : issueId}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
      {issue === undefined ? null : <small className="field-error" id={issueId}>{issue}</small>}
    </label>
  );
}

export function WeatherPanel({
  dataset,
  loading,
  failure,
  isDemo,
  onDemo,
  onFile,
}: {
  readonly dataset: WeatherDataset | null;
  readonly loading: boolean;
  readonly failure: { readonly message: string; readonly issues: readonly WeatherParseIssue[] } | null;
  readonly isDemo: boolean;
  readonly onDemo: () => void;
  readonly onFile: (file: File) => void;
}) {
  return (
    <section className="panel weather-panel" aria-labelledby="weather-title">
      <div className="section-heading compact-heading">
        <div>
          <p className="section-kicker">01 · 気象データ</p>
          <h2 id="weather-title">比較に使う気象データ</h2>
        </div>
        <div className="weather-actions">
          <button type="button" className="demo-button" disabled={loading} onClick={onDemo}>デモ比較を試す</button>
          <label className="file-button">
            <span>{loading ? "読込中…" : "EPWファイルを読み込む"}</span>
            <input
              type="file"
              accept=".epw"
              disabled={loading}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file !== undefined) onFile(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>
      <div className={isDemo ? "demo-disclosure active" : "demo-disclosure"} role={isDemo ? "status" : undefined}>
        <div>
          <strong>{isDemo ? "デモ · 合成気象データを使用中" : "デモ · 合成気象データ"}</strong>
          <span>サンプル気象データを使って、2つのファサード案の比較をすぐに確認できます。</span>
        </div>
        <p><strong>実測気象ではありません。</strong> 性能検証用データではありません。</p>
      </div>
      <p className="privacy-note">
        {isDemo
          ? "このブラウザ内で生成します。実測気象データや外部通信は使用しません。"
          : "このブラウザ内だけで解析します。EPWファイルの内容をアップロード、保存、表示することはありません。"}
      </p>
      {failure === null ? null : (
        <div className="message error-message" role="alert">
          <strong>EPWファイルを使用できません。</strong>
          <span>{failure.message}</span>
          {failure.issues.length === 0 ? null : (
            <ul>{failure.issues.slice(0, 6).map((item, index) => <li key={`${item.code}-${index}`}>{formatWeatherIssue(item)}</li>)}</ul>
          )}
        </div>
      )}
      {dataset === null ? (
        <div className="weather-empty">
          <strong>EPWファイルは未読込です</strong>
          <span>気象データがなくても、入力編集と形状プレビューは確認できます。</span>
        </div>
      ) : (
        <div className="weather-content">
          <WeatherCoverageNotice coverage={dataset.coverage} />
          <div className="weather-place">
            <strong>{dataset.location.city || "地点名なし"}</strong>
            <span>{[dataset.location.region, dataset.location.country].filter(Boolean).join(" / ")}</span>
          </div>
          <dl className="metadata-grid">
            <div><dt>観測地点 / 出典</dt><dd>{dataset.location.stationId ?? (dataset.location.source || "—")}</dd></div>
            <div><dt>緯度</dt><dd>{dataset.location.latitudeDeg.toFixed(3)}°</dd></div>
            <div><dt>経度</dt><dd>{dataset.location.longitudeDeg.toFixed(3)}°</dd></div>
            <div><dt>標準時</dt><dd>UTC{dataset.location.timeZoneOffsetHours >= 0 ? "+" : ""}{dataset.location.timeZoneOffsetHours}</dd></div>
            <div><dt>時間区間数</dt><dd>{dataset.intervals.length.toLocaleString("ja-JP")} · {dataset.coverage}</dd></div>
            <div><dt>データセットID</dt><dd><code>{dataset.id}</code></dd></div>
            <div><dt>データ出典</dt><dd>{dataset.provenance.sourceName}</dd></div>
            <div><dt>解析上の注意</dt><dd>{dataset.issues.length}件</dd></div>
          </dl>
          {dataset.issues.length === 0 ? (
            <p className="success-line">計算に必要な日射量データがそろっています。</p>
          ) : (
            <ul className="issue-list">
              {dataset.issues.slice(0, 8).map((item, index) => (
                <li key={`${item.code}-${index}`}><strong>{item.severity === "error" ? "エラー" : "注意"}</strong> · {formatWeatherIssue(item)}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

export function ResultsPanel({
  result,
  isDemo,
  colors,
  coverage,
}: {
  readonly result: ComparisonRunResult;
  readonly isDemo: boolean;
  readonly colors: CaseColors;
  readonly coverage: WeatherCoverage;
}) {
  const labels = weatherPeriodLabels(coverage);
  return (
    <section className="panel results-panel" aria-labelledby="results-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">04 · 比較結果</p>
          <h2 id="results-title">期間別比較</h2>
        </div>
        <p>差分 = 各案 − 基準案</p>
      </div>
      <WeatherCoverageNotice coverage={coverage} />
      <aside className="result-reading" aria-labelledby="result-reading-title">
        <h3 id="result-reading-title">結果の読み方</h3>
        <p><strong>この画面の［kWh］は、窓を通して室内へ入る日射熱取得量の累計です。冷房負荷・暖房負荷そのものではありません。</strong></p>
        <p>窓面へ到達する直達日射・天空日射・地面反射の合計に、開口面積とSHGCを掛けて算出します。外気温、壁・窓の熱貫流、換気、内部発熱、建物の蓄熱、空調設備効率などは含まれていません。</p>
        <p>南向き窓では、冬は低い太陽が窓面へ入りやすく、夏は高い太陽を水平庇で遮りやすいため、冬期の日射熱取得が夏期より大きくなる場合があります。</p>
        {isDemo ? <p className="demo-result-warning"><strong>現在のデモ気象は実測データではありません。</strong> 夏期と冬期の大小関係を実建物の空調負荷評価には使用できません。</p> : null}
      </aside>
      <div className="period-grid">
        {PERIODS.map((period) => (
          <article className="period-card" key={period.key}>
            <header>
              <div><h3>{labels[period.labelKey]}の日射熱取得</h3><span>{coverage === "partial" ? period.key === "annual" ? "読込区間のみ（通年ではありません）" : `${period.months}の読込区間のみ` : period.months}</span></div>
              <small>庇あり＝庇＋有効フィンの日射熱取得量</small>
            </header>
            <div className="table-scroll">
              <table className="data-table period-table">
                <thead><tr><th scope="col">案</th><th scope="col">庇あり [kWh]</th><th scope="col">庇なし [kWh]</th><th scope="col">削減率</th><th scope="col">基準案との差 [kWh]</th><th scope="col">基準案との差 [%]</th></tr></thead>
                <tbody>
                  {result.cases.map((item, index) => {
                    const summary = item.simulation.summary[period.key];
                    const delta = item.deltaFromBaseline[period.key];
                    return (
                      <tr key={item.caseId}>
                        <th scope="row"><CaseMarker colors={colors} caseId={item.caseId} index={index} />{item.name}{item.caseId === result.baselineCaseId ? <small>基準案</small> : null}</th>
                        <td className="primary-value">{formatKWh(summary.withOverhangKWh)}</td>
                        <td>{formatKWh(summary.withoutOverhangKWh)}</td>
                        <td>{summary.reductionPercent.toFixed(1)}%</td>
                        <td>{formatSignedKWh(delta.kWh)}</td>
                        <td>{formatPercent(delta.percent)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
      <p className="interpretation-note">差分が負の場合、基準案より日射熱取得量が小さいことを示します。ただし自動的に「良い案」とは判定しません。夏期の日射遮蔽と冬期の日射取得では設計上の意味が異なります。</p>
    </section>
  );
}

export function PrintReportSummary({
  result,
  dataset,
  colors,
}: {
  readonly result: ComparisonRunResult;
  readonly dataset: WeatherDataset;
  readonly colors: CaseColors;
}) {
  const isDemo = dataset.provenance.sourceType === "synthetic";
  return (
    <section className="print-only print-report-summary" aria-label="印刷レポート概要">
      <header>
        <p>Facade Solar Lab</p>
        <h1>ファサード日射熱取得 比較レポート</h1>
      </header>
      <dl className="print-weather-grid">
        <div><dt>地点</dt><dd>{[dataset.location.city, dataset.location.region, dataset.location.country].filter(Boolean).join(" / ")}</dd></div>
        <div><dt>データセット</dt><dd>{dataset.id}</dd></div>
        <div><dt>データ出典</dt><dd>{dataset.provenance.sourceName}</dd></div>
        <div><dt>データ区分</dt><dd>{isDemo ? "Demo / デモ用合成気象データ" : "EPW"}</dd></div>
      </dl>
      {isDemo ? <p className="print-demo-warning">デモ用合成気象データです。実測気象ではありません。性能検証用データではありません。</p> : null}
      <WeatherCoverageNotice coverage={dataset.coverage} />
      <h2>比較案</h2>
      <div className="table-scroll">
        <table className="data-table print-case-table">
          <thead><tr><th>案名</th><th>基準案</th><th>方位</th><th>開口</th><th>庇</th><th>SHGC</th><th>地表面反射率</th></tr></thead>
          <tbody>{result.cases.map((item, index) => {
            const opening = item.parameters.opening;
            const overhang = item.parameters.overhang;
            return (
              <tr key={item.caseId}>
                <th scope="row"><CaseMarker colors={colors} caseId={item.caseId} index={index} /> {item.name}</th>
                <td>{item.caseId === result.baselineCaseId ? "はい" : "いいえ"}</td>
                <td>{item.parameters.facadeAzimuthDegFromNorth}°</td>
                <td>幅 {opening.widthM} m / 下端 {opening.sillZM} m / 上端 {opening.headZM} m</td>
                <td>{overhang === undefined ? "なし" : `出 ${overhang.depthM} m / 高さ ${overhang.elevationZM} m / 左右 ${overhang.leftExtensionM}, ${overhang.rightExtensionM} m`}<FinSummary fins={item.parameters} /></td>
                <td>{item.parameters.solarHeatGainCoefficient}</td>
                <td>{item.parameters.groundReflectance}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </section>
  );
}

export function PrintGeometryComparison({
  result,
  dataset,
  colors = DEFAULT_CASE_COLORS,
}: {
  readonly result: ComparisonRunResult;
  readonly dataset: WeatherDataset;
  readonly colors?: CaseColors;
}) {
  return (
    <section className="print-only print-geometry" aria-labelledby="print-geometry-title">
      <h2 id="print-geometry-title">比較案の形状と参考日射線</h2>
      <div className={`print-geometry-cases count-${result.cases.length}`}>
        {result.cases.map((item, index) => {
          const opening = item.parameters.opening;
          const overhang = item.parameters.overhang;
          const comparisonCase = {
            id: item.caseId,
            name: item.name,
            parameters: item.parameters,
          };
          return (
            <article className="print-geometry-case" key={item.caseId}>
              <header>
                <CaseMarker colors={colors} caseId={item.caseId} index={index} />
                <div>
                  <h3>{item.name}</h3>
                  <p>方位角 {item.parameters.facadeAzimuthDegFromNorth}°</p>
                </div>
                {item.caseId === result.baselineCaseId ? <strong>基準案</strong> : null}
              </header>
              <dl className="print-geometry-facts">
                <div><dt>開口</dt><dd>幅 {opening.widthM} m / 高さ {(opening.headZM - opening.sillZM).toFixed(2)} m</dd></div>
                <div><dt>庇</dt><dd>{overhang === undefined ? "なし" : `出 ${overhang.depthM} m / 高さ ${overhang.elevationZM} m`}</dd></div>
              </dl>
              <FinSummary fins={item.parameters} />
              <GeometryPreview comparisonCase={comparisonCase} dataset={dataset} />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ExportPanel({
  dirty,
  onPrint,
  onCsv,
}: {
  readonly dirty: boolean;
  readonly onPrint: () => void;
  readonly onCsv: () => void;
}) {
  return (
    <section className="panel export-panel no-print" aria-labelledby="export-title">
      <div>
        <p className="section-kicker">比較結果の共有</p>
        <h2 id="export-title">結果を書き出す</h2>
        <p>{dirty ? "現在の表示結果は変更前の計算結果です。比較計算を再実行してから出力してください。" : "印刷レポートまたはExcel等で編集できるCSVとして書き出せます。"}</p>
      </div>
      <div className="export-actions">
        <button type="button" className="secondary-button" disabled={dirty} title="ブラウザの印刷画面からPDF保存できます" onClick={onPrint}>PDFとして保存 / 印刷</button>
        <button type="button" className="secondary-button" disabled={dirty} onClick={onCsv}>CSVを書き出す</button>
      </div>
    </section>
  );
}

function PresetPanel({
  selectedCaseName,
  message,
  error,
  onSaveCase,
  onSaveWorkspace,
  onFile,
}: {
  readonly selectedCaseName: string;
  readonly message: string | null;
  readonly error: string | null;
  readonly onSaveCase: () => void;
  readonly onSaveWorkspace: () => void;
  readonly onFile: (file: File) => void;
}) {
  return (
    <section className="panel preset-panel no-print" aria-labelledby="preset-title">
      <div>
        <p className="section-kicker">比較入力の保存</p>
        <h2 id="preset-title">比較条件を保存・再利用</h2>
        <p>JSONには案名と入力条件だけを保存します。計算結果と気象ファイルの内容は含みません。</p>
      </div>
      <div className="preset-actions">
        <button type="button" className="secondary-button" onClick={onSaveCase}>この案をプリセット保存</button>
        <button type="button" className="secondary-button" onClick={onSaveWorkspace}>比較セットを保存</button>
        <label className="file-button preset-file-button">
          <span>JSONプリセットを読み込む</span>
          <input
            type="file"
            accept=".json,.facade.json"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file !== undefined) onFile(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      <p className="preset-selection">選択中: {selectedCaseName} · 1ファイル / 最大256 KB</p>
      {message === null ? null : <div className="message success-message" role="status">{message}</div>}
      {error === null ? null : <div className="message error-message" role="alert">{error}</div>}
    </section>
  );
}

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

function SingleFloorWorkspace() {
  const { colors, setColor, resetColors } = useCaseColors();
  const [workspace, setWorkspace] = useState<ComparisonWorkspace>(() => createComparisonWorkspace());
  const [selectedCaseId, setSelectedCaseId] = useState("case-a");
  const [dataset, setDataset] = useState<WeatherDataset | null>(null);
  const [weatherFailure, setWeatherFailure] = useState<{ readonly message: string; readonly issues: readonly WeatherParseIssue[] } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [result, setResult] = useState<ComparisonRunResult | null>(null);
  const [dirty, setDirty] = useState(true);
  const [runError, setRunError] = useState<string | null>(null);
  const [presetMessage, setPresetMessage] = useState<string | null>(null);
  const [presetError, setPresetError] = useState<string | null>(null);
  const [pendingWorkspacePreset, setPendingWorkspacePreset] = useState<FacadeWorkspacePresetV1 | null>(null);
  const caseSequence = useRef(2);

  const selectedCase = workspace.cases.find((item) => item.id === selectedCaseId) ?? workspace.cases[0]!;
  const baselineCase = workspace.cases.find((item) => item.id === workspace.baselineCaseId)!;
  const validationIssues = useMemo(() => validateComparisonWorkspace(workspace), [workspace]);
  const selectedIssues = new Map(
    validationIssues.filter((item) => item.caseId === selectedCase.id).map((item) => [item.path, item.message]),
  );
  const differences = useMemo(() => comparisonInputDifferences(baselineCase, selectedCase), [baselineCase, selectedCase]);
  const weatherUsable = dataset !== null && !hasWeatherErrors(dataset.issues) && dataset.intervals.length > 0;
  const isDemo = dataset?.id === DEMO_WEATHER_DATASET_ID;
  const canRun = weatherUsable && validationIssues.length === 0;

  const mutateWorkspace = (updater: (current: ComparisonWorkspace) => ComparisonWorkspace, nextSelectedCaseId?: string) => {
    setWorkspace((current) => updater(current));
    if (nextSelectedCaseId !== undefined) setSelectedCaseId(nextSelectedCaseId);
    setDirty(true);
    setRunError(null);
  };

  const updateSelectedParameters = (updater: (parameters: FacadeV2Parameters) => FacadeV2Parameters) => {
    mutateWorkspace((current) => {
      const item = current.cases.find((candidate) => candidate.id === selectedCase.id)!;
      return replaceComparisonCase(current, { ...item, parameters: updater(item.parameters) });
    });
  };

  const nextCaseIdentity = () => {
    const next = nextAvailableCaseId(workspace, caseSequence.current);
    caseSequence.current = next.sequence + 1;
    return { id: next.id, name: `案${String.fromCharCode(64 + next.sequence)}` };
  };

  const loadWeather = async (file: File) => {
    setLoadingWeather(true);
    setWeatherFailure(null);
    try {
      const parsed = await parseBrowserEpwFile(file);
      setDataset(parsed);
      setResult(null);
      setDirty(true);
      if (hasWeatherErrors(parsed.issues)) {
        setWeatherFailure({ message: "EPWの必須項目にエラーがあるため、比較計算を実行できません。", issues: parsed.issues });
      }
    } catch (error) {
      setDataset(null);
      setResult(null);
      setWeatherFailure({
        message: error instanceof RangeError ? error.message : "EPWファイルを解析できませんでした。",
        issues: error instanceof WeatherDataError ? error.issues : [],
      });
    } finally {
      setLoadingWeather(false);
    }
  };

  const loadDemoComparison = () => {
    try {
      const demoDataset = createDemoWeatherDataset();
      const demoWorkspace = createDemoComparisonWorkspace();
      const demoResult = runComparison(demoDataset, demoWorkspace);
      caseSequence.current = 3;
      setWorkspace(demoWorkspace);
      resetColors();
      setSelectedCaseId("case-b");
      setDataset(demoDataset);
      setWeatherFailure(null);
      setResult(demoResult);
      setDirty(false);
      setRunError(null);
    } catch {
      setRunError("デモ比較の実行に失敗しました。");
    }
  };

  const executeComparison = () => {
    if (!canRun || dataset === null) return;
    try {
      setResult(runComparison(dataset, workspace));
      setDirty(false);
      setRunError(null);
    } catch {
      setRunError("比較計算の実行に失敗しました。");
    }
  };

  const printComparison = () => {
    if (result === null || dirty) return;
    window.print();
  };

  const downloadComparisonCsv = () => {
    if (result === null || dataset === null || dirty) return;
    const csv = createComparisonCsv(result, dataset);
    downloadTextFile(COMPARISON_CSV_FILENAME, csv, "text/csv;charset=utf-8");
  };

  const saveCasePreset = () => {
    try {
      const json = serializeCasePreset(selectedCase);
      downloadTextFile(createCasePresetFilename(selectedCase.name), json, "application/json;charset=utf-8");
      setPresetMessage(`${selectedCase.name}の入力条件を保存しました。`);
      setPresetError(null);
    } catch (error) {
      setPresetMessage(null);
      setPresetError(error instanceof Error ? error.message : "案のプリセットを保存できませんでした。");
    }
  };

  const saveWorkspacePreset = () => {
    try {
      const json = serializeWorkspacePreset(workspace, selectedCase.id);
      downloadTextFile("facade-comparison-preset.json", json, "application/json;charset=utf-8");
      setPresetMessage("比較セットの入力条件を保存しました。");
      setPresetError(null);
    } catch (error) {
      setPresetMessage(null);
      setPresetError(error instanceof Error ? error.message : "比較セットを保存できませんでした。");
    }
  };

  const applyImportedPreset = (preset: FacadePresetV1, nextCaseId?: string) => {
    const next = applyPresetToAppState(workspace, preset, nextCaseId);
    setWorkspace(next.workspace);
    if (preset.kind === WORKSPACE_PRESET_KIND) resetColors();
    setSelectedCaseId(next.selectedCaseId);
    setResult(next.result);
    setDirty(next.dirty);
    setRunError(null);
    setPresetError(null);
    setPresetMessage(
      preset.kind === CASE_PRESET_KIND
        ? `${preset.name}を新しい比較案として読み込みました。比較計算を実行してください。`
        : "比較セットを置き換えました。比較計算を実行してください。",
    );
  };

  const loadPreset = async (file: File) => {
    setPresetMessage(null);
    setPresetError(null);
    setPendingWorkspacePreset(null);
    try {
      if (!file.name.toLowerCase().endsWith(".json")) {
        throw new RangeError(".jsonまたは.facade.jsonファイルを選択してください。");
      }
      if (file.size > MAX_PRESET_BYTES) {
        throw new RangeError("プリセットファイルが大きすぎます（最大256 KB）。");
      }
      const preset = parseFacadePreset(await file.text());
      if (preset.kind === WORKSPACE_PRESET_KIND) {
        setPendingWorkspacePreset(preset);
        return;
      }
      const next = nextAvailableCaseId(workspace, caseSequence.current);
      caseSequence.current = next.sequence + 1;
      applyImportedPreset(preset, next.id);
    } catch (error) {
      setPresetError(error instanceof Error ? error.message : "JSONプリセットを読み込めませんでした。");
    }
  };

  const inputId = (path: string) => `${selectedCase.id}-${path.replaceAll(".", "-")}`;
  const opening = selectedCase.parameters.opening;
  const overhang = selectedCase.parameters.overhang;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">複数案比較</p>
          <h1>Facade Solar Lab</h1>
          <p className="lede">同じ気象データを使い、ファサード方位・開口・庇・ガラス仕様の違いを比較します。</p>
        </div>
        <div className="model-chip"><span aria-hidden="true" />ブラウザ内で比較</div>
      </header>

      <aside className="critical-warning" aria-label="計算モデルの検証に関する注意">
        <strong>比較検討用モデル — 正式な性能評価には使用できません</strong>
        <p>同じ気象・入力条件で複数案を相対比較する設計検討には活用できます。ただし、表示する絶対値 [kWh] は正式に検証された物理性能値ではありません。BEI、法適合判定、空調容量設計、性能認証、エネルギー消費量の保証には使用しないでください。</p>
      </aside>

      <WeatherPanel
        dataset={dataset}
        loading={loadingWeather}
        failure={weatherFailure}
        isDemo={isDemo}
        onDemo={loadDemoComparison}
        onFile={(file) => void loadWeather(file)}
      />

      <section className="panel case-panel" aria-labelledby="case-title">
        <div className="section-heading">
          <div><p className="section-kicker">02 · 比較案</p><h2 id="case-title">ファサード案</h2></div>
          <div className="case-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={workspace.cases.length >= MAX_COMPARISON_CASES}
              onClick={() => {
                const identity = nextCaseIdentity();
                mutateWorkspace((current) => addComparisonCase(current, createComparisonCase(identity.id, identity.name)), identity.id);
              }}
            >案を追加</button>
            <button
              type="button"
              className="secondary-button"
              disabled={workspace.cases.length >= MAX_COMPARISON_CASES}
              onClick={() => {
                const identity = nextCaseIdentity();
                mutateWorkspace((current) => duplicateComparisonCase(current, selectedCase.id, identity.id, identity.name), identity.id);
              }}
            >複製</button>
          </div>
        </div>

        <div className="case-tabs" role="group" aria-label="比較するファサード案">
          {workspace.cases.map((item, index) => (
            <button key={item.id} type="button" aria-pressed={item.id === selectedCase.id} className={item.id === selectedCase.id ? "case-tab active" : "case-tab"} onClick={() => setSelectedCaseId(item.id)}>
              <CaseMarker colors={colors} caseId={item.id} index={index} />
              <span>{item.name}</span>
              {item.id === workspace.baselineCaseId ? <small>基準案</small> : null}
            </button>
          ))}
        </div>

        <div className="case-toolbar">
          <CaseColorPicker caseName={selectedCase.name} value={getCaseStyle(colors, selectedCase.id, workspace.cases.indexOf(selectedCase)).color} onChange={(color) => setColor(selectedCase.id, color)} />
          <label className="field name-field" htmlFor={`${selectedCase.id}-name`}>
            <span>案の名称</span>
            <input
              id={`${selectedCase.id}-name`}
              value={selectedCase.name}
              aria-invalid={selectedIssues.has("name") || undefined}
              onChange={(event) => {
                const name = event.currentTarget.value;
                mutateWorkspace((current) => name.trim() === "" ? replaceComparisonCase(current, { ...selectedCase, name }) : renameComparisonCase(current, selectedCase.id, name));
              }}
            />
          </label>
          <button type="button" className="text-button" disabled={selectedCase.id === workspace.baselineCaseId} onClick={() => mutateWorkspace((current) => setBaselineCase(current, selectedCase.id))}>基準案に設定</button>
          <button
            type="button"
            className="text-button danger"
            disabled={workspace.cases.length === 1}
            onClick={() => {
              const remaining = workspace.cases.filter((item) => item.id !== selectedCase.id);
              mutateWorkspace((current) => deleteComparisonCase(current, selectedCase.id), remaining[0]!.id);
            }}
          >案を削除</button>
          <span className="case-count">{workspace.cases.length} / {MAX_COMPARISON_CASES}</span>
        </div>

        <div className="workspace-grid">
          <div className="input-workspace">
            <fieldset>
              <legend>ファサード方位</legend>
              <NumberField id={inputId("facadeAzimuthDegFromNorth")} label="ファサード方位角" unit="°（北=0、時計回り）" step={1} value={selectedCase.parameters.facadeAzimuthDegFromNorth} issue={selectedIssues.get("facadeAzimuthDegFromNorth")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, facadeAzimuthDegFromNorth: value }))} />
              <div className="preset-grid" aria-label="方位のプリセット">
                {ORIENTATION_PRESETS.map(([label, value]) => (
                  <button key={label} type="button" aria-pressed={selectedCase.parameters.facadeAzimuthDegFromNorth === value} onClick={() => updateSelectedParameters((parameters) => ({ ...parameters, facadeAzimuthDegFromNorth: value }))}>{label}<small>{value}°</small></button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>開口</legend>
              <div className="field-grid">
                <NumberField id={inputId("opening.widthM")} label="開口幅" unit="m" value={opening.widthM} issue={selectedIssues.get("opening.widthM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, opening: { ...parameters.opening, widthM: value } }))} />
                <NumberField id={inputId("opening.sillZM")} label="開口下端高さ" unit="m" value={opening.sillZM} issue={selectedIssues.get("opening.sillZM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, opening: { ...parameters.opening, sillZM: value } }))} />
                <NumberField id={inputId("opening.headZM")} label="開口上端高さ" unit="m" value={opening.headZM} issue={selectedIssues.get("opening.headZM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, opening: { ...parameters.opening, headZM: value } }))} />
                <div className="derived-value"><span>開口高さ</span><strong>{Number.isFinite(opening.headZM - opening.sillZM) ? `${(opening.headZM - opening.sillZM).toFixed(2)} m` : "—"}</strong></div>
              </div>
            </fieldset>

            <fieldset>
              <legend>水平庇</legend>
              <label className="switch-row">
                <input
                  type="checkbox"
                  checked={overhang !== undefined}
                  onChange={(event) => {
                    const enabled = event.currentTarget.checked;
                    updateSelectedParameters((parameters) => enabled ? {
                      ...parameters,
                      overhang: { depthM: 0.8, elevationZM: parameters.opening.headZM + 0.3, leftExtensionM: 0.5, rightExtensionM: 0.5 },
                    } : {
                      facadeAzimuthDegFromNorth: parameters.facadeAzimuthDegFromNorth,
                      opening: parameters.opening,
                      solarHeatGainCoefficient: parameters.solarHeatGainCoefficient,
                      groundReflectance: parameters.groundReflectance,
                    });
                  }}
                />
                <span>{overhang === undefined ? "なし" : "あり"}</span>
              </label>
              {overhang === undefined ? <p className="field-note">この案では庇形状を計算モデルへ渡しません。</p> : (
                <div className="field-grid">
                  <NumberField id={inputId("overhang.depthM")} label="庇の出" unit="m" value={overhang.depthM} issue={selectedIssues.get("overhang.depthM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, overhang: { ...parameters.overhang!, depthM: value } }))} />
                  <NumberField id={inputId("overhang.elevationZM")} label="庇高さ" unit="m" value={overhang.elevationZM} issue={selectedIssues.get("overhang.elevationZM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, overhang: { ...parameters.overhang!, elevationZM: value } }))} />
                  <NumberField id={inputId("overhang.leftExtensionM")} label="左側の張り出し" unit="m" value={overhang.leftExtensionM} issue={selectedIssues.get("overhang.leftExtensionM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, overhang: { ...parameters.overhang!, leftExtensionM: value } }))} />
                  <NumberField id={inputId("overhang.rightExtensionM")} label="右側の張り出し" unit="m" value={overhang.rightExtensionM} issue={selectedIssues.get("overhang.rightExtensionM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, overhang: { ...parameters.overhang!, rightExtensionM: value } }))} />
                </div>
              )}
            </fieldset>

            <FinEditor fins={selectedCase.parameters} sillZM={selectedCase.parameters.opening.sillZM} headZM={selectedCase.parameters.opening.headZM} inputPrefix={selectedCase.id} issues={selectedIssues} onChange={(fins) => updateSelectedParameters((parameters) => ({ ...parameters, leftFin: fins.leftFin, rightFin: fins.rightFin }))} />
            <fieldset>
              <legend>ガラスと地面反射</legend>
              <div className="field-grid">
                <NumberField id={inputId("solarHeatGainCoefficient")} label="日射熱取得率（SHGC）" step={0.05} value={selectedCase.parameters.solarHeatGainCoefficient} issue={selectedIssues.get("solarHeatGainCoefficient")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, solarHeatGainCoefficient: value }))} />
                <NumberField id={inputId("groundReflectance")} label="地面反射率" step={0.05} value={selectedCase.parameters.groundReflectance} issue={selectedIssues.get("groundReflectance")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, groundReflectance: value }))} />
              </div>
            </fieldset>
            {selectedIssues.size === 0 ? null : (
              <div className="message error-message" role="alert"><strong>比較計算の前に、この案の入力を修正してください。</strong><ul>{[...selectedIssues.entries()].map(([path, message]) => <li key={path}>{message}</li>)}</ul></div>
            )}
          </div>

          <section className="preview-workspace" aria-labelledby="geometry-title">
            <div className="subsection-heading"><div><p className="section-kicker">03 · 形状</p><h2 id="geometry-title">選択中の案</h2></div><span>{selectedCase.name}</span></div>
            <GeometryPreview comparisonCase={selectedCase} dataset={dataset} />
            <div className="difference-panel">
              <h3>{baselineCase.name}からの入力差</h3>
              {differences.length === 0 ? <p>基準案との入力差はありません。</p> : (
                <dl>{differences.map((difference) => (
                  <div key={difference.key}>
                    <dt>{difference.label}</dt>
                    <dd><span>{formatInputValue(difference.baselineValue, difference.unit)}</span><b aria-hidden="true">→</b><strong>{formatInputValue(difference.caseValue, difference.unit)}</strong></dd>
                  </div>
                ))}</dl>
              )}
            </div>
          </section>
        </div>
      </section>

      <PresetPanel
        selectedCaseName={selectedCase.name}
        message={presetMessage}
        error={presetError}
        onSaveCase={saveCasePreset}
        onSaveWorkspace={saveWorkspacePreset}
        onFile={(file) => void loadPreset(file)}
      />

      {pendingWorkspacePreset === null ? null : (
        <div className="preset-dialog-backdrop no-print">
          <section className="preset-dialog" role="dialog" aria-modal="true" aria-labelledby="preset-dialog-title">
            <p className="section-kicker">比較セットの読み込み</p>
            <h2 id="preset-dialog-title">現在の比較案を、このJSONの比較セットで置き換えます</h2>
            <p>{pendingWorkspacePreset.cases.length}案を読み込みます。現在の計算結果は破棄され、再計算が必要です。</p>
            <div className="preset-dialog-actions">
              <button type="button" className="text-button" autoFocus onClick={() => setPendingWorkspacePreset(null)}>キャンセル</button>
              <button
                type="button"
                className="run-button"
                onClick={() => {
                  applyImportedPreset(pendingWorkspacePreset);
                  setPendingWorkspacePreset(null);
                  caseSequence.current = 2;
                }}
              >比較セットを置き換える</button>
            </div>
          </section>
        </div>
      )}

      <section className="run-panel" aria-labelledby="run-title">
        <div>
          <p className="section-kicker">明示的に計算を実行</p>
          <h2 id="run-title">比較計算を実行</h2>
          <p>{dataset === null ? "比較するにはEPWファイルを読み込んでください。" : validationIssues.length > 0 ? "計算前に不正な入力を修正してください。" : dirty ? "入力変更はまだ計算結果に反映されていません。" : "現在の入力と気象データが計算結果に反映されています。"}</p>
        </div>
        <button type="button" className="run-button" disabled={!canRun} onClick={executeComparison}>比較計算を実行 <span>→</span></button>
      </section>
      {runError === null ? null : <div className="message error-message" role="alert">{runError}</div>}

      {result === null || dataset === null ? (
        <section className="panel results-empty" aria-label="比較結果の状態">
          <span>比較結果</span>
          <strong>{dataset === null ? "比較するにはEPWファイルを読み込んでください" : "入力を確認し、比較計算を実行してください"}</strong>
          <p>{dataset?.coverage === "partial" ? "読込期間合計・夏期の読込分・冬期の読込分の日射熱取得、月別値、基準案との差を表示します（通年結果ではありません）。" : "年間・夏期・冬期の日射熱取得、月別値、基準案との差をここに表示します。"}</p>
        </section>
      ) : (
        <>
          {dirty ? <div className="stale-banner" role="status">入力変更は未計算です。表示中の結果は前回の比較計算によるものです。</div> : null}
          <PrintReportSummary result={result} dataset={dataset} colors={colors} />
          <ResultsPanel result={result} isDemo={isDemo} colors={colors} coverage={dataset.coverage} />
          <MonthlyChart result={result} colors={colors} />
          <ExportPanel dirty={dirty} onPrint={printComparison} onCsv={downloadComparisonCsv} />
          <PrintGeometryComparison result={result} dataset={dataset} colors={colors} />
        </>
      )}

      <section className="panel assumptions-panel" aria-labelledby="assumptions-title">
        <div className="section-heading">
          <div><p className="section-kicker">モデル情報</p><h2 id="assumptions-title">前提条件とデータ出典</h2></div>
          <p>差分を判断する前に確認してください</p>
        </div>
        <div className="assumption-grid">
          <article>
            <h3>気象データ</h3>
            <dl>
              <div><dt>データセット</dt><dd>{dataset?.id ?? "未読込"}</dd></div>
              <div><dt>出典</dt><dd>{dataset?.provenance.sourceName ?? "ブラウザ内でEPWを読み込んでください"}</dd></div>
              <div><dt>地点</dt><dd>{dataset === null ? "—" : `${dataset.location.city} / ${dataset.location.country}`}</dd></div>
              <div><dt>時間区間数</dt><dd>{dataset?.intervals.length.toLocaleString("ja-JP") ?? "—"}</dd></div>
            </dl>
          </article>
          <article>
            <h3>計算モデル</h3>
            <dl className="identity-list">
              <div><dt>選択入力の計算モデル（modelVersion）</dt><dd><code>{hasActiveFins(selectedCase.parameters) ? "facade-v2-weather" : "facade-v1-weather"}</code></dd></div>
              <div><dt>形状モデル（geometryVersion）</dt><dd><code>{hasActiveFins(selectedCase.parameters) ? "facade-v2" : "facade-v1"}</code></dd></div>
              <div><dt>直達日射（direct）</dt><dd><code>{hasActiveFins(selectedCase.parameters) ? FACADE_V2_DIRECT_SHADING_MODEL : FACADE_V1_DIRECT_SHADING_MODEL}</code></dd></div>
              <div><dt>天空日射（diffuse）</dt><dd><code>{FACADE_V1_DIFFUSE_SHADING_MODEL}</code></dd></div>
              <div><dt>地面反射（ground）</dt><dd><code>{FACADE_V1_GROUND_REFLECTION_MODEL}</code></dd></div>
            </dl>
          </article>
          <article className="limitation-card">
            <h3>形状モデルの適用範囲</h3>
            <p><strong>有限幅の形状計算は直達日射の影だけに適用します。</strong></p>
            <p>鉛直開口1つに水平庇・左右縦フィン各0または1つ。フィン有効時は <code>{FACADE_V2_DIRECT_SHADING_MODEL}</code> で重複影を合成します。天空日射は庇のみ等方性2D無限幅近似で、フィンの天空日射効果は含みません。地面反射は遮蔽しません。M5外部参照はNOT_RUNで、絶対kWhの正式な物理validationではありません。</p>
          </article>
        </div>
      </section>

      <footer><span>Facade Solar Lab · 複数案比較</span><span>設計比較支援 · 最終判断は設計者が行ってください</span></footer>
    </main>
  );
}

export function App() {
  const [mode, setMode] = useState<"single" | "multi">("single");
  return (
    <>
      <nav className="mode-switch no-print" aria-label="Workspaceモード">
        <span>Workspace</span>
        <button type="button" aria-pressed={mode === "single"} className={mode === "single" ? "active" : undefined} onClick={() => setMode("single")}>単一階モード</button>
        <button type="button" aria-pressed={mode === "multi"} className={mode === "multi" ? "active" : undefined} onClick={() => setMode("multi")}>複数階モード</button>
      </nav>
      <section hidden={mode !== "single"}><SingleFloorWorkspace /></section>
      <section hidden={mode !== "multi"}><MultiFloorWorkspace /></section>
    </>
  );
}

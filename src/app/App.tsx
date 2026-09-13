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
  engineManifest,
  FACADE_V1_DIFFUSE_SHADING_MODEL,
  FACADE_V1_DIRECT_SHADING_MODEL,
  FACADE_V1_GROUND_REFLECTION_MODEL,
  type FacadeV1Parameters,
} from "../engine";
import { createDemoComparisonWorkspace } from "../demo/demo-scenario";
import {
  DEMO_WEATHER_DATASET_ID,
  createDemoWeatherDataset,
} from "../demo/demo-weather";
import {
  hasWeatherErrors,
  WeatherDataError,
  type WeatherDataset,
  type WeatherParseIssue,
} from "../weather";
import { GeometryPreview } from "./components/GeometryPreview";
import { MonthlyChart } from "./components/MonthlyChart";
import { parseBrowserEpwFile } from "./weather-file";

const ORIENTATION_PRESETS = [
  ["N", 0], ["NE", 45], ["E", 90], ["SE", 135],
  ["S", 180], ["SW", 225], ["W", 270], ["NW", 315],
] as const;

const PERIODS = [
  { key: "annual", label: "Annual", months: "Jan–Dec" },
  { key: "cooling", label: "Summer / Cooling", months: "Apr–Sep" },
  { key: "heating", label: "Winter / Heating", months: "Oct–Mar" },
] as const;

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

function WeatherPanel({
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
          <p className="section-kicker">01 · Local weather</p>
          <h2 id="weather-title">Weather dataset</h2>
        </div>
        <div className="weather-actions">
          <button type="button" className="demo-button" disabled={loading} onClick={onDemo}>Try Demo Comparison</button>
          <label className="file-button">
            <span>{loading ? "Reading…" : "Load EPW"}</span>
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
          <strong>{isDemo ? "DEMO · Synthetic weather active" : "Synthetic weather option"}</strong>
          <span>Explore the complete comparison workflow using deterministic synthetic weather.</span>
        </div>
        <p><strong>Not measured weather.</strong> Not validation evidence.</p>
      </div>
      <p className="privacy-note">
        {isDemo
          ? "Generated in this browser only. No measured weather or external request is used."
          : "Parsed in this browser only. Raw file contents are not uploaded, stored, or displayed."}
      </p>
      {failure === null ? null : (
        <div className="message error-message" role="alert">
          <strong>EPW could not be used.</strong>
          <span>{failure.message}</span>
          {failure.issues.length === 0 ? null : (
            <ul>{failure.issues.slice(0, 6).map((item, index) => <li key={`${item.code}-${index}`}>{item.code}: {item.message}</li>)}</ul>
          )}
        </div>
      )}
      {dataset === null ? (
        <div className="weather-empty">
          <strong>No EPW loaded</strong>
          <span>Geometry editing and explanatory previews remain available.</span>
        </div>
      ) : (
        <div className="weather-content">
          <div className="weather-place">
            <strong>{dataset.location.city || "Unnamed EPW location"}</strong>
            <span>{[dataset.location.region, dataset.location.country].filter(Boolean).join(", ")}</span>
          </div>
          <dl className="metadata-grid">
            <div><dt>Station / source</dt><dd>{dataset.location.stationId ?? (dataset.location.source || "—")}</dd></div>
            <div><dt>Latitude</dt><dd>{dataset.location.latitudeDeg.toFixed(3)}°</dd></div>
            <div><dt>Longitude</dt><dd>{dataset.location.longitudeDeg.toFixed(3)}°</dd></div>
            <div><dt>Time zone</dt><dd>UTC{dataset.location.timeZoneOffsetHours >= 0 ? "+" : ""}{dataset.location.timeZoneOffsetHours}</dd></div>
            <div><dt>Intervals</dt><dd>{dataset.intervals.length.toLocaleString("en-US")} · {dataset.coverage}</dd></div>
            <div><dt>Dataset ID</dt><dd><code>{dataset.id}</code></dd></div>
            <div><dt>Provenance</dt><dd>{dataset.provenance.sourceName}</dd></div>
            <div><dt>Parse issues</dt><dd>{dataset.issues.length}</dd></div>
          </dl>
          {dataset.issues.length === 0 ? (
            <p className="success-line">Required radiation fields are present.</p>
          ) : (
            <ul className="issue-list">
              {dataset.issues.slice(0, 8).map((item, index) => (
                <li key={`${item.code}-${index}`}><strong>{item.severity}</strong> · {item.code} · {item.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function ResultsPanel({ result }: { readonly result: ComparisonRunResult }) {
  return (
    <section className="panel results-panel" aria-labelledby="results-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">04 · Calculated comparison</p>
          <h2 id="results-title">Period performance</h2>
        </div>
        <p>Delta = case − baseline</p>
      </div>
      <div className="period-grid">
        {PERIODS.map((period) => (
          <article className="period-card" key={period.key}>
            <header>
              <div><h3>{period.label}</h3><span>{period.months}</span></div>
              <small>with-overhang focus</small>
            </header>
            <div className="table-scroll">
              <table className="data-table period-table">
                <thead><tr><th scope="col">Case</th><th scope="col">With [kWh]</th><th scope="col">Without [kWh]</th><th scope="col">Reduction</th><th scope="col">Δ kWh</th><th scope="col">Δ %</th></tr></thead>
                <tbody>
                  {result.cases.map((item, index) => {
                    const summary = item.simulation.summary[period.key];
                    const delta = item.deltaFromBaseline[period.key];
                    return (
                      <tr key={item.caseId}>
                        <th scope="row"><span className={`case-marker series-${index + 1}`}>{String.fromCharCode(65 + index)}</span>{item.name}{item.caseId === result.baselineCaseId ? <small>baseline</small> : null}</th>
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
      <p className="interpretation-note">A negative delta means lower solar heat gain than the baseline. It is not automatically “better”: summer reduction and winter reduction have different design consequences.</p>
    </section>
  );
}

export function App() {
  const [workspace, setWorkspace] = useState<ComparisonWorkspace>(() => createComparisonWorkspace());
  const [selectedCaseId, setSelectedCaseId] = useState("case-a");
  const [dataset, setDataset] = useState<WeatherDataset | null>(null);
  const [weatherFailure, setWeatherFailure] = useState<{ readonly message: string; readonly issues: readonly WeatherParseIssue[] } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [result, setResult] = useState<ComparisonRunResult | null>(null);
  const [dirty, setDirty] = useState(true);
  const [runError, setRunError] = useState<string | null>(null);
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

  const updateSelectedParameters = (updater: (parameters: FacadeV1Parameters) => FacadeV1Parameters) => {
    mutateWorkspace((current) => {
      const item = current.cases.find((candidate) => candidate.id === selectedCase.id)!;
      return replaceComparisonCase(current, { ...item, parameters: updater(item.parameters) });
    });
  };

  const nextCaseIdentity = () => {
    const sequence = caseSequence.current;
    caseSequence.current += 1;
    return { id: `case-${sequence}`, name: `Case ${String.fromCharCode(64 + sequence)}` };
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
        setWeatherFailure({ message: "Required EPW fields contain errors. Calculation is disabled.", issues: parsed.issues });
      }
    } catch (error) {
      setDataset(null);
      setResult(null);
      setWeatherFailure({
        message: error instanceof Error ? error.message : "EPW parsing failed",
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
      setSelectedCaseId("case-b");
      setDataset(demoDataset);
      setWeatherFailure(null);
      setResult(demoResult);
      setDirty(false);
      setRunError(null);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Demo comparison failed");
    }
  };

  const executeComparison = () => {
    if (!canRun || dataset === null) return;
    try {
      setResult(runComparison(dataset, workspace));
      setDirty(false);
      setRunError(null);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Comparison failed");
    }
  };

  const inputId = (path: string) => `${selectedCase.id}-${path.replaceAll(".", "-")}`;
  const opening = selectedCase.parameters.opening;
  const overhang = selectedCase.parameters.overhang;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">M4 · COMPARISON UX</p>
          <h1>Facade Solar Lab</h1>
          <p className="lede">Compare facade directions, openings, overhangs, and glass choices under one local weather dataset.</p>
        </div>
        <div className="model-chip"><span aria-hidden="true" />{engineManifest.milestone} workspace</div>
      </header>

      <aside className="critical-warning" aria-label="Model validation warning">
        <strong>Comparison model — not formal performance evidence</strong>
        <p>Absolute weather-driven kWh values are not formally validated physical-performance results. Do not use them for BEI, official energy compliance, HVAC sizing, final certification, or guaranteed energy prediction.</p>
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
          <div><p className="section-kicker">02 · Design cases</p><h2 id="case-title">Facade alternatives</h2></div>
          <div className="case-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={workspace.cases.length >= MAX_COMPARISON_CASES}
              onClick={() => {
                const identity = nextCaseIdentity();
                mutateWorkspace((current) => addComparisonCase(current, createComparisonCase(identity.id, identity.name)), identity.id);
              }}
            >Add case</button>
            <button
              type="button"
              className="secondary-button"
              disabled={workspace.cases.length >= MAX_COMPARISON_CASES}
              onClick={() => {
                const identity = nextCaseIdentity();
                mutateWorkspace((current) => duplicateComparisonCase(current, selectedCase.id, identity.id, identity.name), identity.id);
              }}
            >Duplicate</button>
          </div>
        </div>

        <div className="case-tabs" role="group" aria-label="Comparison cases">
          {workspace.cases.map((item, index) => (
            <button key={item.id} type="button" aria-pressed={item.id === selectedCase.id} className={item.id === selectedCase.id ? "case-tab active" : "case-tab"} onClick={() => setSelectedCaseId(item.id)}>
              <span className={`case-marker series-${index + 1}`}>{String.fromCharCode(65 + index)}</span>
              <span>{item.name}</span>
              {item.id === workspace.baselineCaseId ? <small>Baseline</small> : null}
            </button>
          ))}
        </div>

        <div className="case-toolbar">
          <label className="field name-field" htmlFor={`${selectedCase.id}-name`}>
            <span>Case name</span>
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
          <button type="button" className="text-button" disabled={selectedCase.id === workspace.baselineCaseId} onClick={() => mutateWorkspace((current) => setBaselineCase(current, selectedCase.id))}>Set as baseline</button>
          <button
            type="button"
            className="text-button danger"
            disabled={workspace.cases.length === 1}
            onClick={() => {
              const remaining = workspace.cases.filter((item) => item.id !== selectedCase.id);
              mutateWorkspace((current) => deleteComparisonCase(current, selectedCase.id), remaining[0]!.id);
            }}
          >Delete case</button>
          <span className="case-count">{workspace.cases.length} / {MAX_COMPARISON_CASES}</span>
        </div>

        <div className="workspace-grid">
          <div className="input-workspace">
            <fieldset>
              <legend>Facade orientation</legend>
              <NumberField id={inputId("facadeAzimuthDegFromNorth")} label="Facade azimuth" unit="° from North" step={1} value={selectedCase.parameters.facadeAzimuthDegFromNorth} issue={selectedIssues.get("facadeAzimuthDegFromNorth")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, facadeAzimuthDegFromNorth: value }))} />
              <div className="preset-grid" aria-label="Orientation presets">
                {ORIENTATION_PRESETS.map(([label, value]) => (
                  <button key={label} type="button" aria-pressed={selectedCase.parameters.facadeAzimuthDegFromNorth === value} onClick={() => updateSelectedParameters((parameters) => ({ ...parameters, facadeAzimuthDegFromNorth: value }))}>{label}<small>{value}°</small></button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Opening</legend>
              <div className="field-grid">
                <NumberField id={inputId("opening.widthM")} label="Width" unit="m" value={opening.widthM} issue={selectedIssues.get("opening.widthM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, opening: { ...parameters.opening, widthM: value } }))} />
                <NumberField id={inputId("opening.sillZM")} label="Sill elevation" unit="m" value={opening.sillZM} issue={selectedIssues.get("opening.sillZM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, opening: { ...parameters.opening, sillZM: value } }))} />
                <NumberField id={inputId("opening.headZM")} label="Head elevation" unit="m" value={opening.headZM} issue={selectedIssues.get("opening.headZM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, opening: { ...parameters.opening, headZM: value } }))} />
                <div className="derived-value"><span>Derived height</span><strong>{Number.isFinite(opening.headZM - opening.sillZM) ? `${(opening.headZM - opening.sillZM).toFixed(2)} m` : "—"}</strong></div>
              </div>
            </fieldset>

            <fieldset>
              <legend>Horizontal overhang</legend>
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
                <span>{overhang === undefined ? "Disabled" : "Enabled"}</span>
              </label>
              {overhang === undefined ? <p className="field-note">The engine receives no overhang geometry for this case.</p> : (
                <div className="field-grid">
                  <NumberField id={inputId("overhang.depthM")} label="Depth" unit="m" value={overhang.depthM} issue={selectedIssues.get("overhang.depthM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, overhang: { ...parameters.overhang!, depthM: value } }))} />
                  <NumberField id={inputId("overhang.elevationZM")} label="Elevation" unit="m" value={overhang.elevationZM} issue={selectedIssues.get("overhang.elevationZM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, overhang: { ...parameters.overhang!, elevationZM: value } }))} />
                  <NumberField id={inputId("overhang.leftExtensionM")} label="Left extension" unit="m" value={overhang.leftExtensionM} issue={selectedIssues.get("overhang.leftExtensionM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, overhang: { ...parameters.overhang!, leftExtensionM: value } }))} />
                  <NumberField id={inputId("overhang.rightExtensionM")} label="Right extension" unit="m" value={overhang.rightExtensionM} issue={selectedIssues.get("overhang.rightExtensionM")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, overhang: { ...parameters.overhang!, rightExtensionM: value } }))} />
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend>Glass and ground</legend>
              <div className="field-grid">
                <NumberField id={inputId("solarHeatGainCoefficient")} label="SHGC" step={0.05} value={selectedCase.parameters.solarHeatGainCoefficient} issue={selectedIssues.get("solarHeatGainCoefficient")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, solarHeatGainCoefficient: value }))} />
                <NumberField id={inputId("groundReflectance")} label="Ground reflectance" step={0.05} value={selectedCase.parameters.groundReflectance} issue={selectedIssues.get("groundReflectance")} onChange={(value) => updateSelectedParameters((parameters) => ({ ...parameters, groundReflectance: value }))} />
              </div>
            </fieldset>
            {selectedIssues.size === 0 ? null : (
              <div className="message error-message" role="alert"><strong>Fix this case before running.</strong><ul>{[...selectedIssues.entries()].map(([path, message]) => <li key={path}>{message}</li>)}</ul></div>
            )}
          </div>

          <section className="preview-workspace" aria-labelledby="geometry-title">
            <div className="subsection-heading"><div><p className="section-kicker">03 · Geometry</p><h2 id="geometry-title">Selected case</h2></div><span>{selectedCase.name}</span></div>
            <GeometryPreview comparisonCase={selectedCase} />
            <div className="difference-panel">
              <h3>Input differences from {baselineCase.name}</h3>
              {differences.length === 0 ? <p>No input differences from the baseline.</p> : (
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

      <section className="run-panel" aria-labelledby="run-title">
        <div>
          <p className="section-kicker">Explicit simulation</p>
          <h2 id="run-title">Run Comparison</h2>
          <p>{dataset === null ? "Load an EPW file to run weather comparison." : validationIssues.length > 0 ? "Resolve invalid inputs before calculation." : dirty ? "Changes not calculated." : "Results match the current inputs and weather dataset."}</p>
        </div>
        <button type="button" className="run-button" disabled={!canRun} onClick={executeComparison}>Run Comparison <span>→</span></button>
      </section>
      {runError === null ? null : <div className="message error-message" role="alert">{runError}</div>}

      {result === null ? (
        <section className="panel results-empty" aria-label="Comparison results status">
          <span>RESULTS</span>
          <strong>{dataset === null ? "Load an EPW file to run weather comparison" : "Run the current cases when you are ready"}</strong>
          <p>Annual, Summer / Cooling, Winter / Heating, monthly values, and baseline deltas will appear here.</p>
        </section>
      ) : (
        <>
          {dirty ? <div className="stale-banner" role="status">Changes not calculated — displayed results are from the last Run Comparison.</div> : null}
          <ResultsPanel result={result} />
          <MonthlyChart result={result} />
        </>
      )}

      <section className="panel assumptions-panel" aria-labelledby="assumptions-title">
        <div className="section-heading">
          <div><p className="section-kicker">Model disclosure</p><h2 id="assumptions-title">Assumptions & provenance</h2></div>
          <p>Review before interpreting differences</p>
        </div>
        <div className="assumption-grid">
          <article>
            <h3>Weather</h3>
            <dl>
              <div><dt>Dataset</dt><dd>{dataset?.id ?? "Not loaded"}</dd></div>
              <div><dt>Source</dt><dd>{dataset?.provenance.sourceName ?? "Browser-local EPW required"}</dd></div>
              <div><dt>Site</dt><dd>{dataset === null ? "—" : `${dataset.location.city}, ${dataset.location.country}`}</dd></div>
              <div><dt>Intervals</dt><dd>{dataset?.intervals.length.toLocaleString("en-US") ?? "—"}</dd></div>
            </dl>
          </article>
          <article>
            <h3>Model identity</h3>
            <dl className="identity-list">
              <div><dt>modelVersion</dt><dd><code>facade-v1-weather</code></dd></div>
              <div><dt>geometryVersion</dt><dd><code>facade-v1</code></dd></div>
              <div><dt>direct</dt><dd><code>{FACADE_V1_DIRECT_SHADING_MODEL}</code></dd></div>
              <div><dt>diffuse</dt><dd><code>{FACADE_V1_DIFFUSE_SHADING_MODEL}</code></dd></div>
              <div><dt>ground</dt><dd><code>{FACADE_V1_GROUND_REFLECTION_MODEL}</code></dd></div>
            </dl>
          </article>
          <article className="limitation-card">
            <h3>Geometry boundary</h3>
            <p><strong>Finite-width geometry applies only to direct shadow.</strong></p>
            <p>Diffuse shading remains the isotropic 2D infinite-width approximation. Ground reflection is unshaded. One vertical opening and zero or one horizontal overhang are supported.</p>
          </article>
        </div>
      </section>

      <footer><span>Facade Solar Lab · {engineManifest.milestone}</span><span>Comparative design aid · Human judgment required</span></footer>
    </main>
  );
}

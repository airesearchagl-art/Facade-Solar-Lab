import { useState } from "react";

import { formatKWh, formatPercent, formatSignedKWh } from "../../comparison";
import { compareStory, type MultiFloorCaseResult, type MultiFloorRunResult } from "../../multifloor";
import type { WeatherDataset } from "../../weather";
import { caseFloorSeries, FloorMonthlyChart, type FloorMonthlySeries } from "./FloorMonthlyChart";
import { MultiFloorGeometryPreview } from "./MultiFloorGeometryPreview";
import { CaseLegendLine, CaseMarker, DEFAULT_CASE_COLORS, getCaseStyle, type CaseColors } from "../case-colors";

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"] as const;

function PeriodTable({ result, colors }: { readonly result: MultiFloorRunResult; readonly colors: CaseColors }) {
  const periods = [
    { label: "年間", value: "annualKWh", delta: "annual" },
    { label: "夏期（4〜9月）", value: "summerKWh", delta: "summer" },
    { label: "冬期（10〜3月）", value: "winterKWh", delta: "winter" },
  ] as const;
  return (
    <div className="table-scroll">
      <table className="data-table multifloor-total-table">
        <thead><tr><th scope="col">期間</th>{result.cases.map((item, index) => <th scope="col" key={item.caseId}><CaseMarker colors={colors} caseId={item.caseId} index={index} /> {item.name}</th>)}</tr></thead>
        <tbody>{periods.map((period) => (
          <tr key={period.label}>
            <th scope="row">{period.label}</th>
            {result.cases.map((item) => {
              const delta = item.deltaFromBaseline[period.delta];
              return <td key={item.caseId}><strong>{formatKWh(item.total[period.value])} kWh</strong><small>{item.caseId === result.baselineCaseId ? "基準案" : `${formatSignedKWh(delta.kWh)} kWh / ${formatPercent(delta.percent)}`}</small></td>;
            })}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function MultiFloorMonthlyChart({ result, colors }: { readonly result: MultiFloorRunResult; readonly colors: CaseColors }) {
  const width = 720;
  const height = 270;
  const left = 52;
  const right = 18;
  const top = 18;
  const bottom = 40;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maximum = Math.max(1, ...result.cases.flatMap((item) => item.total.monthlyKWh));
  const x = (index: number) => left + (index * plotWidth) / 11;
  const y = (value: number) => top + plotHeight - (value / maximum) * plotHeight;
  return (
    <section className="multifloor-monthly" aria-labelledby="multifloor-monthly-title">
      <div className="subsection-heading"><div><p className="section-kicker">Building Total</p><h3 id="multifloor-monthly-title">建物全体の月別比較</h3></div><span>日射熱取得量 [kWh]</span></div>
      <ul className="chart-legend" aria-label="建物案の凡例">{result.cases.map((item, index) => <li key={item.caseId}><CaseLegendLine colors={colors} caseId={item.caseId} index={index} /><strong>{String.fromCharCode(65 + index)}</strong> {item.name}{item.caseId === result.baselineCaseId ? " · 基準案" : ""}</li>)}</ul>
      <div className="chart-scroll">
        <svg className="monthly-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="multifloor-chart-title multifloor-chart-desc">
          <title id="multifloor-chart-title">建物案ごとの月別日射熱取得量</title>
          <desc id="multifloor-chart-desc">各階の月別値を合計した建物全体値です。正確な値は下の表でも確認できます。</desc>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const lineY = top + plotHeight - ratio * plotHeight;
            return <g key={ratio}><line className="chart-grid" x1={left} x2={width - right} y1={lineY} y2={lineY} /><text className="axis-label" x={left - 10} y={lineY + 4} textAnchor="end">{formatKWh(maximum * ratio)}</text></g>;
          })}
          {MONTHS.map((month, index) => <text className="axis-label" key={month} x={x(index)} y={height - 14} textAnchor="middle">{month}</text>)}
          {result.cases.map((item, caseIndex) => {
            const style = getCaseStyle(colors, item.caseId, caseIndex);
            const points = item.total.monthlyKWh.map((value, index) => `${x(index)},${y(value)}`).join(" ");
            return <g key={item.caseId} data-case-id={item.caseId}><polyline points={points} fill="none" stroke={style.color} strokeDasharray={style.dash} strokeWidth="3" />{item.total.monthlyKWh.map((value, index) => <circle key={MONTHS[index]} cx={x(index)} cy={y(value)} r="4" fill="#fffdf7" stroke={style.color} strokeWidth="2"><title>{`${item.name}・${MONTHS[index]}: ${formatKWh(value)} kWh`}</title></circle>)}</g>;
          })}
        </svg>
      </div>
      <details className="monthly-table-wrap" open>
        <summary>建物全体の月別値</summary>
        <div className="table-scroll"><table className="data-table monthly-table"><caption>各階合計の日射熱取得量 [kWh] と基準案差</caption><thead><tr><th scope="col">月</th>{result.cases.map((item) => <th scope="col" key={item.caseId}>{item.name}</th>)}</tr></thead><tbody>{MONTHS.map((month, index) => <tr key={month}><th scope="row">{month}</th>{result.cases.map((item) => {
          const delta = item.deltaFromBaseline.monthly[index]!;
          return <td key={item.caseId}><strong>{formatKWh(item.total.monthlyKWh[index]!)} kWh</strong><small>{item.caseId === result.baselineCaseId ? "基準案" : `${formatSignedKWh(delta.kWh)} kWh / ${formatPercent(delta.percent)}`}</small></td>;
        })}</tr>)}</tbody></table></div>
      </details>
    </section>
  );
}

export function StoryComparisonTable({ result, storyIndex, colors = DEFAULT_CASE_COLORS }: { readonly result: MultiFloorRunResult; readonly storyIndex: number; readonly colors?: CaseColors }) {
  const rows = compareStory(result, storyIndex);
  return <div className="table-scroll">
    <table className="data-table story-comparison-table">
      <caption>下から{storyIndex + 1}番目の階を比較 · 日射熱取得量 [kWh]</caption>
      <thead><tr><th scope="col">建物案 / 階名称</th><th scope="col">年間</th><th scope="col">夏期</th><th scope="col">冬期</th><th scope="col">基準案の同じ階との差</th></tr></thead>
      <tbody>{rows.map((row, index) => <tr key={row.caseId}>
        <th scope="row"><span className="story-case-name"><CaseMarker colors={colors} caseId={row.caseId} index={index} /> {row.caseName}</span><span className="story-floor-name">{row.floor?.name ?? "該当階なし"}</span></th>
        <td>{row.floor === null ? "—" : formatKWh(row.floor.simulation.summary.annual.withOverhangKWh)}</td>
        <td>{row.floor === null ? "—" : formatKWh(row.floor.simulation.summary.cooling.withOverhangKWh)}</td>
        <td>{row.floor === null ? "—" : formatKWh(row.floor.simulation.summary.heating.withOverhangKWh)}</td>
        <td>{row.delta === null ? <span title="基準案または比較案に該当階がありません">—</span> : row.caseId === result.baselineCaseId ? "基準案" : <div className="story-deltas">{(["annual", "summer", "winter"] as const).map((period, index) => <span key={period}>{["年間", "夏期", "冬期"][index]} {formatSignedKWh(row.delta![period].kWh)}<small>{formatPercent(row.delta![period].percent)}</small></span>)}</div>}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function storyMonthlySeries(result: MultiFloorRunResult, storyIndex: number, colors: CaseColors = DEFAULT_CASE_COLORS): readonly FloorMonthlySeries[] {
  return compareStory(result, storyIndex).flatMap((row, index) => row.floor === null ? [] : [{
    ...getCaseStyle(colors, row.caseId, index),
    id: row.caseId,
    label: row.caseName + " · " + row.floor.name + (row.caseId === result.baselineCaseId ? " · 基準案" : ""),
    monthlyKWh: row.floor.simulation.monthly.map((month) => month.withOverhangKWh),
  }]);
}

function FloorTable({ item }: { readonly item: MultiFloorCaseResult }) {
  return (
    <div className="table-scroll">
      <table className="data-table floor-result-table">
        <thead><tr><th scope="col">Floor</th><th scope="col">年間</th><th scope="col">夏期</th><th scope="col">冬期</th></tr></thead>
        <tbody>{item.floors.map((floor) => <tr key={floor.floorId}><th scope="row">{floor.name}</th><td>{formatKWh(floor.simulation.summary.annual.withOverhangKWh)} kWh</td><td>{formatKWh(floor.simulation.summary.cooling.withOverhangKWh)} kWh</td><td>{formatKWh(floor.simulation.summary.heating.withOverhangKWh)} kWh</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function MultiFloorResults({
  result,
  selectedCaseId,
  selectedFloorId,
  onSelectCase,
  onSelectFloor,
  dataset = null,
  colors = DEFAULT_CASE_COLORS,
}: {
  readonly result: MultiFloorRunResult;
  readonly selectedCaseId: string;
  readonly selectedFloorId: string;
  readonly onSelectCase: (caseId: string) => void;
  readonly onSelectFloor: (floorId: string) => void;
  readonly dataset?: WeatherDataset | null;
  readonly colors?: CaseColors;
}) {
  const [requestedStoryIndex, setStoryIndex] = useState(0);
  const [monthlyMode, setMonthlyMode] = useState<"floors" | "cases">("floors");
  const storyCount = Math.max(...result.cases.map((item) => item.floors.length));
  const storyIndex = Math.min(requestedStoryIndex, storyCount - 1);
  const selectedCase = result.cases.find((item) => item.caseId === selectedCaseId) ?? result.cases[0]!;
  const selectedFloor = selectedCase.floors.find((floor) => floor.floorId === selectedFloorId) ?? selectedCase.floors[0]!;
  return (
    <section className="panel multifloor-results" aria-labelledby="multifloor-results-title">
      <div className="section-heading"><div><p className="section-kicker">04 · 複数階比較結果</p><h2 id="multifloor-results-title">Building Total</h2></div><p>差分 = 各建物案 − 基準案</p></div>
      <div className="result-reading">
        <p><strong>表示値は各階の開口を通る日射熱取得量の単純合算です。冷房・暖房負荷ではありません。</strong></p>
        <p>建物全体差には階数、開口面積、SHGC、庇条件の差が含まれます。自動的な優劣判定は行いません。</p>
      </div>
      <PeriodTable result={result} colors={colors} />
      <MultiFloorMonthlyChart result={result} colors={colors} />

      <section className="story-comparison no-print" aria-labelledby="story-comparison-title">
        <div className="subsection-heading"><div><p className="section-kicker">02 · 同じ階順を比較</p><h3 id="story-comparison-title">階別の案比較</h3></div></div>
        <p className="comparison-note">同じ階順（下からn番目）を比較します。名称・IDが違っても階順で対応し、該当階がない案の値・差分は「—」です。</p>
        <div className="result-selectors"><label>比較対象階<select value={storyIndex} onChange={(event) => setStoryIndex(Number(event.currentTarget.value))}>{Array.from({ length: storyCount }, (_, index) => <option key={index} value={index}>下から{index + 1}番目</option>)}</select></label></div>
        <StoryComparisonTable result={result} storyIndex={storyIndex} colors={colors} />
      </section>

      <section className="floor-breakdown no-print" aria-labelledby="floor-breakdown-title">
        <div className="subsection-heading"><div><p className="section-kicker">03 · Case内訳</p><h3 id="floor-breakdown-title">Floor Breakdown</h3></div></div>
        <div className="result-selectors no-print">
          <label>建物案<select value={selectedCase.caseId} onChange={(event) => onSelectCase(event.currentTarget.value)}>{result.cases.map((item) => <option key={item.caseId} value={item.caseId}>{item.name}</option>)}</select></label>
          <label>月別詳細の階<select value={selectedFloor.floorId} onChange={(event) => onSelectFloor(event.currentTarget.value)}>{selectedCase.floors.map((floor) => <option key={floor.floorId} value={floor.floorId}>{floor.name}</option>)}</select></label>
        </div>
        <div className="no-print">
          <FloorTable item={selectedCase} />
          <details className="monthly-table-wrap" open>
            <summary>{selectedCase.name} · {selectedFloor.name} の月別詳細</summary>
            <div className="table-scroll"><table className="data-table compact-month-table"><thead><tr>{MONTHS.map((month) => <th scope="col" key={month}>{month}</th>)}</tr></thead><tbody><tr>{selectedFloor.simulation.monthly.map((month) => <td key={month.month}>{formatKWh(month.withOverhangKWh)}</td>)}</tr></tbody></table></div>
          </details>
        </div>
      </section>

      <section className="floor-monthly-comparison no-print" aria-label="階別月別比較">
        <p className="section-kicker">04 · 月ごとの推移</p>
        <div className="monthly-view-switch" role="group" aria-label="月別グラフの比較方法">
          <button type="button" aria-pressed={monthlyMode === "floors"} onClick={() => setMonthlyMode("floors")}>Case内で階比較</button>
          <button type="button" aria-pressed={monthlyMode === "cases"} onClick={() => setMonthlyMode("cases")}>同じ階を案比較</button>
        </div>
        {monthlyMode === "floors" ? <FloorMonthlyChart title={selectedCase.name + " — 階別月別日射熱取得"} series={caseFloorSeries(selectedCase, selectedFloor.floorId)} colorOverride={colors[selectedCase.caseId]} /> : <>
          <p className="comparison-note">上の「比較対象階」: 下から{storyIndex + 1}番目。該当階がない案は描画しません。</p>
          <FloorMonthlyChart title={"下から" + (storyIndex + 1) + "番目 — 案別月別日射熱取得"} series={storyMonthlySeries(result, storyIndex, colors)} />
        </>}
      </section>

      <section className="print-only multifloor-story-report" aria-label="全階順の案比較">
        <h2>階別の案比較</h2><p>同じ階順（下からn番目）を比較。該当階がない場合は「—」。差分は各案 − 基準案です。</p>
        {Array.from({ length: storyCount }, (_, index) => <article key={index}><StoryComparisonTable result={result} storyIndex={index} colors={colors} /></article>)}
      </section>
      <section className="print-only multifloor-all-floor-report" aria-label="全建物案の階別結果">
        {result.cases.map((item, index) => <article key={item.caseId} className="multifloor-case-report">
          <h2><CaseMarker colors={colors} caseId={item.caseId} index={index} /> {item.name}{item.caseId === result.baselineCaseId ? " · 基準案" : ""}</h2>
          <h3>Floor Breakdown</h3><FloorTable item={item} />
          <FloorMonthlyChart title={item.name + " — 階別月別日射熱取得"} series={caseFloorSeries(item)} colorOverride={colors[item.caseId]} />
          <h3>積層形状 · 全階の参考日射線</h3>
          <MultiFloorGeometryPreview buildingCase={item.definition} dataset={dataset} report />
        </article>)}
      </section>
    </section>
  );
}

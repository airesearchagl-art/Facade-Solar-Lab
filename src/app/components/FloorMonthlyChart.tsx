import { useId } from "react";

import { formatKWh } from "../../comparison";
import type { MultiFloorCaseResult } from "../../multifloor";

export const FLOOR_MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"] as const;
const COLORS = ["#b84322", "#176b73", "#7f5aa2", "#647438", "#2858a1", "#9a6a1c"] as const;
const DASHES = [undefined, "8 4", "2 4", "12 4 2 4"] as const;

export interface FloorMonthlySeries {
  readonly id: string;
  readonly label: string;
  readonly monthlyKWh: readonly number[];
  readonly highlighted?: boolean;
}

export function caseFloorSeries(item: MultiFloorCaseResult, selectedFloorId?: string): readonly FloorMonthlySeries[] {
  return item.floors.map((floor) => ({
    id: floor.floorId,
    label: floor.name,
    monthlyKWh: floor.simulation.monthly.map((month) => month.withOverhangKWh),
    highlighted: floor.floorId === selectedFloorId,
  }));
}

/** Presentation only: every plotted value comes from the saved simulation result. */
export function FloorMonthlyChart({ title, series }: {
  readonly title: string;
  readonly series: readonly FloorMonthlySeries[];
}) {
  const titleId = useId();
  const maximum = Math.max(1, ...series.flatMap((item) => item.monthlyKWh));
  // Keep enough axis gutter for large values; the chart scrolls locally on phones.
  const left = Math.max(60, formatKWh(maximum).length * 7 + 14);
  const width = 720;
  const height = 265;
  const x = (index: number) => left + index * (width - left - 24) / 11;
  const y = (value: number) => 220 - (value / maximum) * 200;
  const styled = series.map((item, index) => ({ ...item, color: COLORS[index % COLORS.length]!, dash: DASHES[index % DASHES.length] }));
  return (
    <section className="floor-monthly-chart" aria-labelledby={titleId}>
      <div className="subsection-heading"><h3 id={titleId}>{title}</h3><span>日射熱取得量 [kWh]</span></div>
      <ul className="chart-legend floor-chart-legend" aria-label={`${title}の凡例`}>
        {styled.map((item) => <li key={item.id} className={item.highlighted ? "highlighted" : undefined}>
          <svg width="30" height="12" aria-hidden="true"><line x1="0" y1="6" x2="30" y2="6" stroke={item.color} strokeWidth="3" strokeDasharray={item.dash} /></svg>
          <span>{item.label}{item.highlighted ? " · 選択中" : ""}</span>
        </li>)}
      </ul>
      <div className="chart-scroll">
        <svg className="monthly-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <title>{title}</title><desc>各階の計算済み月別値。点のラベルと月別表で正確な数値を確認できます。</desc>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => <g key={ratio}><line className="chart-grid" x1={left} x2={width - 24} y1={y(maximum * ratio)} y2={y(maximum * ratio)} /><text className="axis-label" x={left - 10} y={y(maximum * ratio) + 4} textAnchor="end">{formatKWh(maximum * ratio)}</text></g>)}
          {FLOOR_MONTHS.map((month, index) => <text className="axis-label" key={month} x={x(index)} y="249" textAnchor="middle">{month}</text>)}
          {[...styled].sort((a, b) => Number(a.highlighted ?? false) - Number(b.highlighted ?? false)).map((item) => <g key={item.id} data-series-id={item.id} data-highlighted={item.highlighted || undefined}>
            <polyline points={item.monthlyKWh.map((value, index) => `${x(index)},${y(value)}`).join(" ")} fill="none" stroke={item.color} strokeWidth={item.highlighted ? 4 : 2} strokeDasharray={item.dash} />
            {item.monthlyKWh.map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r={item.highlighted ? 4 : 3} fill="white" stroke={item.color} strokeWidth="2"><title>{`${item.label} · ${FLOOR_MONTHS[index]}: ${formatKWh(value)} kWh`}</title></circle>)}
          </g>)}
        </svg>
      </div>
      <details className="monthly-table-wrap no-print"><summary>階別月別の数値を表示</summary><div className="table-scroll"><table className="data-table monthly-table"><caption>{title} [kWh]</caption><thead><tr><th scope="col">月</th>{series.map((item) => <th key={item.id} scope="col">{item.label}</th>)}</tr></thead><tbody>{FLOOR_MONTHS.map((month, index) => <tr key={month}><th scope="row">{month}</th>{series.map((item) => <td key={item.id}>{formatKWh(item.monthlyKWh[index]!)}</td>)}</tr>)}</tbody></table></div></details>
    </section>
  );
}

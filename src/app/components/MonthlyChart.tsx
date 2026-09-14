import { formatKWh, type ComparisonRunResult } from "../../comparison";
import { CaseLegendLine, CaseMarker, DEFAULT_CASE_COLORS, getCaseStyle, type CaseColors } from "../case-colors";

interface MonthlyChartProps {
  readonly result: ComparisonRunResult;
  readonly colors?: CaseColors;
}

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"] as const;
export function MonthlyChart({ result, colors = DEFAULT_CASE_COLORS }: MonthlyChartProps) {
  const width = 720;
  const height = 280;
  const left = 52;
  const right = 18;
  const top = 18;
  const bottom = 40;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const max = Math.max(
    1,
    ...result.cases.flatMap((item) =>
      item.simulation.monthly.map((month) => month.withOverhangKWh),
    ),
  );
  const x = (monthIndex: number) => left + (monthIndex * plotWidth) / 11;
  const y = (value: number) => top + plotHeight - (value / max) * plotHeight;

  return (
    <section className="panel chart-panel" aria-labelledby="monthly-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">季節変動</p>
          <h2 id="monthly-title">月別比較</h2>
        </div>
        <p>庇ありの日射熱取得量 [kWh]</p>
      </div>
      <ul className="chart-legend" aria-label="比較案の凡例">
        {result.cases.map((item, index) => (
          <li key={item.caseId}>
            <CaseLegendLine colors={colors} caseId={item.caseId} index={index} />
            <strong>{String.fromCharCode(65 + index)}</strong> {item.name}
            {item.caseId === result.baselineCaseId ? " · 基準案" : ""}
          </li>
        ))}
      </ul>
      <div className="chart-scroll">
        <svg
          className="monthly-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby="monthly-svg-title monthly-svg-desc"
        >
          <title id="monthly-svg-title">案ごとの月別ファサード日射熱取得量</title>
          <desc id="monthly-svg-desc">
            庇ありの月別値を12か月分示す折れ線グラフです。同じ正確な値を下の表でも確認できます。
          </desc>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const lineY = top + plotHeight - ratio * plotHeight;
            return (
              <g key={ratio}>
                <line className="chart-grid" x1={left} x2={width - right} y1={lineY} y2={lineY} />
                <text className="axis-label" x={left - 10} y={lineY + 4} textAnchor="end">
                  {formatKWh(max * ratio)}
                </text>
              </g>
            );
          })}
          {MONTHS.map((month, index) => (
            <text className="axis-label" key={month} x={x(index)} y={height - 14} textAnchor="middle">
              {month}
            </text>
          ))}
          {result.cases.map((item, caseIndex) => {
            const style = getCaseStyle(colors, item.caseId, caseIndex);
            const points = item.simulation.monthly
              .map((month, index) => `${x(index)},${y(month.withOverhangKWh)}`)
              .join(" ");
            return (
              <g key={item.caseId} data-case-id={item.caseId}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={style.color}
                  strokeDasharray={style.dash}
                  strokeWidth="3"
                />
                {item.simulation.monthly.map((month, index) => (
                  <g key={month.month}>
                    <circle
                      cx={x(index)}
                      cy={y(month.withOverhangKWh)}
                      r="4"
                      fill="#fffdf7"
                      stroke={style.color}
                      strokeWidth="2"
                    />
                    <title>{`${item.name}・${MONTHS[index]}: ${formatKWh(month.withOverhangKWh)} kWh`}</title>
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      <details className="monthly-table-wrap" open>
        <summary>月別値の表</summary>
        <div className="table-scroll">
          <table className="data-table monthly-table">
            <caption>庇ありの日射熱取得量・月別値 [kWh]</caption>
            <thead>
              <tr>
                <th scope="col">月</th>
                {result.cases.map((item, index) => (
                  <th scope="col" key={item.caseId}><CaseMarker colors={colors} caseId={item.caseId} index={index} /> {item.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((month, monthIndex) => (
                <tr key={month}>
                  <th scope="row">{month}</th>
                  {result.cases.map((item) => (
                    <td key={item.caseId}>{formatKWh(item.simulation.monthly[monthIndex]!.withOverhangKWh)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

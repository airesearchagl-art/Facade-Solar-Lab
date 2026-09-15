import type { WeatherCoverage } from "../weather";

// Presentation only: the canonical parser owns temporal integrity / coverage.
export function weatherPeriodLabels(coverage: WeatherCoverage | undefined) {
  return coverage === "partial"
    ? { annual: "読込期間合計", summer: "夏期の読込分", winter: "冬期の読込分" }
    : { annual: "年間", summer: "夏期", winter: "冬期" };
}

export function WeatherCoverageNotice({ coverage }: { readonly coverage: WeatherCoverage | undefined }) {
  if (coverage !== "partial") return null;
  return (
    <aside className="result-reading weather-coverage-warning" aria-label="気象データの対象期間">
      <p><strong>部分期間の気象データです（partial）。通年結果ではありません。</strong></p>
      <p>期間別・月別値と基準案との差は読込区間のみの集計です。夏期・冬期全体を満たすとは限りません。未読込期間の0は日射量ゼロの確認ではなく、年間換算・補完はしていません。</p>
    </aside>
  );
}

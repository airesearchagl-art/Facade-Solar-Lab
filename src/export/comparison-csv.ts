import type { ComparisonRunResult } from "../comparison";
import type { WeatherDataset } from "../weather";

export const COMPARISON_CSV_FILENAME = "facade-solar-comparison.csv";

const PERIOD_COLUMNS = [
  ["年間", "annual"],
  ["夏期", "cooling"],
  ["冬期", "heating"],
] as const;

const BASE_HEADERS = [
  "案名",
  "基準案",
  "気象データセット",
  "気象地点",
  "気象データ種別",
  "気象データ注意",
  "ファサード方位角_deg",
  "開口幅_m",
  "窓下端_m",
  "窓上端_m",
  "庇あり",
  "庇出幅_m",
  "庇高さ_m",
  "左側延長_m",
  "右側延長_m",
  "SHGC",
  "地表面反射率",
] as const;

function safeSpreadsheetText(value: string): string {
  return /^\s*[=+\-@]/u.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number): string {
  const text =
    typeof value === "number"
      ? (() => {
          if (!Number.isFinite(value)) {
            throw new RangeError("CSV values must be finite");
          }
          return String(value);
        })()
      : safeSpreadsheetText(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function locationLabel(dataset: Pick<WeatherDataset, "location">): string {
  return [dataset.location.city, dataset.location.region, dataset.location.country]
    .filter(Boolean)
    .join(" / ");
}

function demoWarning(dataset: Pick<WeatherDataset, "provenance">): string {
  return dataset.provenance.sourceType === "synthetic"
    ? "デモ用合成気象データ／実測気象ではありません／性能検証用データではありません"
    : "EPW気象データ";
}

export function createComparisonCsv(
  result: ComparisonRunResult,
  dataset: Pick<WeatherDataset, "id" | "location" | "provenance">,
): string {
  const periodHeaders = PERIOD_COLUMNS.flatMap(([label]) => [
    `${label}_庇あり_kWh`,
    `${label}_庇なし_kWh`,
    `${label}_削減率_pct`,
    `${label}_基準案差_kWh`,
    `${label}_基準案差_pct`,
  ]);
  const monthHeaders = Array.from({ length: 12 }, (_, index) => `${index + 1}月_kWh`);
  const headers = [...BASE_HEADERS, ...periodHeaders, ...monthHeaders];
  const rows = result.cases.map((item) => {
    const { parameters } = item;
    const overhang = parameters.overhang;
    const periodValues = PERIOD_COLUMNS.flatMap(([, key]) => {
      const summary = item.simulation.summary[key];
      const delta = item.deltaFromBaseline[key];
      return [
        summary.withOverhangKWh,
        summary.withoutOverhangKWh,
        summary.reductionPercent,
        delta.kWh,
        delta.percent === null ? "" : delta.percent,
      ];
    });
    return [
      item.name,
      item.caseId === result.baselineCaseId ? "はい" : "いいえ",
      dataset.id,
      locationLabel(dataset),
      dataset.provenance.sourceType === "synthetic" ? "Demo" : "EPW",
      demoWarning(dataset),
      parameters.facadeAzimuthDegFromNorth,
      parameters.opening.widthM,
      parameters.opening.sillZM,
      parameters.opening.headZM,
      overhang === undefined ? "いいえ" : "はい",
      overhang?.depthM ?? "",
      overhang?.elevationZM ?? "",
      overhang?.leftExtensionM ?? "",
      overhang?.rightExtensionM ?? "",
      parameters.solarHeatGainCoefficient,
      parameters.groundReflectance,
      ...periodValues,
      ...item.simulation.monthly.map((month) => month.withOverhangKWh),
    ];
  });
  return `\uFEFF${[headers, ...rows]
    .map((row) => row.map((value) => csvCell(value)).join(","))
    .join("\r\n")}\r\n`;
}

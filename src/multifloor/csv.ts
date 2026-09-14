import type { WeatherDataset } from "../weather";
import type { MultiFloorRunResult } from "./types";

export const MULTI_FLOOR_CSV_FILENAME = "facade-solar-multifloor-comparison.csv";

function safeSpreadsheetText(value: string): string {
  return /^\s*[=+\-@]/u.test(value) ? `'${value}` : value;
}
function csvCell(value: string | number): string {
  const text = typeof value === "number"
    ? (() => {
        if (!Number.isFinite(value)) throw new RangeError("CSV values must be finite");
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

export function createMultiFloorCsv(
  result: MultiFloorRunResult,
  dataset: Pick<WeatherDataset, "id" | "location" | "provenance">,
): string {
  const months = Array.from({ length: 12 }, (_, index) => `${index + 1}月_kWh`);
  const headers = [
    "行種別", "建物案", "基準案", "階ID", "階名称", "気象データセット", "気象地点",
    "ファサード方位角_deg", "地表面反射率", "階高_m", "開口中心X_m", "開口幅_m",
    "開口高さ_m", "腰壁高さ_m", "庇あり", "庇出幅_m", "庇高さ_m", "左側延長_m",
    "右側延長_m", "SHGC", "年間_kWh", "夏期_kWh", "冬期_kWh", "年間基準案差_kWh",
    "年間基準案差_pct", "夏期基準案差_kWh", "夏期基準案差_pct", "冬期基準案差_kWh",
    "冬期基準案差_pct", ...months,
  ];
  const rows: Array<Array<string | number>> = [];
  for (const item of result.cases) {
    const common = [
      item.name,
      item.caseId === result.baselineCaseId ? "はい" : "いいえ",
    ] as const;
    rows.push([
      "Building", ...common, "", "", dataset.id, locationLabel(dataset),
      item.definition.facadeAzimuthDegFromNorth, item.definition.groundReflectance,
      "", "", "", "", "", "", "", "", "", "", "",
      item.total.annualKWh, item.total.summerKWh, item.total.winterKWh,
      item.deltaFromBaseline.annual.kWh, item.deltaFromBaseline.annual.percent ?? "",
      item.deltaFromBaseline.summer.kWh, item.deltaFromBaseline.summer.percent ?? "",
      item.deltaFromBaseline.winter.kWh, item.deltaFromBaseline.winter.percent ?? "",
      ...item.total.monthlyKWh,
    ]);
    for (const floor of item.floors) {
      const definition = floor.definition;
      const overhang = definition.overhang;
      rows.push([
        "Floor", ...common, definition.id, definition.name, dataset.id, locationLabel(dataset),
        item.definition.facadeAzimuthDegFromNorth, item.definition.groundReflectance,
        definition.floorHeightM, definition.opening.centerXM, definition.opening.widthM,
        definition.opening.heightM, definition.opening.sillHeightM,
        overhang === undefined ? "いいえ" : "はい", overhang?.depthM ?? "",
        overhang?.elevationM ?? "", overhang?.leftExtensionM ?? "",
        overhang?.rightExtensionM ?? "", definition.solarHeatGainCoefficient,
        floor.simulation.summary.annual.withOverhangKWh,
        floor.simulation.summary.cooling.withOverhangKWh,
        floor.simulation.summary.heating.withOverhangKWh,
        "", "", "", "", "", "",
        ...floor.simulation.monthly.map((month) => month.withOverhangKWh),
      ]);
    }
  }
  return `\uFEFF${[headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")}\r\n`;
}

import type { InputDifferenceValue } from "./types";

export function formatKWh(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

export function formatSignedKWh(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatKWh(value)}`;
}

export function formatPercent(value: number | null): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatInputValue(
  value: InputDifferenceValue,
  unit?: "m" | "°",
): string {
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return unit === undefined ? formatted : `${formatted} ${unit}`;
}

import { parseEpw, type WeatherDataset } from "../weather";

export async function parseBrowserEpwFile(file: File): Promise<WeatherDataset> {
  if (!file.name.toLowerCase().endsWith(".epw")) {
    throw new RangeError("Select an .epw weather file");
  }
  const text = await file.text();
  return parseEpw(text, {
    sourceName: file.name,
    sourceType: "epw",
  });
}

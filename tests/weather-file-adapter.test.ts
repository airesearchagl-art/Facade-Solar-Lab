import { describe, expect, it } from "vitest";

import { parseBrowserEpwFile } from "../src/app/weather-file";
import hourlyFixture from "./fixtures/weather/synthetic-hourly.epw?raw";

function browserFile(name: string, text: string): File {
  return { name, text: async () => text } as File;
}

describe("browser-local EPW adapter", () => {
  it("uses the canonical parser and retains public-safe file provenance", async () => {
    const dataset = await parseBrowserEpwFile(
      browserFile("synthetic-browser-smoke.epw", hourlyFixture),
    );
    expect(dataset.location.city).toBe("Synthetic Tokyo");
    expect(dataset.intervals).toHaveLength(1);
    expect(dataset.provenance).toEqual({
      sourceType: "epw",
      sourceName: "synthetic-browser-smoke.epw",
    });
    expect(dataset.issues).toEqual([]);
  });

  it("rejects non-EPW extensions before reading contents", async () => {
    let read = false;
    const file = {
      name: "weather.csv",
      text: async () => {
        read = true;
        return hourlyFixture;
      },
    } as File;
    await expect(parseBrowserEpwFile(file)).rejects.toThrow(/\.epw/u);
    expect(read).toBe(false);
  });
});

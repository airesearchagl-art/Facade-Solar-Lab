import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { App } from "../src/app/App";

describe("M4 application shell", () => {
  it("server-renders the complete pre-weather workspace contract", () => {
    const html = renderToString(<App />);
    expect(html).toContain("M4 · COMPARISON UX");
    expect(html).toContain("Try Demo Comparison");
    expect(html).toContain("Explore the complete comparison workflow using deterministic synthetic weather.");
    expect(html).toContain("Synthetic weather");
    expect(html).toContain("Not measured weather");
    expect(html).toContain("Not validation evidence");
    expect(html).toContain("Load EPW");
    expect(html).toContain("Case A");
    expect(html).toContain("Run Comparison");
    expect(html).toContain("Load an EPW file to run weather comparison");
    expect(html).toContain("Section");
    expect(html).toContain("Front elevation");
    expect(html).toContain("Assumptions &amp; provenance");
    expect(html).toContain("Absolute weather-driven kWh values are not formally validated");
    expect(html).toContain("Finite-width geometry applies only to direct shadow");
  });
});

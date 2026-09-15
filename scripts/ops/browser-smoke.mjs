import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { siteOrigin } from "./contract.mjs";

// Existing Playwright + Chrome only. Fresh ephemeral profile; no cookie export,
// token injection, file upload, dialogs, or Deployment Protection bypass.
export async function browserSmoke(origin) {
  assert.equal(siteOrigin(new URL(origin).hostname), origin);
  const require = createRequire(import.meta.url);
  const { chromium } = require(process.env.OPS_PLAYWRIGHT_MODULE || "playwright");
  const browser = await chromium.launch({ headless: true, ...(process.env.OPS_CHROME_EXECUTABLE ? { executablePath: process.env.OPS_CHROME_EXECUTABLE } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(15000);
  const errors = [], assetErrors = [];
  let stage = "navigation";
  page.on("pageerror", () => errors.push("runtime"));
  page.on("console", message => { if (message.type() === "error") errors.push({ kind: "console", origin: (() => { try { return new URL(message.location().url).origin; } catch { return "unknown"; } })() }); });
  page.on("response", response => { if (new URL(response.url()).origin === origin && response.status() >= 400) assetErrors.push({ path: new URL(response.url()).pathname, status: response.status() }); });
  page.on("requestfailed", request => { if (new URL(request.url()).origin === origin) errors.push({ kind: "requestfailed", path: new URL(request.url()).pathname, reason: request.failure()?.errorText }); });
  try {
    const response = await page.goto(origin, { waitUntil: "networkidle", timeout: 20000 });
    assert.equal(response.status(), 200);
    assert.equal(new URL(page.url()).origin, origin);
    assert.equal(await page.title(), "Facade Solar Lab");
    const modes = [];
    for (const mode of ["single", "multi"]) {
      stage = `${mode}:demo`;
      await page.getByRole("button", { name: mode === "single" ? "単一階モード" : "複数階モード", exact: true }).click();
      const scope = page.locator(mode === "single" ? "main.app-shell:not(.multifloor-shell)" : "main.multifloor-shell");
      await scope.getByRole("button", { name: mode === "single" ? "デモ比較を試す" : "複数階デモを試す", exact: true }).click();
      const result = scope.locator(mode === "single" ? ".results-panel" : ".multifloor-results");
      await result.waitFor();
      const text = await result.innerText();
      assert(!/NaN|Infinity/.test(text));
      assert.equal(await scope.locator(".case-tabs .case-tab").count(), 2);
      assert((await scope.locator("svg.monthly-chart polyline").count()) >= 2);
      assert((await scope.locator("table tbody tr").count()) >= 2);
      assert.match(await scope.locator(".critical-warning").innerText(), mode === "single" ? /正式に検証された物理性能値ではありません/ : /正式な物理性能評価には使用できません/);
      assert.match(await scope.innerText(), /合成気象/);
      stage = `${mode}:390px`;
      await page.setViewportSize({ width: 390, height: 844 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert(await scope.locator(".run-button").isEnabled());
      await scope.locator(".run-button").click();
      await scope.locator(".stale-banner").waitFor({ state: "detached" });
      assert(await result.isVisible());
      assert(!/NaN|Infinity/.test(await result.innerText()));
      modes.push({ mode, demo: "PASS", resultFinite: true, viewport390: "PASS" });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    stage = "mode-state-and-errors";
    await page.getByRole("button", { name: "単一階モード", exact: true }).click();
    assert(await page.locator("main.app-shell:not(.multifloor-shell) .results-panel").isVisible());
    assert.deepEqual(errors, []); assert.deepEqual(assetErrors, []);
    return { status: "PASS", method: "existing headless Chrome / Playwright; Demo only", modes, fatalErrors: 0, consoleErrors: 0, assetErrors: 0 };
  } catch (error) {
    return { status: "BLOCKED", stage, errorType: error.name, fatalOrConsoleErrors: errors.length, errors, assetErrors };
  } finally { await browser.close(); }
}

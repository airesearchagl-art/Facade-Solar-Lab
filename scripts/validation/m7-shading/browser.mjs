import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

// Existing Playwright + Chrome only. No installation, login, cookies or bypass tokens.
const [target = "http://127.0.0.1:5177/"] = process.argv.slice(2);
const url = new URL(target);
if (!["127.0.0.1", "localhost"].includes(url.hostname) && !/^facade-solar-[a-z0-9]+-airesearchagls-projects\.vercel\.app$/u.test(url.hostname)) throw new Error("Expected local or exact Facade Solar Lab Preview URL");
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.OPS_PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ ...(process.env.OPS_CHROME_EXECUTABLE ? { executablePath: process.env.OPS_CHROME_EXECUTABLE } : {}), headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const output = resolve(".local-validation/m7-shading/browser");
await mkdir(output, { recursive: true });
const errors = [], assetErrors = [], responses = [];
page.on("pageerror", e => errors.push(String(e)));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
page.on("response", response => {
  if (new URL(response.url()).origin !== url.origin) return;
  responses.push({ url: response.url(), status: response.status() });
  if (response.status() >= 400) assetErrors.push({ url: response.url(), status: response.status() });
});
const report = { target, checkedAtUtc: new Date().toISOString(), method: "Existing headless Chrome, UI events, synthetic Demo only, browser-generated CSV/PDF. Not native OS dialog or external physical validation.", modes: {} };
page.setDefaultTimeout(15000);
try {
  const response = await page.goto(target, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  assert.equal(await page.title(), "Facade Solar Lab", "Protected Preview needs existing Human-authenticated surface; no bypass");
  for (const mode of ["single", "multi"]) {
    if (mode === "multi") await page.getByRole("button", { name: "複数階モード", exact: true }).click();
    const scope = page.locator(mode === "single" ? "main.app-shell:not(.multifloor-shell)" : "main.multifloor-shell");
    await scope.getByRole("button", {name:mode === "single" ? "デモ比較を試す" : "複数階デモを試す",exact:true}).click();
    const results = scope.locator(mode === "single" ? ".results-panel" : ".multifloor-results");
    await results.waitFor();
    await scope.locator(".case-tabs .case-tab").nth(1).click();
    if (mode === "multi") await scope.locator(".floor-tabs .floor-tab").nth(1).click();
    for (const side of ["左", "右"]) {
      await scope.getByRole("checkbox", { name: `${side}フィンを使用`, exact: true }).check();
      await scope.getByLabel(`${side}フィン 出 [m]`, { exact: true }).fill(side === "左" ? "1.2" : "0.8");
    }
    await scope.locator(".stale-banner").waitFor();
    const csvButton = scope.getByRole("button", { name: mode === "single" ? "CSVを書き出す" : "複数階CSVを書き出す", exact: true });
    assert(await csvButton.isDisabled());
    const run = async () => { await scope.locator(".run-button").click(); await scope.locator(".stale-banner").waitFor({ state: "detached" }); };
    await run();
    const before = await results.innerText();
    await scope.getByLabel("左フィン 出 [m]", { exact: true }).fill("1.8");
    await scope.locator(".stale-banner").waitFor();
    await run();
    assert.notEqual(await results.innerText(), before, "fin edit must update results");
    assert(!/NaN|Infinity/u.test(await results.innerText()));
    assert((await scope.locator(".preview-workspace .fin-line").count()) >= 2);
    assert.match(await scope.locator(".difference-panel").innerText(), /左フィン/u);
    if (mode === "multi") {
      assert.equal(await scope.locator(".floor-breakdown").count(), 1);
      await scope.getByRole("button", { name: "同じ階を案比較", exact: true }).click();
      assert((await scope.locator(".story-comparison-table:visible tbody tr").count()) >= 2);
    }
    const downloadPromise = page.waitForEvent("download");
    await csvButton.click();
    const download = await downloadPromise;
    await download.saveAs(join(output, `${mode}.csv`));
    const csv = await readFile(join(output, `${mode}.csv`), "utf8");
    assert.match(csv, /左フィン出幅_m/u); assert.match(csv, /右フィン上端_m/u); assert(!/NaN|Infinity/.test(csv));
    await scope.locator(".preview-workspace").screenshot({ path: join(output, `${mode}-geometry.png`) });
    const monthly = scope.locator(mode === "single" ? ".chart-panel" : ".multifloor-monthly");
    await monthly.screenshot({ path: join(output, `${mode}-monthly.png`) });
    await page.setViewportSize({ width: 390, height: 844 });
    await scope.locator(".fin-editors").scrollIntoViewIfNeeded();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(output, `${mode}-390-input.png`) });
    await scope.locator(".preview-workspace").scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(output, `${mode}-390-geometry.png`) });
    await monthly.scrollIntoViewIfNeeded();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(output, `${mode}-390-monthly.png`) });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await scope.getByRole("button", { name: "PDFとして保存 / 印刷", exact: true }).click();
    await page.emulateMedia({ media: "print" });
    assert.equal(await scope.locator(".fin-editors").isVisible(), false);
    assert((await scope.locator(".fin-summary:visible").count()) >= 2);
    await page.pdf({ path: join(output, `${mode}.pdf`), printBackground: true, preferCSSPageSize: true });
    await page.emulateMedia({ media: "screen" });
    report.modes[mode] = { demo: "PASS", fins: "PASS", staleRerun: "PASS", monthly: "PASS", geometry: "PASS", csv: "PASS", viewport390: "PASS", print: "generated; separate PDF visual inspection required" };
    console.log(`${mode} browser PASS`);
  }
  assert.deepEqual(errors, []); assert.deepEqual(assetErrors, []);
  report.status = "PASS";
  report.responses = responses; report.errors = errors; report.assetErrors = assetErrors;
  await writeFile(join(output, "evidence.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await page.screenshot({ path: join(output, "failure.png"), fullPage: true });
  console.error(String(error)); process.exitCode = 1;
} finally { await browser.close(); }

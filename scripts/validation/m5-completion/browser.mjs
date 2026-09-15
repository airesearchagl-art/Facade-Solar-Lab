import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

// Existing Playwright/Chrome only. No downloads/install. EPW stays in localhost.
const [epw, target = "http://127.0.0.1:5175/"] = process.argv.slice(2);
if (!epw || !["127.0.0.1", "localhost"].includes(new URL(target).hostname)) throw new Error("Supply local EPW path and localhost product URL");
const epwHash = createHash("sha256").update(await readFile(epw)).digest("hex").toUpperCase();
assert.equal(epwHash, "3D3781E80F39851D80D1B445D94DEFD0C69CD74574B89DDB6E17C0575064612E");
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.M5_PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ ...(process.env.M5_CHROME_EXECUTABLE ? { executablePath: process.env.M5_CHROME_EXECUTABLE } : {}), headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
page.setDefaultTimeout(10000);
const output = resolve(".local-validation/m5-completion/browser");
await mkdir(output, { recursive: true });
const errors = [], assets = [], failedRequests = [], externalRequests = [];
page.on("pageerror", error => errors.push({ type: "runtime", text: String(error) }));
page.on("console", message => { if (message.type() === "error") errors.push({ type: "console", text: message.text(), url: message.location().url }); });
page.on("response", response => { if (response.status() >= 400) assets.push({ status: response.status(), url: response.url() }); });
page.on("requestfailed", request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
await page.route("**/*", route => {
  const url = new URL(route.request().url());
  if (["127.0.0.1", "localhost"].includes(url.hostname) || ["data:", "blob:"].includes(url.protocol)) return route.continue();
  externalRequests.push(url.origin); return route.abort();
});
const evidence = { method: "Existing headless Chrome / Playwright; real file through input.setInputFiles, normal UI handlers. Native OS chooser and interactive print dialog NOT claimed. Chrome live-DOM print/PDF engine used; no injected weather/result state.", epwHash, target, cases: {} };
try {
  const response = await page.goto(target, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  assert.equal(await page.title(), "Facade Solar Lab");
  assert.equal(await page.locator("vite-error-overlay").count(), 0);
  await page.screenshot({ path: join(output, "initial.png") });
  console.log("Initial product smoke PASS / HTTP 200");

  async function loadWeather(scope) {
    await scope.locator('.weather-panel input[type="file"]').setInputFiles(epw);
    await scope.locator(".weather-content").waitFor();
    const text = await scope.locator(".weather-content").innerText();
    assert.match(text, /TOKYO HYAKURI/i); assert.match(text, /8,760/);
    assert.equal(await scope.locator(".weather-panel .error-message").count(), 0);
    return text;
  }
  async function run(scope) {
    await scope.locator(".run-button").click();
    await scope.locator(".stale-banner").waitFor({ state: "detached" });
  }
  async function outputs(scope, mode) {
    const resultSelector = mode === "single" ? ".results-panel" : ".multifloor-results";
    const state = await scope.locator(resultSelector).innerText();
    assert(!/NaN|Infinity/u.test(state));
    const tableCells = await scope.locator("table td").allTextContents();
    const points = await scope.locator("svg.monthly-chart polyline").evaluateAll(nodes => nodes.map(n => n.getAttribute("points")));
    for (const [index, color] of ["#0055cc", "#d00080"].entries()) {
      await scope.locator(".case-tabs .case-tab").nth(index).click();
      await scope.locator('input[type="color"]').fill(color);
      assert.equal(await scope.locator('input[type="color"]').inputValue(), color);
      const chart = scope.locator(mode === "single" ? ".chart-panel" : ".multifloor-monthly");
      assert.equal(await chart.locator("svg.monthly-chart polyline").nth(index).getAttribute("stroke"), color);
      assert.equal(await chart.locator(".case-legend-line line").nth(index).getAttribute("stroke"), color);
    }
    assert.deepEqual(await scope.locator("table td").allTextContents(), tableCells, "color changed numeric values");
    assert.deepEqual(await scope.locator("svg.monthly-chart polyline").evaluateAll(nodes => nodes.map(n => n.getAttribute("points"))), points);
    const csvPromise = page.waitForEvent("download");
    await scope.getByRole("button", { name: mode === "single" ? "CSVを書き出す" : "複数階CSVを書き出す", exact: true }).click();
    const download = await csvPromise;
    const csvPath = join(output, `${mode}.csv`);
    await download.saveAs(csvPath);
    const csv = await readFile(csvPath, "utf8");
    assert(!/NaN|Infinity/u.test(csv));
    assert.match(csv, /TOKYO HYAKURI/i);
    const rows = csv.trim().split(/\r?\n/u).map(line => [...line.matchAll(/"((?:[^"]|"")*)"/gu)].map(m => m[1].replaceAll('""', '"')));
    const headers = rows.shift();
    assert.equal(rows.length, mode === "single" ? 2 : 8);
    const numericHeaders = mode === "single"
      ? ["年間_庇あり_kWh", "夏期_庇あり_kWh", "冬期_庇あり_kWh", ...Array.from({ length: 12 }, (_, i) => `${i + 1}月_kWh`)]
      : ["年間_kWh", "夏期_kWh", "冬期_kWh", ...Array.from({ length: 12 }, (_, i) => `${i + 1}月_kWh`)];
    // Exact CSV values must round to the displayed result/print table values.
    const allTableText = (await scope.locator("table").allTextContents()).join(" ");
    for (const row of rows) for (const header of numericHeaders) {
      const value = Number(row[headers.indexOf(header)]);
      assert(Number.isFinite(value) && value >= 0);
      assert(allTableText.includes(value.toLocaleString("ja-JP", { maximumFractionDigits: 1 })), `${mode}: CSV/display mismatch: ${header}`);
    }
    if (mode === "multi") {
      for (const building of rows.filter(row => row[0] === "Building")) {
        const floors = rows.filter(row => row[0] === "Floor" && row[1] === building[1]);
        assert.equal(floors.length, 3);
        for (const header of numericHeaders) {
          const column = headers.indexOf(header);
          assert(Math.abs(floors.reduce((sum, floor) => sum + Number(floor[column]), 0) - Number(building[column])) < 1e-8);
        }
      }
    }
    await scope.locator(resultSelector).screenshot({ path: join(output, `${mode}-results.png`) });
    await page.setViewportSize({ width: 390, height: 844 });
    await scope.locator('input[type="color"]').scrollIntoViewIfNeeded();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(output, `${mode}-390-controls.png`) });
    await scope.locator(mode === "single" ? ".chart-panel" : ".multifloor-monthly").scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(output, `${mode}-390-results.png`) });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const monthly = scope.locator(mode === "single" ? ".chart-panel" : ".multifloor-monthly");
    for (const selector of [".chart-scroll", ".table-scroll"]) {
      const scrolling = await monthly.locator(selector).evaluate(el => {
        el.scrollLeft = el.scrollWidth;
        return { overflow: getComputedStyle(el).overflowX, position: el.scrollLeft, maximum: el.scrollWidth - el.clientWidth };
      });
      assert(["auto", "scroll"].includes(scrolling.overflow));
      assert(scrolling.maximum > 0 && scrolling.position > 0, "390px horizontal results must remain accessible");
    }
    await page.screenshot({ path: join(output, `${mode}-390-results-right.png`) });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await scope.getByRole("button", { name: "PDFとして保存 / 印刷", exact: true }).click();
    await page.emulateMedia({ media: "print" });
    assert.equal(await scope.locator('input[type="color"]').isVisible(), false);
    assert.equal(await scope.locator("svg.monthly-chart").first().evaluate(el => getComputedStyle(el).printColorAdjust), "exact");
    await page.pdf({ path: join(output, `${mode}.pdf`), printBackground: true, preferCSSPageSize: true });
    await page.emulateMedia({ media: "screen" });
    evidence.cases[mode] = { resultText: state, csvBytes: Buffer.byteLength(csv), monthlyPolylines: points.length, colorNumericInvariant: true, viewport390: "PASS", printPdf: "generated; separate rendered-page inspection required" };
    console.log(`${mode}: real EPW / results / colors / CSV / print PDF / 390px PASS`);
  }
  const single = page.locator("main.app-shell:not(.multifloor-shell)");
  evidence.singleProvenance = await loadWeather(single);
  await single.getByRole("button", { name: "複製", exact: true }).click();
  await single.getByLabel("庇の出 [m]", { exact: true }).fill("1.6");
  await run(single);
  const first = await single.locator(".results-panel").innerText();
  await single.getByLabel("庇の出 [m]", { exact: true }).fill("1.8");
  await single.locator(".stale-banner").waitFor();
  assert(await single.getByRole("button", { name: "CSVを書き出す", exact: true }).isDisabled());
  await run(single);
  assert.notEqual(await single.locator(".results-panel").innerText(), first);
  await outputs(single, "single");

  await page.getByRole("button", { name: "複数階モード", exact: true }).click();
  const multi = page.locator("main.multifloor-shell");
  evidence.multiProvenance = await loadWeather(multi);
  assert.equal(await multi.locator(".floor-tabs .floor-tab").count(), 3);
  await multi.getByRole("button", { name: "建物案を複製", exact: true }).click();
  await multi.getByLabel("庇の出 [m]", { exact: true }).fill("1.6");
  await run(multi);
  await multi.locator(".multifloor-results").waitFor();
  const initialMulti = await multi.locator(".multifloor-results").innerText();
  await multi.getByLabel("庇の出 [m]", { exact: true }).fill("1.8");
  await multi.locator(".stale-banner").waitFor();
  assert(await multi.getByRole("button", { name: "複数階CSVを書き出す", exact: true }).isDisabled());
  await run(multi);
  assert.notEqual(await multi.locator(".multifloor-results").innerText(), initialMulti);
  await multi.getByRole("button", { name: "同じ階を案比較", exact: true }).click();
  assert.equal(await multi.locator(".story-comparison-table:visible tbody tr").count(), 2);
  await multi.getByRole("button", { name: "Case内で階比較", exact: true }).click();
  await outputs(multi, "multi");
  evidence.errors = errors; evidence.assets = assets; evidence.failedRequests = failedRequests; evidence.externalRequests = externalRequests;
  assert.deepEqual(errors, []); assert.deepEqual(assets, []); assert.deepEqual(failedRequests, []); assert.deepEqual(externalRequests, []);
  evidence.status = "PASS";
  await writeFile(join(output, "evidence.json"), JSON.stringify(evidence, null, 2) + "\n");
  console.log("Browser acceptance PASS; inspect rendered PDFs separately.");
} catch (error) {
  await page.screenshot({ path: join(output, "failure.png"), fullPage: true });
  await writeFile(join(output, "failure.json"), JSON.stringify({ error: String(error), errors, assets, failedRequests, externalRequests, body: await page.locator("body").innerText() }, null, 2));
  console.error({ error: String(error), errors, assets, failedRequests });
  process.exitCode = 1;
} finally { await browser.close(); }

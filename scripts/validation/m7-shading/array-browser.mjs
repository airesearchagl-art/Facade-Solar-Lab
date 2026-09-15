import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
const [target="http://127.0.0.1:5177/"]=process.argv.slice(2),url=new URL(target);
if(!["127.0.0.1","localhost"].includes(url.hostname)&&!/^facade-solar-[a-z0-9]+-airesearchagls-projects\.vercel\.app$/u.test(url.hostname))throw new Error("Expected exact FSL Preview or localhost");
const {chromium}=createRequire(import.meta.url)(process.env.OPS_PLAYWRIGHT_MODULE||"playwright");
const browser=await chromium.launch({...(process.env.OPS_CHROME_EXECUTABLE?{executablePath:process.env.OPS_CHROME_EXECUTABLE}:{}),headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
page.setDefaultTimeout(15000);
const output=resolve(".local-validation/m7-array/browser");await mkdir(output,{recursive:true});
const errors=[],assetErrors=[],responses=[],modes={};
page.on("pageerror",e=>errors.push(String(e)));page.on("console",m=>{if(["error","warning"].includes(m.type()))errors.push(m.text());});
page.on("response",r=>{if(new URL(r.url()).origin===url.origin){responses.push({path:new URL(r.url()).pathname,status:r.status()});if(r.status()>=400)assetErrors.push(new URL(r.url()).pathname);}});
async function download(button,path) {const ready=page.waitForEvent("download");await button.click();await(await ready).saveAs(path);return readFile(path,"utf8");}
try {
  const response=await page.goto(target,{waitUntil:"networkidle"});assert.equal(response.status(),200);assert.equal(await page.title(),"Facade Solar Lab");
  assert.equal(await page.locator("vite-error-overlay").count(),0);await page.screenshot({path:join(output,"initial.png")});
  console.log("Dev page PASS: renders, no overlay; walking input → canonical engine → result/export.");
  for(const mode of ["single","multi"]){
    if(mode==="multi")await page.getByRole("button",{name:"複数階モード",exact:true}).click();
    const scope=page.locator(mode==="single"?"main.app-shell:not(.multifloor-shell)":"main.multifloor-shell");
    await scope.getByRole("button",{name:mode==="single"?"中間フィンのピッチ比較":"複数階フィンのピッチ比較",exact:true}).click();
    const results=scope.locator(mode==="single"?".results-panel":".multifloor-results"),run=async()=>{await scope.locator(".run-button").click();await scope.locator(".stale-banner").waitFor({state:"detached"});};
    await results.waitFor();assert.equal(await scope.locator(".case-tabs .case-tab").count(),3);
    await scope.locator(".case-tabs .case-tab").nth(1).click();if(mode==="multi")await scope.locator(".floor-tabs .floor-tab").nth(1).click();
    const pitch=scope.getByLabel("中間フィン 中心ピッチ [m]",{exact:true}),csvButton=scope.getByRole("button",{name:mode==="single"?"CSVを書き出す":"複数階CSVを書き出す",exact:true});
    await pitch.fill("0");assert(await scope.locator(".run-button").isDisabled());assert(await csvButton.isDisabled());assert.match(await scope.locator(".intermediate-fin-editor").innerText(),/正の有限値/);
    await pitch.fill("1.5");for(const side of ["左","右"])await scope.getByRole("checkbox",{name:`${side}フィンを使用`,exact:true}).check();
    if(mode==="single"){
      const overhang=scope.locator("fieldset").filter({has:page.locator("legend",{hasText:/^水平庇$/})}).getByRole("checkbox");
      await overhang.uncheck();assert(await scope.getByRole("checkbox",{name:"中間フィンを使用",exact:true}).isChecked());
      for(const side of ["左","右"])assert(await scope.getByRole("checkbox",{name:`${side}フィンを使用`,exact:true}).isChecked());
      await overhang.check();
      await scope.getByLabel("庇高さ [m]",{exact:true}).fill("3.6");
    }
    await scope.locator(".stale-banner").waitFor();assert(await csvButton.isDisabled());await run();
    const before=await results.innerText();await pitch.fill("1");await scope.locator(".stale-banner").waitFor();await run();assert.notEqual(await results.innerText(),before);
    await scope.getByLabel("中間フィン 配置方式",{exact:true}).selectOption("count");await scope.getByLabel("中間フィン 枚数",{exact:true}).fill("129");assert(await scope.locator(".run-button").isDisabled());
    await scope.getByLabel("中間フィン 枚数",{exact:true}).fill("3");await run();assert.match(await scope.locator(".intermediate-fin-editor .array-summary").innerText(),/実配置: 3枚/);
    await scope.getByLabel("中間フィン 配置方式",{exact:true}).selectOption("pitch");await pitch.fill("1.5");
    if(mode==="multi"){
      for(const [i,p] of [[0,"2"],[1,"1.5"],[2,"1"]]){await scope.locator(".floor-tabs .floor-tab").nth(i).click();await pitch.fill(p);}
      await scope.locator(".floor-tabs .floor-tab").nth(1).click();
    }
    await run();assert.equal(await scope.locator('.preview-workspace [data-fin="intermediate"]').count(),mode==="single"?4:13);
    assert.match(await scope.locator(".difference-panel").innerText(),/中間フィン/);assert(!/NaN|Infinity/.test(await results.innerText()));
    if(mode==="multi"){await scope.getByRole("button",{name:"同じ階を案比較",exact:true}).click();assert((await scope.locator(".story-comparison-table:visible tbody tr").count())>=3);}
    const csv=await download(csvButton,join(output,`${mode}.csv`));for(const h of ["中間フィンあり","実配置枚数","左右端部余白_m"])assert(csv.includes(h));assert(!/NaN|Infinity/.test(csv));
    const presetPath=join(output,`${mode}.json`),preset=JSON.parse(await download(scope.getByRole("button",{name:mode==="single"?"比較セットを保存":"複数階比較セットを保存",exact:true}),presetPath));
    assert.equal(preset.schemaVersion,2);assert(!/positionsFromLeftM|rawWeather|private|results/.test(JSON.stringify(preset)));
    await scope.locator('.preset-panel input[type="file"]').setInputFiles(presetPath);
    if(mode==="single")await scope.getByRole("button",{name:"比較セットを置き換える",exact:true}).click();
    await scope.locator(".success-message").waitFor();await run();
    assert.equal(await scope.locator('.preview-workspace [data-fin="intermediate"]').count(),mode==="single"?4:13);
    await scope.locator(".preview-workspace").screenshot({path:join(output,`${mode}-geometry.png`)});
    const monthly=scope.locator(mode==="single"?".chart-panel":".multifloor-monthly");await monthly.screenshot({path:join(output,`${mode}-monthly.png`)});
    await page.setViewportSize({width:390,height:844});
    for(const [name,locator] of [["input",scope.locator(".intermediate-fin-editor")],["geometry",scope.locator(".preview-workspace")],["monthly",monthly]]){
      await locator.scrollIntoViewIfNeeded();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:join(output,`${mode}-390-${name}.png`)});
    }
    await page.setViewportSize({width:1440,height:1000});await scope.getByRole("button",{name:"PDFとして保存 / 印刷",exact:true}).click();await page.emulateMedia({media:"print"});
    assert(!(await scope.locator(".fin-editors").isVisible()));assert((await scope.locator(".array-summary:visible").count())>=3);
    await page.pdf({path:join(output,`${mode}.pdf`),printBackground:true,preferCSSPageSize:true});await page.emulateMedia({media:"screen"});
    modes[mode]={demo3Cases:"PASS",arrayEditPitchCount:"PASS",limitValidation:"PASS",staleRerun:"PASS",geometryCount:mode==="single"?4:13,monthly:"PASS",csv:"PASS",presetUIRoundtrip:"PASS",viewport390:"PASS",print:"generated; separate visual inspection required"};console.log(`${mode} PASS`);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(assetErrors,[]);
  const report={target,checkedAtUtc:new Date().toISOString(),method:"Existing ephemeral headless Chrome; UI events and real downloaded files; synthetic weather only. Not native OS chooser/print dialog or external physics validation.",status:"PASS",modes,errors,assetErrors,responses};
  await writeFile(join(output,"evidence.json"),JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify(report,null,2));
}catch(error){await page.screenshot({path:join(output,"failure.png"),fullPage:true});console.error(String(error));process.exitCode=1;}finally{await browser.close();}

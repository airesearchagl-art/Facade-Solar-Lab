import assert from "node:assert/strict";
import { cpus } from "node:os";
import { createServer } from "vite";
const server = await createServer({ configFile: false, envDir: false, logLevel: "silent", server: { middlewareMode: true }, appType: "custom" });
try {
  const { runScenario } = await server.ssrLoadModule("/src/scenario/study.ts");
  const { createDemoWeatherDataset } = await server.ssrLoadModule("/src/demo/demo-weather.ts");
  const { createDemoComparisonWorkspace } = await server.ssrLoadModule("/src/demo/demo-scenario.ts");
  const { createMultiFloorDemoWorkspace } = await server.ssrLoadModule("/src/multifloor/demo.ts");
  const dataset = createDemoWeatherDataset(), single = createDemoComparisonWorkspace().cases[0], multi = createMultiFloorDemoWorkspace().cases[0];
  const slots = Array.from({length:4}, (_,i) => ({ id:i ? `w${i}` : "current",label:`Synthetic ${i+1}`,dataset:{...dataset,id:`synthetic-${i}`,location:{...dataset.location,latitudeDeg:30+i*2}} }));
  const rows=[];
  for(const fins of [false,true])for(const floors of [1,3,10]) {
    const fin = { depthM:.6,bottomZM:.9,topZM:3.3,layout:{mode:"pitch",pitchM:2} };
    const source = floors===1 ? {mode:"single",workspace:{baselineCaseId:"d0",cases:Array.from({length:4},(_,i)=>({...single,id:`d${i}`,name:`Design ${i+1}`,parameters:{...single.parameters,solarHeatGainCoefficient:.3+i*.1,...(fins?{intermediateFins:fin}:{})}}))}}
      : {mode:"multi",workspace:{baselineCaseId:"d0",cases:Array.from({length:4},(_,i)=>({...multi,id:`d${i}`,name:`Building ${i+1}`,floors:Array.from({length:floors},(_,j)=>({...multi.floors[0],id:`f${j}`,name:`${j+1}F`,solarHeatGainCoefficient:.3+i*.1,...(fins?{intermediateFins:fin}:{})}))}))}};
    const input={...source,slots,referenceId:"current"}, ticks=[], progress=[];
    const wall=performance.now();
    const result=runScenario(input,new Date().toISOString(),n=>{ticks.push(performance.now());progress.push(n);},()=>performance.now());
    const endToEndMs=performance.now()-wall;
    assert.deepEqual(progress,Array.from({length:17},(_,i)=>i));assert(result.cells.every(c=>c.status==="VALID"));
    const times=result.cells.map(c=>c.runtimeMs).sort((a,b)=>a-b);
    const row={mode:source.mode,floors,arm:fins?"pitch-2m":"no-fins",combinations:16,intervals:8760,endToEndMs,medianCombinationMs:(times[7]+times[8])/2,maxProgressGapMs:Math.max(...ticks.slice(1).map((v,i)=>v-ticks[i]))};
    rows.push(row);console.log(JSON.stringify(row));
  }
  console.log(JSON.stringify({checkedAt:new Date().toISOString(),node:process.version,cpu:cpus()[0]?.model,method:"One local synthetic run per condition; end-to-end includes validation, identity and result clone/freeze. No Worker setup or UI. Not an SLA. Browser cancel checked separately.",rows}));
} finally { await server.close(); }

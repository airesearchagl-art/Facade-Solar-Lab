import assert from "node:assert/strict";
import { createServer } from "vite";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
const server=await createServer({configFile:false,envDir:false,logLevel:"silent",server:{middlewareMode:true},appType:"custom"});
try {
  const {arrayWorkload}=await server.ssrLoadModule("/scripts/validation/m7-shading/probes.ts");
  const rows=[],hash=value=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
  for(const [cases,floors] of [[1,1],[4,5]]) for(const arm of ["none","jamb","pitch1.5","pitch0.6",...(cases===1?["dense40"]:[])]) {
    const w=arrayWorkload(floors,cases,arm),digest=hash(w.run()),elapsedMs=[];
    for(let i=0;i<5;i++) { const start=performance.now(),result=w.run();elapsedMs.push(performance.now()-start);assert.equal(hash(result),digest);assert(result.cases.every(c=>Number.isFinite(c.total.annualKWh))); }
    const row={cases,floors,arm,intervals:w.intervals,elapsedMs,medianMs:[...elapsedMs].sort((a,b)=>a-b)[2],digest};rows.push(row);console.log(JSON.stringify(row));
  }
  const report={checkedAtUtc:new Date().toISOString(),node:process.version,cpu:cpus()[0]?.model,method:"8760 synthetic intervals; identical 6m opening/overhang across arms (dense probe 12m/P0.3). One warmup +5 measured; setup/hash excluded. Local CPU evidence, no SLA or external validation.",rows};
  await mkdir(".local-validation/m7-array",{recursive:true});await writeFile(".local-validation/m7-array/workload.json",JSON.stringify(report,null,2)+"\n");
} finally {await server.close();}

import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "vite";
// Generates only local, explicitly synthetic test artifacts; never real weather.
const server=await createServer({configFile:false,envDir:false,logLevel:"silent",server:{middlewareMode:true},appType:"custom"});
try {
  const {createDemoWeatherDataset}=await server.ssrLoadModule("/src/demo/demo-weather.ts");
  const {createDemoComparisonWorkspace}=await server.ssrLoadModule("/src/demo/demo-scenario.ts");
  const {createMultiFloorDemoWorkspace}=await server.ssrLoadModule("/src/multifloor/demo.ts");
  const {parseEpw}=await server.ssrLoadModule("/src/weather/index.ts");
  const {scenarioPreset}=await server.ssrLoadModule("/src/scenario/preset.ts");
  const full=createDemoWeatherDataset(),datasets=[];
  const directory=new URL("../../../.local-validation/m11-scenario/",import.meta.url);
  await mkdir(directory,{recursive:true});
  for(const [index,partial]of [[0,false],[1,false],[2,true]]) {
    const intervals=partial?full.intervals.slice(0,24):full.intervals;
    const name=`SYNTHETIC-NOT-MEASURED-${index+1}.epw`;
    const rows=[`LOCATION,SYNTHETIC ${index+1},NOT MEASURED,TEST,GENERATED,TEST,${32+index},139,9,0`,"DESIGN CONDITIONS,0","TYPICAL/EXTREME PERIODS,0","GROUND TEMPERATURES,0","HOLIDAYS/DAYLIGHT SAVINGS,No,0,0,0","COMMENTS 1,Synthetic UI fixture NOT physical evidence","COMMENTS 2,No measured data",`DATA PERIODS,1,1,Synthetic,Sunday,1/1,${partial?"1/1":"12/31"}`];
    for(const v of intervals)rows.push([v.time.year,v.time.month,v.time.day,v.time.rawHour,60,"SYNTHETIC",0,0,0,0,0,0,0,v.radiation.globalHorizontalWhPerM2,v.radiation.directNormalWhPerM2*(.7+index*.1),v.radiation.diffuseHorizontalWhPerM2].join(","));
    const text=rows.join("\r\n")+"\r\n";
    await writeFile(new URL(name,directory),text);
    const dataset=parseEpw(text,{sourceName:name,sourceType:"epw"});datasets.push(dataset);
    console.log(JSON.stringify({name,coverage:dataset.coverage,count:dataset.intervals.length,issues:dataset.issues.length}));
  }
  const slots=[{id:"current",label:"現在の気象",dataset:full},...datasets.slice(0,2).map((dataset,i)=>({id:`weather-${i+1}`,label:`合成 ${i+1}`,dataset}))];
  for(const mode of ["single","multi"]){
    const input={mode,workspace:mode==="single"?createDemoComparisonWorkspace():createMultiFloorDemoWorkspace(),slots,referenceId:"current"};
    await writeFile(new URL(`${mode}-input.json`,directory),scenarioPreset(input,"weather.annual"));
  }
  const base=createMultiFloorDemoWorkspace().cases[0];
  const heavy={mode:"multi",referenceId:"current",slots:[...slots,{id:"weather-3",label:"合成partial",dataset:datasets[2]}],
    workspace:{baselineCaseId:"d0",cases:Array.from({length:4},(_,i)=>({...base,id:`d${i}`,name:`取消確認 ${i+1}`,floors:Array.from({length:10},(_,j)=>({...base.floors[0],id:`f${j}`,name:`${j+1}F`,intermediateFins:{depthM:.6,bottomZM:.9,topZM:3.3,layout:{mode:"pitch",pitchM:1}}}))}))}};
  await writeFile(new URL("multi-cancel-input.json",directory),scenarioPreset(heavy,"annual"));
}finally{await server.close();}

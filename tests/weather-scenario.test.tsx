import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import { createDemoComparisonWorkspace } from "../src/demo/demo-scenario";
import { createMultiFloorDemoWorkspace } from "../src/multifloor/demo";
import { runMultiFloorComparison } from "../src/multifloor/simulation";
import { floorToFacadeV1Parameters } from "../src/multifloor/parameters";
import { simulateFacade } from "../src/engine/facade-v2";
import { createWeatherIntervalTime, type WeatherDataset } from "../src/weather";
import { describeWeather, temporalFingerprint, weatherFingerprint, weatherCoverageCompatibility } from "../src/scenario/weather";
import { runScenario, scenarioInputKey, scenarioMetric, validateScenario } from "../src/scenario/study";
import { scenarioCsv } from "../src/scenario/export";
import { bindScenarioWeather, parseScenarioPreset, scenarioPreset } from "../src/scenario/preset";
import { handleScenario, type ScenarioMessage, type ScenarioRequest } from "../src/scenario/protocol";
import type { ScenarioInput } from "../src/scenario/types";
import { RunClient, type RunWorker } from "../src/app/explorer-client";
import { WeatherScenarioResults } from "../src/app/components/WeatherScenarioResults";
import { WeatherScenarioPanel } from "../src/app/components/WeatherScenarioPanel";
import { App } from "../src/app/App";
const full = createDemoWeatherDataset();
const weather: WeatherDataset = { ...full, coverage: "partial", intervals: [...full.intervals.slice(4104,4128), ...full.intervals.slice(8496,8520)] };
const changed: WeatherDataset = { ...weather, id: "different", location: { ...weather.location, latitudeDeg: 33 }, intervals: weather.intervals.map(v => ({ ...v, radiation: { ...v.radiation, directNormalWhPerM2: v.radiation.directNormalWhPerM2! * .8 } })) };
const mismatch: WeatherDataset = { ...changed, intervals: changed.intervals.slice(1) };
const slots = [{ id: "current", label: "現在", dataset: weather }, { id: "w2", label: "気象2", dataset: changed }];
const single: ScenarioInput = { mode: "single", workspace: createDemoComparisonWorkspace(), slots, referenceId: "current" };
const multi: ScenarioInput = { mode: "multi", workspace: createMultiFloorDemoWorkspace(), slots, referenceId: "current" };
const time = "2026-09-23T00:00:00.000Z";

describe("M11 weather identity / coverage", () => {
  it("is deterministic and content based, independent of names and IDs", () => {
    expect(weatherFingerprint(weather)).toBe(weatherFingerprint({ ...weather, id: "renamed", provenance: { ...weather.provenance, sourceName: "renamed.epw" } }));
    expect(weatherFingerprint(weather)).not.toBe(weatherFingerprint(changed));
    expect(weatherFingerprint(weather)).not.toBe(weatherFingerprint({ ...weather, intervals: weather.intervals.map((v,i) => i ? v : { ...v, radiation: { ...v.radiation, globalHorizontalWhPerM2: 1 } }) }));
  });
  it("compares full-year slots across differing source years, not raw filename", () => {
    const differentYear = { ...full, intervals: full.intervals.map(v => ({ ...v, time: createWeatherIntervalTime(2023,v.time.month,v.time.day,v.time.rawHour,60,60) })) };
    expect(temporalFingerprint(full)).toBe(temporalFingerprint(differentYear));
    expect(weatherFingerprint(full)).not.toBe(weatherFingerprint(differentYear));
    expect(weatherCoverageCompatibility(describeWeather(full),describeWeather(differentYear))).toBe("COMPARABLE_FULL_YEAR");
  });
  it("compares identical partial sequences and rejects changed order/minute/duration/coverage", () => {
    expect(weatherCoverageCompatibility(describeWeather(weather),describeWeather(changed))).toBe("COMPARABLE_PARTIAL");
    for (const d of [mismatch, { ...weather, intervals: [...weather.intervals].reverse() }, { ...weather, coverage: "full-year-8760" as const },
      { ...weather, intervals: weather.intervals.map((v,i) => i ? v : { ...v, time: { ...v.time, rawMinute: 15 } }) },
      { ...weather, intervalMinutes: 15 }]) {
      expect(weatherCoverageCompatibility(describeWeather(weather),describeWeather(d))).toBe("NOT_COMPARABLE");
    }
  });
});
describe("M11 definitions, immutable graphs and keys", () => {
  it.each([0,5])("rejects %s weather datasets or designs", n => {
    const ws = Array.from({length:n},(_,i)=>({...slots[0]!,id:`w${i}`,dataset:{...weather,location:{...weather.location,latitudeDeg:30+i}}}));
    expect(()=>validateScenario({...single,slots:ws})).toThrow();
    expect(()=>validateScenario({...single,workspace:{...single.workspace,cases:Array.from({length:n},(_,i)=>({...single.workspace.cases[0]!,id:`d${i}`}))}} as ScenarioInput)).toThrow();
  });
  it("accepts at most 16, with weather-major deterministic order", () => {
    const input = {...single,slots:Array.from({length:4},(_,i)=>({...slots[0]!,id:i ? `w${i}`:"current",dataset:{...weather,location:{...weather.location,latitudeDeg:30+i}}})),
      workspace:{...single.workspace,cases:Array.from({length:4},(_,i)=>({...single.workspace.cases[0]!,id:i?`d${i}`:single.workspace.baselineCaseId}))}} as ScenarioInput;
    const result=runScenario(input,time);
    expect(result.cells).toHaveLength(16);
    expect(result.cells.map(c=>[c.weatherId,c.designId])).toEqual(input.slots.flatMap(w=>input.workspace.cases.map(d=>[w.id,d.id])));
  });
  it("rejects duplicate IDs/content, missing references and unusable weather", () => {
    for(const input of [{...single,referenceId:"none"},{...single,workspace:{...single.workspace,baselineCaseId:"none"}},
      {...single,slots:[slots[0]!,slots[0]!]},{...single,slots:[slots[0]!,{...slots[1]!,dataset:weather}]},
      {...single,slots:[{...slots[0]!,dataset:{...weather,intervals:[]}}]}]) expect(()=>validateScenario(input as ScenarioInput)).toThrow();
  });
  it.each([single,multi])("owns nested inputs/results without caller mutation or freezing: $mode", input => {
    const before=JSON.stringify(input), result=runScenario(input,time);
    expect(JSON.stringify(input)).toBe(before);
    expect(Object.isFrozen(input.workspace.cases[0])).toBe(false);expect(Object.isFrozen(weather.provenance)).toBe(false);
    expect(Object.isFrozen(result.snapshot.workspace.cases[0])).toBe(true);expect(Object.isFrozen(result.cells[0])).toBe(true);
    expect(result.snapshot.workspace).not.toBe(input.workspace);
    expect(JSON.stringify(result.snapshot)).not.toContain('"intervals"');
  });
  it("changes keys for source, baseline, order, slots, labels, reference and content", () => {
    const key=scenarioInputKey(single);
    const edits=[{...single,referenceId:"w2"},{...single,slots:[...slots].reverse()}, {...single,slots:slots.slice(0,1)},
      {...single,slots:slots.map(s=>({...s,label:s.label+"!"}))}, {...single,slots:[slots[0]!,{...slots[1]!,dataset:mismatch}]},
      {...single,workspace:{...single.workspace,baselineCaseId:single.workspace.cases[1]!.id}},
      {...single,workspace:{...single.workspace,cases:[...single.workspace.cases].reverse()}}, multi];
    for(const input of edits)expect(scenarioInputKey(input as ScenarioInput)).not.toBe(key);
  });
});
describe("M11 canonical equality and deltas", () => {
  it.each([single,multi])("matches canonical $mode and exact period deltas", input => {
    const result=runScenario(input,time);
    for(const c of result.cells){
      expect(c.status).toBe("VALID");if(c.status!=="VALID")continue;
      const ds=input.slots.find(w=>w.id===c.weatherId)!.dataset;
      if(input.mode==="single")expect(c.simulation).toEqual(simulateFacade(ds,input.workspace.cases.find(d=>d.id===c.designId)!.parameters));
      else{
        const d=input.workspace.cases.find(d=>d.id===c.designId)!;
        const canonical=runMultiFloorComparison(ds,input.workspace).cases.find(r=>r.caseId===c.designId)!;
        expect(c.building).toEqual(canonical);
        expect(c.values.annual).toBe(c.floors.reduce((n,f)=>n+f.values.annual,0));
        for(const [i,f]of c.building!.floors.entries())expect(f.simulation).toEqual(simulateFacade(ds,floorToFacadeV1Parameters(d,d.floors[i]!)));
        expect(c.designDelta.status==="VALID"&&c.designDelta.values.annual).toBe(canonical.deltaFromBaseline.annual.kWh);
      }
      const baseline=result.cells.find(b=>b.designId===input.workspace.baselineCaseId&&b.weatherId===c.weatherId)!;
      const reference=result.cells.find(b=>b.designId===c.designId&&b.weatherId===input.referenceId)!;
      if(baseline.status!=="VALID"||reference.status!=="VALID")throw new Error("valid fixture");
      for(const p of ["annual","summer","winter"] as const){
        expect(c.designDelta.status==="VALID"&&c.designDelta.values[p]).toBe(c.values[p]-baseline.values[p]);
        expect(c.weatherDelta.status==="VALID"&&c.weatherDelta.values[p]).toBe(c.values[p]-reference.values[p]);
        for(const [i,f]of c.floors.entries()){
          expect(f.designDelta.status==="VALID"&&f.designDelta.values[p]).toBe(f.values[p]-baseline.floors[i]!.values[p]);
          expect(f.weatherDelta.status==="VALID"&&f.weatherDelta.values[p]).toBe(f.values[p]-reference.floors[i]!.values[p]);
        }
      }
    }
  });
  it("keeps within-weather design deltas when cross-weather is NOT_COMPARABLE", () => {
    const result=runScenario({...single,slots:[slots[0]!,{...slots[1]!,dataset:mismatch}]},time);
    const c=result.cells.at(-1)!;if(c.status!=="VALID")throw new Error("valid fixture");
    expect(c.designDelta.status).toBe("VALID");expect(c.weatherDelta.status).toBe("NOT_COMPARABLE");
    expect(scenarioMetric(c,"weather.annual").value).toBeNull();expect(scenarioMetric(c,"annual").value).not.toBeNull();
  });
  it("keeps INVALID single cells with no numerical substitution, even invalid baseline", () => {
    if(single.mode!=="single")throw new Error();
    const input={...single,workspace:{...single.workspace,cases:single.workspace.cases.map((c,i)=>i?c:{...c,parameters:{...c.parameters,opening:{...c.parameters.opening,widthM:0}}})}};
    const r=runScenario(input,time);
    expect(r.cells.map(c=>c.status)).toEqual(["INVALID","VALID","INVALID","VALID"]);
    expect(r.cells[0]).not.toHaveProperty("values");
    expect(r.cells[1]).toMatchObject({designDelta:{status:"INVALID"}});
  });
  it("reports invalid Multi floor, continues other building, matches floors by position", () => {
    if(multi.mode!=="multi")throw new Error();
    const input={...multi,workspace:{...multi.workspace,cases:multi.workspace.cases.map((c,i)=>i?c:{...c,floors:c.floors.map((f,j)=>j?f:{...f,floorHeightM:0})})}};
    const r=runScenario(input,time);expect(r.cells[0]).toMatchObject({status:"INVALID",reason:expect.stringContaining("floor-1")});expect(r.cells[1]?.status).toBe("VALID");
    const shorter={...multi,workspace:{...multi.workspace,cases:multi.workspace.cases.map((c,i)=>i?c:{...c,floors:c.floors.slice(0,1)})}};
    const c=runScenario(shorter,time).cells[1]!;if(c.status!=="VALID")throw new Error();
    expect(c.floors[0]!.designDelta.status).toBe("VALID");expect(c.floors[1]!.designDelta.status).toBe("INVALID");
  });
});
describe("M11 exports / rendering",()=>{
  it.each([single,multi])("roundtrips $mode input only, UNRESOLVED and exact binding",input=>{
    const text=scenarioPreset(input,"weather.winter"), restored=parseScenarioPreset(text);
    expect(restored.source).toEqual({mode:input.mode,workspace:input.workspace});expect(restored.slots.map(s=>s.status)).toEqual(["UNRESOLVED","UNRESOLVED"]);
    expect(bindScenarioWeather(restored.slots[0]!.weather,weather)).toBe(weather);
    expect(()=>bindScenarioWeather(restored.slots[0]!.weather,changed)).toThrow(/fingerprint/);
    for(const field of ["intervals","result","rawEpw","localPath","token","fileHandle"])expect(text).not.toContain(`"${field}"`);
  });
  it.each(["intervals","result","rawEpw","localPath","token","fileHandle"])("rejects prohibited JSON payload %s",field=>{
    const p=JSON.parse(scenarioPreset(single,"annual"));p[field]=[];expect(()=>parseScenarioPreset(JSON.stringify(p))).toThrow();
  });
  it("rejects malformed/oversized/unknown-version/fingerprint/duplicate presets",()=>{
    const p=JSON.parse(scenarioPreset(single,"annual"));
    for(const value of ["{",'あ'.repeat(90000),JSON.stringify({...p,schemaVersion:8}),JSON.stringify({...p,slots:[p.slots[0],p.slots[0]]}),JSON.stringify({...p,metric:"winner"})])expect(()=>parseScenarioPreset(value)).toThrow();
  });
  it.each([single,multi])("CSV BOM CRLF, exact rows and metadata: $mode",input=>{
    const r=runScenario(input,time), csv=scenarioCsv(r);
    expect(csv.startsWith("\uFEFF")).toBe(true);expect(csv.endsWith("\r\n")).toBe(true);
    const floorCount=input.mode==="multi"?input.workspace.cases.reduce((n,c)=>n+c.floors.length,0)*input.slots.length:0;
    expect(csv.trim().split("\r\n")).toHaveLength(1+r.cells.length+floorCount);
    expect(csv).toContain("temporalFingerprint");expect(csv).toContain("designDeltaStatus");expect(csv).toContain("weatherDeltaStatus");expect(csv).toContain("weather-scenario-v1");
  });
  it("guards formula text and leaves unavailable delta values blank",()=>{
    const r=runScenario({...single,slots:[{...slots[0]!,label:'=HYPERLINK("x")'},{...slots[1]!,dataset:mismatch}]},time),csv=scenarioCsv(r);
    expect(csv).toContain("'=HYPERLINK");expect(csv).toContain('"NOT_COMPARABLE","","",""');
  });
  it.each([single,multi])("renders accessible matrix/exact values, provenance and floors: $mode",input=>{
    const result=runScenario({...input,slots:[slots[0]!,{...slots[1]!,dataset:mismatch}]},time);
    const html=renderToStaticMarkup(<WeatherScenarioResults result={result} metric="weather.annual" selected="" onSelect={()=>{}} colors={{}}/>);
    for(const word of ["Design Δ","Weather Δ","Heatmap","NOT_COMPARABLE","読込期間合計","exact values","provenance","button"])expect(html).toContain(word);
    if(input.mode==="multi")expect(html).toContain("Floor Breakdown");
  });
  it("Single/Multi discoverability and shared panel are server renderable without Worker fallback",()=>{
    const html=renderToStaticMarkup(<App/>);expect(html.match(/気象シナリオ比較<\/h2>/g)).toHaveLength(2);
    expect(renderToStaticMarkup(<WeatherScenarioPanel source={{mode:"single",workspace:single.workspace as never}} dataset={weather} loadingWeather={false} colors={{}} onBaseline={()=>{}} onCurrentWeather={()=>{}} onImport={()=>{}}/>)).toContain("最大4気象");
  });
});
describe("M11 Worker protocol",()=>{
  const request={type:"run" as const,runId:1,input:single,executedAt:time};
  it("emits 0..N and each cell, then one complete; definition failure never completes",()=>{
    const events:ScenarioMessage[]=[];handleScenario(request,e=>events.push(e));
    expect(events.filter(e=>e.type==="progress").map(e=>e.completed)).toEqual([0,1,2,3,4]);expect(events.at(-1)?.type).toBe("complete");
    expect(events.filter(e=>e.type==="progress"&&e.cell)).toHaveLength(4);
    const errors:ScenarioMessage[]=[];handleScenario({...request,input:{...single,referenceId:"bad"}},e=>errors.push(e));expect(errors.map(e=>e.type)).toEqual(["error"]);
  });
  function fake():RunWorker<ScenarioRequest,ScenarioMessage>&{stopped:boolean}{return{onmessage:null,onerror:null,onmessageerror:null,postMessage(){},terminate(){this.stopped=true;},stopped:false};}
  it("terminates canceled/old workers, rejects old IDs and handles failure without fallback",()=>{
    const workers:ReturnType<typeof fake>[]=[], events:ScenarioMessage[]=[];
    const client=new RunClient<ScenarioRequest,ScenarioMessage>(()=>{const w=fake();workers.push(w);return w;},runId=>({type:"error",runId,message:"no fallback"}));
    const old=client.run(request,e=>events.push(e));client.cancel();expect(workers[0]!.stopped).toBe(true);
    workers[0]!.onmessage!({data:{type:"complete",runId:old,result:runScenario(single,time)}} as MessageEvent<ScenarioMessage>);expect(events).toEqual([]);
    client.run(request,e=>events.push(e));workers[1]!.onmessage!({data:{type:"progress",runId:old,completed:1,total:4}} as MessageEvent<ScenarioMessage>);expect(events).toEqual([]);
    workers[1]!.onerror!({} as ErrorEvent);expect(workers[1]!.stopped).toBe(true);expect(events).toEqual([expect.objectContaining({type:"error",message:"no fallback"})]);
  });
});

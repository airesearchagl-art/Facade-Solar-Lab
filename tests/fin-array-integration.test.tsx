import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createDemoWeatherDataset } from "../src/demo/demo-weather";
import { createFinArrayDemoWorkspace } from "../src/demo/demo-scenario";
import { createMultiFloorFinArrayDemoWorkspace } from "../src/multifloor/demo";
import { createComparisonCase, createComparisonWorkspace, duplicateComparisonCase, comparisonInputDifferences, runComparison, validateComparisonCase } from "../src/comparison";
import { createMultiFloorCase, createMultiFloorDefinition, createMultiFloorWorkspace, runMultiFloorComparison, floorToFacadeV1Parameters, duplicateMultiFloorCase, validateMultiFloorCase } from "../src/multifloor";
import { simulateFacade, calculateFacadeV2IntervalIrradiance } from "../src/engine/facade-v2";
import { simulateFacadeV1, calculateFacadeV1IntervalIrradiance } from "../src/engine/facade-v1";
import { parseFacadePreset, serializeCasePreset, serializeWorkspacePreset } from "../src/preset";
import { parseMultiFloorPreset, serializeMultiFloorCasePreset, serializeMultiFloorWorkspacePreset } from "../src/multifloor/preset";
import { createComparisonCsv } from "../src/export";
import { createMultiFloorCsv } from "../src/multifloor/csv";
import { ARRAY_CSV_HEADERS, arrayCsvValues } from "../src/export/fin-fields";
import { FinEditor } from "../src/app/components/FinEditor";
import { GeometryPreview } from "../src/app/components/GeometryPreview";
import { MultiFloorGeometryPreview } from "../src/app/components/MultiFloorGeometryPreview";
import { MultiFloorResults } from "../src/app/components/MultiFloorResults";
import { IntermediateFinSummary } from "../src/app/components/IntermediateFinEditor";

const weather = createDemoWeatherDataset(), base = createComparisonCase("a","A").parameters;
const fin = { depthM:.6,bottomZM:.9,topZM:3.3,layout:{mode:"pitch",pitchM:1.5} as const };
const item = createComparisonCase("b","=Array",{...base,intermediateFins:fin});
const floor = {...createMultiFloorDefinition("f1","1F"),intermediateFins:fin};
const building = createMultiFloorCase("b","B",[floor]);

describe("fin array canonical composition, migration and exports",()=>{
  it("zero depth array takes exact v1 route",()=>expect(simulateFacade(weather,{...base,intermediateFins:{...fin,depthM:0}})).toEqual(simulateFacadeV1(weather,base)));
  it("P>W without jamb fins takes exact v1 route (actual zero fins)",()=>expect(simulateFacade(weather,{...base,intermediateFins:{...fin,layout:{mode:"pitch",pitchM:7}}})).toEqual(simulateFacadeV1(weather,base)));
  it("array-only modifies direct, not shared diffuse/ground/unshaded radiation",()=>{
    const r={globalHorizontalWhPerM2:600,directNormalWhPerM2:800,diffuseHorizontalWhPerM2:100},s={azimuthDeg:230,elevationDeg:25};
    const a=calculateFacadeV1IntervalIrradiance(base,r,s),b=calculateFacadeV2IntervalIrradiance(item.parameters,r,s);
    for(const k of ["diffuseWithOverhangWhPerM2","diffuseWithoutOverhangWhPerM2","groundReflectedWhPerM2","totalWithoutOverhangWhPerM2"] as const)expect(b[k]).toBe(a[k]);
    expect(b.directWithOverhangWhPerM2).toBeLessThan(a.directWithOverhangWhPerM2);
  });
  it("Single and one-floor exact canonical equality",()=>{
    const p=floorToFacadeV1Parameters(building,floor),a=runComparison(weather,createComparisonWorkspace(createComparisonCase("a","A",p))).cases[0]!.simulation;
    const b=runMultiFloorComparison(weather,createMultiFloorWorkspace(building)).cases[0]!;
    expect(b.floors[0]!.simulation).toEqual(a);expect(a.modelVersion).toBe("facade-v2-weather");expect(b.total.annualKWh).toBe(a.summary.annual.withOverhangKWh);
  });
  it("three independently configured floors sum without physical cross-floor effects",()=>{
    const floors=[2,1.5,1].map((pitchM,i)=>({...floor,id:`f${i}`,name:`${i+1}F`,intermediateFins:{...fin,layout:{mode:"pitch" as const,pitchM}}}));
    const c=createMultiFloorCase("c","C",floors),r=runMultiFloorComparison(weather,createMultiFloorWorkspace(c)).cases[0]!;
    floors.forEach((f,i)=>expect(r.floors[i]!.simulation).toEqual(simulateFacade(weather,floorToFacadeV1Parameters(c,f))));
    expect(r.total.annualKWh).toBe(r.floors.reduce((sum,f)=>sum+f.simulation.summary.annual.withOverhangKWh,0));
  });
  it("cloning deep-copies layout in both modes",()=>{
    const a=duplicateComparisonCase(createComparisonWorkspace(item),item.id,"c").cases[1]!.parameters.intermediateFins!;
    expect(a).toEqual(fin);expect(a.layout).not.toBe(item.parameters.intermediateFins!.layout);
    const b=duplicateMultiFloorCase(createMultiFloorWorkspace(building),"b","c","C").cases[1]!.floors[0]!.intermediateFins!;
    expect(b).toEqual(fin);expect(b.layout).not.toBe(floor.intermediateFins.layout);
  });
  it("difference contains activation/mode/pitch/count and dimensions",()=>{
    const diff=comparisonInputDifferences(createComparisonCase("a","A"),item);
    expect(diff.map(d=>d.key)).toEqual(["intermediateFins.enabled","intermediateFins.layout.mode","intermediateFins.layout.pitchM","intermediateFins.depthM","intermediateFins.bottomZM","intermediateFins.topZM"]);
    const other=createComparisonCase("c","C",{...base,intermediateFins:{...fin,layout:{mode:"count",count:3}}});
    expect(comparisonInputDifferences(item,other).map(d=>d.key)).toEqual(["intermediateFins.layout.mode","intermediateFins.layout.pitchM","intermediateFins.layout.count"]);
  });
  it.each([{mode:"pitch",pitchM:1.5},{mode:"count",count:3}] as const)("Single and Multi v2 optional array roundtrip %j",layout=>{
    const a=createComparisonCase("b","B",{...base,intermediateFins:{...fin,layout}}),b=createMultiFloorCase("b","B",[{...floor,intermediateFins:{...fin,layout}}]);
    const s=parseFacadePreset(serializeCasePreset(a)),m=parseMultiFloorPreset(serializeMultiFloorCasePreset(b));
    if(s.kind!=="facade-solar-lab-case-preset"||m.kind!=="facade-solar-lab-multifloor-case-preset")throw new Error("kind");
    expect(s.schemaVersion).toBe(2);expect(s.parameters).toEqual(a.parameters);expect(m.case).toEqual(b);
    expect(parseFacadePreset(serializeWorkspacePreset(createComparisonWorkspace(a),"b")).schemaVersion).toBe(2);
    expect(parseMultiFloorPreset(serializeMultiFloorWorkspacePreset(createMultiFloorWorkspace(b),"b","f1")).schemaVersion).toBe(2);
  });
  it("old edge-fin v2 remains unchanged with no inferred array",()=>{
    const edge=createComparisonCase("a","A",{...base,leftFin:{depthM:.6,bottomZM:.9,topZM:3.3}});
    const raw=serializeCasePreset(edge),parsed=parseFacadePreset(raw);expect(parsed.schemaVersion).toBe(2);expect(JSON.stringify(parsed)).not.toContain("intermediateFins");
    if(parsed.kind!=="facade-solar-lab-case-preset")throw new Error("kind");expect(serializeCasePreset({...edge,parameters:parsed.parameters})).toBe(raw);
  });
  it("whitelist strips positions/results/private fields from writer AND reader",()=>{
    const raw=JSON.parse(serializeCasePreset(item));raw.parameters.intermediateFins.positions=[1];raw.parameters.intermediateFins.layout.private="secret";raw.parameters.intermediateFins.weather="secret";
    expect(JSON.stringify(parseFacadePreset(JSON.stringify(raw)))).not.toMatch(/positions|private|secret|weather/);
    const unsafe={...item,parameters:{...item.parameters,intermediateFins:{...fin,positions:[1],layout:{...fin.layout,private:"secret"}}}};
    expect(serializeCasePreset(unsafe)).not.toMatch(/positions|private|secret/);
  });
  it.each([null,{mode:"pitch",pitchM:0},{mode:"pitch",pitchM:.001},{mode:"count",count:129},{mode:"count",count:1.1},{mode:"count",count:"3"},{mode:"other"}])("rejects malformed/over-limit layout in both readers: %j",layout=>{
    const s=JSON.parse(serializeCasePreset(item)),m=JSON.parse(serializeMultiFloorCasePreset(building));s.parameters.intermediateFins.layout=layout;m.case.floors[0].intermediateFins.layout=layout;
    expect(()=>parseFacadePreset(JSON.stringify(s))).toThrow();expect(()=>parseMultiFloorPreset(JSON.stringify(m))).toThrow();
  });
  it("UI validation flags layout limit with no truncation",()=>{
    const invalid={...fin,layout:{mode:"pitch" as const,pitchM:.001}};
    expect(validateComparisonCase({...item,parameters:{...base,intermediateFins:invalid}}).map(i=>i.path)).toContain("intermediateFins.layout");
    expect(validateMultiFloorCase({...building,floors:[{...floor,intermediateFins:invalid}]}).map(i=>i.path)).toContain("intermediateFins.layout");
  });
  it("array columns append after all old columns, with mode blanks and derived data",()=>{
    expect(arrayCsvValues({intermediateFins:fin},6)).toEqual(["はい","ピッチ指定",1.5,"",4,1.5,.75,.6,.9,3.3]);
    expect(arrayCsvValues({intermediateFins:{...fin,layout:{mode:"count",count:3}}},6)).toEqual(["はい","枚数指定","",3,3,1.5,1.5,.6,.9,3.3]);
    expect(arrayCsvValues({},6)).toEqual(["いいえ",...Array(9).fill("")]);
    for(const csv of [createComparisonCsv(runComparison(weather,createComparisonWorkspace(item)),weather),createMultiFloorCsv(runMultiFloorComparison(weather,createMultiFloorWorkspace({...building,name:"=1+1"})),weather)]) {
      const lines=csv.trim().split("\r\n"),headers=lines[0]!.split('","').map(x=>x.replace(/^\uFEFF?"|"$/g,""));
      expect(headers.slice(-10)).toEqual(ARRAY_CSV_HEADERS);expect(csv).toContain("'=");expect(new Set(lines.map(l=>l.split('","').length)).size).toBe(1);
    }
  });
  it("dedicated Demo has 3 comparable pitches without altering old Demo",()=>{
    const s=createFinArrayDemoWorkspace(),m=createMultiFloorFinArrayDemoWorkspace();expect(s.cases).toHaveLength(3);expect(m.cases).toHaveLength(3);
    expect(s.cases.map(c=>c.parameters.intermediateFins?.layout)).toEqual([undefined,{mode:"pitch",pitchM:2},{mode:"pitch",pitchM:1}]);
    const r=runComparison(weather,s);expect(r.cases[1]!.simulation.summary.annual.withOverhangKWh).toBeLessThan(r.cases[0]!.simulation.summary.annual.withOverhangKWh);
    expect(r.cases[2]!.simulation.summary.annual.withOverhangKWh).toBeLessThan(r.cases[1]!.simulation.summary.annual.withOverhangKWh);
  });
});

describe("array rendering / report input contract",()=>{
  it("pitch editor shows all required inputs and canonical derivation",()=>{
    const html=renderToStaticMarkup(<FinEditor fins={{intermediateFins:fin}} widthM={6} sillZM={.9} headZM={3.3} inputPrefix="a" issues={new Map()} onChange={()=>{}}/>);
    for(const text of ["中央割付","ピッチ指定","枚数指定","実配置: 4枚","中心ピッチ: 1.50 m","左右端部余白: 0.75 m","中間フィン 出"])expect(html).toContain(text);
    expect(html).toContain('type="number"');expect(html).not.toMatch(/clear spacing|NaN|Infinity/);
  });
  it("count summary is also printable and omits redundant persisted coordinates",()=>expect(renderToStaticMarkup(<IntermediateFinSummary fin={{...fin,layout:{mode:"count",count:3}}} widthM={6}/>)).toContain("枚数指定 3枚"));
  it("6m/P1.5 renders four actual elevation lines and one side projection",()=>{
    const html=renderToStaticMarkup(<GeometryPreview comparisonCase={item} dataset={null}/>);
    expect(html.match(/data-fin="intermediate"/g)).toHaveLength(4);expect(html.match(/class="fin-projection intermediateFin"/g)).toHaveLength(1);expect(html).toContain("中間フィン 4枚");
  });
  it("per-floor layout renders 3/4/6 lines and clips display only",()=>{
    const b=createMultiFloorCase("a","A",[2,1.5,1].map((pitchM,i)=>({...floor,id:`f${i}`,name:`${i+1}F`,intermediateFins:{...fin,topZM:20,layout:{mode:"pitch" as const,pitchM}}})));
    const before=JSON.stringify(b),html=renderToStaticMarkup(<MultiFloorGeometryPreview buildingCase={b} dataset={null}/>);
    expect(html.match(/data-fin="intermediate"/g)).toHaveLength(13);expect(JSON.stringify(b)).toBe(before);
    expect(html).toContain("clipは表示のみ");expect(html).not.toMatch(/NaN|Infinity/);
  });
  it("invalid pitch produces error instead of thousands of SVG lines",()=>{
    const html=renderToStaticMarkup(<GeometryPreview comparisonCase={{...item,parameters:{...base,intermediateFins:{...fin,layout:{mode:"pitch",pitchM:.001}}}}} dataset={null}/>);
    expect(html).toContain("形状入力を修正");expect(html).not.toContain('data-fin="intermediate"');
  });
  it("Multi print includes per-floor array inputs and stacked geometry",()=>{
    const result=runMultiFloorComparison(weather,createMultiFloorWorkspace(building));
    const html=renderToStaticMarkup(<MultiFloorResults result={result} dataset={weather} selectedCaseId="b" selectedFloorId="f1" onSelectCase={()=>{}} onSelectFloor={()=>{}}/>);
    for(const text of ["階別の遮蔽入力","端部・中間フィン","実配置: 4枚","ピッチ指定 1.5 m"])expect(html).toContain(text);
    expect(html).not.toMatch(/NaN|Infinity/);
  });
});

import { describe, expect, it } from "vitest";
import checkpoint from "../scripts/validation/m7-shading/edge-checkpoint.json";
import { edgeCheckpoint } from "../scripts/validation/m7-shading/edge-checkpoint";
import { calculateDirectShadowV2, deriveFinLayout, MAX_INTERMEDIATE_FINS, sweepShadowUnionArea, type DirectShadowV2Input, type FinLayout } from "../src/geometry/facade-v2";
import { calculateDirectShadow, type Point2 } from "../src/geometry";
const rect = (l: number, r: number, b = 0, t = 2): Point2[] => [{xM:l,zM:b},{xM:r,zM:b},{xM:r,zM:t},{xM:l,zM:t}];
const fin = { depthM: .5, bottomZM: 0, topZM: 2, layout: { mode: "pitch", pitchM: 1.5 } as const };
const input: DirectShadowV2Input = { facadeAzimuthDegFromNorth:180, solarAzimuthDegFromNorth:225, solarElevationDeg:Math.atan(Math.SQRT1_2)*180/Math.PI, opening:{centerXM:0,widthM:6,sillZM:0,headZM:2}, intermediateFins:fin };
const overhang = { depthM:.5,elevationZM:2,leftExtensionM:2,rightExtensionM:2 };

describe("M7 array: fixed checkpoint and canonical centred layout", () => {
  it("90 edge shadows + three annual runs exactly retain the pre-array checkpoint", async () => {
    expect(checkpoint.checkpoint).toBe("2ccbcc89cfe475df4df5a5ec42f0c899b250deaa");
    const bytes = new TextEncoder().encode(JSON.stringify(edgeCheckpoint(), (key,value) => key === "directShadingModel" ? undefined : value));
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(x=>x.toString(16).padStart(2,"0")).join("");
    expect(digest).toBe(checkpoint.digest);
  });
  it("no fins preserves full v1 identity", () => { const p={...input,intermediateFins:undefined}; const {surfaceShadows:_,...actual}=calculateDirectShadowV2(p); expect(actual).toEqual(calculateDirectShadow(p)); });
  it.each([
    [1.5, [0.75,2.25,3.75,5.25], .75], [2, [1,3,5], 1], [6,[3],3], [7,[],null],
  ] as const)("6m pitch %s: strict interior", (pitchM, positions, edgeMarginM) => {
    const d=deriveFinLayout(6,{mode:"pitch",pitchM}); expect(d.positionsFromLeftM).toEqual(positions); expect(d.count).toBe(positions.length); expect(d.edgeMarginM).toBe(edgeMarginM);
  });
  it("count3 gives 1.5/3/4.5; pitch1.5; margin1.5",()=>expect(deriveFinLayout(6,{mode:"count",count:3})).toEqual({count:3,pitchM:1.5,edgeMarginM:1.5,positionsFromLeftM:[1.5,3,4.5]}));
  it("128 is accepted without truncation",()=>expect(deriveFinLayout(12,{mode:"count",count:MAX_INTERMEDIATE_FINS}).count).toBe(128));
  it.each([0,-1,NaN,Infinity,Number.MIN_VALUE])( "rejects invalid/unbounded pitch %s", pitchM=>expect(()=>deriveFinLayout(6,{mode:"pitch",pitchM})).toThrow(RangeError));
  it.each([0,-1,1.5,NaN,Infinity,129,Number.MAX_SAFE_INTEGER])("rejects invalid count %s", count=>expect(()=>deriveFinLayout(6,{mode:"count",count})).toThrow(RangeError));
  it("pitch-derived count overflow is error",()=>expect(()=>deriveFinLayout(6,{mode:"pitch",pitchM:.001})).toThrow(/128/));
  it("unresolved interior position is rejected",()=>expect(()=>deriveFinLayout(1e-12,{mode:"count",count:1})).toThrow(/解決/));
  it("invalid mode is rejected",()=>expect(()=>deriveFinLayout(6,{mode:"other"} as unknown as FinLayout)).toThrow());
});

describe("analytic general union: vertex and crossing x slabs, no raster",()=>{
  it("four disjoint strips: area8",()=>expect(sweepShadowUnionArea([rect(0,1),rect(2,3),rect(4,5),rect(6,7)])).toBe(8));
  it("four+ overlaps count once: area12",()=>expect(sweepShadowUnionArea(Array.from({length:5},(_,i)=>rect(i,i+2)))).toBe(12));
  it("128 coincident polygons count once",()=>expect(sweepShadowUnionArea(Array.from({length:128},()=>rect(0,2)))).toBe(4));
  it("edge contact creates no extra area",()=>expect(sweepShadowUnionArea([rect(0,1),rect(1,2),rect(2,3),rect(3,4)])).toBe(8));
  it("non-vertex edge crossing splits the slab (2+2-1=3)",()=>{
    const a=[{xM:0,zM:0},{xM:2,zM:0},{xM:2,zM:2}], b=[{xM:0,zM:2},{xM:2,zM:0},{xM:2,zM:2}];
    expect(sweepShadowUnionArea([a,b,a,b])).toBe(3);
    expect(sweepShadowUnionArea([[...b].reverse(),a,b,[...a].reverse()])).toBe(3);
  });
  it("separated z intervals are unioned, not the overall envelope",()=>expect(sweepShadowUnionArea([rect(0,2,0,1),rect(0,2,2,3),rect(0,2,4,5),rect(0,2,6,7)])).toBe(8));
  it.each([1e6,1e9,1e12])("large translated coordinates %s retain area",d=>expect(sweepShadowUnionArea(Array.from({length:5},(_,i)=>rect(i+d,i+2+d,d,d+2)))).toBe(12));
  it("finite validation rejects NaN/Infinity",()=>expect(()=>sweepShadowUnionArea([[{xM:Infinity,zM:0}]])).toThrow(RangeError));
  it("rejects concavity",()=>expect(()=>sweepShadowUnionArea([[{xM:0,zM:0},{xM:2,zM:0},{xM:1,zM:1},{xM:2,zM:2},{xM:0,zM:2}]])).toThrow(/convex/));
  it("empty and degenerate polygons have zero area",()=>expect(sweepShadowUnionArea([[],[{xM:0,zM:0},{xM:1,zM:1}]])).toBe(0));
  it("small but real slab is not erased by a metre epsilon",()=>expect(sweepShadowUnionArea([rect(0,1e-8,0,1e6)])).toBeCloseTo(.01,12));
});

describe("array direct geometry analytical areas",()=>{
  // sx/sy=-1, sz/sy=1; each half-metre strip integral(2-t,0..0.5)=0.875.
  it("4 fins: sum of four disjoint trapezoids =3.5",()=>expect(calculateDirectShadowV2(input).shadedAreaM2).toBeCloseTo(3.5,12));
  it("overhang plus4 fins: 3+3.5-4*0.125=6",()=>expect(calculateDirectShadowV2({...input,overhang}).shadedAreaM2).toBeCloseTo(6,12));
  it("overhang + jambs + array: 6+0.875-0.125=6.75",()=>expect(calculateDirectShadowV2({...input,overhang,leftFin:fin,rightFin:fin}).shadedAreaM2).toBeCloseTo(6.75,12));
  it("mirror of centred array",()=>expect(calculateDirectShadowV2({...input,overhang,solarAzimuthDegFromNorth:135}).shadedAreaM2).toBeCloseTo(calculateDirectShadowV2({...input,overhang}).shadedAreaM2,12));
  it("deep overlapping fins + left jamb completely shade",()=>expect(calculateDirectShadowV2({...input,leftFin:{...fin,depthM:10,topZM:20},intermediateFins:{...fin,depthM:10,topZM:20}}).directShadedFraction).toBe(1));
  it.each([90,270,270-1e-10])("grazing gate %s",solarAzimuthDegFromNorth=>expect(calculateDirectShadowV2({...input,solarAzimuthDegFromNorth}).directShadedFraction).toBe(0));
  it("near grazing is finite and bounded",()=>{const x=calculateDirectShadowV2({...input,solarAzimuthDegFromNorth:269.9999});expect(x.directShadedFraction).toBeGreaterThanOrEqual(0);expect(x.directShadedFraction).toBeLessThanOrEqual(1);});
  it.each([1e6,1e9,1e12])("array uses opening local positions at datum%s",d=>expect(calculateDirectShadowV2({...input,opening:{...input.opening,centerXM:d,sillZM:d,headZM:d+2},intermediateFins:{...fin,bottomZM:d,topZM:d+2}}).shadedAreaM2).toBeCloseTo(3.5,12));
  it("P>W generates zero shadows, not jamb fins",()=>expect(calculateDirectShadowV2({...input,intermediateFins:{...fin,layout:{mode:"pitch",pitchM:7}}}).shadedAreaM2).toBe(0));
  it("invalid layout rejected even at night",()=>expect(()=>calculateDirectShadowV2({...input,solarElevationDeg:-1,intermediateFins:{...fin,layout:{mode:"count",count:129}}})).toThrow());
});

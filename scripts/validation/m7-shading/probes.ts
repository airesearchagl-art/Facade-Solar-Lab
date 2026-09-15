import { independentCase, syntheticYear } from "../m5-completion/fixtures";
import { runMultiFloorComparison, type MultiFloorCase } from "../../../src/multifloor";

export function workload(floors: number, count: number, fins: boolean) {
  const dataset = syntheticYear(2025, 60);
  const cases: MultiFloorCase[] = Array.from({ length: count }, (_, i) => {
    const item = independentCase(floors, i);
    return { ...item, floors: item.floors.map((floor) => ({
      ...floor,
      // Same overhang on both benchmark arms, including floors absent in M5 fixture.
      overhang: floor.overhang ?? { depthM: 1, elevationM: 3.2, leftExtensionM: 0.2, rightExtensionM: 0.7 },
      ...(fins ? {
        leftFin: { depthM: 0.8, bottomZM: 0.6, topZM: 3.2 },
        rightFin: { depthM: 1.2, bottomZM: 0.6, topZM: 3.2 },
      } : {}),
    })) };
  });
  return { intervals: dataset.intervals.length, run: () => runMultiFloorComparison(dataset, { cases, baselineCaseId: cases[0]!.id }) };
}

export function arrayWorkload(floors: number, count: number, arm: "none" | "jamb" | "pitch1.5" | "pitch0.6" | "dense40") {
  const dataset = syntheticYear(2025, 60);
  const cases = Array.from({length:count},(_,i)=>{
    const c=independentCase(floors,i);
    return {...c, floors:c.floors.map(f=>({...f,
      opening:{...f.opening,widthM:arm==="dense40"?12:6,heightM:2.4,sillHeightM:.9},
      overhang:{depthM:.8,elevationM:3.6,leftExtensionM:.5,rightExtensionM:.5},
      ...(arm==="jamb"?{leftFin:{depthM:.6,bottomZM:.9,topZM:3.3},rightFin:{depthM:.6,bottomZM:.9,topZM:3.3}}:{}),
      ...(["pitch1.5","pitch0.6","dense40"].includes(arm)?{intermediateFins:{depthM:.6,bottomZM:.9,topZM:3.3,layout:{mode:"pitch" as const,pitchM:arm==="pitch1.5"?1.5:arm==="pitch0.6"?.6:.3}}}:{}),
    }))};
  });
  return {intervals:dataset.intervals.length,run:()=>runMultiFloorComparison(dataset,{cases,baselineCaseId:cases[0]!.id})};
}

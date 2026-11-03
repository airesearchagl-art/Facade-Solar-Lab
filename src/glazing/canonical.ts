import { METRICS, type AssemblySnapshot, type FourMetricBasis, type G1UserEntry, type UserSource, type Source } from './types';
export const SOURCE_KEYS = ['sourceRef','manufacturer','originalSourceUrl','originalTable','rowIdentifier','rowNumber','rowDescriptor','sourceEdition','sourceRevision','manufacturerProductRevision','effectiveDate','retrievedAt','retrievalDateBasis','accessStatus','verificationStatus','evidenceReference'] as const;
export const ASSEMBLY_KEYS = ['sourceNotation','nominalOverallThicknessMm','paneThicknessesMm','cavityThicknessMm','sourceGasLabel','gasFillRatio','outsideToInsideConfirmed','coatingSurface','sourcePaneCodes'] as const;
export function validString(s: string): void {
  if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(s)) throw Error('INVALID_UNICODE');
}
export function normalize(value: unknown): unknown {
  if (typeof value === 'string') { validString(value); return value.replace(/\r\n?/g,'\n').normalize('NFC'); }
  if (typeof value === 'number') { if (!Number.isFinite(value) || Object.is(value,-0)) throw Error('INVALID_NUMBER'); return value; }
  if (Array.isArray(value)) return value.map(normalize);
  if (value === null || typeof value === 'boolean') return value;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,normalize(v)]));
  throw Error('INVALID_VALUE');
}
export function canonical(value: unknown): string { return JSON.stringify(normalize(value)); }
export function utf8(s: string): Uint8Array {
  validString(s); const out: number[]=[];
  for (const ch of s) { const n=ch.codePointAt(0)!;
    if(n<128) out.push(n); else if(n<2048) out.push(192|(n>>6),128|(n&63));
    else if(n<65536) out.push(224|(n>>12),128|((n>>6)&63),128|(n&63));
    else out.push(240|(n>>18),128|((n>>12)&63),128|((n>>6)&63),128|(n&63));
  } return new Uint8Array(out);
}
export function metricTuples(metrics: FourMetricBasis<Source | UserSource>): unknown[] {
  return METRICS.map(k=>{const m=metrics[k];return [k,m.value,m.unit,m.evaluationScope,m.incidenceSide,m.incidenceAngleDeg,m.calculationOrTestStandard,
    m.boundaryConditions===null?null:[m.boundaryConditions.identity,[...m.boundaryConditions.parameters].sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0).map(p=>[p.name,p.value,p.unit])],
    m.evidenceRef,m.verificationStatus,SOURCE_KEYS.map(key=>m.resolvedSource[key])];});
}
export function assemblyTuple(a: AssemblySnapshot): unknown[] { return ['glz-assembly-v1',...ASSEMBLY_KEYS.map(k=>a[k])]; }
export function userTuple(e: G1UserEntry): unknown[] { return ['glz-user-entry-v1',e.userRevision,metricTuples(e.metrics),e.assemblyDescription,e.assembly===null?null:assemblyTuple(e.assembly)]; }
export function owned<T>(v:T):T { if(Array.isArray(v)) return v.map(owned) as T; if(v && typeof v==='object') return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,owned(x)])) as T; return v; }
export function freeze<T>(v:T):T { if(v && typeof v==='object') { Object.values(v).forEach(freeze);Object.freeze(v); } return v; }

import { METRICS, type Workspace, type FourMetricBasis, type Source, type UserSource, type AssemblySnapshot, type Entry, type CatalogSelection } from './types';
import { SOURCE_KEYS, ASSEMBLY_KEYS, validString } from './canonical';
export function check(ok: unknown, reason: string): asserts ok { if(!ok) throw Error(reason); }
export function object(v:unknown, keys: readonly string[], optional: readonly string[]=[]): asserts v is Record<string,unknown> {
  check(v!==null && typeof v==='object' && !Array.isArray(v),'OBJECT_REQUIRED');
  check(Object.getPrototypeOf(v)===Object.prototype || Object.getPrototypeOf(v)===null,'INVALID_PROTOTYPE');
  check(keys.every(k=>Object.hasOwn(v,k)) && Object.keys(v).every(k=>keys.includes(k)||optional.includes(k)),'SCHEMA_KEYS');
}
export function text(v: unknown, nullable=false, max=Infinity): asserts v is string | null {
  if(nullable && v===null) return; check(typeof v==='string' && v.length>0 && v.length<=max,'STRING_REQUIRED'); validString(v);
  check(!/(?:(?:^|\s)[a-z]:[\\/]|\\\\[^\s]+|file:\/\/|\/(?:Users|home|tmp)\/|(?:password|credential|access[_-]?token|api[_-]?key|secret)\s*[:=]|Bearer\s+\S+)/i.test(v),'PRIVATE_PATH_OR_CREDENTIAL');
}
export function number(v:unknown,min:number,max:number,nullable=false,exclusive=false):void {
  if(nullable&&v===null)return;check(typeof v==='number'&&Number.isFinite(v)&&!Object.is(v,-0)&&(exclusive?v>min:v>=min)&&v<=max,'NUMBER_RANGE');
}
export function iso(v:unknown,nullable=false):void {
  if(v===null&&nullable)return;text(v);check(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v),'ISO_DATE');
  const [y,m,d]=(v as string).split('-').map(Number);const days=[31,((y!%4===0&&y!%100!==0)||y!%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];
  check(m!>=1&&m!<=12&&d!>=1&&d!<=days[m!-1]!,'ISO_DATE');
}
const sourceUrlControl = /[\u0000-\u001f\u007f]/;
const credentialKey = /token|key|secret|password|auth|signature|credential/i;
const encodedAsciiByte = /%[0-7][0-9a-f]/gi;

function inspectQueryKey(rawKey: string): void {
  // The whole URL has already passed strict escape and UTF-8 validation.
  let key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
  for (let depth = 1; ; depth++) {
    check(!sourceUrlControl.test(key), 'URL_CONTROL');
    check(!credentialKey.test(key), 'URL_CREDENTIAL');
    if (key.search(encodedAsciiByte) === -1) return;
    check(depth < 8, 'URL_ENCODING_DEPTH');
    // Only ASCII escapes can reveal a forbidden word, control, or another escape.
    // Leave non-ASCII octets in place and inspect ASCII even immediately beside them.
    key = key.replace(encodedAsciiByte, escape => String.fromCharCode(parseInt(escape.slice(1), 16)));
  }
}

export function url(v: unknown, nullable = false): void {
  if (nullable && v === null) return;
  text(v);
  check(typeof v === 'string' && /^https?:\/\/[^\s/?#@]+(?:[/?#][^\s]*)?$/i.test(v), 'SOURCE_HTTP_URL');
  check(!/[?&#](?:[^=&]*(?:token|key|secret|password|auth|signature|credential)[^=&]*)=/i.test(v), 'URL_CREDENTIAL');

  let decoded: string;
  try {
    decoded = decodeURIComponent(v);
  } catch {
    throw Error('URL_ESCAPE');
  }
  check(!sourceUrlControl.test(decoded), 'URL_CONTROL');

  // Split on original delimiters so an encoded '&', '=' or '#' stays in its component.
  const query = v.indexOf('?');
  const fragment = v.indexOf('#');
  if (query < 0 || (fragment >= 0 && fragment < query)) return;
  for (const field of v.slice(query + 1, fragment < 0 ? undefined : fragment).split('&')) {
    inspectQueryKey(field.split('=', 1)[0]!);
  }
}
export function source(v:unknown,user=false):void {
  object(v,SOURCE_KEYS);
  for(const k of SOURCE_KEYS) {
    if(k==='originalSourceUrl')url(v[k],user);
    else if(k==='retrievedAt')iso(v[k],user);
    else if(k==='effectiveDate')iso(v[k],true);
    else text(v[k],['rowNumber','rowDescriptor','sourceEdition','sourceRevision','manufacturerProductRevision'].includes(k));
  }
  check((user?['UNVERIFIED']:['DIRECT_TABLE_CHECKED','SOURCE_RECHECK_PENDING','UNVERIFIED']).includes(v.verificationStatus as string),'VERIFICATION_STATUS');
}
export function metrics(v:unknown,user=false): asserts v is FourMetricBasis<Source | UserSource> {
  object(v,METRICS);
  for(const k of METRICS) {
    const m=v[k];object(m,['value','unit','evaluationScope','incidenceSide','incidenceAngleDeg','calculationOrTestStandard','boundaryConditions','evidenceRef','verificationStatus','resolvedSource']);
    number(m.value,0,k==='ugWm2K'?Infinity:1,true,k==='ugWm2K');check(m.unit===(k==='ugWm2K'?'W/m2K':'fraction'),'METRIC_UNIT');
    text(m.evaluationScope);text(m.evidenceRef);text(m.calculationOrTestStandard,true);
    check(['EXTERIOR','INTERIOR','UNKNOWN','NOT_APPLICABLE'].includes(m.incidenceSide as string),'INCIDENCE_SIDE');
    number(m.incidenceAngleDeg,0,90,true);
    if(k==='ugWm2K') {check(m.incidenceSide==='NOT_APPLICABLE'&&m.incidenceAngleDeg===null,'UG_INCIDENCE');check(!/WHOLE[_ -]?WINDOW|\bUw\b/i.test((m.evaluationScope as string).replace('NOT_WHOLE_WINDOW','GLAZING')),'UG_NOT_UW');}
    source(m.resolvedSource,user);check((user?['UNVERIFIED']:['DIRECT_TABLE_CHECKED','SOURCE_RECHECK_PENDING','UNVERIFIED']).includes(m.verificationStatus as string),'VERIFICATION_STATUS');
    const b=m.boundaryConditions;if(b!==null){object(b,['identity','parameters']);text(b.identity);check(Array.isArray(b.parameters),'BOUNDARY_PARAMETERS');const names=new Set<string>();
      for(const p of b.parameters){object(p,['name','value','unit']);text(p.name);check(/^[A-Za-z][A-Za-z0-9_.-]*$/.test(p.name as string)&&!names.has(p.name as string),'BOUNDARY_NAME');names.add(p.name as string);text(p.unit,true);
        if(typeof p.value==='number')number(p.value,-Infinity,Infinity);else if(typeof p.value==='string')text(p.value);else check(p.value===null||typeof p.value==='boolean','BOUNDARY_VALUE');}}
  }
}
export function assembly(v:unknown): asserts v is AssemblySnapshot {
  object(v,ASSEMBLY_KEYS);text(v.sourceNotation);text(v.sourceGasLabel);text(v.coatingSurface,true);
  number(v.nominalOverallThicknessMm,0,Infinity,false,true);number(v.cavityThicknessMm,0,Infinity,false,true);
  check(Array.isArray(v.paneThicknessesMm)&&v.paneThicknessesMm.length>0,'PANE_THICKNESS');v.paneThicknessesMm.forEach(x=>number(x,0,Infinity,false,true));
  number(v.gasFillRatio,0,1,true);check(typeof v.outsideToInsideConfirmed==='boolean','ASSEMBLY_ORDER');
  check(v.sourcePaneCodes===null||Array.isArray(v.sourcePaneCodes),'PANE_CODES');if(Array.isArray(v.sourcePaneCodes))v.sourcePaneCodes.forEach(x=>text(x));
}
export function digestFormat(v:unknown,prefix:string):void { check(typeof v==='string'&&new RegExp('^'+prefix+':sha256:[0-9a-f]{64}$').test(v),'DIGEST_FORMAT'); }
export function selection(v:unknown): asserts v is CatalogSelection {
  object(v,['kind','recordId','recordRevision','normalizedContentDigest','savedEtaShgc','metricBasisVersion','metricBasisDigest','savedMetricBasis','savedAssemblyIdentity','savedAssembly','resolutionState']);
  check(v.kind==='catalog_record','CATALOG_KIND');text(v.recordId,false,128);text(v.recordRevision);check(/^sha256:[0-9a-f]{64}$/.test(v.normalizedContentDigest as string),'LEGACY_DIGEST');
  number(v.savedEtaShgc,0,1);check(v.metricBasisVersion==='glz-metric-basis-v1','BASIS_VERSION');digestFormat(v.metricBasisDigest,'glz-metric-basis-v1');digestFormat(v.savedAssemblyIdentity,'glz-assembly-v1');
  metrics(v.savedMetricBasis);assembly(v.savedAssembly);check(v.savedMetricBasis.etaShgc.value===v.savedEtaShgc,'ETA_CONFLICT');check(['RESOLVED','UNRESOLVED_CATALOG'].includes(v.resolutionState as string),'RESOLUTION_STATE');
}
export function entry(v:unknown): asserts v is Entry {
  check(v!==null&&typeof v==='object','ENTRY_REQUIRED');const origin=(v as Record<string,unknown>).origin;
  if(origin==='user_entry'){
    object(v,['id','name','origin','userRevision','metrics','assemblyDescription','assembly','entryContentDigest']);
    check(typeof v.userRevision==='string'&&/^U[1-9][0-9]*$/.test(v.userRevision)&&Number.isSafeInteger(Number(v.userRevision.slice(1))),'USER_REVISION');
    metrics(v.metrics,true);text(v.assemblyDescription,true);if(v.assembly!==null)assembly(v.assembly);digestFormat(v.entryContentDigest,'glz-user-entry-v1');
    for(const k of METRICS)check(v.metrics[k].evidenceRef===`${v.metrics[k].resolvedSource.sourceRef}:${k}`,'USER_EVIDENCE_REF');
  }else{object(v,['id','name','origin','selection']);check(origin==='local_record','ENTRY_ORIGIN');selection(v.selection);}
  text(v.id,false,128);text(v.name,false,120);
}
export function workspace(v:unknown): asserts v is Workspace {
  object(v,['entries','selectedEntryId']);check(Array.isArray(v.entries)&&v.entries.length>=1&&v.entries.length<=4,'WORKSPACE_COUNT');v.entries.forEach(entry);
  const ids=v.entries.map(e=>(e as Entry).id);check(new Set(ids).size===ids.length,'DUPLICATE_ID');check(ids.includes(v.selectedEntryId as string),'SELECTED_ID');
}

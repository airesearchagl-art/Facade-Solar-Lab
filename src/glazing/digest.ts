import type { HashPort, FourMetricBasis, AssemblySnapshot, G1UserEntry, LocalRecord, Entry } from './types';
import { utf8, canonical, metricTuples, assemblyTuple, userTuple } from './canonical';
import { check, metrics, assembly, entry } from './validation';
export async function sha(value:string,port:HashPort):Promise<string>{const out=await port(utf8(value));check(out instanceof Uint8Array&&out.length===32,'SHA256_PORT');return Array.from(out,b=>b.toString(16).padStart(2,'0')).join('');}
export async function basisDigest(m:FourMetricBasis,port:HashPort):Promise<string>{metrics(m);return 'glz-metric-basis-v1:sha256:'+await sha(canonical(['glz-metric-basis-v1',metricTuples(m)]),port);}
export async function assemblyIdentity(a:AssemblySnapshot,port:HashPort):Promise<string>{assembly(a);return 'glz-assembly-v1:sha256:'+await sha(canonical(assemblyTuple(a)),port);}
export async function userDigest(e:G1UserEntry,port:HashPort):Promise<string>{entry({...e,entryContentDigest:'glz-user-entry-v1:sha256:'+'0'.repeat(64)});return 'glz-user-entry-v1:sha256:'+await sha(canonical(userTuple(e)),port);}
export async function legacyDigest(r:LocalRecord,port:HashPort):Promise<string>{return 'sha256:'+await sha(JSON.stringify([r.recordId,r.manufacturer,r.productName,r.assembly.sourceNotation,r.assembly.nominalOverallThicknessMm,...['etaShgc','ugWm2K','visibleTransmittance','visibleReflectance'].map(k=>r.metrics[k as keyof typeof r.metrics].value)]),port);}
export async function verifyEntry(e:Entry,port:HashPort):Promise<void>{entry(e);if(e.origin==='user_entry')check(e.entryContentDigest===await userDigest(e,port),'USER_DIGEST_MISMATCH');else{
  check(e.selection.metricBasisDigest===await basisDigest(e.selection.savedMetricBasis,port),'BASIS_DIGEST_MISMATCH');check(e.selection.savedAssemblyIdentity===await assemblyIdentity(e.selection.savedAssembly,port),'ASSEMBLY_DIGEST_MISMATCH');}}

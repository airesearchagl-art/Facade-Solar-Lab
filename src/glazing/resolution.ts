import { METRICS, type RecordInput, type CatalogSelection, type HashPort } from './types';
import { object, text, iso, check, metrics, assembly, source, selection } from './validation';
import { canonical, owned, metricTuples, assemblyTuple, SOURCE_KEYS } from './canonical';
import { basisDigest, assemblyIdentity, legacyDigest } from './digest';
const RECORD_KEYS=['recordId','legacyResearchId','recordRevision','manufacturerProductRevision','retrievedAt','normalizedContentDigest','manufacturer','productName','productAbbreviation','sourceEdition','sourceRevision','publicationPermissionStatus','allowPublicBundle','correctionOf','supersededBy','availabilityStatus','assembly','rowEvidence','metrics','metricBasisVersion','metricBasisDigest','assemblyIdentity'];
export async function validateRecord(input:unknown,port:HashPort):Promise<RecordInput>{
  object(input,['kind','schemaVersion','record','sourceRegistry']);check(input.kind==='facade-solar-lab-glazing-record-input'&&input.schemaVersion===1,'KIND_VERSION');
  const r=input.record;object(r,RECORD_KEYS);
  for(const k of ['recordId','recordRevision','manufacturer','productName','publicationPermissionStatus','availabilityStatus'])text(r[k]);text(r.recordId,false,128);
  for(const k of ['legacyResearchId','manufacturerProductRevision','productAbbreviation','sourceEdition','sourceRevision','correctionOf','supersededBy'])text(r[k],true);
  iso(r.retrievedAt);check(r.allowPublicBundle===false,'PUBLIC_BUNDLE_BLOCKED');metrics(r.metrics);assembly(r.assembly);check(r.metrics.etaShgc.value!==null,'CATALOG_ETA_REQUIRED');
  check(r.metricBasisVersion==='glz-metric-basis-v1','BASIS_VERSION');object(r.rowEvidence,['sourceRef','rowIdentifier','verificationStatus'],['rowDescriptor']);
  const row=r.rowEvidence;text(row.sourceRef);text(row.rowIdentifier);if(Object.hasOwn(row,'rowDescriptor'))text(row.rowDescriptor,true);
  const registry=input.sourceRegistry;object(registry,[row.sourceRef as string]);const src=registry[row.sourceRef as string];
  const registryKeys=SOURCE_KEYS.filter(k=>!['sourceRef','rowIdentifier','rowNumber','rowDescriptor','manufacturerProductRevision'].includes(k));object(src,registryKeys);
  const materialized={...src,sourceRef:row.sourceRef,rowIdentifier:row.rowIdentifier,rowNumber:null,rowDescriptor:row.rowDescriptor??null,manufacturerProductRevision:r.manufacturerProductRevision};source(materialized);
  for(const k of ['manufacturer','sourceEdition','sourceRevision','retrievedAt'])check(canonical(r[k])===canonical(src[k]),'RECORD_SOURCE_CONFLICT');
  check(row.verificationStatus===src.verificationStatus,'ROW_STATUS_CONFLICT');
  for(const k of METRICS){const m=r.metrics[k];check(canonical(m.resolvedSource)===canonical(materialized),'REGISTRY_CONFLICT');check(m.evidenceRef===`${row.sourceRef}:${row.rowIdentifier}:${k}`,'EVIDENCE_REF_CONFLICT');check(m.verificationStatus===row.verificationStatus,'METRIC_STATUS_CONFLICT');}
  const result=input as unknown as RecordInput;
  check(r.normalizedContentDigest===await legacyDigest(result.record,port),'LEGACY_DIGEST_MISMATCH');
  check(r.metricBasisDigest===await basisDigest(result.record.metrics,port),'BASIS_DIGEST_MISMATCH');check(r.assemblyIdentity===await assemblyIdentity(result.record.assembly,port),'ASSEMBLY_DIGEST_MISMATCH');
  return owned(result);
}
export function recordSelection(doc:RecordInput):CatalogSelection {const r=doc.record;return owned({kind:'catalog_record',recordId:r.recordId,recordRevision:r.recordRevision,normalizedContentDigest:r.normalizedContentDigest,savedEtaShgc:r.metrics.etaShgc.value!,metricBasisVersion:r.metricBasisVersion,metricBasisDigest:r.metricBasisDigest,savedMetricBasis:r.metrics,savedAssemblyIdentity:r.assemblyIdentity,savedAssembly:r.assembly,resolutionState:'UNRESOLVED_CATALOG'});}
export async function rebind(saved:CatalogSelection,input:RecordInput,port:HashPort):Promise<CatalogSelection>{
  selection(saved);check(saved.metricBasisDigest===await basisDigest(saved.savedMetricBasis,port),'BASIS_DIGEST_MISMATCH');check(saved.savedAssemblyIdentity===await assemblyIdentity(saved.savedAssembly,port),'ASSEMBLY_DIGEST_MISMATCH');
  const doc=await validateRecord(input,port);const candidate=recordSelection(doc);
  for(const k of ['recordId','recordRevision','savedEtaShgc','normalizedContentDigest','metricBasisVersion','metricBasisDigest','savedAssemblyIdentity'] as const)check(saved[k]===candidate[k],`REBIND_${k}_MISMATCH`);
  check(canonical(metricTuples(saved.savedMetricBasis))===canonical(metricTuples(candidate.savedMetricBasis)),'REBIND_BASIS_MISMATCH');check(canonical(assemblyTuple(saved.savedAssembly))===canonical(assemblyTuple(candidate.savedAssembly)),'REBIND_ASSEMBLY_MISMATCH');
  // Selection is always explicit, including historical/discontinued records; never pick a latest revision.
  return {...owned(saved),resolutionState:'RESOLVED'};
}

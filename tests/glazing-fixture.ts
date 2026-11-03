// Entirely synthetic provenance and numbers. NOT MANUFACTURER DATA.
import type { RecordInput, HashPort, FourMetricBasis, Source } from '../src/glazing/types';
import { RECORD_KIND, METRICS } from '../src/glazing/types';
import { newUserEntry } from '../src/glazing/user-entry';
import { legacyDigest, basisDigest, assemblyIdentity } from '../src/glazing/digest';
import { owned } from '../src/glazing/canonical';
export async function syntheticRecord(hash:HashPort,revision='R1'):Promise<RecordInput>{
 const user=await newUserEntry('synthetic','SYNTHETIC / NOT MANUFACTURER DATA',hash);
 const source={manufacturer:'SYNTHETIC',originalSourceUrl:'https://example.invalid/synthetic',originalTable:'SYNTHETIC / NOT MANUFACTURER DATA',sourceEdition:null,sourceRevision:null,effectiveDate:null,retrievedAt:'2026-10-26',retrievalDateBasis:'SYNTHETIC',accessStatus:'SYNTHETIC',verificationStatus:'UNVERIFIED' as const,evidenceReference:'SYNTHETIC'};
 const resolved:Source={...source,sourceRef:'SYNTHETIC',rowIdentifier:'ROW',rowNumber:null,rowDescriptor:null,manufacturerProductRevision:null};
 const metrics=Object.fromEntries(METRICS.map(k=>[k,{...user.metrics[k],value:k==='ugWm2K'?1.7:.38,evidenceRef:`SYNTHETIC:ROW:${k}`,resolvedSource:owned(resolved)}])) as FourMetricBasis;
 const doc:RecordInput={kind:RECORD_KIND,schemaVersion:1,sourceRegistry:{SYNTHETIC:source},record:{recordId:'synthetic-record',recordRevision:revision,legacyResearchId:null,manufacturerProductRevision:null,retrievedAt:'2026-10-26',normalizedContentDigest:'',manufacturer:'SYNTHETIC',productName:'SYNTHETIC / NOT MANUFACTURER DATA',productAbbreviation:null,sourceEdition:null,sourceRevision:null,publicationPermissionStatus:'NOT_VERIFIED',allowPublicBundle:false,correctionOf:null,supersededBy:null,availabilityStatus:'CURRENT_LISTING_CHECK_REQUIRED_AT_SELECTION',assembly:{sourceNotation:'SYNTHETIC',nominalOverallThicknessMm:23,paneThicknessesMm:[5,7],cavityThicknessMm:11,sourceGasLabel:'UNKNOWN',gasFillRatio:null,outsideToInsideConfirmed:false,coatingSurface:null,sourcePaneCodes:null},rowEvidence:{sourceRef:'SYNTHETIC',rowIdentifier:'ROW',verificationStatus:'UNVERIFIED'},metrics,metricBasisVersion:'glz-metric-basis-v1',metricBasisDigest:'',assemblyIdentity:''}};
 return refresh(doc,hash);
}
export async function refresh(doc:RecordInput,hash:HashPort):Promise<RecordInput>{doc.record.normalizedContentDigest=await legacyDigest(doc.record,hash);doc.record.metricBasisDigest=await basisDigest(doc.record.metrics,hash);doc.record.assemblyIdentity=await assemblyIdentity(doc.record.assembly,hash);return doc;}

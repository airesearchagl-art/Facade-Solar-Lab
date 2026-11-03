import { METRICS, type G1UserEntry, type HashPort, type UserSource, type FourMetricBasis } from './types';
import { owned } from './canonical';
import { check, entry } from './validation';
import { userDigest } from './digest';
export async function newUserEntry(id:string,name:string,port:HashPort):Promise<G1UserEntry>{
  const source:UserSource={sourceRef:`user-entry:${id}`,manufacturer:'UNKNOWN',originalSourceUrl:null,originalTable:'UNKNOWN',rowIdentifier:'UNKNOWN',rowNumber:null,rowDescriptor:null,sourceEdition:null,sourceRevision:null,manufacturerProductRevision:null,effectiveDate:null,retrievedAt:null,retrievalDateBasis:'USER_ENTERED_NOT_SOURCE_RETRIEVAL',accessStatus:'USER_ENTRY',verificationStatus:'UNVERIFIED',evidenceReference:'USER_DECLARED'};
  const metrics=Object.fromEntries(METRICS.map(k=>[k,{value:null,unit:k==='ugWm2K'?'W/m2K':'fraction',evaluationScope:'UNKNOWN',incidenceSide:k==='ugWm2K'?'NOT_APPLICABLE':'UNKNOWN',incidenceAngleDeg:null,calculationOrTestStandard:null,boundaryConditions:null,evidenceRef:`${source.sourceRef}:${k}`,verificationStatus:'UNVERIFIED',resolvedSource:owned(source)}])) as FourMetricBasis<UserSource>;
  const e:G1UserEntry={id,name,origin:'user_entry',userRevision:'U1',metrics,assemblyDescription:null,assembly:null,entryContentDigest:''};e.entryContentDigest=await userDigest(e,port);return e;
}
export async function reviseUserEntry(previous:G1UserEntry,draft:G1UserEntry,port:HashPort):Promise<G1UserEntry>{
  entry(previous);check(draft.id===previous.id&&draft.origin==='user_entry','ENTRY_IDENTITY');const n=Number(previous.userRevision.slice(1))+1;check(Number.isSafeInteger(n),'REVISION_OVERFLOW');
  const next={...owned(draft),userRevision:`U${n}`};next.entryContentDigest=await userDigest(next,port);entry(next);return next;
}

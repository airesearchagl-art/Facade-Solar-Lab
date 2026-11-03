import { WORKSPACE_KIND, RECORD_KIND, type Input, type Workspace, type HashPort, type WorkspaceInput } from './types';
import { strictJson, sizeGuard } from './strict-json';
import { object, workspace, check } from './validation';
import { verifyEntry } from './digest';
import { owned, utf8 } from './canonical';
import { validateRecord } from './resolution';
export async function validateWorkspace(w:unknown,port:HashPort):Promise<Workspace>{workspace(w);const copy=owned(w);for(const e of copy.entries)await verifyEntry(e,port);return copy;}
export async function parseInput(s:string,port:HashPort):Promise<Input>{
  const input=strictJson(s);check(input!==null&&typeof input==='object','INPUT_OBJECT');const kind=(input as Record<string,unknown>).kind;
  if(kind===RECORD_KIND)return validateRecord(input,port);
  object(input,['kind','schemaVersion','workspace']);check(kind===WORKSPACE_KIND&&input.schemaVersion===1,'KIND_VERSION');
  const w=await validateWorkspace(input.workspace,port);for(const e of w.entries)if(e.origin==='local_record')e.selection.resolutionState='UNRESOLVED_CATALOG';
  return {kind:WORKSPACE_KIND,schemaVersion:1,workspace:w};
}
export async function serializeWorkspace(w:Workspace,port:HashPort):Promise<Uint8Array>{
  const copy=await validateWorkspace(w,port);const input:WorkspaceInput={kind:WORKSPACE_KIND,schemaVersion:1,workspace:copy};const bytes=utf8(JSON.stringify(input,null,2)+'\n');sizeGuard(bytes.length);return bytes;
}

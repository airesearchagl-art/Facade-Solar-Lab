import { WORKSPACE_KIND, type Workspace, type Entry, type RecordInput, type HashPort, type Input } from './types';
import { owned, freeze, canonical } from './canonical';
import { workspace, entry, check } from './validation';
import { validateWorkspace, parseInput, serializeWorkspace } from './json';
import { recordSelection, rebind } from './resolution';
export interface Ticket { generation:number; revision:number }
export interface Preview { ticket:Ticket; input:Input }
export interface Snapshot { workspace:Workspace; identity:string }
/** Session-only owner. Every publication is an owned graph; pending work never mutates inputs. */
export class GlazingSession {
  private value:Workspace; private records:RecordInput[]=[]; private generation=0; private revision=0;
  private result:Snapshot|null=null; private stale=true; private editing=false;
  constructor(initial:Workspace,private readonly hash:HashPort){workspace(initial);this.value=owned(initial);}
  get state(){return {workspace:owned(this.value),catalog:owned(this.records),snapshot:this.result,stale:this.stale,editing:this.editing};}
  get current(){return !!this.result&&!this.stale&&!this.editing&&!this.value.entries.some(e=>e.origin==='local_record'&&e.selection.resolutionState!=='RESOLVED');}
  begin():Ticket{return {generation:++this.generation,revision:this.revision};}
  cancel():void{this.generation++;}
  private accept(t:Ticket):void{check(t.generation===this.generation&&t.revision===this.revision,'STALE_ASYNC_RESULT');}
  private change(w:Workspace):void{workspace(w);this.value=owned(w);this.revision++;this.generation++;this.stale=true;}
  startEdit():void{this.editing=true;this.revision++;this.generation++;this.stale=true;}
  finishEdit():void{this.editing=false;}
  add(e:Entry,ticket?:Ticket):void{if(ticket)this.accept(ticket);entry(e);this.change({entries:[...this.value.entries,e],selectedEntryId:e.id});}
  replace(id:string,e:Entry,ticket?:Ticket):void{if(ticket)this.accept(ticket);entry(e);check(e.id===id&&this.value.entries.some(x=>x.id===id),'REPLACE_ID');this.change({...this.value,entries:this.value.entries.map(x=>x.id===id?e:x)});}
  duplicate(id:string,newId:string,name:string):void{const e=this.value.entries.find(x=>x.id===id);check(e,'ENTRY_NOT_FOUND');this.add({...owned(e),id:newId,name});}
  remove(id:string):void{const i=this.value.entries.findIndex(e=>e.id===id);check(i>=0,'ENTRY_NOT_FOUND');const entries=this.value.entries.filter(e=>e.id!==id);const selectedEntryId=this.value.selectedEntryId===id?(entries[Math.max(0,i-1)]?.id??''):this.value.selectedEntryId;this.change({entries,selectedEntryId});}
  select(id:string):void{if(id!==this.value.selectedEntryId)this.change({...this.value,selectedEntryId:id});}
  async update():Promise<void>{check(!this.editing,'EDIT_PENDING');const t=this.begin();const w=await validateWorkspace(this.value,this.hash);check(!w.entries.some(e=>e.origin==='local_record'&&e.selection.resolutionState!=='RESOLVED'),'UNRESOLVED_CATALOG');this.accept(t);this.result=freeze({workspace:owned(w),identity:canonical(w)});this.stale=false;}
  async preview(s:string):Promise<Preview>{const ticket=this.begin();const input=await parseInput(s,this.hash);this.accept(ticket);return freeze({ticket,input});}
  apply(p:Preview,action:'workspace'|'add'|'replace'|'supply',id?:string,name?:string):void{
    this.accept(p.ticket);check(!this.editing,'EDIT_PENDING');
    if(p.input.kind===WORKSPACE_KIND){check(action==='workspace','IMPORT_ACTION');this.change(p.input.workspace);this.result=null;return;}
    check(action!=='workspace','IMPORT_ACTION');const doc=p.input;const found=this.records.find(d=>d.record.recordId===doc.record.recordId&&d.record.recordRevision===doc.record.recordRevision);
    check(!found||canonical(found)===canonical(doc),'REVISION_CONTENT_CONFLICT');
    const records=found?owned(this.records):[...owned(this.records),owned(doc)];let next=owned(this.value);
    if(action==='add'||action==='replace'){check(id&&name,'ENTRY_NAME_ID_REQUIRED');const e:Entry={id,name,origin:'local_record',selection:recordSelection(doc)};
      if(action==='add')next={entries:[...next.entries,e],selectedEntryId:id};else{check(next.entries.some(x=>x.id===id),'ENTRY_NOT_FOUND');next.entries=next.entries.map(x=>x.id===id?e:x);}}
    workspace(next);this.change(next);this.records=records;
  }
  async bind(id:string,recordIndex:number):Promise<void>{const t=this.begin();const e=owned(this.value.entries.find(x=>x.id===id));const doc=owned(this.records[recordIndex]);check(e?.origin==='local_record'&&doc,'CATALOG_REQUIRED');const selection=await rebind(e.selection,doc,this.hash);this.accept(t);this.replace(id,{...e,selection});}
  async export():Promise<Uint8Array>{check(this.current,'CURRENT_REQUIRED');const t=this.begin();const bytes=await serializeWorkspace(this.value,this.hash);this.accept(t);check(this.current,'CURRENT_REQUIRED');return bytes;}
}

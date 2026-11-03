import { useEffect, useRef, useState } from 'react';
import { GlazingSession, type Preview } from '../../../glazing/workspace';
import { newUserEntry, reviseUserEntry } from '../../../glazing/user-entry';
import type { Entry } from '../../../glazing/types';
import { browserHash, readGlazingFile, saveGlazingFile } from '../../glazing-file';
import { GlazingComparisonTable } from './GlazingComparisonTable';
import { GlazingEntryEditor } from './GlazingEntryEditor';
import { GlazingImportReview } from './GlazingImportReview';
export function GlazingWorkspace(){
 const [session,setSession]=useState<GlazingSession|null>(null);const [,render]=useState(0);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [preview,setPreview]=useState<Preview|null>(null);const [editorKey,setEditorKey]=useState(0);
 const operation=useRef(0);const nextId=useRef(2);const sessionOwner=useRef<GlazingSession|null>(null);
 useEffect(()=>{let active=true;void newUserEntry('glazing-1','案1',browserHash).then(e=>{if(active){const created=new GlazingSession({entries:[e],selectedEntryId:e.id},browserHash);sessionOwner.current=created;setSession(created);}}).catch(e=>{if(active)setError(String(e));});return()=>{active=false;operation.current++;sessionOwner.current?.cancel();};},[]);
 function refresh(){render(n=>n+1);}
 function id(){return `glazing-${nextId.current++}-${crypto.randomUUID()}`;}
 async function run(fn:(isCurrent:()=>boolean)=>void|Promise<void>){const op=++operation.current;setBusy(true);setError('');try{await fn(()=>op===operation.current);}catch(e){if(op===operation.current)setError(e instanceof Error?e.message:String(e));}finally{if(op===operation.current){setBusy(false);refresh();}}}
 if(!session)return <main className="glazing-workspace"><h1>ガラス性能比較</h1><p role="status">{error||'準備中…'}</p></main>;
 const state=session.state;const selected=state.workspace.entries.find(e=>e.id===state.workspace.selectedEntryId)!;const locked=busy||state.editing;const full=state.workspace.entries.length>=4;
 function change(fn:()=>void){setPreview(null);void run(fn);}
 async function saveEntry(draft:Entry){
  if(!session)return;const op=++operation.current;const ticket=session.begin();setBusy(true);
  try{const e=draft.origin==='user_entry'&&selected.origin==='user_entry'?await reviseUserEntry(selected,draft,browserHash):draft;
   if(op!==operation.current)return;session.replace(selected.id,e,ticket);session.finishEdit();setEditorKey(k=>k+1);refresh();
  }catch(e){if(op===operation.current)throw e;}finally{if(op===operation.current)setBusy(false);}
 }
 async function fileSelected(file:File){const op=++operation.current;session!.cancel();setPreview(null);setBusy(true);setError('');try{const text=await readGlazingFile(file);if(op!==operation.current)return;const p=await session!.preview(text);if(op===operation.current)setPreview(p);}catch(e){if(op===operation.current)setError(e instanceof Error?e.message:String(e));}finally{if(op===operation.current){setBusy(false);refresh();}}}
 return <main className="glazing-workspace"><header><p>GLAZING PERFORMANCE LAB · G1</p><h1>ガラス性能比較</h1><p>手入力または自分で選択したローカルJSONを最大4案まで比較します。外部送信・自動保存はありません。</p><a href="#guide-glazing">使い方・評価条件について</a></header>
 <p role="status">{busy?'処理中':session.current?'Current':state.snapshot?'STALE — 入力変更あり。比較を更新してください':'未比較 — 比較を更新してください'} / {state.workspace.entries.length} / 4案</p>
 <div className="glazing-actions"><button type="button" disabled={locked||full} onClick={()=>void run(async isCurrent=>{
  setPreview(null);const ticket=session.begin();const e=await newUserEntry(id(),`案${state.workspace.entries.length+1}`,browserHash);
  // Check the UI owner and Session ticket immediately before synchronous publication.
  if(isCurrent())session.add(e,ticket);
 })}>手入力案を追加</button>
 <button type="button" disabled={locked||full} onClick={()=>change(()=>session.duplicate(selected.id,id(),selected.name))}>選択案を複製</button>
 <button type="button" disabled={locked||state.workspace.entries.length===1} onClick={()=>change(()=>session.remove(selected.id))}>選択案を削除</button>
 <button type="button" disabled={locked} onClick={()=>void run(async()=>{setPreview(null);await session.update();})}>比較を更新</button>
 <button type="button" disabled={locked||!session.current} onClick={()=>void run(()=>saveGlazingFile(session))}>Current JSONを保存</button></div>
 <label>比較案を選択<select value={selected.id} disabled={locked} onChange={e=>change(()=>session.select(e.target.value))}>{state.workspace.entries.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
 <label>ローカルJSONを読み込む（最大256 KiB）<input type="file" accept=".json,application/json" disabled={state.editing} onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void fileSelected(f);}}/></label>
 {error&&<p role="alert">{error}</p>}
 {preview&&<GlazingImportReview preview={preview} busy={busy||state.editing} count={state.workspace.entries.length} target={selected.name} onCancel={()=>{operation.current++;session.cancel();setBusy(false);setPreview(null);}} onApply={action=>void run(()=>{session.apply(preview,action,action==='replace'?selected.id:id(),preview.input.kind==='facade-solar-lab-glazing-record-input'?preview.input.record.productName:undefined);setPreview(null);setEditorKey(k=>k+1);})}/>}
 <GlazingEntryEditor key={`${selected.id}:${editorKey}`} entry={selected} busy={busy} onDirty={()=>{session.startEdit();setPreview(null);operation.current++;refresh();}} onSave={saveEntry} onCancel={()=>{operation.current++;session.cancel();session.finishEdit();setBusy(false);setEditorKey(k=>k+1);refresh();}}/>
 {selected.origin==='local_record'&&<section><h2>製品の版を明示照合</h2><p>{selected.selection.resolutionState} / {selected.selection.recordId} / {selected.selection.recordRevision}。一致する出典資料を選択してください。廃番・改訂済みの場合も履歴と状態を確認したうえで操作してください。</p>{state.catalog.map((d,i)=><div key={`${d.record.recordId}:${d.record.recordRevision}`}><p>{d.record.productName} / {d.record.recordRevision} / {d.record.availabilityStatus}</p><button type="button" disabled={locked} onClick={()=>void run(()=>session.bind(selected.id,i))}>この版と照合して結合（{d.record.recordRevision}）</button></div>)}</section>}
 <GlazingComparisonTable workspace={state.snapshot?.workspace??state.workspace} stale={!!state.snapshot&&!session.current}/>
 <p>Public Catalog Bundle: BLOCKED。任意構成からの自動性能算定、Single/Multiへの転送、自動ランキングは対象外です。</p>
 </main>;
}

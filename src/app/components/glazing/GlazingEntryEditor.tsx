import { useState, type FormEvent } from 'react';
import { METRICS, type Entry, type G1UserEntry } from '../../../glazing/types';
import { owned } from '../../../glazing/canonical';
import { strictJson } from '../../../glazing/strict-json';
import { object } from '../../../glazing/validation';
import { LABELS } from './GlazingEvidenceDetails';
function evidence(e:G1UserEntry,k:typeof METRICS[number]){const {value:_v,unit:_u,...basis}=e.metrics[k];return JSON.stringify(basis,null,2);}
export function GlazingEntryEditor({entry,busy,onDirty,onSave,onCancel}:{entry:Entry;busy:boolean;onDirty:()=>void;onSave:(entry:Entry)=>Promise<void>;onCancel:()=>void}){
 const [name,setName]=useState(entry.name);const [description,setDescription]=useState(entry.origin==='user_entry'?entry.assemblyDescription??'':'');
 const [values,setValues]=useState(Object.fromEntries(METRICS.map(k=>[k,entry.origin==='user_entry'&&entry.metrics[k].value!==null?String(entry.metrics[k].value):''])));
 const [unknown,setUnknown]=useState(Object.fromEntries(METRICS.map(k=>[k,entry.origin==='user_entry'&&entry.metrics[k].value===null])));
 const [basis,setBasis]=useState(Object.fromEntries(METRICS.map(k=>[k,entry.origin==='user_entry'?evidence(entry,k):''])));
 const [assembly,setAssembly]=useState(entry.origin==='user_entry'?JSON.stringify(entry.assembly,null,2):'null');
 const [error,setError]=useState('');const [changed,setChanged]=useState(false);
 function dirty(){setChanged(true);onDirty();setError('');}
 async function submit(event:FormEvent){event.preventDefault();try{const draft=owned(entry);draft.name=name;
  if(draft.origin==='user_entry'){
   draft.assemblyDescription=description===''?null:description;draft.assembly=strictJson(assembly) as G1UserEntry['assembly'];
   for(const k of METRICS){const b=strictJson(basis[k]!);object(b,['evaluationScope','incidenceSide','incidenceAngleDeg','calculationOrTestStandard','boundaryConditions','evidenceRef','verificationStatus','resolvedSource']);
    if(!unknown[k]&&!/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(values[k]!))throw Error(`${LABELS[k]}: 数値を入力するかUNKNOWNを選択してください`);
    draft.metrics[k]={...b,value:unknown[k]?null:Number(values[k]),unit:k==='ugWm2K'?'W/m2K':'fraction'} as G1UserEntry['metrics'][typeof k];
   }
  }await onSave(draft);setChanged(false);
 }catch(e){setError(e instanceof Error?e.message:String(e));}}
 return <form className="glazing-editor" onSubmit={e=>void submit(e)}><h2>選択案を編集</h2><fieldset disabled={busy}><legend>{entry.name}</legend>
 <label>案名（120文字まで）<input value={name} onChange={e=>{setName(e.target.value);dirty();}}/></label>
 {entry.origin==='user_entry'?<><p>利用者入力・原典未照合。fractionは0〜1、Ugは正数。不明値はUNKNOWNを選択します。</p>
 <div className="glazing-metric-grid">{METRICS.map(k=><div key={k}><label>{LABELS[k]} [{k==='ugWm2K'?'W/m²K':'fraction'}]<input inputMode="decimal" disabled={unknown[k]} value={values[k]} onChange={e=>{setValues({...values,[k]:e.target.value});dirty();}}/></label><label className="glazing-check"><input type="checkbox" checked={unknown[k]} onChange={e=>{setUnknown({...unknown,[k]:e.target.checked});dirty();}}/>UNKNOWN（{k}）</label>
 <details><summary>{LABELS[k]} の根拠を編集</summary><p>scope・方向・法線からの角度・規格・境界条件・出典16項目を保持します。未知値はUNKNOWN/null。確認状態はUNVERIFIEDです。</p><label>{LABELS[k]} の評価条件・出典JSON<textarea rows={16} spellCheck={false} value={basis[k]} onChange={e=>{setBasis({...basis,[k]:e.target.value});dirty();}}/></label></details></div>)}</div>
 <label>ガラス構成の説明<textarea value={description} onChange={e=>{setDescription(e.target.value);dirty();}}/></label>
 <details><summary>既知の構成snapshot（任意・mm）</summary><p>不明の場合はnull。構成から性能値を算定しません。</p><label>構成JSON<textarea rows={7} value={assembly} onChange={e=>{setAssembly(e.target.value);dirty();}}/></label></details>
 </>:<p>製品性能は直接編集できません。訂正は別revisionのローカル資料を読み込み、明示的に置換してください。</p>}
 <div className="glazing-actions"><button type="submit" disabled={!changed}>編集を適用</button><button type="button" onClick={onCancel}>編集を破棄</button></div></fieldset>{error&&<p role="alert">{error}</p>}</form>;
}

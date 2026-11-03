import { METRICS, type Entry } from '../../../glazing/types';
export const LABELS={etaShgc:'η 日射熱取得率',ugWm2K:'Ug ガラス中央部熱貫流率',visibleTransmittance:'VT 可視光透過率',visibleReflectance:'VR 可視光反射率'};
export function GlazingEvidenceDetails({entry}:{entry:Entry}){
 const metrics=entry.origin==='user_entry'?entry.metrics:entry.selection.savedMetricBasis;
 const a=entry.origin==='user_entry'?entry.assembly:entry.selection.savedAssembly;
 return <details className="glazing-evidence"><summary>{entry.name} — 全指標の出典・評価条件</summary>
 <p>{entry.origin==='user_entry'?'利用者入力・原典未照合':`ローカル資料の申告状態（アプリによる原典照合ではありません） / ${entry.selection.recordId} / ${entry.selection.recordRevision}`}</p>
 <p>構成: {entry.origin==='user_entry'?entry.assemblyDescription??'UNKNOWN':a?.sourceNotation}</p>
 {a&&<><p>寸法単位 mm。{a.outsideToInsideConfirmed?'外→内の順序確認済み（入力資料の申告）':'外→内の順序は未確認'}。膜面・封入率が未知の場合、構成性能は未確定。</p><pre>{JSON.stringify(a,null,2)}</pre></>}
 {METRICS.map(k=><details key={k}><summary>{LABELS[k]} — {metrics[k].value??'UNKNOWN'} {metrics[k].unit}</summary><dl>{Object.entries(metrics[k]).filter(([key])=>key!=='resolvedSource').map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value===null?'UNKNOWN':typeof value==='object'?JSON.stringify(value):String(value)}</dd></div>)}</dl><p>出典URLは表示のみ。自動取得しません。</p><dl>{Object.entries(metrics[k].resolvedSource).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value??'UNKNOWN'}</dd></div>)}</dl></details>)}
 </details>;
}

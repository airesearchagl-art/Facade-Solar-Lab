import type { Preview } from '../../../glazing/workspace';
import { WORKSPACE_KIND } from '../../../glazing/types';
import { recordSelection } from '../../../glazing/resolution';
import { GlazingEvidenceDetails } from './GlazingEvidenceDetails';
export function GlazingImportReview({preview,count,target,busy,onApply,onCancel}:{preview:Preview;count:number;target:string;busy:boolean;onApply:(action:'workspace'|'add'|'replace'|'supply')=>void;onCancel:()=>void}){
 const input=preview.input;const isWorkspace=input.kind===WORKSPACE_KIND;
 return <section className="glazing-import-review" aria-label="JSON取込確認"><h2>取込内容を確認</h2><p>現在{count}案。適用するまで入力と比較結果は変わりません。公開カタログの配布許可にはなりません。</p>
 {isWorkspace?<><p>{input.workspace.entries.length}案でWorkspace全体を置換。製品はUNRESOLVEDから再照合が必要です。</p>{input.workspace.entries.map(e=><GlazingEvidenceDetails key={e.id} entry={e}/>)}</>:<><p>{input.record.productName} / {input.record.recordRevision} / {input.record.availabilityStatus} / {input.record.publicationPermissionStatus} / 公開同梱不可</p><GlazingEvidenceDetails entry={{id:'preview',name:input.record.productName,origin:'local_record',selection:recordSelection(input)}}/></>}
 <div className="glazing-actions">{isWorkspace?<button type="button" disabled={busy} onClick={()=>onApply('workspace')}>全案を明示置換</button>:<><button type="button" disabled={busy||count>=4} onClick={()=>onApply('add')}>新しい案として追加（未解決）</button><button type="button" disabled={busy} onClick={()=>onApply('replace')}>選択案「{target}」を置換（未解決）</button><button type="button" disabled={busy} onClick={()=>onApply('supply')}>照合用資料として保持</button></>}<button type="button" onClick={onCancel}>取込をキャンセル</button></div></section>;
}

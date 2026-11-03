import { METRICS, type Workspace } from '../../../glazing/types';
import { LABELS, GlazingEvidenceDetails } from './GlazingEvidenceDetails';
export function GlazingComparisonTable({workspace,stale=false}:{workspace:Workspace;stale?:boolean}){
 return <section aria-label="性能比較"><h2>{stale?'前回の比較（STALE・参考）':'性能比較'}</h2><p>評価条件は異なる場合や未確認の場合があります。数値の大小だけで製品を選定しないでください。Ugはガラス中央部の値で、窓全体のUwではありません。</p>
 <div className="glazing-table-scroll" tabIndex={0} aria-label="比較表（横スクロール）"><table><thead><tr><th scope="col">指標・単位</th>{workspace.entries.map(e=><th scope="col" key={e.id}>{e.name}</th>)}</tr></thead><tbody>
 {METRICS.map(k=><tr key={k}><th scope="row">{LABELS[k]} [{k==='ugWm2K'?'W/m²K':'fraction'}]</th>{workspace.entries.map(e=>{const m=(e.origin==='user_entry'?e.metrics:e.selection.savedMetricBasis)[k];return <td key={e.id}>{m.value===null?'UNKNOWN':String(m.value)}<small>{m.verificationStatus} / {m.incidenceSide}</small></td>;})}</tr>)}
 <tr><th scope="row">入力・製品revision</th>{workspace.entries.map(e=><td key={e.id}>{e.origin==='user_entry'?`利用者入力 ${e.userRevision}`:`${e.selection.recordId} / ${e.selection.recordRevision} / ${e.selection.resolutionState}`}</td>)}</tr>
 </tbody></table></div>{workspace.entries.map(e=><GlazingEvidenceDetails entry={e} key={e.id}/>)}
 </section>;
}

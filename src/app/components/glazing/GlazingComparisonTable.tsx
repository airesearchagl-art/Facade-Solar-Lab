import { useId } from 'react';
import { METRICS, type MetricName, type Workspace } from '../../../glazing/types';
import { constructionDescription } from './generic-constructions';
import { LABELS, GlazingEvidenceDetails } from './GlazingEvidenceDetails';

// Column examples, independent of the selected construction and the entry's inputs.
const sampleValues: Record<MetricName, readonly number[]> = {
  etaShgc: [0.31, 0.42, 0.53, 0.64],
  ugWm2K: [1.11, 2.22, 3.33, 4.44],
  visibleTransmittance: [0.71, 0.62, 0.53, 0.44],
  visibleReflectance: [0.12, 0.23, 0.34, 0.45],
};

export const sampleWarning = '架空データ・設計判断に使用不可';

interface Props {
  workspace: Workspace;
  status: '未比較' | 'STALE' | 'Current';
  sample: boolean;
}

export function GlazingComparisonTable({ workspace, status, sample }: Props) {
  const { entries } = workspace;
  const scrollHelpId = useId();
  return <section aria-label="性能比較">
    <h2>{sample ? '性能比較のサンプル表示' : status === 'STALE' ? '前回の比較（STALE・参考）' : '性能比較'}</h2>
    {sample
      ? <p className="glazing-sample-warning">{sampleWarning}。数値は列ごとの固定例です。構成や出典との対応はありません。ローカル資料の案はサンプル対象外です。</p>
      : <p>評価条件は異なる場合や未確認の場合があります。数値の大小だけで製品を選定しないでください。Ugはガラス中央部の値で、窓全体のUwではありません。</p>}
    <p id={scrollHelpId} className="glazing-scroll-help">表が収まらない場合は、表の中を左右・上下にスクロールできます。キーボードではTabで表を選び、矢印キーで移動します。案名と左端の指標を見ながら比較してください。</p>
    <div className="glazing-table-scroll" role="region" tabIndex={0} aria-label="比較表（横スクロール）" aria-describedby={scrollHelpId}>
      <table style={{ minWidth: `calc(var(--glazing-label-width) + ${entries.length} * var(--glazing-case-width))` }}>
        <colgroup><col className="glazing-metric-column"/>{entries.map(e => <col key={e.id}/>)}</colgroup>
        <thead><tr><th scope="col">指標・単位</th>{entries.map(e => <th scope="col" key={e.id}>{e.name}<small>{status}{sample && ' / サンプル'}</small></th>)}</tr></thead>
        <tbody>
          <tr><th scope="row">構成分類・構成説明</th>{entries.map(e => {
            if (e.origin === 'local_record') return <td key={e.id}>ローカル資料<small>{e.selection.savedAssembly.sourceNotation}</small></td>;
            const { selected, notes } = constructionDescription(e.assemblyDescription);
            const showApplicabilityNote = !sample && selected.id !== 'custom' && METRICS.some(k => e.metrics[k].value !== null);
            return <td key={e.id}>{selected.name}{notes && <small>{notes}</small>}{e.assembly && <small>{e.assembly.sourceNotation}</small>}
              {showApplicabilityNote && <small>手入力値と出典がこの構成に当てはまるかは未確認です。</small>}
            </td>;
          })}</tr>
          {METRICS.map(k => <tr key={k}>
            <th scope="row">{LABELS[k]}{k === 'etaShgc' && ' / SHGC'} [{k === 'ugWm2K' ? 'W/m²K' : 'fraction'}]</th>
            {entries.map((e, index) => {
              if (sample) return <td key={e.id}>{e.origin === 'local_record' ? '対象外（ローカル資料）'
                : <><strong>{sampleValues[k][index]}</strong><small>{sampleWarning}</small></>}</td>;
              const metric = (e.origin === 'user_entry' ? e.metrics : e.selection.savedMetricBasis)[k];
              return <td key={e.id}><strong>{metric.value ?? 'UNKNOWN'}</strong>
                <small>{metric.verificationStatus} / {metric.incidenceSide}</small>
                <small>出典：{metric.resolvedSource.originalTable} / {metric.evidenceRef}</small></td>;
            })}
          </tr>)}
          <tr><th scope="row">入力・製品revision</th>{entries.map(e => <td key={e.id}>{e.origin === 'user_entry'
            ? `利用者入力 ${e.userRevision}` : `${e.selection.recordId} / ${e.selection.recordRevision} / ${e.selection.resolutionState}`}</td>)}</tr>
          <tr><th scope="row">入力の比較状態</th>{entries.map(e => <td key={e.id}>{status}</td>)}</tr>
        </tbody>
      </table>
    </div>
    {!sample && entries.map(e => <GlazingEvidenceDetails entry={e} key={e.id}/>)}
  </section>;
}

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GlazingComparisonTable } from '../src/app/components/glazing/GlazingComparisonTable';
import { constructions, describeConstruction } from '../src/app/components/glazing/generic-constructions';
import { newUserEntry, reviseUserEntry } from '../src/glazing/user-entry';
import { GlazingSession } from '../src/glazing/workspace';
import type { HashPort, Workspace } from '../src/glazing/types';
import { nodeSha256 } from './glazing-node-oracle.mjs';

const hash: HashPort = async bytes => nodeSha256(bytes);
const render = (workspace: Workspace, status: 'Current' | 'STALE' = 'Current', sample = false) =>
  renderToStaticMarkup(createElement(GlazingComparisonTable, { workspace, status, sample }));

describe('G3 narrow comparison context', () => {
  it.each([1, 4])('retains all %i case columns and connects keyboard instructions to the scroll region', async count => {
    const entries = await Promise.all(Array.from({length: count}, (_, i) => newUserEntry('e'+i, '合成案'+i, hash)));
    const html = render({entries, selectedEntryId: entries[0]!.id});
    const helpId = html.match(/aria-describedby="([^"]+)"/)![1];
    expect(html).toContain('id="'+helpId+'"');
    expect(html).toContain('Tabで表を選び、矢印キーで移動');
    expect(html).toMatch(/tabindex="0"/);
    const headers = html.split('<thead>')[1]!.split('</thead>')[0]!;
    expect(headers.match(/scope="col"/g)).toHaveLength(count + 1);
    for (const entry of entries) expect(headers).toContain(entry.name+'<small>Current</small>');
    expect(html).toContain('+ '+count+' * var(--glazing-case-width)');
    expect(html.match(/<strong>UNKNOWN<\/strong>/g)).toHaveLength(count * 4);
  });

  it('keeps long names, zero, unknown, source and revision in their original columns', async () => {
    const entries = await Promise.all(Array.from({length:4}, (_,i)=>newUserEntry('e'+i, '合成案'+i+'長い説明'.repeat(12), hash)));
    for (let i=0; i<4; i++) {
      const draft = structuredClone(entries[i]!);
      draft.assemblyDescription = describeConstruction(constructions[i+1]!, '合成構成注記'+i);
      draft.metrics.etaShgc.value = [0.5, 0, null, 0.75][i]!;
      draft.metrics.etaShgc.resolvedSource.originalTable = '合成出典'+i+'条件注記'.repeat(30);
      entries[i] = await reviseUserEntry(entries[i]!, draft, hash);
    }
    const workspace = {entries, selectedEntryId: entries[0]!.id};
    const session = new GlazingSession(workspace, hash);
    await session.update();
    const before = session.state, bytes = await session.export();
    const html = render(workspace);
    const rows = html.split('<tbody>')[1]!.split('</tbody>')[0]!.split('</tr>');
    const cells = (row: string) => [...row.matchAll(/<td>([\s\S]*?)<\/td>/g)].map(m => m[1]!);
    const eta = cells(rows[1]!);
    expect(eta).toHaveLength(4);
    for (let i=0; i<4; i++) {
      expect(eta[i]).toContain('<strong>'+([0.5,0,'UNKNOWN',0.75][i])+'</strong>');
      expect(eta[i]).toContain(entries[i]!.metrics.etaShgc.resolvedSource.originalTable);
      expect(html).toContain(entries[i]!.name);
    }
    expect(cells(rows[0]!).map(c => c.includes('手入力値と出典がこの構成に当てはまるかは未確認です。'))).toEqual([true,true,false,true]);
    expect(cells(rows[5]!).every(c => c==='利用者入力 U2')).toBe(true);
    const stale = render(workspace,'STALE').split('</thead>')[0]!;
    expect(stale.match(/<small>STALE<\/small>/g)).toHaveLength(4);
    const sample = render(workspace,'Current',true);
    expect(sample.split('</thead>')[0]!.match(/Current \/ サンプル/g)).toHaveLength(4);
    expect(sample).not.toContain('合成出典');
    expect(render(workspace)).toBe(html);
    expect(session.state).toEqual(before);
    expect(session.state.snapshot).toBe(before.snapshot);
    expect(await session.export()).toEqual(bytes);
  });

  it('assigns distinct help targets when two comparison tables are rendered together', async () => {
    const entry = await newUserEntry('e','合成案',hash);
    const props = {workspace:{entries:[entry],selectedEntryId:'e'},status:'Current' as const,sample:false};
    const html = renderToStaticMarkup(createElement('div', {}, createElement(GlazingComparisonTable,props),createElement(GlazingComparisonTable,props)));
    const ids=[...html.matchAll(/aria-describedby="([^"]+)"/g)].map(m=>m[1]);
    expect(new Set(ids).size).toBe(2);
  });
});

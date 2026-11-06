import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { constructions, constructionDescription, describeConstruction } from '../src/app/components/glazing/generic-constructions';
import { GlazingComparisonTable, sampleWarning } from '../src/app/components/glazing/GlazingComparisonTable';
import { GlazingEntryEditor } from '../src/app/components/glazing/GlazingEntryEditor';
import { GlazingSession } from '../src/glazing/workspace';
import { newUserEntry, reviseUserEntry } from '../src/glazing/user-entry';
import { recordSelection } from '../src/glazing/resolution';
import { METRICS, type HashPort, type Entry, type Workspace } from '../src/glazing/types';
import { syntheticRecord } from './glazing-fixture';
import { nodeSha256 } from './glazing-node-oracle.mjs';

const hash: HashPort = async bytes => nodeSha256(bytes);

function table(workspace: Workspace, sample = false, status: '未比較' | 'Current' | 'STALE' = 'Current') {
  return renderToStaticMarkup(createElement(GlazingComparisonTable, { workspace, sample, status }));
}

describe('G3 construction selection and display-only sample', () => {
  it('exposes six stable classifications and no product values on the user editor', async () => {
    expect(constructions.map(c => c.id)).toEqual(['custom', 'single', 'double', 'low-e-gain', 'low-e-shield', 'triple']);
    const editor = renderToStaticMarkup(createElement(GlazingEntryEditor, {
      entry: await newUserEntry('e','案1',hash), busy: false, onDirty() {}, async onSave() {}, onCancel() {},
    }));
    expect(editor).toMatch(/<label>一般的なガラス構成<select/);
    expect(editor.match(/<option /g)).toHaveLength(6);
    for (const c of constructions) {
      expect(editor).toContain(c.name);
      expect(c).toMatchObject({kind: 'GENERIC_CONSTRUCTION', performance: 'UNKNOWN'});
      expect(c.layers.length).toBeGreaterThan(0);
      expect(c.unspecified.length).toBeGreaterThan(0);
    }
    expect(editor).toContain('出典：一般分類・製品未指定');
  });

  it.each(constructions)('round-trips notes with whitespace and category-like text ($id)', c => {
    const notes = '  独自の説明\r\n【一般構成】単板ガラス\n三層ガラス  ';
    const text = describeConstruction(c, notes);
    expect(constructionDescription(text)).toEqual({selected: c, notes});
    expect(describeConstruction(constructions[0], constructionDescription(text).notes)).toBe(notes);
  });

  it('keeps an old free description custom including an ordinary name and an unknown header', () => {
    for (const text of ['Low-E複層ガラス（日射取得型）', '【一般構成】架空分類\nガラス3枚', '単板ガラス\n複層ガラス']) {
      expect(constructionDescription(text)).toEqual({selected: constructions[0], notes: text});
    }
  });

  it('compares four independent selections, updates revision and digest, and restores v1 bytes', async () => {
    const first = await newUserEntry('g1', '案1', hash);
    const session = new GlazingSession({entries: [first], selectedEntryId: first.id}, hash);
    for (let i = 1; i < 4; i++) session.add(await newUserEntry('g'+(i+1), '案'+(i+1), hash));
    await session.update();
    const entries = session.state.workspace.entries;
    for (const [index, previous] of entries.entries()) {
      if (previous.origin !== 'user_entry') throw Error('user_entry expected');
      const selection = constructions[index + 1]!;
      const next = await reviseUserEntry(previous, {...previous, assemblyDescription: describeConstruction(selection, '注記'+index)}, hash);
      expect(next.userRevision).toBe('U2');
      expect(next.entryContentDigest).not.toBe(previous.entryContentDigest);
      expect(next.metrics).toEqual(previous.metrics);
      expect(next.assembly).toBeNull();
      session.replace(previous.id, next);
      session.select(previous.id);
      expect(session.state.workspace.selectedEntryId).toBe(previous.id);
      expect(session.current).toBe(false);
    }
    expect(table(session.state.snapshot!.workspace, false, 'STALE')).toContain('前回の比較（STALE・参考）');
    await session.update();
    const html = table(session.state.workspace);
    const header = html.split('</thead>')[0]!;
    const classification = html.split('<tbody>')[1]!.split('</tr>')[0]!;
    for (let i = 0; i < 4; i++) {
      expect(header).toContain('案'+(i+1));
      expect(classification).toContain(constructions[i+1]!.name+'<small>注記'+i);
    }
    expect(html.match(/<strong>UNKNOWN<\/strong>/g)).toHaveLength(16);
    const bytes = await session.export();
    const raw = new TextDecoder().decode(bytes);
    expect(JSON.parse(raw).schemaVersion).toBe(1);
    const fresh = new GlazingSession({entries:[first],selectedEntryId:first.id},hash);
    fresh.apply(await fresh.preview(raw),'workspace');
    expect(fresh.state.workspace).toEqual(session.state.workspace);
    await fresh.update();
    expect(await fresh.export()).toEqual(bytes);
  });

  it('isolates four column samples from actual values, provenance, identity and saved bytes', async () => {
    const cases = await Promise.all(['a','b','c','d'].map(id => newUserEntry(id,id,hash)));
    const draft = structuredClone(cases[0]!);
    draft.metrics.etaShgc.value = 0.6789;
    draft.metrics.etaShgc.resolvedSource.originalTable = '試験用出典';
    cases[0] = await reviseUserEntry(cases[0]!, draft, hash);
    const session = new GlazingSession({entries:cases,selectedEntryId:'a'},hash);
    await session.update();
    const original = session.state, bytes = await session.export();
    const actual = table(original.workspace);
    expect(actual).toContain('<strong>0.6789</strong>');
    expect(actual).toContain('出典：試験用出典');
    const demo = table(original.workspace, true);
    expect(demo.match(/<small>架空データ・設計判断に使用不可<\/small>/g)).toHaveLength(16);
    const rows = [...demo.matchAll(/<tr><th scope="row">[^<]*<\/th>((?:<td><strong>[^<]+<\/strong>.*?<\/td>){4})<\/tr>/g)];
    expect(rows).toHaveLength(METRICS.length);
    for (const row of rows) {
      const numbers = [...row[1]!.matchAll(/<strong>([\d.]+)<\/strong>/g)].map(m=>m[1]);
      expect(new Set(numbers).size).toBe(4);
    }
    expect(demo).not.toContain('0.6789');
    expect(demo).not.toContain('試験用出典');
    expect(table(session.state.workspace)).toBe(actual);
    expect(actual).not.toContain(sampleWarning);
    expect(session.state).toEqual(original);
    expect(await session.export()).toEqual(bytes);
  });

  it('keeps local_record columns distinct in both modes, with no editable category', async () => {
    const doc = await syntheticRecord(hash);
    const entry: Entry = {origin:'local_record',id:'local',name:'資料の案',selection:recordSelection(doc)};
    const before = structuredClone(entry);
    const html = renderToStaticMarkup(createElement(GlazingEntryEditor, {entry, busy:false,onDirty(){},async onSave(){},onCancel(){}}));
    expect(html).not.toContain('<select');
    const w = {entries:[entry],selectedEntryId:entry.id};
    expect(table(w)).toContain(doc.record.assembly.sourceNotation);
    expect(table(w)).toContain('出典：'+doc.record.metrics.etaShgc.resolvedSource.originalTable);
    const demo = table(w,true);
    expect(demo.match(/対象外（ローカル資料）/g)).toHaveLength(4);
    expect(demo).not.toContain('<strong>');
    expect(entry).toEqual(before);
  });

  it('renders a labelled keyboard-focusable scrolling region', async () => {
    const e = await newUserEntry('e','案1',hash);
    const html = table({entries:[e],selectedEntryId:'e'});
    expect(html).toMatch(/class="glazing-table-scroll" role="region" tabindex="0" aria-label="比較表（横スクロール）"/i);
  });
});


describe('G3 manual metrics and generic construction applicability', () => {
  const editorNote = '手入力値と出典がこの構成に当てはまるかは未確認です。';
  const editor = (entry: Entry) => renderToStaticMarkup(createElement(GlazingEntryEditor, {
    entry, busy: false, onDirty() {}, async onSave() {}, onCancel() {},
  }));

  it('retains four A-specific sources after choosing B, through STALE, Current and JSON v1', async () => {
    const first = await newUserEntry('a', '案1', hash);
    const draft = structuredClone(first);
    draft.assemblyDescription = describeConstruction(constructions[1], '合成試験');
    const values = {etaShgc: 0.49, ugWm2K: 1.23, visibleTransmittance: 0.67, visibleReflectance: 0};
    for (const k of METRICS) {
      draft.metrics[k].value = values[k];
      draft.metrics[k].resolvedSource.originalTable = '合成・構成Aの表・' + k;
      draft.metrics[k].evaluationScope = 'SYNTHETIC_SCOPE';
    }
    const a = await reviseUserEntry(first, draft, hash);
    const session = new GlazingSession({entries:[a], selectedEntryId:a.id}, hash);
    await session.update();
    const snapshotA = session.state.snapshot!;
    const bytesA = await session.export();
    session.startEdit();
    const b = await reviseUserEntry(a, {...a, assemblyDescription:describeConstruction(constructions[5], '合成試験')}, hash);
    session.replace(a.id, b); session.finishEdit();
    expect(b.metrics).toEqual(a.metrics);
    expect([a.userRevision, b.userRevision]).toEqual(['U2','U3']);
    expect(b.entryContentDigest).not.toBe(a.entryContentDigest);
    expect(session.state.snapshot).toBe(snapshotA);
    expect(table(snapshotA.workspace, false, 'STALE')).toContain(constructions[1].name);
    expect(session.current).toBe(false);
    await expect(session.export()).rejects.toThrow('CURRENT_REQUIRED');
    await session.update();
    expect(session.current).toBe(true);
    const stateB = session.state, bytesB = await session.export();
    expect(bytesB).not.toEqual(bytesA);
    const htmlB = table(stateB.snapshot!.workspace);
    expect(htmlB).toContain(constructions[5].name);
    for (const k of METRICS) {
      expect(htmlB).toContain('<strong>'+values[k]+'</strong>');
      expect(htmlB).toContain('合成・構成Aの表・'+k);
    }
    editor(b);
    const demo = table(stateB.snapshot!.workspace, true);
    expect(demo).toContain(sampleWarning);
    expect(demo).not.toContain('合成・構成Aの表');
    expect(demo).not.toContain(editorNote);
    expect(table(session.state.snapshot!.workspace)).toBe(htmlB);
    expect(session.current).toBe(true);
    expect(session.state).toEqual(stateB);
    expect(session.state.snapshot).toBe(stateB.snapshot);
    expect(await session.export()).toEqual(bytesB);
    const raw = new TextDecoder().decode(bytesB);
    expect(JSON.parse(raw).schemaVersion).toBe(1);
    expect(raw).not.toContain(editorNote);
    const fresh = new GlazingSession({entries:[first], selectedEntryId:first.id},hash);
    fresh.apply(await fresh.preview(raw),'workspace'); await fresh.update();
    expect(fresh.state.workspace.entries[0]).toEqual(b);
    expect(await fresh.export()).toEqual(bytesB);
  });

  it.each(METRICS)('explains applicability for a single known %s, including zero fractions', async k => {
    const entry = await newUserEntry('a','案1',hash);
    const draft = structuredClone(entry);
    draft.assemblyDescription = describeConstruction(constructions[5], '');
    draft.metrics[k].value = k === 'ugWm2K' ? 1.23 : 0;
    const actual = await reviseUserEntry(entry, draft, hash);
    const html = table({entries:[actual],selectedEntryId:actual.id});
    expect(html.match(/<strong>UNKNOWN<\/strong>/g)).toHaveLength(3);
    expect.soft(html.split(editorNote)).toHaveLength(2);
    expect(editor(actual).split(editorNote)).toHaveLength(2);
  });

  it('places the notice only in the applicable case column and excludes sample values', async () => {
    const known = await newUserEntry('known', '対象', hash);
    known.assemblyDescription = describeConstruction(constructions[2], '');
    known.metrics.visibleReflectance.value = 0;
    const unknown = await newUserEntry('unknown', '全て不明', hash);
    unknown.assemblyDescription = known.assemblyDescription;
    const custom = await newUserEntry('custom', '自由記述', hash);
    custom.assemblyDescription = '三層ガラス'; custom.metrics.ugWm2K.value = 1.23;
    const local: Entry = {origin:'local_record', id:'local', name:'合成ローカル資料', selection:recordSelection(await syntheticRecord(hash))};
    const w = {entries:[unknown, known, custom, local], selectedEntryId:unknown.id};
    const cells = table(w).split('<tbody>')[1]!.split('</tr>')[0]!.match(/<td>[\s\S]*?<\/td>/g)!;
    expect(cells.map(cell => cell.includes(editorNote))).toEqual([false,true,false,false]);
    expect(cells[3]).toContain(local.selection.savedAssembly.sourceNotation);
    for (const e of [unknown, custom, local]) expect(editor(e)).not.toContain(editorNote);
    const demo = table(w, true);
    expect(demo).not.toContain(editorNote);
    expect(demo).toContain(sampleWarning);
    expect(demo).toContain('対象外（ローカル資料）');
  });
});

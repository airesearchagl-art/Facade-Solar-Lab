import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import type { ReactElement } from 'react';
import { GlazingWorkspace } from '../src/app/components/glazing/GlazingWorkspace';
import { GlazingImportReview } from '../src/app/components/glazing/GlazingImportReview';
import { GlazingEntryEditor } from '../src/app/components/glazing/GlazingEntryEditor';
import { GlazingSession } from '../src/glazing/workspace';
import { newUserEntry } from '../src/glazing/user-entry';
import { serializeWorkspace } from '../src/glazing/json';
import { nodeSha256 } from './glazing-node-oracle.mjs';
import type { G1UserEntry, HashPort } from '../src/glazing/types';

// Only hook scheduling and the hash port are controlled. Production TSX callbacks,
// File decoding, preview/apply and GlazingSession are executed unchanged; no DOM claim.
const host = vi.hoisted(() => ({
  slots: [] as unknown[], cursor: 0, effects: [] as (() => void)[],
  cleanups: [] as (() => void)[], writes: 0,
  hashes: [] as { wait: Promise<void>; entered: () => void }[],
}));
vi.mock('react', async original => {
  const actual = await original<typeof import('react')>();
  return { ...actual,
    useState<T,>(initial: T | (() => T)) {
      const index = host.cursor++;
      if (!(index in host.slots)) host.slots[index] = typeof initial === 'function' ? (initial as () => T)() : initial;
      return [host.slots[index], (next: T | ((value: T) => T)) => {
        host.writes++;
        host.slots[index] = typeof next === 'function' ? (next as (value: T) => T)(host.slots[index] as T) : next;
      }];
    },
    useRef<T,>(initial: T) {
      const index = host.cursor++;
      if (!(index in host.slots)) host.slots[index] = { current: initial };
      return host.slots[index];
    },
    useEffect(setup: () => void | (() => void)) {
      const index = host.cursor++;
      if (!(index in host.slots)) {
        host.slots[index] = true;
        host.effects.push(() => { const cleanup = setup(); if (cleanup) host.cleanups.push(cleanup); });
      }
    },
  };
});
vi.mock('../src/app/glazing-file', async original => {
  const actual = await original<typeof import('../src/app/glazing-file')>();
  const { nodeSha256: sha } = await import('./glazing-node-oracle.mjs');
  return { ...actual, browserHash: async (bytes: Uint8Array) => {
    const latch = host.hashes.shift();
    if (latch) { latch.entered(); await latch.wait; }
    return sha(bytes);
  } };
});

const hash: HashPort = async bytes => nodeSha256(bytes);
let tree: ReactElement;
function draw() { host.cursor = 0; tree = GlazingWorkspace(); for (const effect of host.effects.splice(0)) effect(); return tree; }
function nodes(value: unknown = tree): ReactElement<any>[] {
  if (Array.isArray(value)) return value.flatMap(v => nodes(v ?? null));
  if (!value || typeof value !== 'object' || !('props' in value)) return [];
  const element = value as ReactElement<any>;
  return [element, ...nodes(element.props.children ?? null)];
}
function button(name: string) { draw(); return nodes().find(n => n.type === 'button' && n.props.children === name)!; }
function editor() { draw(); return nodes().find(n => n.type === GlazingEntryEditor)!.props; }
function review() { draw(); return nodes().find(n => n.type === GlazingImportReview)?.props; }
function status() { draw(); return nodes().find(n => n.props.role === 'status')!.props.children; }
function alert() { draw(); return nodes().find(n => n.props.role === 'alert')?.props.children; }
function session() { return host.slots.find(value => value instanceof GlazingSession) as GlazingSession; }
async function drain() { for (let i = 0; i < 100; i++) await Promise.resolve(); }
function latch() {
  let release!: () => void; let reject!: (error: Error) => void; let entered!: () => void;
  const wait = new Promise<void>((resolve, fail) => { release = resolve; reject = fail; });
  const started = new Promise<void>(resolve => { entered = resolve; });
  return { wait, started, entered, release, reject };
}
async function beginAdd() {
  const hold = latch(); host.hashes.push(hold);
  button('手入力案を追加').props.onClick(); await hold.started; return hold;
}
async function workspaceFile(id = 'B') {
  const entry = await newUserEntry(id, `SYNTHETIC ${id}`, hash);
  return new File([new Uint8Array(await serializeWorkspace({ entries: [entry], selectedEntryId: id }, hash))], 'synthetic.json');
}
function choose(file: File) {
  draw(); nodes().find(n => n.type === 'input' && n.props.type === 'file')!.props.onChange({ target: { files: [file], value: 'selected' } });
}
async function importB() { choose(await workspaceFile()); await vi.waitFor(() => expect(review()).toBeDefined()); review()!.onApply('workspace'); await drain(); }
function unmount() { for (const cleanup of host.cleanups.splice(0)) cleanup(); }
beforeEach(async () => {
  host.slots = []; host.cursor = 0; host.effects = []; host.cleanups = []; host.hashes = []; host.writes = 0;
  draw(); await vi.waitFor(() => expect(session()).toBeInstanceOf(GlazingSession)); draw();
});
afterEach(() => unmount());

describe('G1-IR-F01 actual TSX callbacks and real Session', () => {
  it('delayed add A cannot mutate imported B entries, selection, snapshot, revision or STALE', async () => {
    const a = await beginAdd(); await importB();
    button('比較を更新').props.onClick(); await vi.waitFor(() => expect(session().current).toBe(true));
    const afterB = session().state, revision = session().begin().revision;
    a.release(); await drain();
    expect(session().state).toEqual(afterB);
    expect(session().state.snapshot).toBe(afterB.snapshot);
    expect(session().begin().revision).toBe(revision);
    expect(session().state.workspace.entries.map(e => e.id)).toEqual(['B']);
    expect(session().current).toBe(true); expect(alert()).toBeUndefined();
  });
  it('a normal add still publishes and selects the new entry', async () => {
    const a = await beginAdd(); a.release(); await drain();
    const w = session().state.workspace;
    expect(w.entries).toHaveLength(2); expect(w.selectedEntryId).toBe(w.entries[1]!.id); expect(alert()).toBeUndefined();
  });
  it('import preview cancellation invalidates A and preserves the existing snapshot', async () => {
    await session().update(); const original = session().state;
    const a = await beginAdd(); choose(await workspaceFile());
    await vi.waitFor(() => expect(review()).toBeDefined()); review()!.onCancel();
    const writes = host.writes; a.release(); await drain();
    expect(session().state).toEqual(original); expect(host.writes).toBe(writes); expect(review()).toBeUndefined();
  });
  it.each(['resolve', 'reject'] as const)('unmount invalidates A, including %s and finally', async outcome => {
    const a = await beginAdd(); const before = session().state; unmount(); const writes = host.writes;
    if (outcome === 'resolve') a.release(); else a.reject(Error('OLD_A'));
    await drain(); expect(session().state).toEqual(before); expect(host.writes).toBe(writes);
  });
  it('successive adds only allow the newer completion even if busy is bypassed', async () => {
    const a = await beginAdd(); const c = await beginAdd(); c.release(); await drain();
    const afterC = session().state; expect(afterC.workspace.entries).toHaveLength(2);
    a.release(); await drain(); expect(session().state).toEqual(afterC); expect(alert()).toBeUndefined();
  });
  it('old error/finally cannot clear newer busy or publish an alert', async () => {
    const a = await beginAdd(), read = latch(), file = await workspaceFile();
    const bytes = await file.arrayBuffer();
    Object.defineProperty(file, 'arrayBuffer', { value: async () => { read.entered(); await read.wait; return bytes; } });
    choose(file); await read.started; const before = status(), writes = host.writes;
    expect(JSON.stringify(before)).toContain('処理中'); a.reject(Error('OLD_A')); await drain();
    expect(status()).toEqual(before); expect(alert()).toBeUndefined(); expect(host.writes).toBe(writes);
    read.release(); await vi.waitFor(() => expect(review()).toBeDefined()); review()!.onCancel();
  });
  it('old error/finally cannot replace a newer import error', async () => {
    const a = await beginAdd(); choose(new File(['{'], 'invalid.json'));
    await vi.waitFor(() => expect(alert()).toContain('JSON_SYNTAX'));
    const currentAlert = alert(), before = session().state, writes = host.writes;
    a.reject(Error('OLD_A')); await drain();
    expect(alert()).toBe(currentAlert); expect(session().state).toEqual(before); expect(host.writes).toBe(writes);
  });
  it('cancelled editor save cannot publish after a new Workspace import', async () => {
    const props = editor(); props.onDirty();
    const draft = structuredClone(session().state.workspace.entries[0]) as G1UserEntry; draft.name = 'OLD EDIT';
    const held = latch(); host.hashes.push(held);
    const saving = editor().onSave(draft) as Promise<void>; await held.started;
    editor().onCancel(); await importB(); const afterB = session().state, writes = host.writes;
    held.release(); await saving; await drain();
    expect(session().state).toEqual(afterB); expect(host.writes).toBe(writes); expect(alert()).toBeUndefined();
  });
  it('unmount invalidates an in-flight Session update as well as UI publication', async () => {
    const held = latch(); host.hashes.push(held); button('比較を更新').props.onClick(); await held.started;
    const before = session().state; unmount(); const writes = host.writes;
    held.release(); await drain(); expect(session().state).toEqual(before); expect(host.writes).toBe(writes);
  });
});

describe('G3 screen controls with the existing G1 callback host (non-GUI)', () => {
  function input(type: string) {
    draw();
    return nodes().find(n => n.type === 'input' && n.props.type === type)!;
  }

  it('changes project name and toggles the actual table without changing session, ticket or saved bytes', async () => {
    const { GlazingComparisonTable, sampleWarning } = await import('../src/app/components/glazing/GlazingComparisonTable');
    const tableProps = () => { draw(); return nodes().find(n => n.type === GlazingComparisonTable)!.props; };
    await session().update();
    const before = session().state, bytes = await session().export();
    const ticket = session().begin();
    expect(input('text').props.value).toBe('');
    for (const value of ['試験案件A','編集中の案件B']) {
      input('text').props.onChange({target:{value}});
      expect(input('text').props.value).toBe(value);
    }
    expect(input('text').props.autoComplete).toBe('off');
    expect(nodes().some(n => n.type === 'label' && nodes(n.props.children).some(x => x.props['aria-describedby'] === 'glazing-project-help'))).toBe(true);
    const real = tableProps();
    expect(real.sample).toBe(false);
    input('checkbox').props.onChange({target:{checked:true}});
    expect(tableProps()).toEqual({...real, sample:true});
    expect(JSON.stringify(nodes().find(n => n.props.role === 'note')!.props.children)).toContain(sampleWarning);
    expect(session().state).toEqual(before);
    expect(session().state.snapshot).toBe(before.snapshot);
    // A presentation change cannot supersede a previously obtained Session ticket.
    const probe = new GlazingSession(before.workspace, hash);
    expect(session().begin().generation).toBe(ticket.generation + 1);
    expect(await session().export()).toEqual(bytes);
    const raw = new TextDecoder().decode(await session().export());
    expect(raw).not.toMatch(/試験案件|編集中の案件|架空データ/);
    probe.apply(await probe.preview(raw), 'workspace');
    expect(probe.state.workspace).toEqual(before.workspace);
    input('checkbox').props.onChange({target:{checked:false}});
    expect(tableProps()).toEqual(real);
    unmount(); host.slots = []; draw(); await vi.waitFor(() => expect(session()).toBeInstanceOf(GlazingSession));
    expect(input('text').props.value).toBe('');
    expect(input('checkbox').props.checked).toBe(false);
  });

  it('applies a real editor category callback, preserves detailed input and moves STALE to Current', async () => {
    const { syntheticRecord } = await import('./glazing-fixture');
    const { reviseUserEntry } = await import('../src/glazing/user-entry');
    const { constructionDescription } = await import('../src/app/components/glazing/generic-constructions');
    const first = await newUserEntry('entry', '案1', hash);
    const draft = structuredClone(first);
    draft.assemblyDescription = '  独自の自由記述\n第二行  ';
    draft.assembly = (await syntheticRecord(hash)).record.assembly;
    draft.metrics.visibleReflectance.value = 0.271;
    draft.metrics.visibleReflectance.resolvedSource.originalTable = '試験用の表';
    const initial = await reviseUserEntry(first, draft, hash);
    const owner = new GlazingSession({entries:[initial],selectedEntryId:initial.id}, hash);
    await owner.update();
    host.slots = [];
    function renderEditor() {
      host.cursor = 0;
      return GlazingEntryEditor({entry: initial, busy: false, onDirty: () => owner.startEdit(), onCancel: () => {},
        onSave: async edited => {
          if (edited.origin !== 'user_entry') throw Error('user_entry expected');
          owner.replace(initial.id, await reviseUserEntry(initial, edited, hash)); owner.finishEdit();
        }});
    }
    const select = () => nodes(renderEditor()).find(n => n.type === 'select')!;
    select().props.onChange({target:{value:'triple'}});
    expect(select().props.value).toBe('triple');
    expect(owner.current).toBe(false);
    expect(owner.state.workspace.entries[0]).toEqual(initial);
    renderEditor().props.onSubmit({preventDefault(){}});
    await vi.waitFor(() => expect(owner.state.editing).toBe(false));
    const edited = owner.state.workspace.entries[0] as G1UserEntry;
    expect(constructionDescription(edited.assemblyDescription).notes).toBe(draft.assemblyDescription);
    expect(constructionDescription(edited.assemblyDescription).selected.id).toBe('triple');
    expect(edited.assembly).toEqual(initial.assembly);
    expect(edited.metrics).toEqual(initial.metrics);
    expect(edited.userRevision).toBe('U3');
    expect(edited.entryContentDigest).not.toBe(initial.entryContentDigest);
    expect(owner.current).toBe(false);
    await owner.update(); expect(owner.current).toBe(true);
  });
});

it('switches through all four saved drafts via the Workspace controls and refreshes the same four columns', async () => {
  const { constructions, describeConstruction, constructionDescription } = await import('../src/app/components/glazing/generic-constructions');
  const { GlazingComparisonTable } = await import('../src/app/components/glazing/GlazingComparisonTable');
  const ids: string[] = [];
  for (let i = 0; i < 4; i++) {
    if (i > 0) {
      button('手入力案を追加').props.onClick();
      await vi.waitFor(() => expect(session().state.workspace.entries).toHaveLength(i + 1));
    }
    const item = structuredClone(editor().entry) as G1UserEntry;
    ids.push(item.id);
    item.name = '比較用の案'+(i+1);
    item.assemblyDescription = describeConstruction(constructions[i+1]!, '注記'+i);
    editor().onDirty();
    await editor().onSave(item);
  }
  expect(button('手入力案を追加').props.disabled).toBe(true);
  for (const [i, id] of ids.entries()) {
    draw(); nodes().find(n => n.type === 'select')!.props.onChange({target:{value:id}});
    await drain();
    const active = editor().entry as G1UserEntry;
    expect([active.id, active.name, constructionDescription(active.assemblyDescription).selected.id])
      .toEqual([id,'比較用の案'+(i+1),constructions[i+1]!.id]);
  }
  button('比較を更新').props.onClick();
  await vi.waitFor(() => expect(session().current).toBe(true));
  draw();
  const comparison = nodes().find(n => n.type === GlazingComparisonTable)!.props;
  expect(comparison.status).toBe('Current');
  expect(comparison.workspace.entries.map((e: G1UserEntry) => e.id)).toEqual(ids);
});


it('G3 manual metrics: draft applicability follows the actual category, input and UNKNOWN controls', async () => {
  const entry = await newUserEntry('draft', '合成案', hash);
  const original = structuredClone(entry);
  host.slots = [];
  function controls() {
    host.cursor = 0;
    return nodes(GlazingEntryEditor({entry, busy:false, onDirty(){}, async onSave(){}, onCancel(){}}));
  }
  const category = (value: string) => controls().find(n => n.type === 'select')!.props.onChange({target:{value}});
  const typeValue = (index: number, value: string) => controls().filter(n => n.props.inputMode === 'decimal')[index]!.props.onChange({target:{value}});
  const unknown = (index: number, checked: boolean) => controls().filter(n => n.props.type === 'checkbox')[index]!.props.onChange({target:{checked}});
  const showsNote = () => controls().some(n => n.type === 'p' && n.props.children === '手入力値と出典がこの構成に当てはまるかは未確認です。');

  category('single'); unknown(0, false);
  for (const raw of ['', 'x', '0x1', '-0', '1.01']) {
    typeValue(0, raw); expect(showsNote(), raw).toBe(false);
  }
  typeValue(0, '0'); expect(showsNote()).toBe(true);
  category('triple'); expect(showsNote()).toBe(true);
  category('custom'); expect(showsNote()).toBe(false);
  category('triple'); unknown(0, true); expect(showsNote()).toBe(false);
  unknown(1, false);
  for (const raw of ['0', '1e309']) {
    typeValue(1, raw); expect(showsNote(), raw).toBe(false);
  }
  typeValue(1, '2.3'); expect(showsNote()).toBe(true);
  expect(entry).toEqual(original);
});

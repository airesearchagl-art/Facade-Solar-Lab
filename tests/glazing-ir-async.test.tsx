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

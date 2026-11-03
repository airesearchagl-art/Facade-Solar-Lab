import markAbRaw from './glazing-ir-legacy-v1-mark-ab.json?raw';
import markC3Raw from './glazing-ir-legacy-v1-mark-c3.json?raw';
import markAbSpaceRaw from './glazing-ir-legacy-v1-mark-ab-space.json?raw';
import discountRaw from './glazing-ir-legacy-v1-discount.json?raw';
import japaneseRaw from './glazing-ir-legacy-v1-japanese.json?raw';
import { describe, it, expect } from 'vitest';
import { entry, url } from '../src/glazing/validation';
import { newUserEntry, reviseUserEntry } from '../src/glazing/user-entry';
import { userDigest } from '../src/glazing/digest';
import { serializeWorkspace, parseInput } from '../src/glazing/json';
import { GlazingSession } from '../src/glazing/workspace';
import { canonical, userTuple } from '../src/glazing/canonical';
import { WORKSPACE_KIND, type HashPort } from '../src/glazing/types';
import { readGlazingFile } from '../src/app/glazing-file';
import { nodeSha256 } from './glazing-node-oracle.mjs';
const hash: HashPort = async bytes => nodeSha256(bytes);
// Independent Node SHA of a structurally consistent payload makes a matching digest;
// rejection must be the URL rule, not an incidental USER_DIGEST_MISMATCH.
function digestUnchecked(e: Parameters<typeof userTuple>[0]) {
  return 'glz-user-entry-v1:sha256:' + Array.from(nodeSha256(new TextEncoder().encode(canonical(userTuple(e)))), b => b.toString(16).padStart(2, '0')).join('');
}
const nestedKey = (key: string, depth: number) => { for (let i=0;i<depth;i++) key=encodeURIComponent(key); return key; };
// Assert the rejection reason: a failing UTF-8 decode must not mask a hidden key.
const h1Rejections: Record<string, string> = {
  '?mark%25AB%2574oken=IR_ONLY': 'URL_CREDENTIAL',
  '?%25E0%25A4%2561u%2574h=IR_ONLY': 'URL_CREDENTIAL',
  '?q=1&q=2&%25C0%25AF%252553IGNATURE=IR_ONLY': 'URL_CREDENTIAL',
  '?t%256Fk%2565n%25C3=IR_ONLY': 'URL_CREDENTIAL',
  '?%2500=x': 'URL_CONTROL',
  '?mark%25AB%2501=x': 'URL_CONTROL',
  '?mark%25C3%257F=x': 'URL_CONTROL',
  '?value=x\u0001y': 'URL_CONTROL',
  ['?mark%25AB' + nestedKey('%74oken', 8) + '=IR_ONLY']: 'URL_ENCODING_DEPTH',
};
const bad = [
  ...Object.keys(h1Rejections),
  '?token=IR_ONLY', '?%74oken=IR_ONLY', '?access_token=IR_ONLY', '?access_%74oken=IR_ONLY',
  '?To%4bEn=IR_ONLY', '?access_%54oKeN=IR_ONLY', '?q=ok&%74oken=IR_ONLY&q=second',
  '?%74oken=first&token=second', '?%2574oken=IR_ONLY', '?%252574oken=IR_ONLY',
  '?%61ccess_%2574oken=IR_ONLY', '?%61pi_%6bey=IR_ONLY', '?%73ignature=IR_ONLY',
  '?q=%', '?%7=bad', '?%GG=bad', '?%C0%AF=bad', '?%E0%A4=bad',
  '?%2500safe=bad', '?%74oken',
  '?to%256ben=IR_ONLY', '?%2554o%254bEn=IR_ONLY', '?q=ok&q=two&%2574oken=IR_ONLY',
  '?safe%25-%2574oken=IR_ONLY', '?%2525-%2574oken=IR_ONLY',
  '?raw%=x', '?raw%2=x', '?%ED%A0%80=x',
  '?%00=x', '?%1f=x', '?%7F=x', '?%257F=x', '?%250A=x',
  '?' + nestedKey('discount%', 9) + '=10',
  '?' + nestedKey('%74oken', 8) + '=IR_ONLY',
];
describe('G1-IR-F02 credential URL boundaries', () => {
  it.each(bad)('rejects %s in validation/digest/serialize/parse/preview without mutation', async query => {
    const initial = await newUserEntry('a', 'SYNTHETIC', hash);
    const session = new GlazingSession({ entries: [initial], selectedEntryId: 'a' }, hash); await session.update();
    const original = session.state, revision = session.begin().revision;
    const changed = structuredClone(initial); changed.metrics.etaShgc.resolvedSource.originalSourceUrl = 'https://example.invalid/' + query;
    changed.entryContentDigest = digestUnchecked(changed);
    const w = { entries: [changed], selectedEntryId: 'a' };
    let hashCalls = 0; const counted: HashPort = async b => { hashCalls++; return hash(b); };
    const valid = (() => { try { entry(changed); return true; } catch { return false; } })();
    const results = await Promise.allSettled([
      userDigest(changed, counted), serializeWorkspace(w, counted),
      parseInput(JSON.stringify({ kind: WORKSPACE_KIND, schemaVersion: 1, workspace: w }), counted),
      session.preview(JSON.stringify({ kind: WORKSPACE_KIND, schemaVersion: 1, workspace: w })),
      reviseUserEntry(initial, changed, counted),
    ]);
    expect(valid).toBe(false); expect(results.map(r => r.status)).toEqual(Array(5).fill('rejected'));
    expect(hashCalls).toBe(0); expect(session.state).toEqual(original); expect(session.current).toBe(true);
    expect(session.state.snapshot).toBe(original.snapshot); expect(session.begin().revision).toBe(revision);
    for (const result of results) {
      if (result.status === 'rejected') {
        expect(String(result.reason)).not.toContain('USER_DIGEST_MISMATCH');
        if (h1Rejections[query]) expect(result.reason.message).toBe(h1Rejections[query]);
      }
    }
  });
  it.each([
    'https://example.invalid/table?%71=%E6%97%A5%E6%9C%AC&%70age=2',
    'http://example.invalid/?%63ategory=glass&category=coated',
    'https://example.invalid/?q=100%25&name=a+b',
    'https://example.invalid/?%2571=glass',
    'https://example.invalid/%E8%A1%A8?q=x#section-2',
    // H1 changes these two former URL_ESCAPE cases to literal data after the raw layer.
    'https://example.invalid/?%25E0%25A4=x',
    'https://example.invalid/?%25C0%25AF=x',
    'https://example.invalid/table?mark%25AB=10',
    'https://example.invalid/table?mark%25C3=10',
    'https://example.invalid/table?mark%25AB%2520name=10',
    'https://example.invalid/table?mark%25AB%252571=10&mark%25C3=20',
    'https://example.invalid/table?' + nestedKey('mark%AB', 8) + '=10',
    'https://example.invalid/table?discount%25=10',
    'https://example.invalid/table?%E5%89%B2%E5%90%88%25=10',
    'https://example.invalid/table?discount%2525=10',
    'https://example.invalid/table?item%20name=glass',
    'https://example.invalid/table?discount%25%2520rate=10',
    'https://example.invalid/table?discount%25off=10',
    'https://example.invalid/table?%25GG=10',
    'https://example.invalid/table?%2525GG=10',
    'https://example.invalid/table?' + nestedKey('discount%', 8) + '=10',
    'https://example.invalid/table?' + nestedKey('割合%', 3) + '=10',
  ])('preserves a legitimate encoded URL byte-for-byte: %s', async value => {
    expect(() => url(value)).not.toThrow();
    const initial = await newUserEntry('a', 'SYNTHETIC', hash), draft = structuredClone(initial);
    draft.metrics.etaShgc.resolvedSource.originalSourceUrl = value;
    const edited = await reviseUserEntry(initial, draft, hash);
    expect(() => entry(edited)).not.toThrow();
    expect(await userDigest(edited, hash)).toBe(edited.entryContentDigest);
    const bytes = await serializeWorkspace({ entries: [edited], selectedEntryId: 'a' }, hash);
    const parsed = await parseInput(new TextDecoder().decode(bytes), hash);
    expect(parsed.kind).toBe(WORKSPACE_KIND);
    if (parsed.kind !== WORKSPACE_KIND) throw Error('workspace expected');
    expect(parsed.workspace.entries[0]).toEqual(edited);
    const session = new GlazingSession({ entries: [initial], selectedEntryId: 'a' }, hash);
    const original = session.state;
    const file = new File([new Uint8Array(bytes)], 'synthetic-url-v1.json', {type:'application/json'});
    const preview = await session.preview(await readGlazingFile(file));
    expect(session.state).toEqual(original); session.apply(preview, 'workspace');
    expect(session.state.workspace).toEqual(parsed.workspace);
    const restored = session.state.workspace.entries[0]!;
    if (restored.origin !== 'user_entry') throw Error('user entry expected');
    expect(restored.metrics.etaShgc.resolvedSource).toEqual(edited.metrics.etaShgc.resolvedSource);
    expect(restored.metrics.etaShgc.resolvedSource.originalSourceUrl).toBe(value);
    await session.update(); expect(await session.export()).toEqual(bytes);
  });
});

// Frozen regression bytes regenerated with the pre-001 serializer and parser.
// These are not claimed to be the Independent Reviewer original files.
describe('G1-IR-001R legacy v1 bytes', () => {
  it.each([
    ['mark-ab', 'a730758433291d25242bf134029ae5b800f9cc7ca43eb6f809fce326bd5fe9c3', 5603, markAbRaw],
    ['mark-c3', 'ebe5af4bb682eb19f4600612bfeedaa87a572bdeeabb8ccf5c0b37ba8e2a8a7f', 5603, markC3Raw],
    ['mark-ab-space', 'b57496292970aca3ee662f31b7b5b2d674531da87df19c2c8c9dce158633ed92', 5612, markAbSpaceRaw],
    ['discount', '068d0093cc2d778f343a781626768815d719eea7f877579da21dff2b6e4db0af', 5255, discountRaw],
    ['japanese', 'cf7440ab136002c85ccdeb6e05d3cd3beda88ae1e50d4387c01de0dfc2beb9f2', 5265, japaneseRaw],
  ] as const)('restores frozen regenerated v1 %s bytes without changing source or digest', async (_name, expected, size, fixtureUtf8) => {
    const raw = new TextEncoder().encode(fixtureUtf8);
    expect(raw.length).toBe(size);
    expect(Array.from(nodeSha256(raw), b => b.toString(16).padStart(2, '0')).join('')).toBe(expected);
    const decoded = await readGlazingFile(new File([raw], 'legacy-v1.json', {type:'application/json'}));
    const parsed = await parseInput(decoded, hash);
    if (parsed.kind !== WORKSPACE_KIND) throw Error('workspace expected');
    const initial = await newUserEntry('current', 'CURRENT', hash);
    const session = new GlazingSession({entries:[initial],selectedEntryId:initial.id},hash); await session.update();
    const before = session.state;
    const preview = await session.preview(decoded); expect(session.state).toEqual(before);
    session.apply(preview,'workspace'); expect(session.state.workspace).toEqual(parsed.workspace);
    expect(session.state.workspace).toEqual(JSON.parse(decoded).workspace);
    await session.update(); expect(await session.export()).toEqual(raw);
    expect(await serializeWorkspace(parsed.workspace,hash)).toEqual(raw);
  });
});

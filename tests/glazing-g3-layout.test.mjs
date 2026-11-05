import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const source = path => readFileSync(new URL('../src/app/' + path, import.meta.url), 'utf8');

it('loads the focus and horizontal scrolling rules at 390px', () => {
  const css = source('glazing.css');
  expect(source('App.tsx')).toContain('import "./glazing.css"');
  expect(css).toMatch(/\.glazing-table-scroll\s*\{[^}]*overflow-x:\s*auto/);
  expect(css).toMatch(/@media \(max-width: 600px\)[\s\S]*?\.glazing-metric-grid\s*\{\s*grid-template-columns:\s*1fr/);
  expect(css).toContain(':focus-visible');
});

it('keeps project name and demo components free of logging, network and persistence APIs', () => {
  for (const file of ['GlazingWorkspace.tsx','GlazingEntryEditor.tsx','GlazingComparisonTable.tsx','generic-constructions.ts']) {
    const content = source('components/glazing/'+file);
    expect(content, file).not.toMatch(/\b(?:console|fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|caches)\b|document\.cookie/);
  }
});

it('keeps narrow navigation in flow and provides bounded two-axis table context', () => {
  const nav = source('styles.css');
  expect(nav).toMatch(/@media \(max-width: 720px\)[\s\S]*?\.mode-switch\s*\{[^}]*position:\s*static/);
  for (const block of nav.matchAll(/\.mode-switch\s*\{([^}]*)\}/g)) expect(block[1]).not.toMatch(/margin(?:-bottom)?:[^;]*-\d/);
  const css = source('glazing.css');
  expect(css).toContain('overflow-y: auto');
  expect(css).toContain('max-height: 70vh');
  expect(css).toContain('scroll-padding-left: var(--glazing-label-width)');
  expect(css).toContain('scroll-snap-type: x mandatory');
  expect(css).toMatch(/thead th:not\(:first-child\)\s*\{[^}]*scroll-snap-align: start;[^}]*scroll-snap-stop: always/);
  expect(css).toMatch(/th\[scope="row"\][^{]*\{[^}]*position: sticky;[^}]*left: 0/);
  expect(css).toMatch(/thead th\s*\{[^}]*position: sticky;[^}]*top: 0/);
});

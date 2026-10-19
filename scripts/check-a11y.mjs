#!/usr/bin/env node
/**
 * Accessibility gate (architect.md §19.1, §21 T4).
 *
 * axe-core run over the built HTML in jsdom — no browser, no ChromeDriver,
 * works the same locally and in CI.
 *
 * LIMITATION, stated honestly: jsdom does not do layout or paint, so the
 * colour-contrast rule cannot run here. Contrast is verified separately
 * against the token pairs in architect.md §9.2 by check-contrast.mjs.
 * Everything structural — labels, alt text, landmarks, heading order,
 * ARIA validity, link names, form wiring — is covered.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import axe from 'axe-core';

const DIST = 'dist';

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = (await walk(DIST)).sort();
let totalViolations = 0;
const report = [];

for (const file of files) {
  const page = '/' + relative(DIST, file).replace(/index\.html$/, '');
  const html = await readFile(file, 'utf8');

  // Silence jsdom's "canvas not implemented" notices — axe probes for canvas
  // support and jsdom has none. Real errors still surface.
  const virtualConsole = new VirtualConsole();
  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole,
  });
  const { window } = dom;

  window.eval(axe.source);

  const results = await window.axe.run(window.document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false } },
    resultTypes: ['violations'],
  });

  if (results.violations.length) {
    totalViolations += results.violations.length;
    report.push({ page, violations: results.violations });
  }
  window.close();
}

console.log(`check-a11y: ${files.length} page(s) scanned with axe-core`);

if (totalViolations) {
  console.error(`\n${totalViolations} violation(s):`);
  for (const r of report) {
    console.error(`\n  ${r.page}`);
    for (const v of r.violations) {
      console.error(`    ✗ [${v.impact}] ${v.id}: ${v.help}`);
      for (const n of v.nodes.slice(0, 2)) {
        console.error(`        ${n.html.slice(0, 120)}`);
      }
    }
  }
  process.exit(1);
}
console.log('check-a11y: OK — zero violations');

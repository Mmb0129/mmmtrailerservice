#!/usr/bin/env node
/**
 * Source discipline gate (architect.md §29.3).
 *
 *   1. Contact details exist ONLY in src/data/business.ts.
 *   2. Brand colours exist ONLY in tokens.css and theme.ts.
 *   3. `outline: none` never appears.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const rules = [
  {
    name: 'contact details outside business.ts',
    pattern: /9384943004|9842596918|mmmtrailerservice@gmail|MMDA Mathur/,
    allow: ['src/data/business.ts'],
    exts: ['.astro', '.ts', '.js', '.mjs'],
  },
  {
    name: 'hard-coded brand colour',
    pattern: /#[0-9a-fA-F]{6}\b/,
    allow: ['src/styles/tokens.css', 'src/data/theme.ts'],
    exts: ['.astro', '.ts'],
  },
  {
    name: 'removed focus outline',
    pattern: /outline:\s*none/,
    allow: [],
    exts: ['.astro', '.css'],
  },
];

const files = await walk('src');
const errors = [];

for (const file of files) {
  const norm = file.split('\\').join('/');
  const text = await readFile(file, 'utf8');
  for (const rule of rules) {
    if (!rule.exts.some((x) => norm.endsWith(x))) continue;
    if (rule.allow.includes(norm)) continue;
    text.split('\n').forEach((line, i) => {
      if (rule.pattern.test(line)) {
        errors.push(`${norm}:${i + 1}  ${rule.name}\n      ${line.trim().slice(0, 100)}`);
      }
    });
  }
}

console.log(`check-sources: scanned ${files.length} file(s)`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('check-sources: OK');

#!/usr/bin/env node
/**
 * Colour contrast gate (architect.md §9.2).
 *
 * axe-core runs in jsdom, which has no layout engine and therefore cannot
 * compute contrast. This checks the documented token pairs directly against
 * the values in tokens.css, so the ratios in the architecture are verified
 * rather than asserted.
 */
import { readFile } from 'node:fs/promises';

const css = await readFile('src/styles/tokens.css', 'utf8');

function token(name) {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!m) throw new Error(`token --${name} not found in tokens.css`);
  return m[1];
}

function luminance(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** [foreground, background, minimum, what it is used for] */
const PAIRS = [
  ['ink-900', 'paper', 4.5, 'body text on page ground'],
  ['ink-600', 'paper', 4.5, 'secondary text'],
  ['ink-400', 'paper', 4.5, 'captions and meta at 14px — normal text, so AA is 4.5:1'],
  ['navy-800', 'gold-500', 4.5, 'primary CTA'],
  ['on-navy-100', 'navy-800', 4.5, 'white on navy'],
  ['on-navy-200', 'navy-800', 4.5, 'high-emphasis on navy'],
  ['on-navy-300', 'navy-800', 4.5, 'body on navy'],
  ['on-navy-400', 'navy-900', 4.5, 'muted on deep navy'],
  ['gold-500', 'navy-800', 4.5, 'links on navy'],
  ['gold-text', 'white', 4.5, 'eyebrows and small links on white'],
  ['gold-text', 'paper', 4.5, 'eyebrows and small links on paper'],
  ['gold-600', 'white', 3.0, 'borders, rules and icons only — never text'],
  ['error', 'white', 4.5, 'error text'],
  ['error-ink', 'error-bg', 4.5, 'error panel'],
  ['ok', 'white', 4.5, 'success text'],
];

const problems = [];
console.log('check-contrast: token pairs from architect.md §9.2\n');

for (const [fg, bg, min, use] of PAIRS) {
  const r = ratio(token(fg), token(bg));
  const ok = r >= min;
  if (!ok) problems.push(`--${fg} on --${bg} is ${r.toFixed(2)}:1, needs ${min}:1 (${use})`);
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(6)}:1  (min ${min})  --${fg} on --${bg}  — ${use}`,
  );
}

if (problems.length) {
  console.error(`\n${problems.length} contrast failure(s):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log('\ncheck-contrast: OK');

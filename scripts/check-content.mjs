#!/usr/bin/env node
/**
 * Content gates (architect.md §21 T9, T10 + §25).
 *
 *   1. Service and route pages must be >= 80% unique against each other —
 *      the thin-content guard that keeps lane pages honest.
 *   2. Every <img> needs alt, width and height.
 *   3. No generated image may exceed its source width (no upscaling).
 *   4. No forbidden claim may reappear anywhere in the rendered HTML.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';

const DIST = 'dist';
const SRC_PHOTOS = 'src/assets/photos';
const MAX_SIMILARITY = 0.2;

/** Claims removed in SEC-003; they must never come back (architect.md §4.3). */
const FORBIDDEN = [
  /fully covered/i,
  /\b24\s*\/\s*7\b/,
  /no middlemen/i,
  /trusted since/i,
  /\binsured\b/i,
  /100%\s*(on[- ]time|guarantee)/i,
  /guaranteed delivery/i,
  /we are the (?:best|leading|number one|no\.? ?1)/i,
  /world[- ]class/i,
];

async function walk(dir, filter) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p, filter)));
    else if (filter(e.name)) out.push(p);
  }
  return out;
}

const errors = [];
const htmlFiles = await walk(DIST, (n) => n.endsWith('.html'));

/* ── 1. Similarity across service and route pages ─────────────────── */
function bodyText(html) {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  return main
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

function shingles(text, n = 5) {
  const words = text.split(' ').filter(Boolean);
  const set = new Set();
  for (let i = 0; i + n <= words.length; i++) set.add(words.slice(i, i + n).join(' '));
  return set;
}

for (const group of ['services', 'routes']) {
  const pages = htmlFiles.filter(
    (f) => relative(DIST, f).startsWith(group) && !relative(DIST, f).endsWith('index.html'),
  );
  const docs = [];
  for (const f of pages) docs.push({ f, s: shingles(bodyText(await readFile(f, 'utf8'))) });

  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const a = docs[i].s;
      const b = docs[j].s;
      if (!a.size || !b.size) continue;
      let shared = 0;
      for (const sh of a) if (b.has(sh)) shared++;
      const sim = shared / Math.min(a.size, b.size);
      if (sim > MAX_SIMILARITY) {
        errors.push(
          `similarity ${(sim * 100).toFixed(0)}% between ${relative(DIST, docs[i].f)} and ${relative(DIST, docs[j].f)} (max ${MAX_SIMILARITY * 100}%)`,
        );
      }
    }
  }
}

/* ── 2 + 4. Per-page image attributes and forbidden claims ────────── */
for (const file of htmlFiles) {
  const page = '/' + relative(DIST, file).replace(/index\.html$/, '');
  const html = await readFile(file, 'utf8');

  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    if (!/\salt=/.test(tag)) errors.push(`${page}: <img> without alt — ${tag.slice(0, 80)}`);
    if (!/\swidth=/.test(tag) || !/\sheight=/.test(tag)) {
      errors.push(`${page}: <img> without width/height (causes CLS) — ${tag.slice(0, 80)}`);
    }
  }

  const text = bodyText(html);
  for (const re of FORBIDDEN) {
    if (re.test(text)) errors.push(`${page}: forbidden claim matched ${re}`);
  }
}

/* ── 3b. Inline scripts vs the CSP ────────────────────────────────── */
// netlify.toml sets script-src 'self', which forbids inline scripts. Astro
// will inline a small bundle unless told not to, and the result is silently
// blocked in the browser — forms keep working via native POST, but the
// progressive enhancement never runs. This catches that regression.
for (const file of htmlFiles) {
  const page = '/' + relative(DIST, file).replace(/index\.html$/, '');
  const html = await readFile(file, 'utf8');
  for (const tag of html.match(/<script\b[^>]*>/gi) ?? []) {
    const isJsonLd = /type=["']application\/ld\+json["']/.test(tag);
    const hasSrc = /\ssrc=/.test(tag);
    if (!isJsonLd && !hasSrc) {
      errors.push(
        `${page}: inline <script> would be blocked by script-src 'self' — ${tag.slice(0, 70)}`,
      );
    }
  }
}

/* ── 3. No upscaling ──────────────────────────────────────────────── */
let sourceWidths = new Map();
try {
  const { default: sharp } = await import('sharp');
  for (const f of await walk(SRC_PHOTOS, (n) => /\.(jpe?g|png)$/i.test(n))) {
    const { width } = await sharp(f).metadata();
    sourceWidths.set(basename(f).replace(/\.(jpe?g|png)$/i, ''), width ?? 0);
  }
  const assets = await walk(join(DIST, '_astro'), (n) => /\.(jpe?g|webp|avif|png)$/i.test(n));
  for (const f of assets) {
    const stem = basename(f).split('.')[0];
    const src = [...sourceWidths.entries()].find(([k]) => stem === k);
    if (!src) continue;
    const { width } = await sharp(f).metadata();
    if ((width ?? 0) > src[1]) {
      errors.push(`${basename(f)}: ${width}px exceeds source ${src[1]}px — upscaled`);
    }
  }
} catch (err) {
  errors.push(`image check could not run: ${err.message}`);
}

console.log(
  `check-content: ${htmlFiles.length} page(s), ${sourceWidths.size} source photo(s)`,
);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('check-content: OK');

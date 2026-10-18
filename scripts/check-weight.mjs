#!/usr/bin/env node
/**
 * Page-weight gate (architect.md §18.2).
 *
 * Measures what a first-time visitor actually downloads: the HTML, the CSS
 * and JS it references, the fonts it preloads, and the largest image variant
 * the browser would realistically pick — not every generated derivative.
 *
 * This is a static approximation, not a field measurement. Lighthouse on a
 * deploy preview is still required before anyone claims a CWV number
 * (TEST-009).
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const BUDGETS = { html: 20_000, css: 20_000, js: 15_000, total: 800_000 };

async function walk(dir, f) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p, f)));
    else if (f(e.name)) out.push(p);
  }
  return out;
}

const gz = async (p) => gzipSync(await readFile(p)).length;
const raw = async (p) => (await stat(p)).size;

const pages = (await walk(DIST, (n) => n.endsWith('.html'))).sort();
const rows = [];
const problems = [];

for (const file of pages) {
  const page = '/' + relative(DIST, file).replace(/index\.html$/, '');
  const html = await readFile(file, 'utf8');

  const htmlGz = gzipSync(Buffer.from(html)).length;

  let cssGz = 0;
  for (const m of html.matchAll(/<link[^>]+href="(\/_astro\/[^"]+\.css)"/g)) {
    cssGz += await gz(join(DIST, m[1]));
  }

  // Astro inlines small modules; count inline <script type="module"> too.
  let jsGz = 0;
  for (const m of html.matchAll(/<script[^>]+src="(\/_astro\/[^"]+\.js)"/g)) {
    jsGz += await gz(join(DIST, m[1]));
  }
  for (const m of html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)) {
    jsGz += gzipSync(Buffer.from(m[1])).length;
  }

  // Fonts: only what the page preloads.
  let fontBytes = 0;
  for (const m of html.matchAll(/<link[^>]+rel="preload"[^>]+href="(\/fonts\/[^"]+)"/g)) {
    fontBytes += await raw(join(DIST, m[1]));
  }

  // Images. Split into what loads IMMEDIATELY (eager — the hero) and what
  // loads only if the visitor scrolls (lazy). Counting lazy images as
  // initial transfer, as an earlier version of this script did, makes a
  // well-behaved gallery look like a budget breach.
  async function pickWebp(sourceSet) {
    const best = sourceSet
      .split(',')
      .map((c) => c.trim().split(/\s+/))
      .map(([u, w]) => ({ u, w: parseInt(w) || 0 }))
      .filter((c) => c.w <= 1280)
      .sort((a, b) => b.w - a.w)[0];
    if (!best) return 0;
    try {
      return await raw(join(DIST, best.u));
    } catch {
      return 0;
    }
  }

  let eagerImg = 0;
  let lazyImg = 0;
  for (const pic of html.matchAll(/<picture[^>]*>([\s\S]*?)<\/picture>/g)) {
    const block = pic[1];
    const isLazy = /loading="lazy"/.test(block);
    const webp = block.match(/<source[^>]+type="image\/webp"[^>]+srcset="([^"]+)"/);
    const any = webp ?? block.match(/srcset="([^"]+)"/);
    if (!any) continue;
    const bytes = await pickWebp(any[1]);
    if (isLazy) lazyImg += bytes;
    else eagerImg += bytes;
  }

  const total = htmlGz + cssGz + jsGz + fontBytes + eagerImg;
  const fullScroll = total + lazyImg;
  rows.push({ page, htmlGz, cssGz, jsGz, fontBytes, eagerImg, lazyImg, total, fullScroll });

  if (htmlGz > BUDGETS.html) problems.push(`${page}: HTML ${htmlGz}B gz over ${BUDGETS.html}B`);
  if (cssGz > BUDGETS.css) problems.push(`${page}: CSS ${cssGz}B gz over ${BUDGETS.css}B`);
  if (jsGz > BUDGETS.js) problems.push(`${page}: JS ${jsGz}B gz over ${BUDGETS.js}B`);
  if (total > BUDGETS.total) problems.push(`${page}: total ${total}B over ${BUDGETS.total}B`);
}

const k = (n) => (n / 1024).toFixed(1).padStart(7);
console.log('check-weight: estimated first-visit transfer (gz for text)\n');
console.log(`  ${'page'.padEnd(42)}${'html'.padStart(7)}${'css'.padStart(7)}${'js'.padStart(6)}${'font'.padStart(7)}${'hero'.padStart(8)}${'INITIAL'.padStart(9)}${'+scroll'.padStart(9)}`);
for (const r of rows.sort((a, b) => b.total - a.total)) {
  console.log(
    `  ${r.page.padEnd(42)}${k(r.htmlGz)}${k(r.cssGz)}${k(r.jsGz)}${k(r.fontBytes)}${k(r.eagerImg)}${k(r.total)}${k(r.fullScroll)}`,
  );
}
console.log(`\n  budgets: html ${BUDGETS.html / 1024}K · css ${BUDGETS.css / 1024}K · js ${BUDGETS.js / 1024}K · total ${BUDGETS.total / 1024}K (all KB)`);

if (problems.length) {
  console.error(`\n${problems.length} budget breach(es):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log('\ncheck-weight: OK');

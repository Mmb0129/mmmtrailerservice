#!/usr/bin/env node
/**
 * SEO metadata gate (architect.md §21 T6, tasks.md TEST-005).
 * Runs against dist/ after a build. Exits non-zero on any violation.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = 'dist';
const MAX_TITLE = 60;
const MAX_DESC = 155;

async function htmlFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const pick = (html, re) => html.match(re)?.[1]?.trim() ?? null;

/**
 * Files that are not pages and have no SEO surface. __forms.html is a
 * machine-readable manifest that exists only for Netlify's form detection
 * to parse; nobody visits it and it is noindex.
 */
const NOT_PAGES = ['__forms.html'];

const files = (await htmlFiles(DIST)).filter(
  (f) => !NOT_PAGES.some((n) => f.endsWith(n)),
);
const errors = [];
const titles = new Map();
const descriptions = new Map();

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const page = '/' + relative(DIST, file).replace(/index\.html$/, '');
  const fail = (msg) => errors.push(`${page}: ${msg}`);

  const noindex = /<meta\s+name="robots"\s+content="noindex/i.test(html);

  const title = pick(html, /<title>([\s\S]*?)<\/title>/i);
  if (!title) fail('missing <title>');
  else if (title.length > MAX_TITLE) fail(`title is ${title.length} chars (max ${MAX_TITLE})`);
  else if (!noindex) {
    if (titles.has(title)) fail(`duplicate title, also on ${titles.get(title)}`);
    titles.set(title, page);
  }

  const desc = pick(html, /<meta\s+name="description"\s+content="([\s\S]*?)"/i);
  if (!desc) fail('missing meta description');
  else if (desc.length > MAX_DESC) fail(`description is ${desc.length} chars (max ${MAX_DESC})`);
  else if (!noindex) {
    if (descriptions.has(desc)) fail(`duplicate description, also on ${descriptions.get(desc)}`);
    descriptions.set(desc, page);
  }

  const canonical = pick(html, /<link\s+rel="canonical"\s+href="([\s\S]*?)"/i);
  if (!canonical) fail('missing canonical');
  else if (!/^https?:\/\//.test(canonical)) fail(`canonical is not absolute: ${canonical}`);

  const h1s = html.match(/<h1[\s>]/gi)?.length ?? 0;
  if (h1s !== 1) fail(`expected exactly one <h1>, found ${h1s}`);

  if (!/property="og:image"/.test(html)) fail('missing og:image');
  if (!/lang="en-IN"/.test(html)) fail('missing lang="en-IN"');
}

console.log(`check-seo: inspected ${files.length} page(s)`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('check-seo: OK');

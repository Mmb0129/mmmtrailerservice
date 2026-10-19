#!/usr/bin/env node
/**
 * Generates public/__forms.html from the real forms.
 *
 * Netlify's form detection parses the deployed HTML. With a framework it can
 * miss forms that are assembled from components, so Netlify's own guidance is
 * to ship one plain static HTML file declaring every form. This generates
 * that file FROM the built pages, so a field renamed on a page can never
 * silently drift out of the declaration — which would make that field vanish
 * from the submission email without anything appearing broken.
 *
 * Run after a build; the result is committed and served at /__forms.html.
 */
import { readFile, writeFile } from 'node:fs/promises';

const PAGES = [
  ['dist/quote/index.html', 'quote'],
  ['dist/load-enquiry/index.html', 'load-enquiry'],
  ['dist/transport-partners/index.html', 'transport-partner'],
];

const forms = [];

for (const [file, expectedName] of PAGES) {
  const html = await readFile(file, 'utf8');
  const form = html.match(/<form[^>]*data-enquiry-form[\s\S]*?<\/form>/)?.[0];
  if (!form) throw new Error(`no enquiry form found in ${file}`);

  const declaredName = form.match(/\sname="([^"]+)"/)?.[1];
  if (declaredName !== expectedName) {
    throw new Error(`${file}: form name is "${declaredName}", expected "${expectedName}"`);
  }

  const names = [];
  for (const tag of form.match(/<(?:input|select|textarea)\b[^>]*>/g) ?? []) {
    const n = tag.match(/\sname="([^"]+)"/)?.[1];
    if (n && !names.includes(n)) names.push(n);
  }

  const fields = names
    .filter((n) => n !== 'form-name')
    .map((n) => `    <input type="${n === 'bot-field' ? 'text' : 'text'}" name="${n}" />`)
    .join('\n');

  forms.push(
    `  <form name="${expectedName}" data-netlify="true" data-netlify-honeypot="bot-field" hidden>\n` +
      `    <input type="hidden" name="form-name" value="${expectedName}" />\n` +
      `${fields}\n` +
      `    <button type="submit">Send</button>\n` +
      `  </form>`,
  );
  console.log(`  ${expectedName}: ${names.length} fields`);
}

const out = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Form definitions</title>
  </head>
  <body>
    <!--
      GENERATED FILE — do not edit by hand.
      Produced by scripts/gen-netlify-forms.mjs from the built pages so the
      field names here can never drift from the real forms.

      This exists only so Netlify's form detection has a plain HTML file to
      parse. Nobody visits it; it is noindex and the forms are hidden.
    -->
${forms.join('\n\n')}
  </body>
</html>
`;

// public/ is committed and feeds the next build; dist/ makes it part of
// THIS deploy, so enabling the fallback never costs an extra round trip.
await writeFile('public/__forms.html', out);
await writeFile('dist/__forms.html', out);
console.log('wrote public/__forms.html and dist/__forms.html');

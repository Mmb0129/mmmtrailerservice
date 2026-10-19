/**
 * Keeps the footer's copyright year correct between builds.
 *
 * The year is rendered at build time, so it is right the moment the site
 * deploys. If no deploy happens before the new year, this corrects it in the
 * browser. It only writes when the value actually differs, so there is no
 * flash and no layout work in the common case.
 */
const year = String(new Date().getFullYear());

for (const el of document.querySelectorAll<HTMLElement>('[data-current-year]')) {
  if (el.textContent !== year) el.textContent = year;
}

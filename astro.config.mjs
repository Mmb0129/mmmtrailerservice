// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL is set per Netlify deploy context (netlify.toml): the real domain in
// production, $DEPLOY_PRIME_URL in previews. Canonicals, OG tags and the
// sitemap all derive from it, so it must never be hard-coded elsewhere.
const site = process.env.SITE_URL || 'https://mmmtrailerservice.com';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      // /thank-you/ and /404 must stay out of the index (architect.md §14.2).
      filter: (page) => !page.includes('/thank-you') && !page.includes('/404'),
    }),
  ],
  image: {
    // AVIF first, WebP fallback, original last. Quality values are tuned for
    // photographs of vehicles against sky, which band badly if pushed lower.
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
  },
  devToolbar: {
    enabled: false,
  },
  vite: {
    build: {
      // Astro inlines small scripts as <script type="module">...</script>.
      // Our CSP is script-src 'self', which forbids inline scripts, so an
      // inlined bundle is silently blocked in production. Forcing every
      // script out to its own file keeps the strict CSP and the progressive
      // enhancement working together.
      assetsInlineLimit: 0,
    },
  },
});

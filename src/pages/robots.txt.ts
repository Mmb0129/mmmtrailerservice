import type { APIRoute } from 'astro';

/**
 * Context-aware robots.txt (architect.md §14.2).
 *
 * Production allows crawling and points at the sitemap. Every other Netlify
 * deploy context — deploy previews, branch deploys — disallows everything, so
 * a preview can never compete with production in the index. netlify.toml also
 * sets X-Robots-Tag: noindex on previews; belt and braces, because an indexed
 * preview is painful to undo.
 */
export const GET: APIRoute = ({ site }) => {
  const isProduction = process.env.CONTEXT === 'production';

  const body = isProduction
    ? `User-agent: *
Allow: /

Sitemap: ${new URL('sitemap-index.xml', site).href}
`
    : `# Non-production deploy context (${process.env.CONTEXT ?? 'local'}) — not for indexing.
User-agent: *
Disallow: /
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

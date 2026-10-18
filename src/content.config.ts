import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content schemas (architect.md §13.5, §14.2).
 *
 * These are the project's enforcement mechanism, not documentation. A missing
 * alt text, an over-length title or an unconfirmed photograph fails the BUILD.
 * Rules that depend on a reviewer remembering them get broken; rules that
 * break the build do not.
 */

/**
 * Who a photograph actually shows. Only the first two values may be rendered
 * on /fleet/ — see galleryIsPublishable below.
 *
 * Per the owner (2026-10-18), the MSR-liveried vehicles ARE MMM's own, so most
 * of the library qualifies as confirmed-mmm. Four files do not: two with
 * identifiable people awaiting consent, one differently-badged cab that may be
 * a network truck, and one unidentified person.
 */
export const AUTHENTICITY = [
  'confirmed-mmm',
  'confirmed-operation',
  'needs-confirmation',
  'third-party',
  'unsuitable',
] as const;

/** The cargo classes evidenced by photographs (asset-inventory.md §6). */
export const CARGO_CATEGORY = [
  'machinery',
  'plant',
  'structural-steel',
  'pipe',
  'tanks-vessels',
  'solar',
  'containers',
  'agricultural',
  'export-crates',
  'night-operations',
  'vehicle-portrait',
  'trailer-empty',
  'owner',
] as const;

export const TRAILER_TYPE = [
  'high-bed',
  'semi-low-bed',
  'low-bed',
  'container-skeletal',
  'not-applicable',
] as const;

/** Shared SEO fields. Lengths match the build-time guards in SeoHead.astro. */
const seo = {
  title: z.string().min(10).max(60),
  description: z.string().min(50).max(155),
  h1: z.string().min(5),
  primaryKeyword: z.string().min(3),
  secondaryKeywords: z.array(z.string()).default([]),
};

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    ...seo,
    order: z.number().int(),
    summary: z.string().min(20).max(200),
    trailerType: z.enum(TRAILER_TYPE),
    /**
     * Deck dimensions and payloads are owner-supplied only (decisions.md
     * D-012). Left undefined, the page renders "Specifications on request"
     * rather than an estimate — a buyer who plans a load around a wrong
     * deck height arrives with cargo that will not fit.
     */
    specifications: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .optional(),
    relatedRoutes: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const routes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/routes' }),
  schema: z.object({
    ...seo,
    order: z.number().int(),
    origin: z.string(),
    destination: z.string(),
    /** Tada, Sri City, Bengaluru and Hyderabad movements cross a state border
     *  and the page must say so — it is the detail that signals the operator
     *  actually runs the lane (architect.md §12.5). */
    interstate: z.boolean(),
    destinationState: z.string(),
    trailerTypes: z.array(z.enum(TRAILER_TYPE)).min(1),
    /**
     * Owner-supplied lane description. No road distances and no transit times:
     * those are not sourced from a maps API and presented as service facts.
     */
    ownerNotesSupplied: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const gallery = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/gallery' }),
  schema: z.object({
    src: z.string().min(3),
    /** Describes the subject. Not keyword-stuffed, and never a registration number. */
    alt: z.string().min(10, 'alt text must describe the subject'),
    caption: z.string().min(10, 'every published photograph needs a caption'),
    category: z.enum(CARGO_CATEGORY),
    trailerType: z.enum(TRAILER_TYPE).default('not-applicable'),
    authenticity: z.enum(AUTHENTICITY),
    /** Set when an identifiable person appears and consent is not yet given. */
    consentRequired: z.boolean().default(false),
    order: z.number().int().default(100),
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/faqs' }),
  schema: z.object({
    page: z.string(),
    items: z
      .array(
        z.object({
          question: z.string().min(10),
          answer: z.string().min(20),
        }),
      )
      .min(1),
  }),
});

export const collections = { services, routes, gallery, faqs };

/* ── Render gates ──────────────────────────────────────────────────────── */

type GalleryEntry = {
  data: {
    authenticity: (typeof AUTHENTICITY)[number];
    consentRequired: boolean;
  };
};

/**
 * The /fleet/ gallery filter. Authenticity is enforced in the data layer so
 * it cannot be forgotten in a template, and consent is a separate veto: a
 * photograph can be genuinely MMM's and still not publishable because
 * someone identifiable is in it (architect.md §13.6).
 */
export function galleryIsPublishable(entry: GalleryEntry): boolean {
  const { authenticity, consentRequired } = entry.data;
  if (consentRequired) return false;
  return authenticity === 'confirmed-mmm' || authenticity === 'confirmed-operation';
}

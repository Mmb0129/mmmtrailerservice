/**
 * Photo registry. Astro needs a static import to process an image, so every
 * photograph is collected here once and looked up by slug.
 *
 * Filenames are SEO surface (architect.md §13.7): lowercase, hyphenated,
 * describing the subject. Never "PHOTO-2026-10-18-16-05-06 2.jpg".
 */
import type { ImageMetadata } from 'astro';

const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/photos/*.{jpg,jpeg,png}',
  { eager: true },
);

export const photos: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => [
    path.split('/').pop()!.replace(/\.(jpg|jpeg|png)$/, ''),
    mod.default,
  ]),
);

export function photo(slug: string): ImageMetadata {
  const found = photos[slug];
  if (!found) {
    throw new Error(
      `photo("${slug}") not found. Available: ${Object.keys(photos).sort().join(', ')}`,
    );
  }
  return found;
}

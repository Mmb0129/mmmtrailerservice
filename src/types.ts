/** Shared component types. Kept out of .astro frontmatter, where esbuild
 *  mis-parses multi-line exported unions. */

export type FieldType =
  | 'text'
  | 'tel'
  | 'email'
  | 'date'
  | 'textarea'
  | 'select'
  | 'checkbox-group';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * The few brand values that must exist outside CSS.
 *
 * HTML attributes such as <meta name="theme-color"> and SVG fills cannot read
 * a CSS custom property, so they need a literal. Keeping that literal here
 * rather than inline means src/styles/tokens.css and this file are the only
 * two places a brand colour is written — which is what makes the CI check for
 * stray hex values in components meaningful.
 *
 * These MUST stay in sync with src/styles/tokens.css.
 */
export const brandColors = {
  /** --navy-800 — browser chrome, SVG grounds */
  navy: '#0D1B3E',
  /** --gold-500 */
  gold: '#F5A800',
  /** --on-navy-100 */
  white: '#FFFFFF',
  /** The tricolour M-M-M wordmark. Accents only, never body text. */
  mmmBlue: '#1565C0',
  mmmOrange: '#E65100',
  mmmGreen: '#2E7D32',
} as const;

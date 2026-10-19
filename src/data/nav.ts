/**
 * Site navigation, defined once (architect.md §9.5, §11.1).
 *
 * "For Truck Owners" sits in the MAIN nav, not the footer. The capacity side
 * is half the business (§8.2) and burying it would repeat the mistake every
 * competitor makes — not one of them offers a truck owner anything.
 */
export interface NavItem {
  label: string;
  href: string;
}

export const mainNav: NavItem[] = [
  { label: 'Services', href: '/services/' },
  { label: 'Fleet', href: '/fleet/' },
  { label: 'Routes', href: '/routes/' },
  { label: 'About', href: '/about/' },
  { label: 'For Truck Owners', href: '/transport-partners/' },
  { label: 'Contact', href: '/contact/' },
];

export const footerNav: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Trailer hire',
    items: [
      { label: 'High-bed trailer hire', href: '/services/high-bed-trailer-hire/' },
      { label: 'Semi-low-bed trailer hire', href: '/services/semi-low-bed-trailer-hire/' },
      { label: 'Low-bed trailer hire', href: '/services/low-bed-trailer-hire/' },
      { label: 'Container transport', href: '/services/container-trailer-transport/' },
      { label: 'Trailer lease & period hire', href: '/services/trailer-lease-hire/' },
      { label: 'Machinery transport', href: '/services/machinery-transport/' },
    ],
  },
  {
    heading: 'Where we run',
    items: [
      { label: 'Within Chennai', href: '/routes/chennai-local/' },
      { label: 'Chennai to Tada & Sri City', href: '/routes/chennai-tada-sri-city/' },
      { label: 'Chennai to Bengaluru', href: '/routes/chennai-bengaluru/' },
      { label: 'Chennai to Hyderabad', href: '/routes/chennai-hyderabad/' },
      { label: 'All routes', href: '/routes/' },
    ],
  },
  {
    heading: 'Enquiries',
    items: [
      { label: 'Request a quote', href: '/quote/' },
      { label: 'Regular & contract loads', href: '/load-enquiry/' },
      { label: 'For truck owners', href: '/transport-partners/' },
      { label: 'Contact us', href: '/contact/' },
    ],
  },
];

export const legalNav: NavItem[] = [
  { label: 'Privacy', href: '/privacy/' },
  { label: 'Terms', href: '/terms/' },
];

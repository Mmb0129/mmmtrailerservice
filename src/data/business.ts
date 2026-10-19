/**
 * MMM TRAILER SERVICE — single source of truth for business details.
 *
 * Do not duplicate these values anywhere. No phone number, email or address
 * literal may appear in any other file under src/ — CI greps for it.
 * Changing anything here requires an owner instruction.
 *
 * Every value below is verified against the company visiting card, the
 * previous website and the bill book (architect.md §3.1).
 */

/** Indian mobile numbers, stored once in raw form and derived everywhere else. */
function phone(raw: string) {
  const national = raw.replace(/\D/g, '');
  return {
    /** 9384943004 — for comparisons and schema */
    raw: national,
    /**
     * 93849 43004 — how Indians read a mobile number aloud.
     * The separator is U+00A0 (no-break space) so the number can never be
     * split across a line break, which would make it unreadable.
     */
    display: `${national.slice(0, 5)}\u00A0${national.slice(5)}`,
    /** +919384943004 — E.164, for tel: and schema */
    e164: `+91${national}`,
    /** tel:+919384943004 */
    href: `tel:+91${national}`,
  };
}

/**
 * Primary enquiry line, confirmed by the owner 2026-10-18 (decisions.md D-016).
 * Also the WhatsApp number. Drives the hero CTA, the mobile action bar and
 * every wa.me link.
 */
export const primaryPhone = phone('9384943004');

/** Secondary line. Shown on /contact/ and in the footer, never as the lead CTA. */
export const secondaryPhone = phone('9842596918');

export const business = {
  name: 'MMM Trailer Service',
  /** Mazhai Malai Madha — the devotional dedication the initials stand for. */
  nameMeaning: 'Mazhai Malai Madha',
  tagline: 'Expert in the art of Moving…',
  owner: 'Micheal Augustin',
  email: 'mmmtrailerservice@gmail.com',

  /**
   * An office / correspondence address, NOT a depot or a yard open to
   * visitors (architect.md §3.3 A3, decisions.md D-013). Copy must not
   * invite people to turn up.
   */
  address: {
    line1: 'No. 4688/4, 12th Street',
    line2: 'MMDA Mathur',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600068',
    country: 'IN',
    countryName: 'India',
    label: 'Office address',
  },
} as const;

/** Both numbers, primary first. For /contact/ and the footer. */
export const phones = [primaryPhone, secondaryPhone] as const;

/** One line, for the footer and schema. */
export const addressOneLine = [
  business.address.line1,
  business.address.line2,
  `${business.address.city} ${business.address.postalCode}`,
  business.address.state,
].join(', ');

/**
 * WhatsApp deep link with a prefilled message.
 * `context` lets a page say where the enquiry came from, e.g. a lane name,
 * so the owner opens the chat already knowing what it is about.
 */
export function whatsappUrl(context?: string): string {
  const message = context
    ? `Hello MMM Trailer Service, I have an enquiry about ${context}.`
    : 'Hello MMM Trailer Service, I would like to enquire about trailer transport.';
  return `https://wa.me/${primaryPhone.e164.replace('+', '')}?text=${encodeURIComponent(message)}`;
}

/**
 * Enquiry disclosures.
 *
 * `truckOwner` appears above the submit button on /transport-partners/.
 *
 * `shipper` was removed from the cargo-side forms, the footer and the
 * thank-you page at the owner's request (2026-10-19). Its substance is
 * retained on /terms/ under "Enquiries are not bookings", which is where it
 * carries legal weight. Kept here so it is one edit to restore.
 */
export const disclosures = {
  /** /quote/ and /load-enquiry/ — the cargo side. */
  shipper:
    'Submitting an enquiry does not confirm a vehicle or a rate. We will come back to you to confirm availability and commercial terms.',
  /** /transport-partners/ — the capacity side. */
  truckOwner:
    'Registering does not guarantee loads. We will contact you when we have work that suits your vehicle and route.',
} as const;

/** The three trailer configurations MMM runs. Used by nav, forms and schema. */
export const trailerTypes = [
  { slug: 'high-bed-trailer-hire', label: 'High-bed', formValue: 'High-bed' },
  { slug: 'semi-low-bed-trailer-hire', label: 'Semi-low-bed', formValue: 'Semi-low-bed' },
  { slug: 'low-bed-trailer-hire', label: 'Low-bed', formValue: 'Low-bed' },
] as const;

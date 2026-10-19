import type { FaqItem } from '@/types';

/**
 * Genuine questions only (architect.md §12.8). No FAQ exists to pad a page.
 * Q6 is on the homepage deliberately: it is the capacity side's most direct
 * entry point, and nothing else on a transport homepage speaks to a truck
 * owner.
 */
export const homeFaqs: FaqItem[] = [
  {
    question: 'What size trailers do you have?',
    answer:
      '40 ft trailers in three configurations: high-bed, semi-low-bed and low-bed. Which one you need depends on the height and type of your cargo more than its weight.',
  },
  {
    question: 'Do you only work in Chennai?',
    answer:
      'Chennai local, Tada and Sri City are where we work most. We also accept enquiries for movements to and from destinations across India, subject to a suitable vehicle being available.',
  },
  {
    question: 'How quickly can you confirm a truck?',
    answer:
      'It depends on the route, the trailer type and what is free at the time. We will tell you honestly when we reply rather than promise a time we cannot keep.',
  },
  {
    question: 'Do you own your trucks, or arrange them?',
    answer:
      'Both. We run our own 40 ft trailers and your load goes on one of ours first. When our vehicles are committed, we arrange a suitable truck through owners we know and coordinate the movement ourselves.',
  },
  {
    question: 'What do you need from me to quote?',
    answer:
      'Pickup and delivery locations, what the cargo is, roughly what it weighs, its dimensions if you know them, how it will be loaded, and when you need it. The quickest way is to call — if you are not sure which trailer suits, we will advise.',
  },
  {
    question: 'Do you handle ODC loads?',
    answer:
      'Yes. ODC — Over Dimensional Cargo — is a load that exceeds the standard dimensions or permissible weight for the vehicle. Plant sections, long vessels and tall machinery are the usual cases. These movements need the route checked and permissions obtained first, so tell us early rather than close to the date.',
  },
  {
    question: 'Can we hire a trailer for a period rather than per trip?',
    answer:
      'Yes. We lease trailers for a fixed period where the work justifies it — projects, sustained volume, seasonal runs. The terms are set per arrangement rather than from a price list, so call us with the dates and what the vehicle would be doing.',
  },
  {
    question: 'I own a trailer — do you have loads?',
    answer:
      'Yes. When our own trailers are committed we place loads with truck owners we know. Give us a call with your vehicle type, base location and the routes you run, and we will come back to you when we have work that suits.',
  },
];

# Running the MMM Trailer Service website

A short guide for keeping the site up to date. You do not need to be a
developer to do any of this, but you do need someone with access to the
GitHub repository.

**The site:** https://mmmtrailerservice.com
**The code:** https://github.com/Mmb0129/mmmtrailerservice
**The host:** Netlify — it rebuilds the site automatically every time a
change is merged into the `main` branch.

---

## Where enquiries arrive

Three forms on the site, all delivered the same way:

| Page | Who it is for |
|---|---|
| `/quote/` | Someone with a load who wants a price |
| `/load-enquiry/` | Forwarders and companies with regular volume |
| `/transport-partners/` | Truck owners who want loads |

Every submission does two things:

1. **Sends an email** to `mmmtrailerservice@gmail.com`.
2. **Saves a copy in Netlify**, at Netlify → your site → Forms. This is the
   backup if an email is ever lost or deleted.

**Set up three Gmail filters** so you can tell them apart at a glance — one
each for the subject prefixes `[QUOTE]`, `[LOAD]` and `[PARTNER]`, each with
its own label and colour. That is the whole enquiry system, deliberately: at
this volume a Gmail label does the job that a CRM would, and you already know
how to use Gmail.

**Check the forms still work once a month.** Send yourself a test enquiry from
the live site and confirm the email arrives. It takes two minutes and it is the
only way to catch a silent failure.

> The free Netlify plan allows **100 submissions a month**. Spam counts towards
> that. If you start getting close, upgrade the Netlify plan — do not let
> someone "fix" it by rebuilding the forms.

---

## Adding a photograph to the gallery

1. Put the photo in `src/assets/photos/`. **Name it properly** — lowercase,
   words separated by hyphens, describing what it shows. For example
   `mmm-trailer-steel-coils-chennai.jpg`. Do not leave it as `PHOTO-2026-...`;
   the filename is one of the things Google reads.
2. Create a file in `src/content/gallery/` with the same name but ending
   `.yaml`, like this:

```yaml
src: mmm-trailer-steel-coils-chennai
alt: Steel coils chained down on a flatbed trailer
caption: Steel coils, chained and chocked so they cannot roll.
category: structural-steel
trailerType: high-bed
authenticity: confirmed-mmm
order: 30
```

3. That is it. The site resizes the photo, makes the modern formats and adds
   it to the gallery automatically.

**Rules the site enforces for you.** The build will *fail* — the photo simply
will not go live — if the alt text or caption is missing, or if
`authenticity` is anything other than `confirmed-mmm` or
`confirmed-operation`. That is on purpose. It is what stops a photo of
someone else's truck ever being published as ours.

If a photo has someone's face in it and you have not asked them, add
`consentRequired: true` and it will be held back.

---

## Adding or editing a route page

Route pages live in `src/content/routes/` as `.md` files. Copy an existing one
and change the details. The important fields:

- `interstate: true` if the run crosses a state border — the page then says so
  automatically, which is one of the details that shows you know the lane.
- `ownerNotesSupplied: false` — change this to `true` once the page describes
  what *you* actually carry on that lane, rather than general information
  about the destination.

**Do not add a route page for a lane you do not run.** A page that says nothing
specific is worse than no page: it competes with your good pages in Google and
drags them down.

**Do not put distances or transit times on a route page** unless you are
willing to stand behind them.

---

## Changing phone numbers, email or the address

All of it lives in **one file**: `src/data/business.ts`. Change it there and it
updates everywhere on the site at once — header, footer, every form, the
WhatsApp links and the data Google reads.

The site will refuse to build if anyone writes a phone number anywhere else.

If you change a number, also update it in these places, which are outside the
website: your Google Business Profile, IndiaMART, Justdial, and any other
directory listing. They must all match exactly, or Google trusts all of them
less.

---

## What must never go on the site

These are not style preferences. Each one is either untrue, unprovable, or a
promise that could be held against you.

- **No insurance or liability promises.** The old site said "every consignment
  is fully covered". It was removed. If you have a real policy, tell us exactly
  what it covers and it can go back, worded accurately.
- **No made-up numbers.** No fleet count, no "100% on time", no years in
  business, no number of clients, no tonnage.
- **No guaranteed transit times** and no guaranteed availability.
- **No customer names or logos** without their written permission.
- **No stock photographs of trucks.** Every photo on the site is one of yours.
- **No retouching.** Photos go up as they were taken.
- **No truck owner's details published anywhere**, ever.

---

## If something breaks after a change

Netlify keeps every previous version of the site.

1. Go to Netlify → your site → **Deploys**.
2. Find the last version that was working.
3. Press **Publish deploy**.

The site is back within seconds. Nothing is lost, and the broken change can be
fixed afterwards without pressure.

---

## Still outstanding

Things the site is waiting on from you:

| What | Why it matters |
|---|---|
| **Lane descriptions** — two or three sentences per route about what you actually carry and how often | Turns seven general pages into seven pages only you could have written. This is the single biggest SEO win available. |
| **Your story** for the About page — roughly when you started, what you did before | The About page currently says only what can be verified. |
| **Real trailer dimensions** — deck length, deck height, payload for each type | The service pages say "specifications on request" until you supply these. They will not be guessed. |
| **A video of a loaded trailer moving** | The only thing missing from the homepage. See the shot list in `architect.md` §10.5. |
| **Camera originals of the photographs** | Everything we have came through WhatsApp and lost two thirds of its resolution. Sending the originals by AirDrop or Google Drive costs nothing and improves every image on the site. |
| **Google Business Profile** | For searches like "trailer transport Chennai", directories and Google Maps own the results — not websites. This is the main way local customers will find you. |

---

## Who to ask

The full technical plan is in `MMM Infos/architect.md`. It explains every
decision and why it was made. `MMM Infos/tasks.md` lists what has been built
and what has not.

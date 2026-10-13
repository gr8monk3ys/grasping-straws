# Two editions, one notebook: design

Date: 2026-10-12
Status: awaiting review

## Goal

Grasping Straws? is Lorenzo's version of Oblique Strategies. This work makes
it look like part of lscaturchio.xyz, turns it into two physical boxed decks,
and gets the artwork to the point where an order can be placed at
MakePlayingCards (MPC).

Success is two things Lorenzo can hold: a Paper edition and a Night edition,
each a 54-face tarot deck in a printed rigid box, both unmistakably from the
same notebook as his website.

## Decisions

Confirmed by Lorenzo in conversation:

| Question | Decision |
|---|---|
| How far to match lscaturchio.xyz | "Same notebook": its paper, ink, hairline, night palette and wall labels. Fraunces stays the card's voice; the card keeps its shadow and weight. |
| Box | MPC custom rigid box (lid and base), 54 cards per deck. |
| Editions | Two. A light one that is general, a dark one that digs deeper. |
| What the dark deck is | Turned inward: the light deck works on the piece, the dark deck works on the person making it. A separate deck, usable alone. |
| Dark deck size | 52 cards, the same as the light deck. |
| Box art | Direction A for the light edition, direction C for the dark edition. |
| Who writes the dark deck | Claude writes it for now. Lorenzo will revise every card in both decks once everything else is done. |
| Ordering | Claude builds the cart in Lorenzo's Chrome and stops at checkout. Lorenzo checks MPC's proof, confirms the address and pays. |

Assumed, not confirmed. Each is cheap to reverse at review:

1. The light edition is the general deck and the dark edition is the inward
   deck, not the other way round.
2. The editions are named **Paper** and **Night**, after the two themes in
   the website's own design system.
3. Because Lorenzo will revise all cards afterwards, Claude also writes the
   four reserved cards #49–52 in the Paper deck. They become ordinary cards
   and go live on the site when this work merges. If Lorenzo would rather
   keep them as drafts, the Paper edition cannot be rendered for print until
   he writes them, and nothing else in this design changes.
4. The site keeps dealing only the Paper deck (see Out of scope).

## The two editions

| | Paper edition | Night edition |
|---|---|---|
| Works on | the piece in front of you | the person making it |
| Cards | 52 | 52 |
| Card ids | 1–52 | 101–152 |
| Faces | 52 cards + title + instructions = 54 | 52 cards + title + instructions = 54 |
| Card face | Paper Card ground, Ink text | Night Card ground, Night Ink text |
| Box lid | Forest Ink, Paper lettering | Night, emerald mark, Night Ink lettering |
| Box base | Paper | Night Card |

Ids are unique across both editions so a card's number always identifies one
card. The Night range starts at 101 to leave the Paper deck room to grow to
the 72 tier without renumbering anything.

An edition is defined in one place, `src/deck/editions.ts`: its name, its
card file, its id range, its palette, and its box colours. The print
scripts and the box generator read that definition and nothing else.

## Palette

One module, `src/deck/palette.ts`, holds every colour value, named as the
website's DESIGN.md names them. Today the same values are written out
independently in seven files: `global.css`, `print-cards.js`,
`print-and-play.js`, `make-assets.js`, `manifest.webmanifest`, `theme.ts`
and `Base.astro`.

| Role | Light (Paper) | Dark (Night) |
|---|---|---|
| Page ground | Paper `#f9f8f5` | Night `#111317` |
| Card stock | Paper Card `#fbfaf9` | Night Card `#16181d` |
| Under-card, recessed | Paper Tinted `#eeece7` | Night Tinted `#25272d` |
| Text | Ink `#1a1f23` | Night Ink `#fafafa` |
| Metadata | Ink Muted `#606976` | Night Ink Muted `#abb0ba` |
| Accent | Forest Ink `#184e35` | Forest Ink (dark) `#42a979` |
| Secondary green | Moss `#397f5e` | Moss `#397f5e` |
| Hairline | Hairline `#e2dbd5` | Night Hairline `#292c32` |

The scripts import the module directly. The stylesheet cannot import
TypeScript, so its values are written by hand and a test compares every
custom property in `global.css` against the module and fails on drift. The
manifest and the theme-color metas are covered by the same test.

The current stylesheet lightens the accent to `#2c6e4f` for text because
`#184e35` reads close to black at small sizes. The website uses `#184e35`
for link text, so this design adopts it. The one place it is known to fail
is the thin rule at the foot of each card face, where a 3 px line of Forest
Ink is indistinguishable from Ink; that rule uses Moss.

## Site retheme

Scope is the "same notebook" level and no further:

- Every colour token takes the value above, in both themes. Dark mode moves
  from a warm desk (hue 30) to the website's cool night page (hue 220).
- Labels become wall labels: Plex Mono 500, uppercase, 0.16em tracking,
  tabular numerals, Ink Muted. This applies to the masthead tally, pile
  labels, card ids and footer links.
- Dividers follow the Sand Hairline Rule: 1 px of Hairline, never a tinted
  ink.
- Shadows are re-tinted from walnut to Ink. They are not removed. The
  website's Flat Paper Rule is deliberately not adopted for the card, the
  piles and the deck edge, because the card being a physical object is this
  product's third principle. Everything that is not a card goes flat.
- Fraunces remains the only text face. Instrument Sans is not added.
- `DESIGN.md` and `PRODUCT.md` are updated to describe the result, including
  the one sanctioned departure from the website's system (card elevation).
- `docs/screenshot-light.png`, `docs/screenshot-dark.png`, `og.png` and the
  icons are regenerated.

The existing verifier budgets and checks all still apply and must pass
unchanged: CSS at or under 6 KB gzipped, client JS at or under 7 KB, accent
contrast at AA on both grounds, the 11.5 px type floor.

## Card data

- `public/cards.json` stays the Paper deck and the site's single source.
  Cards #49–52 get text and lose their `draft` and `note` keys (assumption
  3). The site then deals 52 cards.
- `src/deck/night.json` is the Night deck: 52 entries, ids 101–152, the same
  shape as `cards.json`. It lives outside `public/` so nothing about it is
  served. The validator runs over both files and checks ids are unique
  across them.
- Night suits, as editorial scaffolding that is never printed: **avoidance**
  (what you are stepping around), **motive** (why this, why now),
  **protection** (what you are guarding), **audience** (whose eyes are in
  the room), **permission** (what you are waiting to be allowed). Roughly
  ten cards each, with the remainder where the writing is strongest.
- Night cards follow the existing voice rules: short imperatives, questions
  and koans, typographic quotes only, every card original. None may
  paraphrase an Oblique Strategies card.
- `CONTEXT.md` gains one term. **Edition**: a printed deck with its own box
  and its own range of card ids. "Deck" keeps its current meaning, the
  cards the site deals.
- `DECK_VERSION` stays at `"1"`. No deck has been printed yet, so the first
  boxes are edition 1, and the number on the box matches the site.

## Print pipeline

`npm run print` takes an edition:

```sh
EDITION=paper npm run print    # -> print/final/paper/
EDITION=night npm run print    # -> print/final/night/
```

It renders that edition's 54 faces, its back and its contact sheet in that
edition's palette. Everything the current script guarantees is kept: the
897 × 1497 px upload size with its self-check, the tier check, the refusal
to render drafts, the per-face safe-line measurement, proof mode and guides.
File names and the two-number scheme are unchanged.

Each edition has its own title card and instructions card. The Paper
instructions card keeps its current text. Claude drafts the Night
instructions card; it should say what the Paper one does not, that this
deck is about the maker and is not meant to be drawn in company.

Each edition has its own back. Paper: the current design, on Paper Card.
Night: the same layout on Night Card with the mark in emerald. Different
backs are intended. The two decks should not be shuffled together, and a
glance at the back should say which deck a stray card belongs to.

The free print-and-play PDF stays Paper only and picks up the new palette.

## The box

A new generator, `scripts/print-box.js`, builds lid and base artwork for an
edition onto MPC's rigid-box template for tarot cards, "up to 78" size.

- The template's dimensions go into a `SPEC` constant with a self-check,
  the same pattern as the card size, so the artwork cannot silently drift
  from the printer's file.
- Rendering is HTML through headless Chromium, like the cards, exported in
  whatever format the template requires.
- Text on the box is measured against the template's safe area and the run
  fails on overflow, the same as a card face.

Content, the same on both editions with the edition's own colours:

| Panel | Carries |
|---|---|
| Lid top | The straw-bundle mark, "Grasping Straws?" in Fraunces, a wall label: edition name and "52 cards" |
| Lid long sides | "Grasping Straws?" and the edition name, so the box reads on a shelf |
| Lid short sides | The mark alone |
| Base bottom | One sentence on what the deck is and who it works on, the URL, the edition number matching `DECK_VERSION`, and "made by Lorenzo" |
| Base sides | Plain |

Finish: matte lamination, linen texture. Large solid dark areas show scuffs,
and this is the finish that hides them best.

A 54-card deck is 18 to 19 mm thick depending on stock, and the smallest
box is built for up to 78 cards, so the deck sits roughly 8 mm below the rim
of the base. This was accepted
at design time in exchange for the lid-and-base form and room to grow.

## Ordering

One order per edition, or both together if both are ready. The steps for
each:

1. `npm run print` and the box generator both succeed for the edition.
2. Lorenzo signs in to makeplayingcards.com in Chrome.
3. Claude drives Chrome: tarot deck, 54 cards, linen stock; uploads the 54
   faces in order and the shared back; adds the custom rigid box and uploads
   its artwork; sets the box finish.
4. Claude stops at the cart and reports the line items and total.
5. Lorenzo reads MPC's on-screen proof against the contact sheet, confirms
   the shipping address and pays.

Claude does not create an account, enter payment details or press the final
order button. `docs/printing.md` is rewritten to describe this flow, the two
editions and the box, replacing its "Not done yet: the tuck box" section.

After an order ships, `PHYSICAL_DECK_URL` stays empty. These are personal
copies; there is no product page.

## Out of scope

- **The Night deck on the site.** The site deals only the Paper deck. How
  the Night deck is presented online is a separate design, to be done once
  Lorenzo has revised its cards. It will not be tied to dark mode: that
  would hand the inward deck to anyone who simply prefers a dark screen.
- Selling the decks, a product page, pricing.
- The rules cards in the manufactured decks. They stay in the free PDF.
- Instrument Sans, and the website's Flat Paper Rule for cards.

## Not yet verified

These are checked first during the build, and each stops the work if it
turns out differently:

1. **The rigid-box template.** MPC lists the box at 129.9 × 79.1 × 30.3 mm
   outside and serves the template only from the product page. If the
   template contradicts the listing, or if "up to 78" is not selectable for
   a 54-card deck, Claude stops and reports before designing to it.
2. **Linen stock for tarot size.** MPC's tarot page offers "smooth or
   linen"; the exact stock code is confirmed in the configurator.
3. **Price.** One rigid box is $18.40. The price of a single 54-card tarot
   deck was not shown on any page fetched. Lorenzo sees the total at the
   cart.

Known risk, accepted: a full-bleed dark card shows edge wear sooner than a
pale one, because the white core appears wherever the edge chips. This
affects the Night deck only.

## Testing

- `npm test`: new tests for palette drift between `palette.ts` and the
  stylesheet, manifest and metas; id uniqueness across both card files;
  edition definitions resolving to 54 faces each.
- `npm run validate`: both card files.
- `npm run verify`: unchanged budgets and contrast checks, run against the
  rethemed build.
- `npm run print` for both editions and the box generator for both, each
  with zero overflow reports, and the contact sheets read by eye.
- The site checked in a browser in both themes, on a phone width and a desk
  width, before screenshots are regenerated.

## Order of work

Three pull requests, each mergeable on its own:

1. **Palette and retheme.** The palette module, the drift test, the
   stylesheet, the regenerated assets, DESIGN.md and PRODUCT.md. No change
   to cards.
2. **Editions and cards.** The edition definitions, cards #49–52, the Night
   deck and its instructions card, `EDITION` in the print script, the
   validator, CONTEXT.md.
3. **Box and ordering.** The template check, the box generator, the
   rewritten printing doc. Ends with a cart built and waiting for Lorenzo.

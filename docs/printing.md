# Printing the decks

How to turn the card files into physical decks of tarot-size cards from
[MakePlayingCards](https://www.makeplayingcards.com) (MPC). They have no
minimum order, so one personal copy is a normal thing to buy.

There are two editions, declared in `src/deck/editions.ts`:

| | Paper edition | Night edition |
|---|---|---|
| Works on | the piece in front of you | the person making it |
| Card file | `public/cards.json` | `src/deck/night.json` |
| Card ids | 1–52 | 101–152 |
| Stock and ink | paper face, ink text | night face, pale text |
| On the site | yes, it is the deck the site deals | no, print only |

Everything about the files is settled and checked by the build. The parts
that need a human are the writing and the finish.

---

## 1. Finish the writing (blocking)

Every card in both editions has text, so both render. **The text is not
final.** The Night deck and Paper cards #49–52 were written as stand-ins so
the objects could be designed around real words; Lorenzo revises every card
before anything is ordered. A printed deck is permanent, so do not order
until that pass is done.

MPC prints tarot decks in **fixed tiers** — 18, 36, 54, 72. Each edition is
52 cards + a title card + an instructions card, which is 54. To grow an
edition past that, reserve the new ids as drafts first:

```json
{ "id": 53, "text": "", "suit": "lateral", "draft": true, "note": "what this slot is for" }
```

A draft is never dealt or published and blocks the print run until it is
written. Write the text into `"text"`, then **delete the `draft` and `note`
keys**. Validation fails if a card has text while still marked draft, so a
half-finished edit cannot slip through.

```sh
npm run validate          # both card files; ids must be unique across editions
```

Use typographic apostrophes (`’`, not `'`). Validation enforces this — at
24pt on card stock a typewriter apostrophe is conspicuous.

To see the layout while slots are still drafts:

```sh
PROOF=1 npm run print     # renders to print/proof/, every draft stamped UNWRITTEN
```

Proof output is defaced on purpose and goes to a different directory, so it
can't be mistaken for the real thing at upload time.

## 2. Render

```sh
npm run print                  # Paper -> print/final/paper/
EDITION=night npm run print    # Night -> print/final/night/
```

This refuses to run while any draft remains, and refuses again if the face
count isn't a tier. For each edition it writes:

| File | What it is |
|---|---|
| `back.png` | one shared back for all 54 cards of that edition |
| `face-001-title.png` | the title card |
| `face-002-instructions.png` | how to use the deck |
| `face-NNN-card-II.png` | one per prompt |
| `contact-sheet.png` | all 55 faces on one sheet |
| `contact-sheet.html` | the same, live, for zooming in |

Face names carry **two** numbers and they are not the same number. `NNN` is
the position in the upload, so a plain alphabetical sort is the deck order.
`II` is the card's `id` — what is printed on the card and what `/c/<id>/`
resolves to. They differ because the title and instructions cards come first.

Every face is also **measured** as it renders: if any text crosses the safe
line, the run names the file, quotes the text and the overflow in pixels, and
exits non-zero. Text at the safe boundary is not reliably visible by eye on a
downscaled proof — the guide outline and a full-width line of type blur into
each other — so this is checked rather than looked at.

Every file is **897 × 1497 px at 300 DPI**. That is MPC's published tarot
upload size, taken from their
[upload FAQ](https://www.makeplayingcards.com/faq-photo.aspx), not from a
third-party template:

```
trim          2.75" × 4.75"          825 × 1425 px
bleed         0.12" each side         36 px  ← trimmed off
safe margin   0.12" further in        36 px  ← keep content inside
upload        2.99" × 4.99"          897 × 1497 px
```

Note the bleed is **0.12"**, not the 1/8" (0.125") MPC's prose rounds it to.
Building to 0.125" gives 900 × 1500, which MPC accepts and silently rescales,
putting every card about 0.3% off register. `SELF_CHECK` in
`scripts/print-cards.js` fails the run if the computed size ever drifts.

To see the bleed and safe outlines drawn on the cards:

```sh
GUIDES=1 npm run print
```

## 3. Proof the contact sheet

Open `print/final/<edition>/contact-sheet.png` and read every card. This is
the step that catches what code cannot:

- a line break that lands somewhere stupid
- a card that reads badly next to its neighbours
- a typo that survived because it is a real word

Card text is set with each **sentence** as its own balanced block, so
two-sentence cards break at the full stop rather than stranding the next
sentence's first word on the line above.

To see the cards as objects, trimmed and corner-rounded, and the boxes
folded up around them:

```sh
npm run mockup            # -> print/mockup/cards.png, desk-paper.png, desk-night.png, desk-both.png
```

These are drawn, not photographed. They are for judging type, margins and
the object as a whole; colour on card stock will be flatter than on a
screen. Never upload anything from `print/mockup/`.

The Night deck prints pale type on a dark ground. Ink spreads into reversed
type on press and thins it, so `scripts/print-cards.js` sets Night faces at
a heavier weight than Paper faces. A full-bleed dark card also shows edge
wear sooner, because the white core appears wherever the edge chips.

## 4. Order

One order per edition. At MPC, choose a **blank tarot deck** (2.75" × 4.75")
and set the card count to **54**. Then:

- **Fronts** — upload the 54 `face-*.png` files. Their `NNN` prefix means a
  plain alphabetical sort is already the deck order. (For a deck you shuffle
  this is cosmetic, but a scrambled upload makes the online proof hard to
  check against the contact sheet.)
- **Back** — choose the same back for every card and upload `back.png`.
- **Finish** — smooth or linen. Linen hides fingerprints and shuffles better;
  smooth holds fine type slightly more crisply. For a deck meant to be
  handled daily, linen.
- **Stock** — their standard blue-core is right for this. Black-core exists
  to stop light showing through, which only matters for games with hidden
  information.

Check MPC's own on-screen proof before paying. Their preview draws the safe
area; nothing should cross it.

## 5. After it ships

- `DECK_VERSION` in `src/config.ts` is the printing number on the box base.
  The first boxes are printing 1. Bump it when card text changes after a
  deck has been printed, so the site and a box in the hand can be told
  apart.
- If the deck ever gets a product page, set `PHYSICAL_DECK_URL` in the same
  file and every "physical deck" link on the site points at it.

---

## The free print-and-play edition

`npm run pnp` renders `public/print-and-play.pdf`: the whole live deck plus
the five rules cards and a title card, four to a US Letter page at true
tarot size, with a cover sheet of instructions and a page of backs for
optional duplexing. It is linked from the About page and served as a static
asset.

```sh
npm run pnp          # -> public/print-and-play.pdf
npm run pnp:check    # is the committed PDF still in step with cards.json?
```

The PDF is served at a stable URL, so the service worker (`public/sw.js`)
fetches it network-first: a returning visitor gets the regenerated edition
on the next online visit, and the cached copy only when offline. No cache
version bump is needed after `npm run pnp`.

Three things it deliberately does differently from the manufactured run:

- **Drafts don't block it.** A permanent deck must not ship a placeholder, so
  `npm run print` refuses while any card is unwritten. Someone printing at
  home today should get today's cards rather than nothing, so the PDF renders
  the live deck and leaves the reserved slots out.
- **The rules cards are here and only here.** MPC prints tarot decks in fixed
  tiers, and the manufactured deck already sits exactly on 54 faces (52
  prompts + title + instructions). Adding five rules cards would make 59,
  which is not a tier — it would cost four written prompts or a jump to the
  72 tier. The five games are on `/play/`, printed in the free edition, and
  out of the manufactured deck until the deck is deliberately resized.
- **The PDF is committed.** It is a generated artifact in git, which is
  normally the wrong thing: the site is static files on a host with no
  browser, so it cannot be rendered on request, and the About page links it.
  The cost of committing generated output is silent drift, so
  `scripts/pnp-stamp.json` records a hash of the inputs (card texts, rules
  cards, generator) and `npm run pnp:check` fails CI when the PDF stops
  matching them. PDFs are not byte-reproducible — they carry ids and dates —
  so the inputs are hashed rather than the output.

Every cell is measured for overflow before the PDF is written, the same way
the manufactured faces are measured against the safe line.

---

## The box

Each edition goes in MPC's
[custom rigid box for tarot cards](https://www.makeplayingcards.com/design/custom-rigid-box-for-tarot-cards.html):
a lid and a base, printed all over. Checked on that page on 2026-10-12:

| | |
|---|---|
| Size option | **Up to 78 cards**, the smallest they make |
| External size | 129.9 × 79.1 × 30.3 mm |
| Finish | **Matte laminated (linen finish)**. Large solid dark areas show scuffs and this hides them best |
| Price | $18.40 for one |
| Template | `2.75x4.75x78pcs.pdf`, from the "Download rigid box template" link with that size selected |

A 54-card deck is 18 to 19 mm thick and the box is built for 78 cards, so
the deck sits about 8 mm below the rim of the base. That was accepted in
exchange for a lid-and-base box and room to grow to the 72 tier.

What goes on each panel is defined once, in `scripts/box-art.js`, in
millimetres: the mark, the name and a wall label on the lid top; the name
and edition along the long sides; the mark on the short sides; and on the
underside what the deck is, the URL and the printing number. The Paper box
has a forest ink lid on a paper base. The Night box is night all over with
the mark in emerald. `npm run mockup` folds those panels into a box to look
at.

**Not done yet:** laying the panels onto MPC's template as an upload file.
The template fixes where each panel sits, how far artwork must bleed past
the fold and what wraps inside the rim, and none of that can be guessed
from the external size. Until that generator exists the box cannot be
ordered with custom art; MPC will print a plain white or black one.

---

## If Playwright can't find a browser

`npm run print` drives headless Chromium. If it dies with *"Executable doesn't
exist"*, another tool has pruned the shared browser cache. Reinstall it with
`npx playwright install chromium`, or keep an isolated copy at:

```sh
export PLAYWRIGHT_BROWSERS_PATH="$HOME/Library/Caches/gs-playwright"
```

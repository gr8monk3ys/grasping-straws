# Printing the decks

How to turn the card files into physical decks of poker-size cards from
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

The card is poker size, 2.5" × 3.5" (63.5 × 88.9 mm). That is the nearest
size MPC makes to the 70 × 90 mm card of Oblique Strategies, the deck this
one answers: the same height to within a millimetre and 6.5 mm narrower.
The size and everything that follows from it live in `scripts/card-spec.js`.

Everything about the files is settled and checked by the build. The parts
that need a human are the writing and the finish.

---

## 1. Finish the writing (blocking)

Every card in both editions has text, so both render. **The text is not
final.** The Night deck and Paper cards #49–52 were written as stand-ins so
the objects could be designed around real words; Lorenzo revises every card
before anything is ordered. A printed deck is permanent, so do not order
until that pass is done.

MPC sells this card in decks of **up to** 18, 36, 55, 72, 90 and more. Each
edition is 52 cards + a title card + an instructions card, which is 54, so
it is ordered as a deck of up to 55 with one slot unused. A 56th face would
move it to the 72 deck and its price. To grow an edition, reserve the new
ids as drafts first:

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

This refuses to run while any draft remains, and refuses again if the faces
outnumber the largest deck MPC sells. For each edition it writes:

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

Every file is **822 × 1122 px at 300 DPI**. That is MPC's published poker
upload size, taken from their
[upload FAQ](https://www.makeplayingcards.com/faq-photo.aspx), not from a
third-party template:

```
trim          2.5" × 3.5"            750 × 1050 px
bleed         0.12" each side         36 px  ← trimmed off
safe margin   0.12" further in        36 px  ← keep content inside
upload        2.74" × 3.74"          822 × 1122 px
```

Note the bleed is **0.12"**, not the 1/8" (0.125") MPC's prose rounds it to.
Building to 0.125" gives 825 × 1125, which MPC accepts and silently rescales,
putting every card a little off register. `scripts/print-cards.js` fails the
run if what it computes ever differs from `UPLOAD` in `scripts/card-spec.js`.

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

One order per edition. At MPC, choose
[Design Your Own Game Cards, Traditional Poker Size](https://www.makeplayingcards.com/design/custom-blank-card-traditional-size.html)
(63.5 × 88.9 mm) and set the size to **Up to 55 cards**. Then:

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

- **Box** — add the custom rigid box for poker cards: **Custom**, **Up to 55
  cards**, **Matte laminated (linen finish)**, and upload that edition's
  `box.pdf`. See [The box](#the-box) below.

Prices read from MPC's configurator on 2026-10-12, for one copy: $18.75 for
the deck on M31 linen stock and $16.70 for the box, so about $35 an edition
before shipping.

Check MPC's own on-screen proof before paying. Their preview draws the safe
area; nothing should cross it. Check it against the contact sheet card by
card: this is the last look before the deck is permanent.

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
- **The rules cards are here and only here.** The manufactured deck is 54
  faces (52 prompts + title + instructions) and is ordered as a deck of up
  to 55. Adding five rules cards would make 59, which moves it to the 72
  deck and no longer fits the 55-card box. The five games are on `/play/`,
  printed in the free edition, and out of the manufactured deck until the
  deck is deliberately resized.
- **It is still tarot size.** The free edition was laid out four to a page
  at 2.75" × 4.75" before the manufactured deck moved to poker size, and has
  not been redrawn. The words are the same; the card is taller.
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
[custom rigid box for poker cards](https://www.makeplayingcards.com/design/custom-rigid-box-for-poker-sized-cards.html):
a lid and a base, printed all over. Checked on that page on 2026-10-12:

| | |
|---|---|
| Size option | **Up to 55 cards**, the smallest they make |
| External size | 97.8 × 72.4 × 20.7 mm |
| Finish | **Matte laminated (linen finish)**. Large solid dark areas show scuffs and this hides them best |
| Price | $16.70 for one |
| Template | `2.5x3.5x54pcs.pdf`, from the "Download rigid box template" link with that size selected |

The box is made for the deck: 55 cards, against the 54 printed. There is no
room in it for a larger deck, so growing an edition past 55 faces means a
new box and a new dieline.

The template is one page holding two nets: the lid on the left, the base on
the right, each a centre panel with four walls and a wrap that turns over
the rim. Its numbers are in `scripts/box-spec.js`, every one a vertex read
out of MPC's file, with a self-check against the size MPC lists. Two things
the listing does not tell you and the template does:

- The **lid is as deep as the base**, 20.7 mm, so a closed box shows only
  the lid. The base's colour is seen when the box is open.
- The **base is 67.9 × 93.3 mm**, smaller than the lid by the thickness of
  the board all round.

What goes on each panel is defined once, in `scripts/box-art.js`, in
millimetres: the mark, the name and a wall label on the lid top; the name
and edition along the long walls; the mark on the short walls; and on the
underside what the deck is, the URL and the printing number. The base walls
are plain.

```sh
npm run print:box                  # Paper -> print/final/paper/
EDITION=night npm run print:box    # Night -> print/final/night/
```

| File | What it is |
|---|---|
| `box.pdf` | the artwork alone on the template's page, placed from the template's own origin. **This is the upload.** |
| `box.png` | the same page at 300 DPI, if their uploader wants an image |
| `box-proof.png` | the artwork with folds in blue and the cut line in red. For checking; never upload it |

The run measures every piece of lettering against its own panel and fails
if any comes within 3 mm of a fold, and it reads the page size back out of
the written PDF and fails if that is not the template's. Chromium does not
print a PDF page at exactly the size asked, so `box.pdf` comes out up to
0.2 mm taller or shorter than the template; the artwork is anchored to the
bottom-left corner, which is the template's origin, so the difference is
added to or taken from the spare bleed along the top.

That placement was checked against the real thing on 2026-10-12, for this
template and for the tarot one used before it: the
fold rectangles were printed to a PDF the same way, MPC's template and that
PDF were both rasterised with Inkscape
(`inkscape --pdf-poppler --export-type=png --export-dpi=200`), and the two
were stacked from the bottom-left corner. The folds coincided at opposite
corners of the page, the lid's top-left and the base's bottom-right. Repeat
that if the template or the browser that renders the PDF changes. MPC's
template is their file and is not kept in this repo.

Open `box-proof.png` before uploading and check three things: every wall's
lettering has its top toward the centre panel (that edge is uppermost once
folded), nothing sits on a blue line, and colour runs past the red line
everywhere.

MPC's template was written for Illustrator: add artwork on a layer, hide
their layer, send the file back. `box.pdf` is that file without their
layer. **Not yet verified:** what their uploader accepts for a rigid box
and how it previews it. That is checked the first time a cart is built; if
it rejects the PDF, `box.png` is the fallback.

---

## If Playwright can't find a browser

`npm run print` drives headless Chromium. If it dies with *"Executable doesn't
exist"*, another tool has pruned the shared browser cache. Reinstall it with
`npx playwright install chromium`, or keep an isolated copy at:

```sh
export PLAYWRIGHT_BROWSERS_PATH="$HOME/Library/Caches/gs-playwright"
```

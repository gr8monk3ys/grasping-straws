# Printing the deck

How to turn `public/cards.json` into a physical deck of tarot-size cards from
[MakePlayingCards](https://www.makeplayingcards.com) (MPC). They have no
minimum order, so one personal copy is a normal thing to buy.

Everything about the files is already settled and checked by the build. The
parts that need a human are the writing and the finish.

---

## 1. Finish the deck (blocking)

Four card slots are reserved and unwritten. They exist because MPC prints
tarot decks in **fixed tiers** — 18, 36, 54, 72 — and 48 prompts + a title
card + an instructions card is 50, which is not a tier. Four more prompts
makes 54.

```sh
node scripts/validate-cards.js     # prints each slot and its brief
```

Each slot carries a `note` explaining the gap in its suit it was reserved to
fill. Write the text into `"text"`, then **delete the `draft` and `note`
keys**. Validation fails if a card has text while still marked draft, so a
half-finished edit cannot slip through.

Use typographic apostrophes (`’`, not `'`). Validation enforces this — at
24pt on card stock a typewriter apostrophe is conspicuous.

To see the layout before the writing is done:

```sh
PROOF=1 npm run print     # renders to print/proof/, every draft stamped UNWRITTEN
```

Proof output is defaced on purpose and goes to a different directory, so it
can't be mistaken for the real thing at upload time.

## 2. Render

```sh
npm run print             # -> print/final/
```

This refuses to run while any draft remains, and refuses again if the face
count isn't a tier. It writes:

| File | What it is |
|---|---|
| `back.png` | one shared back for all 54 cards |
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

Open `print/final/contact-sheet.png` and read every card. This is the step
that catches what code cannot:

- a line break that lands somewhere stupid
- a card that reads badly next to its neighbours
- a typo that survived because it is a real word

Card text is set with each **sentence** as its own balanced block, so
two-sentence cards break at the full stop rather than stranding the next
sentence's first word on the line above.

## 4. Order

At MPC, choose a **blank tarot deck** (2.75" × 4.75") and set the card count
to **54**. Then:

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

- Bump `DECK_VERSION` in `src/config.ts` so the site and the printed box
  agree on which edition is which.
- If the deck ever gets a product page, set `PHYSICAL_DECK_URL` in the same
  file and every "physical deck" link on the site points at it.

---

## Not done yet: the tuck box

The box is a separate piece of artwork on a different template, and its
dimensions depend on the **stack thickness** — which depends on the stock and
card count you actually select at order time. Guessing it is exactly the
mistake this file exists to prevent.

When you've chosen a stock, download MPC's tuck-box template for that
configuration and its numbers can be dropped into a box generator the same
way `SPEC` works here. MPC will also print a plain white or black box if you
would rather not.

---

## If Playwright can't find a browser

`npm run print` drives headless Chromium. If it dies with *"Executable doesn't
exist"*, another tool has pruned the shared browser cache — see
`.claude/skills/verify/SKILL.md`. The isolated copy lives at:

```sh
export PLAYWRIGHT_BROWSERS_PATH="$HOME/Library/Caches/gs-playwright"
```

# Viability features & the physical deck — design

**Date:** 2026-07-12
**Goal:** make Grasping Straws? completely viable as a web app with features
worth talking about, and lay the concrete path to a real card deck game for
artists.

## Constitution (what every feature must respect)

The product's identity is already written into CI: zero framework
JavaScript, no backend, no analytics, no third-party requests at runtime,
one animation, AA contrast in both themes. Features that would need a
server, an account, or a tracking pixel are out of scope by definition.
Everything below is static-site-shaped.

## Approaches considered

1. **Polish only** — fix the placeholder print specs, write the ordering
   docs, ship. Rejected: viable, but adds nothing artists would tell each
   other about.
2. **Curated slate within the ethos** (chosen) — surface the deck's dormant
   structure, add two ritual surfaces, turn the prompts into an actual
   game, and give the physical deck both a free on-ramp and a real
   production path.
3. **Platform play** — accounts, custom decks, commerce backend. Rejected:
   contradicts the product's stated identity and adds permanent
   maintenance burden for speculative value.

## The slate

### 1. Suit decks — "draw from one straw"

Every card already carries a hidden `suit` (`lateral` ×18, `sound` ×10,
`image` ×8, `language` ×6, `threshold` ×6). A musician stuck on a mix
wants `sound`; a painter wants `image`. Surface this as a quiet filter:

- **UI:** a single unobtrusive control under the hint slot on the draw
  screen — a row of suit words, `everything` first and default. Styled
  like the share control (small, muted); hidden until the visitor has
  drawn at least once, so the first-run screen stays untouched.
- **Mechanics:** choosing a suit rebuilds the bag from that suit's ids
  only; the same no-repeat-within-a-cycle and fresh-top-after-reshuffle
  rules apply inside the filtered deck. Switching back to `everything`
  rebuilds the full bag. The choice persists in the same localStorage
  blob (`suit` key); unknown saved suits fall back to `everything`.
- **Naming:** visitors see the suit words as-is — they are evocative and
  already the deck's own vocabulary.

### 2. `/play/` — the deck as a game

Ways-to-play page with original rules, written for working artists: solo
rituals, a duet mode, and group/studio games. This is what turns a prompt
deck into a *card deck game*, and the same text becomes the printed
instruction cards (Appendix A wants 54 faces; 48 prompts + 1 title + 5
rules cards = 54). Linked from the About page and the chrome footer.

### 3. `/today/` — the daily card

A ritual surface: one deterministic card per calendar day, computed
client-side from the date (FNV-style hash of YYYY-MM-DD in the visitor's
local time, mod deck size) — same card for everyone all day, no backend.
The page reuses the card-page presentation, invites a share (pointing at
the card's `/c/<id>/` page), and links back to the deck. Linked from the
About page.

### 4. Print-and-play PDF — the free on-ramp

`npm run pnp` renders the whole deck — faces, backs, rules cards — as a
cut-lines PDF (Letter, tarot-size cards, 2×2 per sheet) via Playwright's
`page.pdf()`, committed as `public/print-and-play.pdf`. The About page
links it. Free print-at-home version markets the manufactured deck
("the object is the instrument") instead of cannibalizing it.

### 5. Physical deck — real numbers, real path

- Replace the placeholder bleed/safe numbers in `scripts/print-cards.js`
  with the printer's published template dimensions (researched from
  MakePlayingCards and The Game Crafter; recorded with source URLs in
  `docs/physical-deck.md`).
- Add the 5 rules cards + title card to the print run: 54 faces total.
- Write `docs/physical-deck.md`: the ordering playbook — printer
  comparison with prices, proof-order steps, box options, and the
  zero-inventory sales channels (both printers offer print-on-demand
  storefronts), plus the `PHYSICAL_DECK_URL` go-live step.

## Error handling

- Suit filter: corrupted/unknown saved suit → `everything`; a suit whose
  cards were all removed from `cards.json` → refill falls back to the
  full deck.
- `/today/`: deck fetch failure shows the same refresh message as the
  draw screen.
- Print scripts stay dev-only (Playwright), never shipped to visitors.

## Testing

`scripts/verify.js` (run in CI) grows checks for: suit filter appears
after a draw, filtering constrains draws to the suit and keeps the
no-repeat rule, the choice persists across reload, `everything` restores
the full bag; `/today/` shows a card and is deterministic within a day
(two fresh contexts agree); `/play/` renders and is linked; the
print-and-play PDF is linked from About and served. `npm run validate`,
`npm run check`, and the no-third-party-requests rule keep applying.

## Out of scope

Accounts, favorites/journals, custom decks, analytics, newsletter,
payments on the site itself. The site sells the deck by linking to the
printer's storefront — no commerce code here.

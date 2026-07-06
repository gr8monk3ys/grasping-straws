# Grasping Straws?

A single-purpose, mobile-first web app that deals one card at a time from an
original deck of lateral-thinking prompts, in the spirit of Brian Eno and
Peter Schmidt's Oblique Strategies. All card text here is original.

Tap, get a card, tap again.

Built with [Astro](https://astro.build) as a fully static site. The built
output ships **zero framework JavaScript** — just the ~2 KB draw script,
inlined into the page.

## Editing the deck

Edit **`public/cards.json`** and nothing else. It's an array of
`{ "id": 1, "text": "…", "suit": "lateral" }` objects:

- `id` must be unique and stable — it's what `#17`-style share links point at.
- `text` is the card.
- `suit` is optional metadata for your own editing convenience; it is never
  shown to visitors.

Removed cards vanish from visitors' in-progress decks automatically; added
cards join at their next reshuffle. When an editing pass lands, bump
`DECK_VERSION` in `src/config.ts` so the site and the printed deck stay in
lockstep.

## Configuration

`src/config.ts` holds the site constants, baked in at build time:

- `DECK_NAME` — the display name. The `?` is part of the mark; designed
  contexts (masthead, card back, titles) keep it, running prose drops it, and
  technical identifiers use `grasping-straws`.
- `PHYSICAL_DECK_URL` — leave `""` for the built-in "coming soon" state;
  set it to the product page URL once the physical deck exists.
- `DECK_VERSION` — shown discreetly on the About page.

The mark (straw bundle) has a single vector source: `public/favicon.svg`.
Both pages render it from there via CSS `mask`, so editing the glyph means
editing one file.

## Developing

```sh
npm install
npm run dev        # dev server with live reload
npm run build      # static build into dist/
npm run preview    # serve the built site
npm run check      # typecheck the client script
npm run validate   # lint public/cards.json
npm run verify     # drive the built site end to end (build + serve first)
npm run assets     # regenerate og.png + PWA icons from favicon.svg
npm run print      # render 300 DPI card faces into print/ (see below)
```

## Print files (physical deck)

`npm run print` renders every card, the card back, and a title card as
300 DPI PNGs into `print/` for MakePlayingCards / The Game Crafter. The
bleed and safe-margin numbers in `scripts/print-cards.js` are
**placeholders** — download the printer's own template files and copy their
exact dimensions in before ordering (run with `GUIDES=1` to overlay the
bleed/safe outlines while checking).

## Deploying

Vercel auto-detects Astro; zero further config. Every push to `main`
rebuilds and deploys. When the real domain goes live, update `site` in
`astro.config.mjs` so `og:image` URLs point at it.

## How it works

- **The bag** (`src/scripts/app.ts`): the full deck is shuffled
  (Fisher–Yates, backed by `crypto.getRandomValues`) into a queue and dealt
  until empty — no repeats within a cycle, like a physical deck. The
  reshuffle guarantees the first card of a new bag differs from the last
  card dealt. Bag state persists in `localStorage`.
- **Share links**: every draw sets `location.hash` to the card id; loading
  `/#17` shows card 17 face up, then rejoins the normal bag.
- **Themes**: light (paper-warm) and dark (near-black) via
  `prefers-color-scheme`, both AA contrast.
- **Motion**: the card flip is the only animation; `prefers-reduced-motion`
  swaps it for a fast crossfade.
- **Offline**: a small service worker (`public/sw.js`) precaches the stable
  URLs and caches everything else as it streams through; Astro's hashed
  asset names mean bundles can never go stale. No third-party requests, no
  analytics, no backend.

## CI

`.github/workflows/ci.yml` runs on every PR: validates `public/cards.json`,
typechecks, builds, then drives the built site in headless Chromium
(`scripts/verify.js`) — full-cycle no-repeat guarantee, reshuffle rule,
persistence, deep links, themes, reduced motion, and the
no-third-party-requests rule.

## Licenses

Code is GPL-3.0 (see `LICENSE`). The EB Garamond fonts in `public/fonts/`
are under the SIL Open Font License (see `public/fonts/OFL.txt`).

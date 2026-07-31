# Grasping Straws?

A single-purpose, mobile-first web app that deals one card at a time from an
original deck of lateral-thinking prompts, in the spirit of Brian Eno and
Peter Schmidt's Oblique Strategies. All card text here is original.

Tap, get a card, tap again.

<p align="center">
  <img src="docs/screenshot-light.png" alt="The face-down card showing the straw-bundle mark, paper-warm light theme" width="42%">
  &nbsp;&nbsp;
  <img src="docs/screenshot-dark.png" alt="A drawn card reading &quot;Solve the wrong problem beautifully.&quot;, near-black dark theme" width="42%">
</p>

Built with [Astro](https://astro.build) as a fully static site. The built
output ships **zero framework JavaScript** — just the draw script and a
hand-rolled WebGL paper shader, ~4 KB gzipped together and inlined into the
page. No framework, no animation library, no third-party requests at runtime.

The card is a real object rather than a picture of one: a two-faced 3D flip
with 3px of stock and lit side edges, a deck beneath that thins as you work
through it, and a fragment shader that generates the paper fibre and tracks
the specular highlight to the card's live rotation. All of it degrades — the
shader falls back to a CSS grain layer, and `prefers-reduced-motion` gets a
plain crossfade.

## Editing the deck

Edit **`public/cards.json`** and nothing else. It's an array of
`{ "id": 1, "text": "…", "suit": "lateral" }` objects:

- `id` must be unique and stable — it's what `#17`-style deep links and the
  `/c/17/` share pages point at.
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
- **Sharing**: once a card is face up, a quiet "share this card" control
  appears in the hint's line — the native share sheet where the platform
  has one, copy-to-clipboard otherwise. It hands out `/c/17/`-style URLs:
  one static page per card, built from `cards.json` at build time, with the
  card text in the title and OG tags so shared links preview the card
  itself (`#`-fragments never reach link scrapers). Each page invites the
  visitor to draw their own.
- **Themes**: light (paper-warm) and dark (near-black), following
  `prefers-color-scheme` by default with a masthead toggle that overrides it
  and persists. Both AA contrast, including the green accent.
- **Type**: Fraunces for the card face and prose, IBM Plex Mono for the
  masthead, tally and labels. Sizes are set by *apparent* size — the two
  families have different x-heights (0.436 and 0.516), so they get separate
  ramps, and a check fails the build if anything renders under ~11.5px
  apparent.
- **The piles**: the deck thins and the discard thickens as you work through
  a cycle, both derived from the same bag state rather than stored
  separately.
- **Motion**: the flip, a per-word card reveal, scroll-driven About reveals
  (native `animation-timeline`, zero JS), hover choreography and a three-beat
  entrance. `prefers-reduced-motion` reduces all of it to a fast crossfade.
- **Offline**: a small service worker (`public/sw.js`) precaches the stable
  URLs and caches everything else as it streams through; Astro's hashed
  asset names mean bundles can never go stale. No third-party requests, no
  analytics, no backend.

## CI

`.github/workflows/ci.yml` runs on every PR: validates `public/cards.json`,
typechecks, builds, then drives the built site in headless Chromium
(`scripts/verify.js`) — full-cycle no-repeat guarantee, reshuffle rule,
persistence, deep links, the share flow and per-card pages, themes,
reduced motion, and the no-third-party-requests rule.

## Licenses

Code is GPL-3.0 (see `LICENSE`). The Fraunces and IBM Plex Mono fonts in
`public/fonts/` are under the SIL Open Font License (see
`public/fonts/OFL.txt`).

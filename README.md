# Grasping Straws?

A single-purpose, mobile-first web app that deals one card at a time from an
original deck of lateral-thinking prompts, in the spirit of Brian Eno and
Peter Schmidt's Oblique Strategies. All card text here is original.

Tap, get a card, tap again.

## Editing the deck

Edit **`cards.json`** and nothing else. It's an array of
`{ "id": 1, "text": "…", "suit": "lateral" }` objects:

- `id` must be unique and stable — it's what `#17`-style share links point at.
- `text` is the card.
- `suit` is optional metadata for your own editing convenience; it is never
  shown to visitors.

Removed cards vanish from visitors' in-progress decks automatically; added
cards join at their next reshuffle.

## Configuration

`config.js` holds the two site constants:

- `DECK_NAME` — the display name. The `?` is part of the mark; designed
  contexts (masthead, card back, titles) keep it, running prose drops it, and
  technical identifiers use `grasping-straws`.
- `PHYSICAL_DECK_URL` — leave `""` for the built-in "coming soon" state;
  set it to the product page URL once the physical deck exists.

## Running locally

It's a static site — serve the directory over HTTP (the deck is fetched, so
`file://` won't work):

```sh
python3 -m http.server 8000
# or: npx serve
```

## Deploying

Push to Vercel as a zero-config static deploy. No build step, no `vercel.json`.

After changing any asset, bump `VERSION` in `sw.js` so returning offline
visitors pick up the new files.

## How it works

- **The bag** (`app.js`): the full deck is shuffled (Fisher–Yates, backed by
  `crypto.getRandomValues`) into a queue and dealt until empty — no repeats
  within a cycle, like a physical deck. The reshuffle guarantees the first
  card of a new bag differs from the last card dealt. Bag state persists in
  `localStorage`.
- **Share links**: every draw sets `location.hash` to the card id; loading
  `/#17` shows card 17 face up, then rejoins the normal bag.
- **Themes**: light (paper-warm) and dark (near-black) via
  `prefers-color-scheme`, both AA contrast.
- **Motion**: the card flip is the only animation; `prefers-reduced-motion`
  swaps it for a fast crossfade.
- **Offline**: a small service worker (`sw.js`) caches everything after the
  first visit. No third-party requests, no analytics, no backend.

## Licenses

Code is GPL-3.0 (see `LICENSE`). The EB Garamond fonts in `fonts/` are under
the SIL Open Font License (see `fonts/OFL.txt`).

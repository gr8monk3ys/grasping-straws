# Product

<!-- impeccable:product-schema 1 -->

<!-- Written from the repository and the owner's brief in one session; the
     owner asked for the run to proceed without a live interview. Facts the
     repository states are recorded plainly. Facts inferred from it, rather
     than confirmed, are marked (inferred). -->

## Platform

web

## Users

Someone stuck mid-work on a creative task (music, film, writing, or anything
else) who wants one prompt to break the deadlock. They arrive on a phone or
at a desk, often mid-session, and want a card in one tap; they may come back
later and expect their deck to continue where it left off. (inferred from
the About page and the README's "tap, get a card, tap again")

Secondary: someone who received a shared card link and lands on a share
page with no context. (inferred from the /c/‹id›/ share pages)

## Product Purpose

Deal one card at a time from an original deck of 48 lateral-thinking
prompts. Success is a visitor drawing a card, taking it seriously for ten
minutes, and coming back to draw again. The site is a sample of the object;
the physical deck is the instrument.

## Positioning

An original deck in the lineage of Brian Eno and Peter Schmidt's Oblique
Strategies (1975): the debt is to the form, not the words. Every card is
original. The name is the method: reaching for a random card feels like
grasping straws, but the drowning man's error is assuming everything within
reach is a straw. The question mark is part of the mark.

The web version behaves like a deck you own rather than a random-quote
button: cards deal from a pile that thins onto a discard that thickens,
either pile can be picked up and looked through, cards can be set aside on
a shelf, and all of it persists across visits.

## Operating Context

- The draw screen (/) is the product: card, deck, discard, shelf, the
  set-aside and share controls, a masthead with the running tally.
- Each card has a static share page (/c/‹id›/) whose title carries the card
  text so a shared link previews the card itself.
- The About page (/about/) explains the lineage and why the physical deck is
  the real thing.
- The physical deck: tarot-size cards printed via MakePlayingCards, in fixed
  tiers, with a print pipeline in the repo (docs/printing.md). Four card
  slots are reserved as drafts until the deck reaches the 54-face tier.
- Deep links (/#‹id›) turn a card up on the draw screen; the draw screen
  works offline once visited (service worker).

## Capabilities and Constraints

- Static Astro site; the built output ships no framework JavaScript. The
  draw script, a hand-rolled WebGL paper shader and the theme toggle are
  ~6 KB gzipped, inlined. Budgets are enforced by the verifier: client JS
  ≤ 7 KB gzipped, CSS ≤ 6 KB gzipped, no JS bundles in dist.
- No third-party requests at runtime, enforced by a same-origin
  Content-Security-Policy meta tag. This is a published promise.
- Tap-to-readable-text budget: the longest card's last word must land
  within 560 ms of the tap.
- Everything degrades: the shader falls back to a CSS grain layer;
  prefers-reduced-motion gets a plain crossfade and silences the table's
  motion; no JavaScript leaves a readable notice and a link to the raw
  cards.json.
- Terminology follows CONTEXT.md: card, draft, deck, cycle, bag, deal,
  discard, reshuffle, face-up card, turn up, shelf, set aside, pile, share
  page.
- Undecided: the physical deck's product page URL (PHYSICAL_DECK_URL is
  empty; the site shows a "coming soon" state). No pricing, no launch date.

## Brand Commitments

- Name: "Grasping Straws?" with the question mark in designed contexts
  (masthead, card back, titles); running prose drops it; technical
  identifiers use grasping-straws.
- Mark: the straw bundle, single vector source at public/favicon.svg,
  rendered via CSS mask on the site and inlined for print.
- Voice: the cards themselves. Short imperatives, questions and koans;
  typographic quotes only (’ “ ”), enforced by validation.
- Made by Lorenzo; deck version shown discreetly on the About page.

## Evidence on Hand

- public/cards.json: 48 written cards across five suits (lateral, sound,
  image, language, threshold); suits are editorial metadata, never shown.
- docs/screenshot-light.png and docs/screenshot-dark.png: the shipped
  interface in both themes.
- docs/printing.md and scripts/print-cards.js: the physical deck's print
  spec and pipeline.
- No testimonials, press, customers, or usage numbers exist. Future work
  must not fabricate any.

## Product Principles

1. One tap, one card. Nothing on the draw screen competes with the deal.
2. A deck you own, not a random-quote button: piles, sequence and the shelf
   are real and persist.
3. The card is a physical object on screen: stock, edges, paper, weight,
   and a turn that reads as a turn.
4. The screen is the sample; the printed deck is the instrument. The site
   should make someone want the object.
5. Ship nothing the visitor did not ask for: no framework, no third-party
   requests, no tracking, and every effect degrades gracefully.

## Accessibility & Inclusion

- WCAG AA contrast on both themes is a standing requirement; the verifier
  checks the accent against its ground.
- The card text stays real DOM (never rasterised) so it is read by
  assistive technology, selectable and shareable; an aria-live region
  announces each deal.
- Keyboard: space or Enter deals; the piles open as native dialogs with
  focus return; reduced motion is honoured throughout.
- Type floor: no text under ~11.5 px apparent size on any page.

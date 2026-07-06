---
name: verify
description: Build/launch/drive recipe for verifying the Grasping Straws? static site end-to-end in a browser.
---

# Verifying Grasping Straws?

Static site, no build step. The deck is fetched, so it must be served over
HTTP (`file://` won't work).

## Launch

```sh
npx http-server -p 8317 -a 127.0.0.1 --silent &   # or python3 -m http.server
```

## Drive

Playwright 1.56 is installed globally; Chromium is preinstalled
(`PLAYWRIGHT_BROWSERS_PATH` is already set). Run scripts with:

```sh
NODE_PATH=/opt/node22/lib/node_modules node <script>.js
```

Flows worth driving after a change:

- Fresh visitor: face-down card + hint visible; click/space/Enter flips to a
  card, `location.hash` becomes `#<id>`, hint fades permanently.
- Full cycle: draw `cards.json.length` times → all ids unique; the next draw
  (reshuffle) must differ from the last card dealt.
- Persistence: reload → `localStorage["grasping-straws.v1"].bag` length
  unchanged; hint stays hidden without re-fading.
- Deep link: `/#17` in a **fresh browser context** (storage is shared within
  a context — a used context legitimately hides the hint) shows card 17 face
  up instantly.
- Emulate `colorScheme: "dark"` and `reducedMotion: "reduce"` contexts —
  both are separately designed paths.
- About page: `data-physical-link` degrades to "coming soon" text while
  `PHYSICAL_DECK_URL` in `config.js` is `""`.
- Collect `page.on("request")` URLs → nothing off-origin is allowed.

## Gotchas

- Draw inputs are swallowed during the 400 ms flip (busy guard — that's by
  design). When scripting consecutive draws, wait for `location.hash` to
  change and pad ~450 ms, or retry the keypress.
- The hint fade transition is 0.8 s — sample its opacity after ~900 ms.
- The service worker registers on 127.0.0.1/localhost; use a fresh browser
  context when you need an uncached first-visit.

---
name: verify
description: Build/launch/drive recipe for verifying the Grasping Straws? Astro site end-to-end in a browser.
---

# Verifying Grasping Straws?

Astro static site. Always verify the **built** output, not the dev server
(the dev server injects Astro's toolbar and skews request/size checks).

## Launch

```sh
npm install          # first time; playwright is pinned to match the
                     # preinstalled browsers (PLAYWRIGHT_BROWSERS_PATH)
npm run build
python3 -m http.server 8317 --bind 127.0.0.1 --directory dist &
```

## Drive

The full end-to-end suite is checked in — run that first:

```sh
node scripts/verify.js        # BASE_URL / SHOTS_DIR env vars optional
```

CI runs the same script via `.github/workflows/ci.yml`.

Flows it covers — extend it rather than scripting ad hoc:

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
- About page (`/about/`): the physical-deck link degrades to "coming soon"
  text while `PHYSICAL_DECK_URL` in `src/config.ts` is `""`.
- Collect `page.on("request")` URLs → nothing off-origin is allowed.

## Gotchas

- Draw inputs are swallowed during the 400 ms flip (busy guard — that's by
  design). When scripting consecutive draws, wait for `location.hash` to
  change and pad ~450 ms, or retry the keypress.
- The hint fade transition is 0.8 s and only armed after the `settled` class
  lands (one rAF after load) — sample opacity after ~900 ms.
- The service worker registers on 127.0.0.1/localhost; use a fresh browser
  context when you need an uncached first-visit.
- Don't run `npx playwright install` here — browsers are preinstalled; if
  versions drift, keep `playwright` pinned to the version matching
  `/opt/pw-browsers` (currently 1.56.1).

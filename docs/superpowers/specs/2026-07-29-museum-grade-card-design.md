# Museum-grade card: motion & materiality pass

**Date:** 2026-07-29
**Scope:** `src/styles/global.css`, `src/scripts/app.ts`, `src/pages/index.astro`,
`src/pages/c/[id].astro`, `src/layouts/Base.astro`, `scripts/verify.js`

## Goal

Make the card read as a physical printed object rather than a flat surface that
changes content. The site should look like itself — a visitor who knows it must
recognize it immediately — while feeling substantially more considered.

The reference bar is object craft (Teenage Engineering, fine-press typography
sites), not effects showcases (Awwwards-style scroll experiences). Restraint
executed to a level that reads as expensive.

## Non-goals

Explicitly **out of scope**. These are settled and must not change:

- The palette. `--bg`, `--card`, `--ink`, `--muted`, `--accent`, `--line`
  keep their current values in both themes.
- The typeface. EB Garamond throughout, both weights, self-hosted.
- The straw-bundle mark (`public/favicon.svg`) and its single-source
  CSS-`mask` rendering.
- Page layout and information architecture. Card centered, hint slot beneath,
  chrome footer. No new pages, no new navigation.
- The card copy in `public/cards.json`.
- The deal model. One tap, one card, flipped in place. The card is not dealt
  from the deck across the screen.

## Constraints

These are pass/fail, not aspirations:

| Constraint | Limit |
|---|---|
| Framework JavaScript in built output | **Zero** — unchanged |
| Inline client script | ≤ 4 KB (from ~2 KB) |
| Total CSS | ≤ 13 KB (from ~7 KB) |
| Off-origin requests | **Zero** — unchanged |
| New runtime dependencies | **None** |
| `prefers-reduced-motion: reduce` | Every animation below has a defined reduced path |
| Tap-to-readable-text latency | ≤ 560 ms |

`devDependencies` may not grow. Playwright and TypeScript stay as they are.

---

## 1 · DOM structure

Every other section depends on this. The current implementation toggles
`hidden` on `#card-mark` / `#card-text`, so only one face exists at a time and
the flip is faked: rotate to 90°, swap content at the invisible edge, rotate
back from −90°. It becomes a real two-faced rotation.

```
.deck                            owns perspective; not a button
├── .deck-stack                  SIBLING of .card — must not rotate with it
│   └── .deck-edge (×3)          all three always in the DOM; visibility toggled
├── .card                (button) unchanged role: the whole card is the hit target
│   └── .card-inner              accumulating rotation; transform-style: preserve-3d
│       ├── .face.face-a         geometric slot at rotateY(0deg)
│       │   ├── .card-mark       mark + wordmark; removed after the first draw
│       │   └── .face-text
│       └── .face.face-b         geometric slot, pre-rotated rotateY(180deg)
│           └── .face-text
```

Requirements:

- **The two faces are geometric slots, not fixed roles.** `.face-a` sits at
  `rotateY(0deg)` and `.face-b` at `rotateY(180deg)`, permanently. Which slot
  carries the current card text alternates with each draw — see *Rotation
  accumulation* below.
- **`.face-b` is pre-rotated `rotateY(180deg)`.** Without it, content in that
  slot renders mirror-imaged when the container turns.
- **`.deck-stack` is a sibling of `.card`, never a child of `.card-inner`.**
  Nesting it inside the rotating element rotates the whole pile and destroys
  the illusion.
- `perspective` moves from `1400px` on `.stage` to **`900px` on `.deck`**.
  1400px against a ~340px card is near-orthographic and reads as a flat thing
  turning rather than an object rotating in space.
- Both faces carry `backface-visibility: hidden`.

### Accessibility

`backface-visibility` is a visual property. It hides nothing from assistive
technology, so with both faces permanently in the DOM a screen reader would
announce the mark *and* the card text.

- Each `.face` gets an `aria-hidden` attribute, toggled in sync with the flip
  so exactly one face is ever exposed.
- The existing `#live` `aria-live="polite"` region continues to announce card
  text on draw. It remains the primary announcement path — face `aria-hidden`
  state exists to prevent double-reading, not to replace it.
- `.card` keeps its `aria-describedby="draw-desc"` and its button semantics.
  Keyboard behaviour (Space / Enter) is unchanged.

### Rotation accumulation

Rotation **accumulates** — 0deg → 180deg → 360deg → 540deg → … — rather than
resetting. It never rotates backwards, so the flip always turns the same way.

Because the slots are fixed in space, the slot facing the viewer alternates
with `flipCount % 2`. The rule is: **on each draw, write the new card text
into the *incoming* slot before starting the rotation.**

| State | Rotation | Slot facing viewer | Contents written |
|---|---|---|---|
| Initial | 0deg | `.face-a` | mark + wordmark |
| Draw 1 | 0 → 180deg | `.face-b` | card 1 → `.face-b` |
| Draw 2 | 180 → 360deg | `.face-a` | card 2 → `.face-a`; mark removed |
| Draw 3 | 360 → 540deg | `.face-b` | card 3 → `.face-b` |

The mark is only ever needed before the first draw — there is no interaction
that returns the card to face-down, which matches current behaviour. It is
removed from `.face-a` when that slot first becomes an incoming text slot.

`aria-hidden` is set on the outgoing slot and cleared on the incoming one, in
sync with the rotation, so exactly one slot is exposed to assistive technology
at every point.

The deep-link path (`show(id, { instant: true })`, `app.ts:203`) skips the
rotation entirely and writes directly into the slot currently facing the
viewer — it must not leave the card mid-turn.

---

## 2 · Materiality

| Layer | Technique | Budget |
|---|---|---|
| Paper grain | `feTurbulence` as a **data-URI `background-image`**, 160×160 tile | ~400 B |
| Card edge | 1px inset light on the top edge, 1px shade on the bottom | 0 |
| Elevation | `--shadow` splits into `--shadow-contact` + `--shadow-ambient` | 0 |
| Specular | Pseudo-element linear-gradient, position driven by flip progress | 0 |
| Deck depth | 3 offset `.deck-edge` elements, `--line` borders | 0 |

**Grain.** Encoded as a background-image, not a live CSS `filter`. As a
background-image the turbulence rasterizes exactly once and is then tiled by
the compositor like any bitmap; as a `filter` it re-rasterizes on composite and
will jank the flip. Tile stays small so the one-time raster is trivial.
Opacity differs per theme — grain that reads correctly on `#fdfaf3` is too
strong on `#201b16`. Target ~3% light, ~4.5% dark, tuned against screenshots.

**Elevation.** The single `--shadow` token becomes two so they can move
independently: the contact shadow tightens and darkens as the card settles
while the ambient shadow stays broadly stable. A single shadow cannot express
weight because lift and spread have to change at different rates.

**Specular.** A gradient sweep across the face, tied to the flip's own
progress rather than run on an independent timer, so it tracks the rotation
exactly.

---

## 3 · Motion

Timings are starting values, to be tuned against captured frames.

| Animation | Behaviour | Reduced-motion path |
|---|---|---|
| **Flip** | One continuous 0→180° rotation, ~520 ms, slight overshoot settle | Existing opacity crossfade (90 ms out / 140 ms in), no rotation |
| **Lift & settle** | Card rises ~14 px on `translateZ` through the turn, settles back; contact shadow tightens on descent | None — no lift |
| **Press** | Pointer-down scales to 0.985, shadow pulls in; releases on pointer-up/cancel | None |
| **Text arrival** | Front-face text fades and rises 6 px as the flip completes | Fade only, no rise |
| **Entrance** | Card settles in once on first paint; **skipped for returning visitors** | None |
| **Reshuffle riffle** | Stack edges fan and re-settle, ~700 ms | None |
| **Deck thinning** | Edge count transitions on draw | Instant, no transition |
| **Page transition** | `@view-transition { navigation: auto; }` | Browser honours reduced-motion natively |

**Entrance gating.** The `settled` class already lands one frame after load
(`app.ts:55`) and `has-drawn` lands synchronously before first paint for
returning visitors (`app.ts:54`). The entrance animation is gated on the
absence of `has-drawn`, reusing signals that already exist. No new persisted
state.

**Page transitions** use the native CSS at-rule. No `<ClientRouter />`, no
client bundle. Browsers without support ignore the rule and navigate normally.
This must not add a single byte of JavaScript.

**Flip duration is the main risk.** 400 ms today, ~520 ms proposed, and the
`busy` guard swallows input for that entire window on a tool designed for
rapid tapping. The ≤ 560 ms latency constraint above is the backstop; if the
tuned value approaches it, the duration comes down rather than the constraint
moving.

---

## 4 · Deck state

Both approved flourishes are driven by **one** derived value, so they cannot
disagree.

```
remaining = bag.length          (ids not yet dealt this cycle)
ratio     = remaining / deck.length
```

| ratio | visible edges |
|---|---|
| > 0.60 | 3 |
| > 0.30 | 2 |
| > 0.00 | 1 |
| = 0.00 | 1 (floor — the deck never visually disappears) |

**The reshuffle riffle needs no separate trigger.** `draw()` refills the bag
lazily — only when a draw arrives and `bag.length === 0` (`app.ts:138`). After
the 48th card the bag sits at zero and the indicator holds at its floor of 1
until the next tap. The riffle fires on the frame where the edge count jumps
from the floor back to 3. One state variable drives both flourishes.

The riffle plays *underneath* the flip, not before it. The draw must not feel
slower on the 49th card than on the 48th.

Deck state is derived on every draw from `bag`, which already persists in
`localStorage`. **No new persisted state, no `STORAGE_KEY` version bump.** A
returning visitor's edge count is correct on first paint because `bag` is
restored before the first render.

---

## 5 · Verification

The loop terminates on captured evidence, not on assertion. Each iteration:

```sh
npm run build
python3 -m http.server 8317 --bind 127.0.0.1 --directory dist &
SHOTS_DIR=… node scripts/verify.js
```

Then inspect the frames and critique against the reference bar before
iterating. Per `.claude/skills/verify`, always verify the **built** output —
the dev server injects Astro's toolbar and skews size and request checks.

### Existing assertions that must still pass

The checked-in suite covers: fresh visitor, full 48-card cycle with unique
ids, no repeat across reshuffle, persistence across reload, deep link in a
fresh context, share control visibility and clipboard fallback, per-card
pages, About page, dark and reduced-motion contexts, and the no-off-origin-
requests check. **All must remain green.** They are the regression net.

Note the documented gotcha: draw inputs are swallowed during the flip by the
`busy` guard. `drawOnce()` pads 450 ms after each draw — **this padding must
rise to match the new flip duration**, or the full-cycle test will flake.

### New assertions

1. Both faces are present in the DOM simultaneously.
2. Exactly one face is `aria-hidden="false"` at rest, and it is the visible one.
3. Text in `.face-b` is not mirrored — asserted via computed transform, which
   must include a 180° Y rotation.
4. Rotation accumulates and never reverses: across a run of draws the
   `.card-inner` angle is strictly increasing, and the slot facing the viewer
   alternates. Card text is readable after **every** draw, not just odd ones —
   this is the regression that would ship a straw-bundle logo as card #2.
5. `.deck-stack` is not a descendant of `.card-inner`.
6. Visible edge count matches the ratio table across a full 48-card cycle.
7. Reshuffle riffle fires on the refill draw and not on any other draw.
8. Entrance animation runs for a fresh visitor and not for a returning one.
9. Tap → readable text latency ≤ 560 ms.
10. Built CSS ≤ 13 KB, inline script ≤ 4 KB.
11. Still zero off-origin requests, still zero framework JS in `dist/`.

### Frames to capture each iteration

Light, dark, and reduced-motion; mobile (390×844) and desktop:

- Face-down at rest, with deck edges
- Mid-flip (~50%), showing the edge and specular sweep
- Face-up at rest
- Pressed state
- Deck at 3, 2, and 1 edges
- Reshuffle riffle mid-frame

## Open risks

1. **Flip duration versus tapping speed** — mitigated by the latency
   constraint; duration yields first.
2. **Grain rendering differs across engines.** Safari's `feTurbulence`
   rasterization is not pixel-identical to Chromium's. Acceptable — it must
   read as paper in both, not match exactly. Verified via screenshots, and the
   value tuned to be robust rather than knife-edge.
3. **`@view-transition` support is uneven.** Degradation is a plain
   navigation, which is the current behaviour. No fallback needed.
4. **Overshoot settle can read as cheap** if overdone. Tune conservatively;
   the reference bar is a settling object, not a bounce.

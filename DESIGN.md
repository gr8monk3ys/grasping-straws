---
name: Grasping Straws?
description: A tarot-size deck of lateral-thinking prompts, dealt one card at a time on warm paper.
colors:
  warm-paper: "#f5efe3"
  card-stock: "#fdfaf3"
  walnut-ink: "#241e16"
  faded-ink: "#6e6455"
  forest-green: "#2c6e4f"
  deep-forest: "#184e35"
  deckle-line: "#dcd2be"
  editorial-hairline: "rgb(36 30 22 / 0.16)"
  under-card: "#f7f1e4"
  cut-edge: "#e9dfca"
  night-desk: "#171310"
  night-stock: "#201b16"
  cream-ink: "#eae3d4"
  faded-cream: "#a79c8a"
  emerald: "#42a979"
  mint: "#6cc39a"
  night-line: "#3a322a"
  night-hairline: "rgb(234 227 212 / 0.16)"
  night-under-card: "#272019"
  night-cut-edge: "#33291f"
typography:
  display:
    fontFamily: "Fraunces, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(1.55rem, 1rem + 2.05vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.28
    letterSpacing: "-0.012em"
    fontVariation: "opsz auto (9..144)"
  headline:
    fontFamily: "Fraunces, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(2.15rem, 4vw + 1rem, 2.85rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.012em"
  lede:
    fontFamily: "Fraunces, Iowan Old Style, Georgia, serif"
    fontSize: "1.4rem"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Fraunces, Iowan Old Style, Georgia, serif"
    fontSize: "1.16rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Plex Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0.1em"
  label-sm:
    fontFamily: "Plex Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.8rem"
    fontWeight: 400
    letterSpacing: "0.08em"
rounded:
  focus: "2px"
  mini: "3px"
  control: "4px"
  spread-card: "5px"
  dialog: "6px"
  card: "14px"
spacing:
  inline: "0.5rem"
  masthead-y: "1.15rem"
  gap: "1.5rem"
  below-card: "1.75rem"
  gutter: "clamp(1rem, 3.5vw, 2.25rem)"
  stage: "clamp(1.5rem, 4vw, 2.75rem)"
  face-inset: "clamp(1.25rem, 6vw, 2rem)"
  prose-measure: "34rem"
components:
  card-face:
    backgroundColor: "{colors.card-stock}"
    textColor: "{colors.walnut-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.card}"
    padding: "{spacing.face-inset}"
  deck-edge:
    backgroundColor: "{colors.under-card}"
    rounded: "{rounded.card}"
  card-spine:
    backgroundColor: "{colors.cut-edge}"
    width: "3px"
  nav-link:
    textColor: "{colors.faded-ink}"
    typography: "{typography.label}"
    padding: "0 0 0.25em"
  nav-link-cta:
    textColor: "{colors.forest-green}"
    typography: "{typography.label}"
    padding: "0 0 0.25em"
  text-button:
    textColor: "{colors.faded-ink}"
    typography: "{typography.label}"
    padding: "0"
  text-button-hover:
    textColor: "{colors.forest-green}"
  text-button-pressed:
    textColor: "{colors.forest-green}"
  pile-button:
    textColor: "{colors.faded-ink}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.control}"
    padding: "0.35rem 0.5rem"
  pile-button-hover:
    textColor: "{colors.forest-green}"
  minipile-layer:
    backgroundColor: "{colors.under-card}"
    rounded: "{rounded.mini}"
  spread-dialog:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.walnut-ink}"
    rounded: "{rounded.dialog}"
    padding: "0"
    width: "min(64rem, 92vw)"
  spread-card:
    backgroundColor: "{colors.card-stock}"
    textColor: "{colors.walnut-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.spread-card}"
    padding: "1.15rem 1rem 1.6rem"
  section-label:
    textColor: "{colors.faded-ink}"
    typography: "{typography.label-sm}"
---

# Design System: Grasping Straws?

## Overview

<!-- The Creative North Star and the colour names below were inferred from the shipped code (src/styles/global.css and the page sources) without an owner interview; rename freely. -->

**Creative North Star: "The Card Table in Lamplight"**

One object sits at the centre of every screen: a tarot-proportion card (5:7) on warm paper stock, with a visible thickness, a stack of spent edges beneath it, and two shadows that behave like a real card lifting from a desk. Everything else on the page is quiet furniture around that object. The masthead is a running head in small-caps mono, the piles are miniature stacks of the same stock, and the dialogs are the same paper set down over the table. Nothing competes with the deal.

The material is paper, not glass. Surfaces carry grain (a fractal-noise tile at 3.4% multiply in light, 5.5% overlay in dark, or a WebGL fibre shader when available), hairline rules rather than borders, and a single green accent borrowed from the owner's site. Density is low and the rhythm is editorial: generous vertical air, one serif for reading and one mono for labels, and a type scale sized by apparent x-height so the two families read at the same optical size. Dark mode is not an inversion but a second stock: near-black warm paper whose lower card edges catch rim light instead of falling into shadow.

Motion is physical and short: a 460ms flip that reads as a solid turning in space, a specular sheen that rides the first half of the turn, cards that deal into a spread with a capped stagger, and a hover that lifts by pixels. Every effect degrades: reduced motion removes decoration and keeps feedback; no JavaScript hides controls that would not work.

**Key Characteristics:**
- One card, optically centred, is the composition; flanking piles reserve symmetric columns so it never shifts.
- Paper-warm neutrals in both themes; a single forest/emerald accent used for links, focus, selection, and the discard tint only.
- Two type registers: Fraunces (optically sized serif) for the card and prose, Plex Mono uppercase with wide tracking for every label and control.
- Hairlines (`--rule`, 16% ink) instead of solid borders on chrome and dialogs; 1px `--line` borders only on card stock.
- Two-layer elevation (ambient + contact) on the card; everything else is flat or tonal.
- Controls are text, not chips: underlined mono words with no box, no fill, no glyph icons.

## Colors

Warm paper and walnut ink in the light theme, warm near-black and cream in the dark theme, with one green accent family that shifts lighter on dark stock to keep AA contrast.

### Primary
- **Forest Green** (`forest-green`): the only accent. Link colour, `:focus-visible` outline, `::selection` background, hovered control text, the pressed "set aside" state, the "Get the deck" CTA in the masthead, and a 12% tint on the discard pile's layers. Chosen at 5.3:1 on Warm Paper so it stays unmistakably green rather than near-black.
- **Deep Forest** (`deep-forest`): the darker sibling reserved for solid fills (8.4:1 on Warm Paper). The shipped site currently has no filled button, so it is defined but unused on any surface; use it if a filled control is ever needed, never for text.
- **Emerald** / **Mint** (`emerald`, `mint`): the dark-theme accent pair, 6.3:1 on Night Desk. Same roles as Forest Green / Deep Forest.

### Neutral
- **Warm Paper** (`warm-paper`): page ground, dialog surface, and the text colour of selected text. Also the light `theme-color`.
- **Card Stock** (`card-stock`): the printed face of the card and of each card in a spread; slightly whiter and cooler than the ground so the card reads as a separate sheet.
- **Under-card** (`under-card`): the face of cards lower in the stack (deck edges and mini-pile layers), a touch darker than the ground because they sit in the top card's shadow.
- **Cut Edge** (`cut-edge`): the 3px spine of the card, warmer and darker than the printed face.
- **Walnut Ink** (`walnut-ink`): all reading text, the tally numerals, the wordmark, and the favicon glyph.
- **Faded Ink** (`faded-ink`): masthead, labels, hints, section headings, the card-back mark, the dialog title, and every resting text control.
- **Deckle Line** (`deckle-line`): the 1px border on card faces and deck edges.
- **Editorial Hairline** (`editorial-hairline`): the 16% ink rule under the masthead, the dialog head, the credit line, the empty-pile ghost outline, and mobile control underlines.
- **Night Desk / Night Stock / Cream Ink / Faded Cream / Night Line / Night Hairline / Night Under-card / Night Cut-edge**: the dark-theme counterparts, applied role-for-role. Note the inversion: on dark stock the under-card and cut edge are *lighter* than the ground, and the edge rim is white at 15% rather than ink at 22%.

### Named Rules
**The One Green Rule.** Green is the only hue on the page and it means "interactive or chosen": links, focus, selection, hover, the pressed shelf state, the CTA, and the discard tint. It never fills a surface and never colours a heading or body text.

**The Two Stocks Rule.** Dark mode is a second paper, not an inverted palette. Every token has a dark twin defined twice (media query and `[data-theme="dark"]`) and the two blocks must stay byte-identical; grain switches from multiply to overlay and lower edges switch from shadow to rim light.

## Typography

**Display Font:** Fraunces, variable 300–700 with optical-size axis 9–144 (with Iowan Old Style, Georgia, serif)
**Body Font:** Fraunces (same file)
**Label/Mono Font:** IBM Plex Mono 400 and 500 (with ui-monospace, SF Mono, Menlo, monospace)

**Character:** A warm, slightly quirky old-style serif for anything that is *read* (the card, the prose) against a plain, evenly-spaced mono for anything that is *labelled* (masthead, tally, hints, controls, headings on the About page). The serif is optically sized so the card face is genuinely a display cut, not scaled body type.

### Hierarchy
- **Display** (400, `clamp(1.55rem, 1rem + 2.05vw, 2.25rem)`, 1.28, −0.012em, `font-optical-sizing: auto`, `text-wrap: balance`, centred): the card text only. Sized so the longest card (62 characters) fits the narrowest card without overflow.
- **Headline** (600, `clamp(2.15rem, 4vw + 1rem, 2.85rem)`, 1.08, −0.012em): the About page `h1`. The only bold serif on the site.
- **Lede** (400, 1.4rem, 1.45): the About page opening paragraph.
- **Body** (400, 1.16rem, 1.55 on the body, 1.6 in About prose): running text, the empty-spread notice. Spread cards use a compact 0.98rem at 1.32.
- **Label** (400 or 500, 0.95rem, uppercase, 0.06–0.1em tracking, `tabular-nums` on numerals): masthead, tally, nav links, hint line, share/set-aside controls, dialog title. Drops to 0.85rem inside the masthead under 34rem.
- **Label-sm** (400 or 500, 0.8rem, uppercase, 0.08–0.2em tracking): pile counts and labels, spread card numbers, the card-back wordmark (0.2em), About section headings (500, 0.16em), the credit line.

### Named Rules
**The Apparent-Size Rule.** The two families have separate ramps because their x-heights differ (Fraunces 0.436em, Plex Mono 0.516em). Never share one size token between serif and mono; a mono element on the serif ramp lands ~20% too large.

**The Type Floor Rule.** Nothing renders under ~11.5px apparent size. `label-sm` (0.8rem) is the smallest step and it is not to be scaled down further with `em` multipliers.

**The Uppercase Mono Rule.** Every label, control, and running-head element is uppercase Plex Mono with tracking of at least 0.06em. Serif is never uppercased or tracked out; mono is never used for reading text.

## Layout

The page is a full-height flex column: masthead (`.chrome`) on top, then a `main` that fills the remaining height and centres its content. Horizontal gutters are `clamp(1rem, 3.5vw, 2.25rem)` in the masthead and `1rem` on the stage; vertical stage padding is `clamp(1.5rem, 4vw, 2.75rem)`.

The draw screen's table is a three-column grid (`1fr auto 1fr`, max-width 56rem, gap `clamp(1rem, 4vw, 3.5rem)`) so the card stays optically centred while the flanking piles grow. The card column is sized `min(82vw, 340px, calc(66dvh * 5 / 7))` at a 5:7 aspect ratio, which keeps the whole card on screen at any viewport. Below the card, one reserved line (`min-height: 1.5em`, `margin-top: 1.75rem`) holds either the hint or the two text controls, grid-stacked so swapping them never moves the card.

Three breakpoints, all `width <` queries in rem: under 46rem the table collapses to one column, the mini-piles hide, and the pile labels become underlined inline rows; under 34rem the masthead wraps, the tally takes its own centred row, the theme toggle keeps only its disc, and `--t-mono` steps down to 0.85rem; under 26rem the two card controls tighten to a 1rem gap and the small mono step.

The About page is a single measure of 34rem, centred, with `3.5rem 1.35rem 4rem` padding; section headings sit at `2.6em` above and `0.7em` below; paragraphs at `0.9em`. The spread dialog is `min(64rem, 92vw)` wide, capped at 84vh, with an auto-fill grid of `minmax(min(11rem, 44%), 1fr)` so two columns always fit on a phone.

## Elevation & Depth

Hybrid: the card is the only lifted object, and it lifts with two shadows at once. The ambient shadow is broad and soft; the contact shadow is tight. They live on separate sibling layers so they can scale in opposite directions on hover (ambient grows to 1.03 and fades to 85%; contact shrinks to 0.97 and fades to 80%) and the contact dims to 55% on press. Everything else is flat or tonal: chrome and dialogs are separated by 16% hairlines, the stack beneath the card is a staircase of three progressively fainter edges (offsets 7/16/25px, scale 0.99/0.978/0.966, opacity 1/0.88/0.74) each catching an upward cast from the card above, and paper grain is applied per face inside its own stacking context so it multiplies only against the card's own stock.

### Shadow Vocabulary
- **Ambient** (`box-shadow: 0 14px 36px -14px rgb(36 30 22 / 0.28)`; dark `0 16px 40px -14px rgb(0 0 0 / 0.6)`): the card's broad ground shadow, on `.card-shadow-ambient`.
- **Contact** (`box-shadow: 0 1px 2px rgb(36 30 22 / 0.08), 0 3px 8px -4px rgb(36 30 22 / 0.2)`; dark `0 1px 2px rgb(0 0 0 / 0.4), 0 3px 10px -4px rgb(0 0 0 / 0.5)`): the card's tight seat shadow.
- **Edge cast** (`box-shadow: 0 -1px 3px -1px rgb(36 30 22 / 0.16)`; dark `0 -2px 5px -2px rgb(0 0 0 / 0.6)`): the upward cast on each deck edge so the slivers read as separate cards.
- **Face bevel** (`inset 0 1px 0 var(--edge-light), inset 0 -1px 0 var(--edge-shade)`): a one-pixel light top and shaded bottom inside every card face.
- **Spread card rest / hover** (`0 2px 5px -2px rgb(0 0 0 / 22%)` → `0 10px 20px -8px rgb(0 0 0 / 30%)` with `translateY(-4px) rotate(-0.7deg)`).
- **Dialog** (`0 30px 70px -30px rgb(0 0 0 / 45%)` over a `rgb(20 16 11 / 62%)` backdrop with 4px blur): the spread set down over the table.
- **Mini-pile layer** (`0 1px 0 var(--rule)`): a single hairline drop so stacked layers are countable.

### Named Rules
**The Two-Shadow Rule.** A lifted card always carries both an ambient and a contact shadow on separate layers. One shadow cannot express weight because lift and spread change at different rates.

**The Only-the-Card-Lifts Rule.** Shadows belong to card stock (the card, spread cards, mini-pile layers, the dialog as a sheet). Chrome, links, text controls, and headings never cast shadows; they separate with hairlines.

## Shapes

Every rounded corner is a card corner. The card, its shadows, faces, and deck edges share a 14px radius; the same object in miniature scales the radius with it (spread cards 5px, mini-pile layers 3px). The spread dialog is a 6px sheet. Controls that are stripped to text get a 4px radius only so their focus ring and the invisible hit padding have a shape; the global focus ring itself rounds to 2px. There are no pills, no circles except the 0.72em theme disc (which is a half-filled circle rotated 180° on hover), and no full-bleed rectangles.

Borders are 1px and either `--line` (on card stock) or `--rule`/`--edge-rim` (hairlines on chrome, dialog, and edges). The bottom border of each deck edge is deliberately given the stronger rim colour so the stack reads as separate cards. An empty pile is a 1px dashed hairline ghost of one card, never a filled placeholder.

Recurring silhouettes: the 5:7 tarot proportion appears at three scales (the card, spread cards, mini-piles), always with a slight alternating rotation in stacks (±0.4° to ±1.5°) so piles read as paper rather than stripes. The card has a 3px spine on each side so it is a solid, not two planes.

## Components

### Buttons
The site has no filled or outlined button. Every control is a word.

- **Text control** (`.share`, "set aside", "share this card"): Plex Mono label at 0.95rem, uppercase, 0.1em tracking, Faded Ink, underlined at 1px with `0.18em` offset, no background, no border. Hover turns the text Forest Green. The pressed shelf state (`aria-pressed="true"`) turns green, drops the underline, and prefixes a check mark: it reads as a state, not an offer. "link copied" (`.is-status`) drops the underline too, for the same reason.
- **Pile button** (`.pile` as `<button>`): the mini-pile plus count plus label, in the small mono step; chrome stripped, hit padding pulled back with negative margin (see the Target Rule), 4px radius. Hover/focus lifts by 2px and greens the label. Disabled at 42% opacity, cursor default, never hidden, so the column does not reflow.
- **Focus (global):** `2px solid` Forest Green outline, 3px offset, 2px radius, on `:focus-visible` only.
- **Dialog close:** a bare `×` at the lede size in Faded Ink, greening on hover.
- **The Target Rule.** Every control is a word, and a word is not a target. Each one is padded to at least 44px tall and the padding is handed back with an equal negative margin (block controls) or left on the inline box (links in prose), so the layout never learns about it: `.share`, `button.pile`, `.spread-close`, `.chrome nav a`, `.deck-name`, `.theme` (whose 10px disc on phones becomes a 44px target this way), `.about p a`, `.card-page-invite a`.

### Cards / Containers
- **The card** (signature, see below).
- **Spread card:** the card in miniature. 5:7, 5px radius, Card Stock, 1px `--edge-rim` border, `0.98rem` serif centred and balanced, number in small mono at the foot, resting shadow `0 2px 5px -2px`, hover lift 4px with a −0.7° tilt. Deals in with a `deal-in` keyframe (0.34s, from `translateY(14px) rotate(-2.5deg) scale(0.97)`) staggered 26ms per card, capped at twelve.
- **Spread dialog:** `<dialog>` on Warm Paper, 6px radius, 1px hairline border, `0 30px 70px -30px` shadow, backdrop `rgb(20 16 11 / 62%)` blurred 4px. Head is `1.35rem clamp(1rem, 3vw, 2rem) 1rem` with a hairline underneath and a mono uppercase title in Faded Ink.
- **Mini-pile:** six absolutely stacked 5:7 layers, `clamp(38px, 7vw, 58px)` wide, 3px radius, Under-card face, `--edge-rim` border, each offset 2.5px higher with alternating rotation; layers fade in as `data-layers` grows. Discard tints toward the accent (12% fill, 34% border via `color-mix`, with plain fallbacks declared first); the shelf tints toward ink (9% / 26%). Empty pile shows a dashed hairline ghost.

### Inputs / Fields
None exist. The site has no form fields.

### Navigation
- **Masthead** (`.chrome`): flex row, baseline-aligned, `1.15rem` vertical padding, hairline rule beneath, mono uppercase 0.95rem in Faded Ink with 0.06em tracking. The wordmark is Walnut Ink at weight 500 and 0.1em; the tally (`n / 48 drawn`) uses tabular numerals with ink numbers and faded separators.
- **Nav links:** no underline at rest; a 1px `currentColor` hairline (`::after`, `scaleX(0 → 1)` from the left, 0.32s) wipes in on hover/focus. Labels never break mid-phrase (`white-space: nowrap`; the nav wraps whole labels instead). "Get the deck" is the CTA and is simply Forest Green; while `PHYSICAL_DECK_URL` is empty it reads "Physical deck" in the chrome's own Faded Ink (`data-soon`), because a link that only leads to "coming soon" must not wear the colour that promises something to get.
- **Theme toggle:** a text button inheriting the masthead's mono style, with a 0.72em half-filled disc that rotates 180° on hover; the word hides under 34rem and the whole control hides without JavaScript.
- **Mobile:** under 34rem the masthead wraps and the tally drops to its own centred row.

### The Card (signature)
A `<button>` at 5:7, 14px radius, `perspective: 900px`, cursor `grab`, `touch-action: pan-y`. Inside, `.card-inner` is a `preserve-3d` solid with `--thickness: 3px`: two faces (`.face-a`, `.face-b` pre-rotated 180°) pushed forward by half the thickness, and two spines filling the gap. Each face is Card Stock with a 1px Deckle Line border, the inset bevel, a `clamp(1.25rem, 6vw, 2rem)` inset, a grain layer (`::before`) and a parked specular sweep (`::after`, a 105° gradient of `--sheen`) that animates for `--flip-ms` (460ms) while the card is `.flipping`. Face-down shows the straw-bundle glyph (masked from `favicon.svg`, `clamp(56px, 26%, 84px)`) over the wordmark in 0.2em-tracked small mono, both Faded Ink; the wordmark wraps rather than running off a narrow card. The face is a container (`container-type: inline-size`) and its text is capped at `10.4cqw`, so a card made small by the viewport's height still holds its longest text. Face-up, the card's number sits in the top-left corner (`.card-num`, small mono, 0.08em, Faded Ink, `#17`), where the printed card carries it and with the same number the share page and the spread use. Press scales to 0.985; hover (fine pointer only) lifts 3px. Beneath sits `.deck-stack` (three edges) and the two shadow layers, all siblings so they never rotate with the card. The static share-page variant (`.card-static`) keeps the shell, drops the second face, restores text selection, and is a link onto the table (`/#id`), in Walnut Ink with no underline. Beneath it: the frame line (`h1.card-page-frame`, "Card 17 of 48", small mono uppercase), one serif sentence in Faded Ink saying what the deck is, then the mono invitation "Draw your own card →". The draw screen's hint is two short paragraphs, one per input kind (touch / fine pointer), stacked in the share control's grid cell; only the matching one is displayed.

## Do's and Don'ts

### Do:
- **Do** put one card at the centre and keep everything else in Faded Ink mono around it; the card text is the only serif on the draw screen.
- **Do** use Forest Green (Emerald on dark) for every interactive or chosen state and nothing else: links, focus ring, selection, hover, pressed, CTA, discard tint.
- **Do** separate chrome with 1px `--rule` hairlines (16% ink) and reserve 1px `--line` borders for card stock.
- **Do** give every lifted sheet both shadows (ambient + contact) on separate layers, and the 14px card radius scaled down with the object (5px, 3px).
- **Do** size mono and serif on their own ramps (`--t-mono` 0.95rem / `--t-mono-sm` 0.8rem vs `--t-body` 1.16rem) and keep every label uppercase with ≥0.06em tracking.
- **Do** define any new colour token twice for dark mode (in the media query and in `[data-theme="dark"]`) with identical values, and provide a plain fallback before any `color-mix()`.
- **Do** honour `prefers-reduced-motion` by removing decorative animation entirely and keeping state feedback (colour, opacity, shadow).
- **Do** keep controls as underlined words; the theme disc is the one non-text affordance.

### Don't:
- **Don't** add a filled, outlined, or pill button; no such control exists and the world is text controls on paper.
- **Don't** introduce a second hue; every non-neutral colour on the page is the green family.
- **Don't** put shadows on chrome, text, headings, or links; only card stock casts.
- **Don't** apply grain as a live CSS filter or outside a face's own stacking context; it is a tiled background image at `--grain-opacity` with `--grain-blend`.
- **Don't** set type below the 0.8rem mono step or scale labels with `em` fractions; the floor is ~11.5px apparent.
- **Don't** use `font: inherit` on a mono control without restating `font-family: var(--font-mono)`; the shorthand silently drops the pile labels to the serif.
- **Don't** render card text into a canvas or texture; it stays real DOM above the paper layer.
- **Don't** use glyph icons or icon fonts; the only marks are the straw-bundle glyph (CSS mask of `favicon.svg`), the `×` close, the `←`/`→` arrows, and the `✓` pressed prefix, all as text.

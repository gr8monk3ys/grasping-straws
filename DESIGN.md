---
name: Grasping Straws?
description: A tarot-size deck of lateral-thinking prompts, dealt one card at a time on a page from the lscaturchio.xyz notebook.
colors:
  paper: "#f9f8f5"
  paper-card: "#fbfaf9"
  paper-tinted: "#eeece7"
  cut-edge: "#dedbd3"
  ink: "#1a1f23"
  ink-muted: "#606976"
  forest-ink: "#184e35"
  moss: "#397f5e"
  hairline: "#e2dbd5"
  night: "#111317"
  night-card: "#16181d"
  night-tinted: "#25272d"
  night-cut-edge: "#33363e"
  night-ink: "#fafafa"
  night-ink-muted: "#abb0ba"
  forest-ink-dark: "#42a979"
  night-hairline: "#292c32"
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
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "0.16em"
  label-sm:
    fontFamily: "Plex Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.8rem"
    fontWeight: 500
    letterSpacing: "0.16em"
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
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    rounded: "{rounded.card}"
    padding: "{spacing.face-inset}"
  deck-edge:
    backgroundColor: "{colors.paper-tinted}"
    rounded: "{rounded.card}"
  card-spine:
    backgroundColor: "{colors.cut-edge}"
    width: "3px"
  nav-link:
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    padding: "0 0 0.25em"
  nav-link-cta:
    textColor: "{colors.moss}"
    typography: "{typography.label}"
    padding: "0 0 0.25em"
  text-button:
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    padding: "0"
  text-button-hover:
    textColor: "{colors.moss}"
  text-button-pressed:
    textColor: "{colors.moss}"
  pile-button:
    textColor: "{colors.ink-muted}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.control}"
    padding: "0.75rem 0.5rem"
  pile-button-hover:
    textColor: "{colors.moss}"
  minipile-layer:
    backgroundColor: "{colors.paper-tinted}"
    rounded: "{rounded.mini}"
  spread-dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    padding: "0"
    width: "min(50rem, 92vw)"
  spread-card:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.spread-card}"
    padding: "1.15rem 1rem 1.6rem"
  section-label:
    textColor: "{colors.ink-muted}"
    typography: "{typography.label-sm}"
---

# Design System: Grasping Straws?

## Overview

<!-- The Creative North Star was inferred from the shipped code without an owner interview; rename freely. The colour names are not ours to rename: they are lscaturchio.xyz's, taken from that repo's DESIGN.md. -->

**Creative North Star: "A Card on the Notebook Page"**

This site is a page from the same notebook as lscaturchio.xyz. It is set on that site's paper, in its ink, ruled with its sand hairline and captioned with its wall labels; at night it is the same cool night page. What this page adds to the notebook is one object: a tarot-proportion card (5:7) with a visible thickness, a stack of spent edges beneath it, and two shadows that behave like a real card lifting from a desk. Everything else is flat paper around that object. The masthead is a running head set as a wall label, the piles are miniature stacks of the same stock, and the dialog is a sheet of the page with a scrim behind it. Nothing competes with the deal.

The material is paper, not glass. Card faces carry grain (a fractal-noise tile at 3.4% multiply in light, 5.5% overlay in dark, or a WebGL fibre shader when available), structure is drawn with 1px hairlines, and there is one green pen. Density is low and the rhythm is editorial: generous vertical air, one serif for reading and one mono for labels, and a type scale sized by apparent x-height so the two families read at the same optical size.

Motion is physical and short: a 460ms flip that reads as a solid turning in space, a specular sheen that rides the first half of the turn, cards that deal into a spread with a capped stagger, and a hover that lifts by pixels. Every effect degrades: reduced motion removes decoration and keeps feedback; no JavaScript hides controls that would not work.

**Key Characteristics:**
- One card, optically centred, is the composition; flanking piles reserve symmetric columns so it never shifts.
- The website's palette, value for value, in both themes; one green pen used for links, focus, selection, chosen states and the discard tint only.
- Two type registers: Fraunces (optically sized serif) for the card and prose, Plex Mono as the website's wall label for everything that is metadata or a control.
- 1px Hairline for every border and divider; no rule is a tinted ink.
- Two-layer elevation (ambient + contact) on card stock; everything that is not a card is flat.
- Controls are text, not chips: underlined mono words with no box, no fill, no glyph icons.

### What is the website's, and what is this page's own

The palette, the hairline, the wall label and the night page are adopted from lscaturchio.xyz without change. Three things are deliberately different, and only the first is a departure from that system's rules:

- **Card elevation is kept.** The website's Flat Paper Rule allows no shadow on a content surface. Here the card, the cards in a spread, the mini-piles and the deck edges all cast, because the card being a physical object is this product's third principle (PRODUCT.md). This is the one sanctioned departure, and it stops at card stock: the masthead, the dialog, links and controls obey the Flat Paper Rule.
- **Fraunces is the only text face.** The website reads in Instrument Sans; this page reads in the card's own voice. No sans is loaded.
- **Labels are larger.** The website's label is 0.72rem; Plex Mono at that size is under this site's type floor, so labels here use 0.8rem and 0.95rem. Weight, case, tracking, numerals and colour are the website's.

## Colors

One paper, one ink, one hairline and one green pen in the light theme; the same four at night, cool rather than warm. Every value lives in `src/deck/palette.ts`, which the print scripts and the asset generator import. The stylesheet, the manifest, the theme-color metas and the theme toggle cannot import it, so `tests/palette.test.mjs` compares each of them to the module and fails if either side is edited alone.

### Primary
- **Forest Ink** (`forest-ink`, `--accent`): the one pen, 9.1:1 on Paper. Prose links, the `:focus-visible` outline, the `::selection` background, and a 12% tint on the discard pile's layers. It is the website's link colour and is used as it stands.
- **Moss** (`moss`, `--moss`): the same pen at label weight, 4.5:1 on Paper. In 13px mono capitals Forest Ink sits 1.7:1 from Ink and reads as black, so a label that turns green turns Moss instead: a hovered text control, the pressed "set aside" state, a hovered pile label, a link set in mono (the invitations under a shared card, the links in the credit line), and the "Get the deck" CTA.
- **Forest Ink (dark)** (`forest-ink-dark`): the night value of both `--accent` and `--moss`, 6.4:1 on Night. It is light enough to hold at any weight, so night needs no second green.

### Neutral
- **Paper** (`paper`, `--bg`): page ground, dialog surface, and the text colour of selected text. Also the light `theme-color` and the manifest's two colours.
- **Paper Card** (`paper-card`, `--card`): the printed face of the card and of each card in a spread. It is a single step off Paper (1.02:1), so the card is separated by its hairline border and its shadows, not by its fill.
- **Paper Tinted** (`paper-tinted`, `--edge-face`): the face of cards lower in the stack (deck edges and mini-pile layers). The website's recessed paper, used here for stock that sits in the top card's shadow.
- **Cut Edge** (`cut-edge`, `--spine`): the 3px spine of the card. Paper Tinted taken one step darker in the same hue; the only light-theme colour that is derived here and is not a website token.
- **Ink** (`ink`, `--ink`): all reading text, the tally numerals, the pile counts, the wordmark. Every light-theme shadow is Ink, thinned (`rgb(26 31 35 / …)`).
- **Ink Muted** (`ink-muted`, `--muted`): every wall label at rest: masthead, hints, section headings, the card-back mark, card ids, the dialog title, every resting text control. 5.2:1 on Paper.
- **Hairline** (`hairline`, `--line` and `--rule`): the 1px border on card faces and deck edges, and the 1px rule under the masthead, under the dialog head, around the dialog, above the credit line, between the rows of the contents page, and around the ghost of an empty pile. Two custom properties, one value.
- **Night / Night Card / Night Tinted / Night Cut-edge / Night Ink / Night Ink Muted / Night Hairline**: the dark-theme counterparts, applied role-for-role, hue 220. Note the inversion: on night stock the under-card and cut edge are *lighter* than the ground, and the edge rim is white at 15% rather than Ink at 22%.

### Named Rules
**The One Pen Rule.** Green is the only hue on the page and it means "interactive or chosen": links, focus, selection, hover, the pressed shelf state, the CTA, and the discard tint. It never fills a surface and never colours a heading or body text. Forest Ink at reading size, Moss at label size; they are one pen at two weights, not two accents.

**The Sand Hairline Rule** (the website's). A divider is 1px of Hairline: sand-toned, never neutral grey, never a tinted ink, never thicker. More structure is more rules and more space, not darker lines.

**The Two Papers Rule.** Dark mode is the notebook at night, not an inverted palette. Every token has a dark twin defined twice (the `prefers-color-scheme` media query and `[data-theme="dark"]`) and the two blocks must stay identical, which the verifier computes and the palette test compares as written; grain switches from multiply to overlay and lower edges switch from shadow to rim light.

**The No Stray Colour Rule.** Outside the three token blocks, no rule in the stylesheet names a colour: everything is a `var()`. The palette test fails on a hex written into a rule, and on any `rgb()` that is not thinned Ink, Night, black or white.

## Typography

**Display Font:** Fraunces, variable 300–700 with optical-size axis 9–144 (with Iowan Old Style, Georgia, serif)
**Body Font:** Fraunces (same file)
**Label/Mono Font:** IBM Plex Mono 500 for labels, 400 for the credit line (with ui-monospace, SF Mono, Menlo, monospace)

**Character:** A warm, slightly quirky old-style serif for anything that is *read* (the card, the prose) against a plain, evenly-spaced mono for anything that is *labelled* (masthead, tally, hints, controls, section headings). The serif is optically sized so the card face is genuinely a display cut, not scaled body type. The mono is the website's wall label: small, uppercase, widely tracked, muted, the caption beside the work.

### Hierarchy
- **Display** (400, `clamp(1.55rem, 1rem + 2.05vw, 2.25rem)`, 1.28, −0.012em, `font-optical-sizing: auto`, `text-wrap: balance`, centred): the card text only. Sized so the longest card (62 characters) fits the narrowest card without overflow.
- **Headline** (600, `clamp(2.15rem, 4vw + 1rem, 2.85rem)`, 1.08, −0.012em): the editorial pages' `h1`. The only bold serif on the site.
- **Lede** (400, 1.4rem, 1.45): the editorial pages' opening paragraph.
- **Body** (400, 1.16rem, 1.55 on the body, 1.6 in prose): running text, the empty-spread notice. Spread cards use a compact 0.98rem at 1.32.
- **Label** (Plex Mono 500, 0.95rem, uppercase, 0.16em, `tabular-nums`, Ink Muted): masthead, tally, nav links, the hint line, the share and set-aside controls, the dialog title, the pile counts (in Ink). Steps down to 0.85rem inside the masthead under 42rem, and the hint and the two controls step down to Label-sm under 26rem.
- **Label-sm** (Plex Mono 500, 0.8rem, uppercase, 0.16em, `tabular-nums`, Ink Muted): pile labels, card ids on the face and in a spread, the share page's frame line, section headings on the editorial pages, the numbers on the contents page.
- **Two exceptions, both deliberate.** The wordmark on the back of the card is a Label-sm tracked at 0.2em: it is the name printed on the object, not a caption beside it. The credit line and the caption riding on a section heading (`.players`) are mono in mixed case at 0.04em, the website's "small mono link" voice: they are sentences, and a sentence is not shouted.

### Named Rules
**The Wall Label Rule** (the website's). Every piece of metadata (a count, an id, a place, a control's name) is set as a label: Plex Mono 500, uppercase, 0.16em, tabular numerals, Ink Muted. It is declared once, as one grouped rule near the top of the stylesheet, and the rules that follow only size a label or step its colour up to Ink; none restates the family, weight, case or tracking.

**The Apparent-Size Rule.** The two families have separate ramps because their x-heights differ (Fraunces 0.436em, Plex Mono 0.516em). Never share one size token between serif and mono; a mono element on the serif ramp lands ~20% too large.

**The Type Floor Rule.** Nothing renders under ~11.5px apparent size. `label-sm` (0.8rem) is the smallest step and it is not to be scaled down further with `em` multipliers. This is why the website's 0.72rem label is not used.

**The Uppercase Mono Rule.** Serif is never uppercased or tracked out; mono is never used for reading text.

## Layout

The page is a full-height flex column: masthead (`.chrome`) on top, then a `main` that fills the remaining height and centres its content. Horizontal gutters are `clamp(1rem, 3.5vw, 2.25rem)` in the masthead and `1rem` on the stage; vertical stage padding is `clamp(1.5rem, 4vw, 2.75rem)`.

The draw screen's table is a three-column grid (`1fr auto 1fr`, max-width 56rem, gap `clamp(1rem, 4vw, 3.5rem)`) so the card stays optically centred while the flanking piles grow. The card column is sized `min(82vw, 340px, calc(66dvh * 5 / 7))` at a 5:7 aspect ratio, which keeps the whole card on screen at any viewport. Below the card, one reserved line (`min-height: 1.5em`, `margin-top: 1.75rem`) holds either the hint or the two text controls, grid-stacked so swapping them never moves the card.

Four breakpoints, all `width <` queries in rem. Under 52rem the tally takes its own centred row beneath the wordmark and the nav. Under 46rem the table collapses to one column, the mini-piles hide, and the pile labels become underlined inline rows. Under 42rem `--t-mono` steps down to 0.85rem in the masthead and the theme toggle keeps only its disc; from about 500px down the nav no longer fits beside the wordmark and wraps, whole, to a row of its own. Under 26rem the two card controls tighten to a 1rem gap and they and the hint take the small label. The masthead breakpoints are measured, not assumed: 0.16em tracking makes every label about a tenth wider than the type alone, and a sweep from 320px to 1100px finds no label broken mid-phrase, no toggle dropped under the links, and no horizontal overflow.

The editorial pages are a single measure of 34rem, centred, with `3.5rem 1.35rem 4rem` padding; section headings sit at `2.6em` above and `0.7em` below; paragraphs at `0.9em`. The spread dialog is `min(50rem, 92vw)` wide, capped at 84vh, with an auto-fill grid of `minmax(min(11rem, 44%), 1fr)` so two columns always fit on a phone.

## Elevation & Depth

Card stock casts; nothing else does. The card lifts with two shadows at once: the ambient shadow is broad and soft, the contact shadow is tight. They live on separate sibling layers so they can scale in opposite directions on hover (ambient grows to 1.03 and fades to 85%; contact shrinks to 0.97 and fades to 80%) and the contact dims to 55% on press. The stack beneath the card is a staircase of three progressively fainter edges (offsets 7/16/25px, scale 0.99/0.978/0.966, opacity 1/0.88/0.74) each catching an upward cast from the card above, and paper grain is applied per face inside its own stacking context so it multiplies only against the card's own stock.

Everything that is not a card is flat, as on the website: the masthead is separated by a hairline, the dialog by its hairline border and a scrim, and a hovered control changes colour, it does not rise.

### Shadow Vocabulary
- **Ambient** (`0 14px 36px -14px rgb(26 31 35 / 0.28)`; dark `0 16px 40px -14px rgb(0 0 0 / 0.6)`): the card's broad ground shadow, on `.card-shadow-ambient`.
- **Contact** (`0 1px 2px rgb(26 31 35 / 0.08), 0 3px 8px -4px rgb(26 31 35 / 0.2)`; dark `0 1px 2px rgb(0 0 0 / 0.4), 0 3px 10px -4px rgb(0 0 0 / 0.5)`): the card's tight seat shadow.
- **Edge cast** (`0 -1px 3px -1px rgb(26 31 35 / 0.16)`; dark `0 -2px 5px -2px rgb(0 0 0 / 0.6)`): the upward cast on each deck edge so the slivers read as separate cards.
- **Face bevel** (`inset 0 1px 0 var(--edge-light), inset 0 -1px 0 var(--edge-shade)`): a one-pixel light top and shaded bottom inside every card face.
- **Spread card** (`var(--shadow-contact)` at rest; `var(--shadow-ambient), var(--shadow-contact)` with `translateY(-4px) rotate(-0.7deg)` on hover): a card in miniature casts the card's own two shadows, from the same tokens.
- **Mini-pile layer** (`0 1px 0 var(--rule)`): a single hairline drop so stacked layers are countable.
- **Scrim** (`rgb(17 19 23 / 62%)` with a 4px blur, on `.spread::backdrop`): Night, thinned, in both themes. Not a shadow: it is how the dialog separates, since the dialog itself casts nothing.

### Named Rules
**The Two-Shadow Rule.** A lifted card always carries both an ambient and a contact shadow on separate layers. One shadow cannot express weight because lift and spread change at different rates.

**The Only-Card-Stock-Casts Rule.** Shadows belong to card stock: the card, spread cards, mini-pile layers and deck edges. The masthead, the dialog, links, text controls and headings never cast; they separate with a hairline, a tint, or a scrim. This is the website's Flat Paper Rule with one exception written into it, and adding a second exception means changing this file first.

**The Ink Shadow Rule.** A light-theme shadow is Ink at reduced alpha, never black and never a second tint. A dark-theme shadow is black, because nothing darker than Night exists to thin.

## Shapes

Every rounded corner is a card corner. The card, its shadows, faces, and deck edges share a 14px radius; the same object in miniature scales the radius with it (spread cards 5px, mini-pile layers 3px). The spread dialog is a 6px sheet. Controls that are stripped to text get a 4px radius only so their focus ring and the invisible hit padding have a shape; the global focus ring itself rounds to 2px. There are no pills, no circles except the 0.72em theme disc (which is a half-filled circle rotated 180° on hover), and no full-bleed rectangles.

Borders are 1px. Flat surfaces and the card's own outline use Hairline (`--line` on card stock, `--rule` on the masthead, the dialog and the contents list; the same value). Stock that has to be told apart from the stock beneath it uses the rim (`--edge-rim`, Ink at 22%, white at 15% on night): spread cards, mini-pile layers, and the bottom border of each deck edge, which is what makes the stack read as separate cards. An empty pile is a 1px dashed hairline ghost of one card, never a filled placeholder.

Recurring silhouettes: the 5:7 tarot proportion appears at three scales (the card, spread cards, mini-piles), always with a slight alternating rotation in stacks (±0.4° to ±1.5°) so piles read as paper rather than stripes. The card has a 3px spine on each side so it is a solid, not two planes.

## Components

### Buttons
The site has no filled or outlined button. Every control is a word.

- **Text control** (`.share`, "set aside", "share this card"): a Label, Ink Muted, underlined at 1px with `0.18em` offset, no background, no border. Hover turns the text Moss. The pressed shelf state (`aria-pressed="true"`) turns Moss, drops the underline, and prefixes a check mark: it reads as a state, not an offer. "link copied" (`.is-status`) drops the underline too, for the same reason.
- **Pile button** (`.pile` as `<button>`): the mini-pile, the count in Ink and the label in Ink Muted, in the small label; chrome stripped, hit padding pulled back with negative margin (see the Target Rule), 4px radius. Hover/focus lifts by 2px and turns the label Moss. Disabled at 42% opacity, cursor default, never hidden, so the column does not reflow. On a phone, where the stacks are hidden, an enabled pile's label is underlined in its own colour.
- **Focus (global):** `2px solid` Forest Ink outline, 3px offset, 2px radius, on `:focus-visible` only.
- **Dialog close:** a bare `×` at the lede size in Ink Muted, turning Moss on hover.
- **The Target Rule.** Every control is a word, and a word is not a target. Each one is padded to at least 44px tall and the padding is handed back with an equal negative margin (block controls) or left on the inline box (links in prose), so the layout never learns about it: `.share`, `button.pile`, `.spread-close`, `.chrome nav a`, `.deck-name`, `.theme` (whose 10px disc on phones becomes a 44px target this way), `.about p a`, `.card-page-invite a`.

### Cards / Containers
- **The card** (signature, see below).
- **Spread card:** the card in miniature. 5:7, 5px radius, Paper Card, 1px `--edge-rim` border, `0.98rem` serif centred and balanced, its id as a small label at the foot, the contact shadow at rest, and a 4px lift with a −0.7° tilt and both shadows on hover. Deals in with a `deal-in` keyframe (0.34s, from `translateY(14px) rotate(-2.5deg) scale(0.97)`) staggered 26ms per card, capped at twelve.
- **Spread dialog:** `<dialog>` on Paper, 6px radius, 1px hairline border, no shadow, over the scrim. Head is `1.35rem clamp(1rem, 3vw, 2rem) 1rem` with a hairline underneath and a Label title.
- **Mini-pile:** six absolutely stacked 5:7 layers, `clamp(38px, 7vw, 58px)` wide, 3px radius, Paper Tinted face, `--edge-rim` border, each offset 2.5px higher with alternating rotation; layers fade in as `data-layers` grows. Discard tints toward Forest Ink (12% fill, 34% border via `color-mix`, with plain fallbacks declared first); the shelf tints toward Ink (9% / 26%). Empty pile shows a dashed hairline ghost.

### Inputs / Fields
None exist. The site has no form fields.

### Navigation
- **Masthead** (`.chrome`): flex row, baseline-aligned, `1.15rem` vertical padding, a hairline beneath, and the whole of it a Label. The wordmark steps up to Ink; the tally (`n / 52 drawn`, the total computed from the deck) has its two numbers in Ink and its separator and word in Ink Muted.
- **Nav links:** no underline at rest; a 1px `currentColor` hairline (`::after`, `scaleX(0 → 1)` from the left, 0.32s) wipes in on hover/focus. Labels never break mid-phrase (`white-space: nowrap`; the nav wraps whole labels instead). "Get the deck" is the CTA and is simply Moss; while `PHYSICAL_DECK_URL` is empty it reads "Physical deck" in the masthead's own Ink Muted (`data-soon`), because a link that only leads to "coming soon" must not wear the colour that promises something to get.
- **Theme toggle:** a text button inheriting the masthead's label, with a 0.72em half-filled disc that rotates 180° on hover; the word hides under 42rem and the whole control hides without JavaScript.
- **Mobile:** see Layout. On a phone the masthead is three rows: wordmark, nav, tally.

### The Card (signature)
A `<button>` at 5:7, 14px radius, `perspective: 900px`, cursor `grab`, `touch-action: pan-y`. Inside, `.card-inner` is a `preserve-3d` solid with `--thickness: 3px`: two faces (`.face-a`, `.face-b` pre-rotated 180°) pushed forward by half the thickness, and two spines in Cut Edge filling the gap. Each face is Paper Card with a 1px Hairline border, the inset bevel, a `clamp(1.25rem, 6vw, 2rem)` inset, a grain layer (`::before`) and a parked specular sweep (`::after`, a 105° gradient of `--sheen`) that animates for `--flip-ms` (460ms) while the card is `.flipping`. Face-down shows the straw-bundle glyph (masked from `favicon.svg`, `clamp(56px, 26%, 84px)`) over the wordmark, both Ink Muted; the wordmark wraps rather than running off a narrow card. The face is a container (`container-type: inline-size`) and its text is capped at `10.4cqw`, so a card made small by the viewport's height still holds its longest text. Face-up, the card's id sits in the top-left corner (`.card-num`, a small label, `#17`), where the printed card carries it and with the same number the share page and the spread use. Press scales to 0.985; hover (fine pointer only) lifts 3px. Beneath sits `.deck-stack` (three edges in Paper Tinted) and the two shadow layers, all siblings so they never rotate with the card. The static share-page variant (`.card-static`) keeps the shell, drops the second face, restores text selection, and is a link onto the table (`/#id`), in Ink with no underline. Beneath it: the frame line (`h1.card-page-frame`, "Card 17 of 52", a small label), one serif sentence in Ink Muted saying what the deck is, then the invitation "Draw your own card →" as a Moss label. The draw screen's hint is two short paragraphs, one per input kind (touch / fine pointer), stacked in the share control's grid cell; only the matching one is displayed.

## Do's and Don'ts

### Do:
- **Do** put one card at the centre and keep everything else in Ink Muted labels around it; the card text is the only serif on the draw screen.
- **Do** take every colour from `src/deck/palette.ts`, and change a colour there first; then the stylesheet, and let the palette test tell you what else names it.
- **Do** use the green pen for every interactive or chosen state and nothing else: Forest Ink for prose links, focus, selection and the discard tint, Moss wherever a label turns green.
- **Do** separate flat surfaces with 1px of Hairline, and give card stock that must be told apart the rim (`--edge-rim`).
- **Do** give every lifted card both shadows (ambient + contact) from the two tokens, and the 14px card radius scaled down with the object (5px, 3px).
- **Do** set every new piece of metadata by adding its selector to the wall-label rule, then size it; do not restate the family, weight, case or tracking.
- **Do** size mono and serif on their own ramps (`--t-mono` 0.95rem / `--t-mono-sm` 0.8rem vs `--t-body` 1.16rem).
- **Do** define any new colour token twice for dark mode (in the media query and in `[data-theme="dark"]`) with identical values, and provide a plain fallback before any `color-mix()`.
- **Do** honour `prefers-reduced-motion` by removing decorative animation entirely and keeping state feedback (colour, opacity, shadow).
- **Do** keep controls as underlined words; the theme disc is the one non-text affordance.

### Don't:
- **Don't** add a filled, outlined, or pill button; no such control exists and the world is text controls on paper.
- **Don't** introduce a second hue; every non-neutral colour on the page is the green pen.
- **Don't** put a shadow on anything that is not card stock: not the masthead, not the dialog, not a control, not a heading.
- **Don't** write a hex or an `rgb()` into a rule; a rule takes a `var()`, and a shadow is thinned Ink.
- **Don't** draw a rule in a tinted ink or in neutral grey; a rule is Hairline.
- **Don't** set Forest Ink in label-size mono in the light theme; it reads as black. That is what Moss is for.
- **Don't** add Instrument Sans or any other face; the website's body font is not this page's.
- **Don't** apply grain as a live CSS filter or outside a face's own stacking context; it is a tiled background image at `--grain-opacity` with `--grain-blend`.
- **Don't** set type below the 0.8rem mono step or scale labels with `em` fractions; the floor is ~11.5px apparent.
- **Don't** use `font: inherit` on a control that is a label; the shorthand resets the family, weight and numerals the wall-label rule gave it.
- **Don't** render card text into a canvas or texture; it stays real DOM above the paper layer.
- **Don't** use glyph icons or icon fonts; the only marks are the straw-bundle glyph (CSS mask of `favicon.svg`), the `×` close, the `←`/`→` arrows, and the `✓` pressed prefix, all as text.

---
target: the draw screen (src/pages/index.astro), with the share and About pages in evidence
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/home/user/grasping-straws/src/pages/index.astro"
target_fingerprint: "sha256:c2ddf4686e444606e7da0a2e4d0db4586f4913c849a7477317bd15f4d2e74dcc"
target_path: /home/user/grasping-straws/src/pages/index.astro
timestamp: 2026-09-21T19-49-34Z
slug: src-pages-index-astro
---
Method: dual-agent (A: design review sub-agent · B: detector and browser-evidence sub-agent), synthesised after both returned. One deviation from the reference: a first `impeccable detect` run over `src/` (one finding, the Fraunces font warning, recorded as a sanctioned exception) happened before Assessment A finished; the browser evidence and dist scans that shaped the synthesis came from Assessment B afterwards.

Target: the draw screen, `src/pages/index.astro`, with the share page and About page in scope for the evidence. Assessed at the pre-polish head (after the deck refactor and the lazy paper mount), before the fixes recorded below.

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | The end of a cycle is invisible: draw 49 reshuffles with a stack wobble and no sentence |
| 2 | Match System / Real World | 3 | The face-up card is counted as "discarded" while it is still on the table |
| 3 | User Control and Freedom | 3 | No way to start a fresh cycle or empty the shelf; a deep-link visitor cannot keep or share the linked card |
| 4 | Consistency and Standards | 3 | "drawn" and "discarded" name one number; straight apostrophes on About against the typographic-quotes rule |
| 5 | Error Prevention | 3 | The phone theme toggle is a 10×10 target |
| 6 | Recognition Rather Than Recall | 3 | The hint (the only mention of "throw" and Space) dies forever after draw one; the face-up card has no number |
| 7 | Flexibility and Efficiency | 3 | No shortcut for set aside or share; no jump-to-number |
| 8 | Aesthetic and Minimalist Design | 3 | The phone states the deck count three times in one column |
| 9 | Error Recovery | 2 | The no-JS page says "tap to draw" above the notice that it cannot; a clipboard failure is silent |
| 10 | Help and Documentation | 3 | One hint line, seen once |
| **Total** | | **29/40** | **Good** |

#### Design Specificity Verdict

**Authored, not interchangeable.** A card that is a solid with spines and two shadow layers, deck edges that thin as the bag empties, piles you can pick up, a discard tinted because it is turned-over stock, a word cascade held to a 560 ms budget, and a type scale computed from measured x-heights. Nobody could swap the logo and ship this as a quote generator. The About page is the one generic surface (a centred essay column with mono headings), and the spread dialog is a standard panel whose only product-specific idea is that its entries are miniature cards.

**Deterministic scan** (Assessment B): `detect src` clean once the Fraunces exception was recorded. `detect dist/*.html` found 3: `all-caps-body` on the pointer hint (37 chars), `wide-tracking` on the About credit (0.06em), and a `tight-leading` on About that the static reader computes as 1.20x from a unitless lede leading. URL mode added `cream-palette` on every page and two `low-contrast 1.0:1` findings on the nav links that are false positives (the wipe-in underline was a `background-image` on the text element; measured contrast 4.9:1 and 5.1:1). Browser-bundle-only findings (`dark-glow #ffba00`, two `text-occlusion` hits) are the bundle's own overlay and the 3D-flip's hidden back face, not the page.

#### Overall Impression

The card is the product and it is a designed object. What falls short is everything around the moment of drawing: the hint that dies, the end of the cycle that passes unmarked, the brightest link on every page leading to "coming soon", and a set of controls that are words rather than targets. The single biggest opportunity was the 200% zoom case, where the longest card was clipped.

#### What's Working

1. **The card is an object.** Spines, two shadow layers animated at different rates, translateZ lift at 90°, a 2.2° settle, sheen weighted to the first half of the turn, words landing inside a capped envelope. The flip reads as paper turning.
2. **Type and colour are argued, not picked.** Fraunces opsz on the face, Plex Mono for the table, both sized by apparent x-height; the dark theme is retoned (inverted rim light) rather than inverted. Every contrast pair measured clears AA with margin (185 checks, 0 failures).
3. **The table model is real.** Piles are native dialogs with focus trap and focus return; empty piles are disabled, not hidden; the discard tint makes the three piles distinguishable at a glance in both themes.

#### Priority Issues

- **[P0] Card text clipped at 200% zoom / short viewports.** At 640×400 CSS px the card is 189 px wide but the face type was still sized by viewport width; the longest card wrapped to nine lines and `overflow: hidden` cut the second sentence. *Fix (applied):* `.deck` is a container and `.card-text` is capped at `10.4cqw`; the wordmark wraps instead of running off the stock. Command: harden.
- **[P1] Card left-aligned between ~415 px and 736 px.** One-column table with no `justify-self`; a 340 px card sat 114 px off centre at 600 px. *Fix (applied):* `.deck { justify-self: center }` in the one-column range; the masthead name never breaks mid-word and nav labels wrap whole. Command: layout.
- **[P1] Touch targets under 24 px.** Theme toggle 10×10 on phones; set aside / share 24 px; pile buttons 28 px; nav links 24 px; inline links 20–23 px. *Fix (applied):* the Target Rule: every control padded to ≥44 px tall with the space handed back by negative margins (or left on the inline box). Command: harden.
- **[P1] The brightest link on every page is a dead end.** "Get the deck" in accent green led to "The physical deck is coming soon." *Fix (applied):* while the URL is empty the link reads "Physical deck" in the chrome's own ink, and the About paragraph says what the deck is (52 prompts, title and instructions cards, tarot-size, printed to order) and that the links will point there the day it exists. Command: clarify.
- **[P2] The end of the cycle is unmarked.** *Fix (applied):* at zero the deck pile's label reads "reshuffles next"; the reshuffle is announced to the live region ("Reshuffled. …"). Command: delight.
- **[P2] The share page has no frame for a stranger.** *Fix (applied):* "Card 17 of 48" as the page heading, one serif sentence saying what the deck is, the card itself a link onto the table at `/#17`, and "Draw your own card →". Command: onboard.
- **[P3] Straight apostrophes on About** against the brand's typographic-quotes rule. *Fix (applied).* Command: typeset.
- **[P3] One number, three renderings on phone.** *Not changed:* the masthead tally and the deck pile are both authored parts of the incumbent table (the README describes the tally as the running head and the piles as the deck you own). Recorded here rather than removed.

#### Persona Red Flags

- **First-timer on a phone:** the theme toggle was a 10 px dot (fixed); the only instructional line disappears forever after the first draw (unchanged: the hint's single showing is a deliberate rule in the stylesheet; the pile labels are now underlined targets that explain themselves).
- **Returning power user on desktop:** no way to start a fresh cycle or empty the shelf without clearing storage (unchanged, product decision; see ADR 0001); the face-up card now carries its number, so pairing the screen with the printed deck no longer means opening the discard.
- **Screen-reader user:** pile buttons read "2discarded" (fixed: a space between count and label, likewise the tally); the reshuffle and "link copied" are now announced in the live region; the hint's two variants are now two short paragraphs.
- **Low-vision at 200% zoom:** card text clipped (fixed), card off-centre (fixed), wordmark clipped (fixed).

#### Minor Observations

- Reduced-motion crossfade faded the whole `.card-inner`, exposing the stack edges mid-fade; now the face crossfades (fixed).
- The no-JS page showed "tap to draw" above the notice that it cannot (fixed).
- "link copied" kept its underline, a status dressed as a link (fixed: `.is-status`).
- Six-card spread laid out 5 + 1 on desktop (fixed: the dialog caps at four columns).
- The spread's × was small on phones (fixed: padded target, sized on the type ramp).
- The theme disc and the CTA rule still animated under reduced motion (fixed).
- Desktop mini-piles share no baseline (left pile centred, right column stacked); unchanged, cosmetic.
- The hint is the largest mono on the phone screen (0.95rem vs 0.85rem chrome); unchanged.

#### Questions to Consider

- Why is the face-up card already "discarded"? A dealt-but-on-the-table state would let "drawn" and "discarded" collapse into one word.
- Should the hint ever be allowed to die? "Throw" is the most delightful verb on the site and a visitor sees it exactly once.
- Who is the share page for, the stranger or the crawler? The frame line and the sentence beneath the card are a first answer.

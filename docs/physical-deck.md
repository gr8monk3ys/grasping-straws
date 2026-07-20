# The physical deck — ordering playbook

How to turn `npm run print` output into a real deck artists can buy,
with zero inventory. Written 2026-07; **re-check every price and template
dimension on the printer's own pages before ordering — they revise.**

## What the deck is

- 54 tarot-size faces (2.75in × 4.75in cut): 48 prompt cards, 5 rules
  cards (the games from `/play/`), 1 title card — plus one shared back.
- One master PNG per face at 900×1500 px / 300 DPI out of
  `npm run print`; `GUIDES=1 npm run print` overlays the cut (red) and
  safe (blue) outlines for proofing.
- The deck version on the box must match `DECK_VERSION` in
  `src/config.ts` — site and object stay in lockstep.

## Template numbers (confirmed 2026-07)

| | The Game Crafter | MakePlayingCards |
|---|---|---|
| Canvas @300 DPI | 900×1500 px | min 897×1497 px |
| Cut line | 1/8in from edge | 36 px bleed per side |
| Safe zone | 1/4in from edge (75 px) | a further 36 px inside |
| Source | [TGC templates](https://help.thegamecrafter.com/article/39-templates), [tarot how-to](https://help.thegamecrafter.com/article/399-how-to-make-a-card-game-tarot-deck) | [MPC image FAQ](https://www.makeplayingcards.com/faq-photo.aspx) |

The master files satisfy both: TGC exactly; MPC sees 1.5 px extra bleed
per side, inside tolerance. Content stays inside the 75 px inset (the
stricter of the two safe zones).

## Route A — The Game Crafter (recommended first)

Print-on-demand with a built-in storefront: **no inventory, no
fulfillment, buyers order and TGC prints per unit.**

1. Create the game at thegamecrafter.com → product type **Tarot Deck**
   (2.75×4.75). Upload the 54 faces + `back.png`.
2. Add a **tuck box** for the tarot deck size; the box art can reuse
   `title.png`'s composition (TGC provides its own box template — use
   their numbers for the box, the card master does not fit it).
3. Order **one proof copy** to yourself. QA against the checklist below.
4. Publish to the TGC shop. You set the markup over manufacturing cost;
   that markup is the royalty. Set `PHYSICAL_DECK_URL` in
   `src/config.ts` to the product page, deploy — every "Get the physical
   deck" link on the site goes live.

Trade-offs: per-unit cost is high (POD), stock is standard card stock,
but the path from "files ready" to "artists can buy it" is days, not
months.

## Route B — MakePlayingCards (quality / small runs)

MPC's stock and finish options are wider (linen, superior smooth, black
core), unit cost drops with quantity, and they also run a
[marketplace](https://www.makeplayingcards.com/marketplace/index.aspx)
where designers sell decks print-on-demand.

1. Product: **tarot size cards** (2.75×4.75), 54 cards + custom back.
2. Upload masters; MPC's preview shows their own bleed/safe overlay —
   confirm nothing important crosses the red/dotted lines.
3. Order 1 sample deck first. Then either list on the MPC marketplace
   (POD, they handle fulfillment) or order a small batch (30–100) for
   direct sales at shows / bandcamp-style drops.

## Route C — offset, later

If the deck finds an audience (say, >250 decks/year through POD), an
offset run (PrintNinja and similar, ~500+ units) cuts unit cost several
times over — but you carry inventory and fulfillment. Not before the
POD routes prove demand. *(Prices unconfirmed; quote when relevant.)*

## Proof QA checklist

- [ ] Text legible at arm's length in lamplight (the studio test)
- [ ] No face crowds the cut — nothing important within 1/4in of the edge
- [ ] Back centering: fan the deck, look for a sawtooth pattern (miscut)
- [ ] Color: the paper-warm cream (`#fdfaf3`) should read as warm white,
      not yellow; ink near-black, not gray
- [ ] Shuffle feel: cards spring back, no immediate edge fray
- [ ] Rules cards read as a set (same title/size treatment)
- [ ] Box: title, the mark, and `Deck v<DECK_VERSION>` present

## Launch steps (site side)

1. `npm run validate && npm run print` at the final `DECK_VERSION`.
2. Proof ordered, QA passed, product page live.
3. `PHYSICAL_DECK_URL` set in `src/config.ts`; deploy.
4. The About page's "coming soon" flips to the product link
   automatically; the print-and-play PDF stays free — it is the ad.

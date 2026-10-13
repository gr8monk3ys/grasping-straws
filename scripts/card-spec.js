/*
 * The printed card, as the printer defines it.
 *
 * Poker size, 2.5" x 3.5" (63.5 x 88.9 mm): MakePlayingCards' "Design Your
 * Own Game Cards - Traditional Poker Size". It is the nearest size they make
 * to the 70 x 90 mm card of Oblique Strategies, the deck this one answers:
 * the same height to within a millimetre, and 6.5 mm narrower.
 *
 * The upload figures are MPC's published ones, not estimates. From their
 * upload FAQ (makeplayingcards.com/faq-photo.aspx), read 2026-10-12:
 *
 *   poker upload   822 x 1122 px at 300 DPI
 *   bleed          "36 pixels each side based on a 300DPI image" is cut off
 *   safe area      a further 36 px in, marked by their red dotted line
 *
 * 36 px is 0.12", NOT the 1/8" (0.125") their prose rounds it to. Building
 * to 0.125" gives 825 x 1125, which MPC accepts and silently rescales, so
 * every card lands a little off register. UPLOAD below is what they ask
 * for; print-cards.js fails if what it computes ever differs.
 *
 * If you change size or printer, replace every number here from THEIR
 * published figures. Do not average two specs.
 */
export const CARD = {
  dpi: 300,
  widthIn: 2.5,
  heightIn: 3.5,
  bleedIn: 36 / 300, // 0.12": MPC trims this off
  safeIn: 36 / 300, // 0.12": keep all content inside this
  cornerMm: 3.2, // approximate; only the mockup draws it
};

export const UPLOAD = { w: 822, h: 1122 }; // MPC's published poker upload size

// MPC sells this card in decks of "up to" these counts (their size menu,
// read 2026-10-12). A deck is priced at the smallest one it fits in, and a
// slot left over is simply not printed.
export const DECK_SIZES = [18, 36, 55, 72, 90, 108, 126, 144];

export const MM_PER_IN = 25.4;
export const TRIM_MM = { w: CARD.widthIn * MM_PER_IN, h: CARD.heightIn * MM_PER_IN };

/*
 * The printer's dieline for the box, as numbers.
 *
 * Read out of MakePlayingCards' own template, `2.5x3.5x54pcs.pdf` ("Rigid
 * box template for up to 55 playing cards, Poker size card 2.5 x 3.5"),
 * fetched 2026-10-12 from the "Download rigid box template" link on
 * makeplayingcards.com/design/custom-rigid-box-for-poker-sized-cards.html
 * with "Up to 55 cards" selected. Every coordinate below is a vertex of a
 * line in that file: PDF points, origin bottom-left, y up.
 *
 * The page holds two nets, the lid on the left and the base on the right.
 * In each, the blue lines are folds: a centre panel and four walls. Past
 * the walls the sheet wraps over the rim and inside; the inner red line is
 * where the sheet is cut and the outer red line is how far artwork must
 * bleed. MPC's note on the file: do not move anything relative to the page.
 *
 * If MPC changes the template, or a different size is ordered, replace
 * every number from THEIR file. Do not scale these.
 */

export const PT_PER_MM = 72 / 25.4;

export const PAGE = { w: 842.176, h: 499.469 };

// The two nets' bleed outlines meet on this line and nowhere else, so the
// page splits cleanly into a lid half and a base half.
export const SPLIT_X = 427.47;

const rect = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });

// Wall names are MPC's, as lettered on the template. `top` is the wall above
// the centre panel on the page, and so on round.
export const LID = {
  cover: rect(111.13, 111.11, 316.36, 388.35),
  top: rect(111.68, 389.77, 315.78, 448.44), // "RIGHT SIDE"
  bottom: rect(111.68, 51.03, 315.78, 109.71), // "LEFT SIDE"
  left: rect(51.02, 109.71, 109.7, 389.77), // "BACK"
  right: rect(317.76, 109.71, 376.44, 389.77), // "FRONT"
};

export const BASE = {
  cover: rect(538.59, 117.49, 731.06, 381.97),
  top: rect(539.15, 383.38, 730.49, 442.06), // "RIGHT SIDE"
  bottom: rect(539.15, 57.4, 730.49, 116.07), // "LEFT SIDE"
  left: rect(478.49, 116.07, 537.17, 383.39), // "FRONT"
  right: rect(732.48, 116.07, 791.15, 383.39), // "BACK"
};

// The cut line of each wrap sheet, for drawing on proofs only.
export const CUT = {
  lid: [
    [381.4, 387.78], [381.4, 423.78], [323.2, 423.78], [317.76, 391.18], [315.78, 396.85],
    [315.78, 448.44], [314.36, 451.98], [314.36, 490.96], [113.1, 490.96], [113.1, 451.98],
    [111.68, 448.44], [111.68, 396.85], [109.7, 391.18], [104.27, 423.78], [46.06, 423.78],
    [46.06, 387.78], [8.5, 387.78], [8.5, 111.68], [46.06, 111.68], [46.06, 75.68],
    [104.27, 75.68], [109.7, 108.28], [111.68, 102.62], [111.68, 51.02], [113.1, 47.48],
    [113.1, 8.5], [314.36, 8.5], [314.36, 47.48], [315.78, 51.02], [315.78, 102.62],
    [317.76, 108.28], [323.2, 75.68], [381.4, 75.68], [381.4, 111.68], [418.96, 111.68],
    [418.96, 387.78],
  ],
  base: [
    [796.11, 381.4], [796.11, 417.4], [737.91, 417.4], [732.48, 384.8], [730.49, 390.47],
    [730.49, 442.06], [729.07, 445.6], [729.07, 484.58], [540.57, 484.58], [540.57, 445.6],
    [539.15, 442.06], [539.15, 390.47], [537.17, 384.8], [531.74, 417.4], [473.53, 417.4],
    [473.53, 381.4], [435.97, 381.4], [435.97, 118.06], [473.53, 118.06], [473.53, 82.06],
    [531.74, 82.06], [537.17, 114.66], [539.15, 108.99], [539.15, 57.4], [540.57, 53.85],
    [540.57, 14.88], [729.07, 14.88], [729.07, 53.85], [730.49, 57.4], [730.49, 108.99],
    [732.48, 114.66], [737.91, 82.06], [796.11, 82.06], [796.11, 118.06], [833.67, 118.06],
    [833.67, 381.4],
  ],
};

const mm = (pt) => pt / PT_PER_MM;
const size = (r) => ({ w: mm(r.x1 - r.x0), h: mm(r.y1 - r.y0) });

// The finished box in millimetres, derived from the dieline, not typed in.
export const BOX = {
  lid: { w: size(LID.cover).w, l: size(LID.cover).h, h: size(LID.left).w },
  base: { w: size(BASE.cover).w, l: size(BASE.cover).h, h: size(BASE.left).w },
};

// MPC lists the box at 97.8 x 72.4 x 20.7 mm outside. The dieline has to
// agree with the listing it was downloaded from, or one of the two has
// changed and nothing should be printed from these numbers.
export const LISTED = { l: 97.8, w: 72.4, h: 20.7 };
const off = (a, b) => Math.abs(a - b) > 0.06;
if (off(BOX.lid.l, LISTED.l) || off(BOX.lid.w, LISTED.w) || off(BOX.base.h, LISTED.h)) {
  throw new Error(
    `Box spec drift: the dieline gives a ${BOX.lid.l.toFixed(1)} x ${BOX.lid.w.toFixed(1)} mm lid on a ` +
      `${BOX.base.h.toFixed(1)} mm base; MPC lists ${LISTED.l} x ${LISTED.w} x ${LISTED.h}.`
  );
}

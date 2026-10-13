/*
 * The printer's dieline for the box, as numbers.
 *
 * Read out of MakePlayingCards' own template, `2.75x4.75x78pcs.pdf` ("Rigid
 * box template for up to 78 playing cards, Tarot size"), last modified by
 * them 2024-04-11 and fetched 2026-10-12 from the "Download rigid box
 * template" link on
 * makeplayingcards.com/design/custom-rigid-box-for-tarot-cards.html with
 * "Up to 78 cards" selected. Every coordinate below is a vertex of a line in
 * that file: PDF points, origin bottom-left, y up.
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

export const PAGE = { w: 937.977, h: 633.547 };

// The two nets' bleed outlines meet on this line and nowhere else, so the
// page splits cleanly into a lid half and a base half.
export const SPLIT_X = 447.02;

const rect = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });

// Wall names are MPC's, as lettered on the template. `top` is the wall above
// the centre panel on the page, and so on round.
export const LID = {
  cover: rect(111.4, 132.67, 335.62, 500.89),
  top: rect(111.4, 502.3, 335.62, 559.85), // "RIGHT SIDE"
  bottom: rect(111.4, 73.7, 335.62, 131.25), // "LEFT SIDE"
  left: rect(52.44, 131.25, 109.98, 502.3), // "BACK"
  right: rect(337.03, 131.25, 394.58, 502.3), // "FRONT"
};

export const BASE = {
  cover: rect(586.76, 139.18, 798.23, 494.36),
  top: rect(586.76, 495.78, 798.23, 581.67), // "RIGHT SIDE"
  bottom: rect(586.76, 51.87, 798.23, 137.76), // "LEFT SIDE"
  left: rect(499.46, 137.76, 585.35, 495.78), // "FRONT"
  right: rect(799.65, 137.76, 885.54, 495.78), // "BACK"
};

// The cut line of each wrap sheet, for drawing on proofs only.
export const CUT = {
  lid: [
    [399.68, 498.62], [399.68, 536.32], [348.37, 536.32], [337.03, 503.72], [335.62, 509.39],
    [335.62, 559.85], [333.35, 563.53], [333.35, 603.22], [113.66, 603.22], [113.66, 563.53],
    [111.4, 559.85], [111.4, 509.39], [109.98, 503.72], [98.64, 536.32], [47.33, 536.32],
    [47.33, 498.62], [8.5, 498.62], [8.5, 134.93], [47.33, 134.93], [47.33, 97.23],
    [98.64, 97.23], [109.98, 129.83], [111.4, 124.16], [111.4, 73.7], [113.66, 70.02],
    [113.66, 30.33], [333.35, 30.33], [333.35, 70.02], [335.62, 73.7], [335.62, 124.16],
    [337.03, 129.83], [348.37, 97.23], [399.68, 97.23], [399.68, 134.93], [438.51, 134.93],
    [438.51, 498.62],
  ],
  base: [
    [890.64, 492.09], [890.64, 529.79], [810.98, 529.79], [799.65, 497.2], [798.23, 502.86],
    [798.23, 581.67], [795.96, 585.35], [795.96, 625.04], [589.03, 625.04], [589.03, 585.35],
    [586.76, 581.67], [586.76, 502.86], [585.35, 497.2], [574.01, 529.79], [494.35, 529.79],
    [494.35, 492.09], [455.52, 492.09], [455.52, 141.45], [494.35, 141.45], [494.35, 103.75],
    [574.01, 103.75], [585.35, 136.34], [586.76, 130.68], [586.76, 51.87], [589.03, 48.19],
    [589.03, 8.5], [795.96, 8.5], [795.96, 48.19], [798.23, 51.87], [798.23, 130.68],
    [799.65, 136.34], [810.98, 103.75], [890.64, 103.75], [890.64, 141.45], [929.47, 141.45],
    [929.47, 492.09],
  ],
};

const mm = (pt) => pt / PT_PER_MM;
const size = (r) => ({ w: mm(r.x1 - r.x0), h: mm(r.y1 - r.y0) });

// The finished box in millimetres, derived from the dieline, not typed in.
export const BOX = {
  lid: { w: size(LID.cover).w, l: size(LID.cover).h, h: size(LID.left).w },
  base: { w: size(BASE.cover).w, l: size(BASE.cover).h, h: size(BASE.left).w },
};

// MPC lists the box at 129.9 x 79.1 x 30.3 mm outside. The dieline has to
// agree with the listing it was downloaded from, or one of the two has
// changed and nothing should be printed from these numbers.
const LISTED = { l: 129.9, w: 79.1, h: 30.3 };
const off = (a, b) => Math.abs(a - b) > 0.06;
if (off(BOX.lid.l, LISTED.l) || off(BOX.lid.w, LISTED.w) || off(BOX.base.h, LISTED.h)) {
  throw new Error(
    `Box spec drift: the dieline gives a ${BOX.lid.l.toFixed(1)} x ${BOX.lid.w.toFixed(1)} mm lid on a ` +
      `${BOX.base.h.toFixed(1)} mm base; MPC lists ${LISTED.l} x ${LISTED.w} x ${LISTED.h}.`
  );
}

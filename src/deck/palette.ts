/*
 * Every colour the project uses, in one place. The values and their names
 * are lscaturchio.xyz's (see that repo's DESIGN.md): this deck is a page
 * from the same notebook, so it is set on the same paper in the same ink.
 *
 * The print scripts, the asset generator and the box generator import this
 * directly. The stylesheet, the manifest and the theme-color metas cannot,
 * so tests/palette.test.mjs holds them to these values instead.
 */

export type Palette = {
  ground: string; // the page
  card: string; // card stock, one shade off the page
  tinted: string; // recessed paper: the card underneath, a pressed surface
  ink: string; // text
  muted: string; // metadata: ids, labels, captions
  accent: string; // the one pen
  moss: string; // the pen at hairline weight, where `accent` reads as ink
  hairline: string; // rules and borders
};

export const PAPER: Palette = {
  ground: "#f9f8f5",
  card: "#fbfaf9",
  tinted: "#eeece7",
  ink: "#1a1f23",
  muted: "#606976",
  accent: "#184e35",
  moss: "#397f5e",
  hairline: "#e2dbd5",
};

export const NIGHT: Palette = {
  ground: "#111317",
  card: "#16181d",
  tinted: "#25272d",
  ink: "#fafafa",
  muted: "#abb0ba",
  accent: "#42a979",
  moss: "#42a979", // already light enough to hold a hairline on night stock
  hairline: "#292c32",
};

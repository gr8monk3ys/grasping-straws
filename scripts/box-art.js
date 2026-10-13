/*
 * What is printed on each panel of an edition's rigid box, as HTML.
 *
 * Shared by the box generator (which lays the panels onto the printer's
 * template) and the mockup (which folds them into a box to look at), so the
 * thing proofed on screen and the thing sent to print cannot drift apart.
 *
 * Every panel is built in millimetres. `mm` converts to pixels at whatever
 * scale the caller renders at, so the same panel is correct at 300 DPI for
 * print and at 4 px/mm for a picture.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DECK_NAME, DECK_VERSION } from "../src/config.ts";
import { mark } from "./mark.js";

const pub = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const b64 = (f) => fs.readFileSync(path.join(pub, "fonts", f)).toString("base64");

export const FONT_CSS = `
  @font-face { font-family: "Fraunces"; font-weight: 300 700;
    src: url(data:font/woff2;base64,${b64("Fraunces-latin.woff2")}) format("woff2"); }
  @font-face { font-family: "Plex Mono"; font-weight: 400;
    src: url(data:font/woff2;base64,${b64("PlexMono-400-latin.woff2")}) format("woff2"); }
  @font-face { font-family: "Plex Mono"; font-weight: 500;
    src: url(data:font/woff2;base64,${b64("PlexMono-500-latin.woff2")}) format("woff2"); }`;

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

// The wall label: the website's catalogue voice, set small beside the work.
const label = (mm, color, sizeMm = 2.3) =>
  `font-family:'Plex Mono',monospace; font-weight:500; font-size:${mm(sizeMm)}px;` +
  ` letter-spacing:0.16em; text-transform:uppercase; white-space:nowrap; color:${color};`;

const name = (mm, color, sizeMm) =>
  `font-family:'Fraunces',serif; font-size:${mm(sizeMm)}px; line-height:1.1; white-space:nowrap; color:${color};` +
  ` font-optical-sizing:none; font-variation-settings:'opsz' ${Math.round(sizeMm * 2.835)},'wght' 600;`;

// Each panel fills its parent; the caller sizes and places the parent.
const panel = (bg, body, style = "") =>
  `<div style="position:absolute; inset:0; background:${bg}; display:grid; ${style}">${body}</div>`;

export function panels(ed, mm) {
  const b = ed.box;
  return {
    // What you see on a desk: the mark, the name, and which deck this is.
    lidTop: panel(
      b.lid,
      `<div></div>
       <div style="display:grid; justify-items:center; gap:${mm(9)}px;">
         <div style="width:${mm(21)}px;">${mark(b.lidMark)}</div>
         <div style="${name(mm, b.lidInk, 7.4)}">${esc(DECK_NAME)}</div>
       </div>
       <div style="${label(mm, b.lidLabel)} align-self:end;">${esc(ed.name)} · 52 cards</div>`,
      `grid-template-rows:1fr auto 1fr; justify-items:center; padding:${mm(9)}px ${mm(6)}px;`
    ),
    // What you see on a shelf.
    lidLong: panel(
      b.lid,
      `<div style="${name(mm, b.lidInk, 5.2)}">${esc(DECK_NAME)}</div>
       <div style="${label(mm, b.lidLabel, 2.1)}">${esc(ed.name)}</div>`,
      `grid-template-columns:1fr auto; align-items:center; padding:0 ${mm(8)}px;`
    ),
    lidShort: panel(
      b.lid,
      `<div style="width:${mm(11)}px;">${mark(b.lidMark)}</div>`,
      `place-items:center;`
    ),
    baseSide: panel(b.base, ""),
    // The underside: what the deck is, where it lives, which printing this is.
    baseBottom: panel(
      b.base,
      `<div style="font-family:'Fraunces',serif; font-size:${mm(4.1)}px; line-height:1.4; color:${b.baseInk};
                   font-optical-sizing:none; font-variation-settings:'opsz' 12,'wght' 400; text-wrap:balance;">
         ${esc(ed.blurb)}</div>
       <div style="display:grid; gap:${mm(2.2)}px;">
         <div style="${label(mm, b.baseLabel, 2.1)}">straws.lscaturchio.xyz</div>
         <div style="${label(mm, b.baseLabel, 2.1)}">Printing ${esc(DECK_VERSION)} · made by Lorenzo</div>
       </div>`,
      `align-content:space-between; padding:${mm(11)}px ${mm(9)}px;`
    ),
  };
}

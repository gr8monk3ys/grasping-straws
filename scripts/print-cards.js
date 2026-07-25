/*
 * Print-file generator: renders every card in public/cards.json — plus the
 * card back, a title card, and the five rules cards — as 300 DPI PNGs into
 * print/ for MakePlayingCards / The Game Crafter. 54 faces + 1 back.
 *
 *   npm run print              # renders print/*.png
 *   GUIDES=1 npm run print     # overlays cut/safe outlines for proofing
 *
 * One master canvas serves both printers (tarot size, 2.75in × 4.75in cut):
 *
 *   The Game Crafter tarot: 900×1500 px @300 DPI, cut line 1/8in (37.5 px)
 *   from the edge, safe zone 1/4in (75 px) from the edge.
 *     https://help.thegamecrafter.com/article/39-templates
 *     https://help.thegamecrafter.com/article/399-how-to-make-a-card-game-tarot-deck
 *   MakePlayingCards tarot: minimum upload 897×1497 px @300 DPI — 36 px
 *   bleed per side, safe area a further 36 px inside.
 *     https://www.makeplayingcards.com/faq-photo.aspx
 *
 * 900×1500 with content inside the 75 px inset satisfies TGC exactly and
 * over-covers MPC's bleed by 1.5 px per side, which the cut swallows.
 * Re-check both template pages before ordering; printers revise specs.
 */
const SPEC = {
  dpi: 300,
  fullWpx: 900, // 3.00in — 2.75in cut + 0.125in bleed each side
  fullHpx: 1500, // 5.00in — 4.75in cut + 0.125in bleed each side
  cutPx: 38, // cut line distance from the canvas edge (1/8in)
  safePx: 75, // content stays this far from the canvas edge (1/4in, TGC's stricter number)
};

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RULES_CARDS } from "./rules-cards.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, "..", "public");
const out = path.join(here, "..", "print");
fs.mkdirSync(out, { recursive: true });

const cards = JSON.parse(fs.readFileSync(path.join(pub, "cards.json"), "utf8"));
const svg = fs.readFileSync(path.join(pub, "favicon.svg"), "utf8");
const font = fs.readFileSync(path.join(pub, "fonts", "EBGaramond-latin.woff2")).toString("base64");
const fontItalic = fs
  .readFileSync(path.join(pub, "fonts", "EBGaramond-Italic-latin.woff2"))
  .toString("base64");

const W = SPEC.fullWpx;
const H = SPEC.fullHpx;
const inset = SPEC.safePx;

const CARD = "#fdfaf3";
const INK = "#241e16";
const MUTED = "#6e6455";
const guides = process.env.GUIDES
  ? `<div style="position:fixed; inset:${SPEC.cutPx}px; outline:2px solid red;"></div>
     <div style="position:fixed; inset:${inset}px; outline:2px dashed blue;"></div>`
  : "";

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

const shell = (body) => `<!doctype html><style>
  @font-face { font-family: "EB Garamond"; src: url(data:font/woff2;base64,${font}) format("woff2"); }
  @font-face { font-family: "EB Garamond"; font-style: italic; src: url(data:font/woff2;base64,${fontItalic}) format("woff2"); }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; }
  body { background: ${CARD}; font-family: "EB Garamond", serif; color: ${INK};
         display: grid; place-items: center; padding: ${inset}px; }
  svg { display: block; }
</style><body>${body}${guides}</body>`;

const face = (text) =>
  shell(
    `<div style="font-size:64px; line-height:1.35; text-align:center; text-wrap:balance;">${esc(text)}</div>`,
  );

const rules = (card) =>
  shell(`<div style="display:grid; justify-items:center; gap:56px; text-align:center;">
    <div style="font-size:40px; letter-spacing:0.2em; text-transform:uppercase;">${esc(card.title)}</div>
    <div style="font-size:32px; font-style:italic; color:${MUTED}; margin-top:-30px;">${esc(card.players)}</div>
    <div style="font-size:44px; line-height:1.45; text-wrap:balance;">${esc(card.body)}</div>
  </div>`);

const back = shell(`<div style="display:grid; justify-items:center; gap:110px; color:${MUTED};">
  <div style="width:260px;">${svg}</div>
  <div style="font-size:40px; letter-spacing:0.22em; text-transform:uppercase; white-space:nowrap;">Grasping&nbsp;Straws?</div>
</div>`);

const title = shell(`<div style="display:grid; justify-items:center; gap:90px;">
  <div style="width:220px; color:${MUTED};">${svg}</div>
  <div style="font-size:88px; font-weight:600;">Grasping Straws?</div>
  <div style="font-size:38px; font-style:italic; color:${MUTED};">an original deck of lateral-thinking prompts</div>
</div>`);

const browser = await chromium.launch(
  // PW_CHANNEL=chrome runs against system Chrome when the pinned download is unavailable
  process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {},
);
const page = await browser.newPage({ viewport: { width: W, height: H } });

async function shoot(html, file) {
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, file) });
  console.log(`wrote print/${file}`);
}

await shoot(back, "back.png");
await shoot(title, "title.png");
for (const card of cards) {
  await shoot(face(card.text), `card-${String(card.id).padStart(2, "0")}.png`);
}
for (let i = 0; i < RULES_CARDS.length; i++) {
  await shoot(rules(RULES_CARDS[i]), `rules-${i + 1}.png`);
}
await browser.close();

const faces = cards.length + RULES_CARDS.length + 1; // prompts + rules + title
console.log(
  `\n${faces} faces + 1 back at ${W}x${H}px (${SPEC.dpi} DPI, tarot 2.75x4.75in cut).` +
    `\nUpload: faces + back.png. See docs/physical-deck.md for the ordering playbook.`,
);

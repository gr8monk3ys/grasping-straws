/*
 * Print-file generator (PRD Appendix A, step 3): renders every card in
 * public/cards.json — plus the card back and a title card — as 300 DPI
 * PNGs into print/ for MakePlayingCards / The Game Crafter.
 *
 *   npm run print              # renders print/*.png
 *   GUIDES=1 npm run print     # overlays bleed/safe outlines for proofing
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ THE DIMENSIONS BELOW ARE PLACEHOLDERS. Appendix A step 2: download  │
 * │ the printer's own template files and copy their exact numbers here  │
 * │ before ordering anything. Do not guess margins.                    │
 * └─────────────────────────────────────────────────────────────────────┘
 */
const SPEC = {
  dpi: 300,
  cardWidthIn: 2.75, // tarot size (decided in Appendix A)
  cardHeightIn: 4.75,
  bleedIn: 0.125, // PLACEHOLDER — use the printer template's bleed
  safeIn: 0.1875, // PLACEHOLDER — use the printer template's safe margin
};

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, "..", "public");
const out = path.join(here, "..", "print");
fs.mkdirSync(out, { recursive: true });

const cards = JSON.parse(fs.readFileSync(path.join(pub, "cards.json"), "utf8"));
const svg = fs.readFileSync(path.join(pub, "favicon.svg"), "utf8");
const font = fs.readFileSync(path.join(pub, "fonts", "Fraunces-latin.woff2")).toString("base64");

const px = (inches) => Math.round(inches * SPEC.dpi);
const W = px(SPEC.cardWidthIn + 2 * SPEC.bleedIn);
const H = px(SPEC.cardHeightIn + 2 * SPEC.bleedIn);
const inset = px(SPEC.bleedIn + SPEC.safeIn); // content stays inside this

const CARD = "#fdfaf3";
const INK = "#241e16";
const MUTED = "#6e6455";
const guides = process.env.GUIDES
  ? `<div style="position:fixed; inset:${px(SPEC.bleedIn)}px; outline:2px solid red;"></div>
     <div style="position:fixed; inset:${inset}px; outline:2px dashed blue;"></div>`
  : "";

const shell = (body) => `<!doctype html><style>
  @font-face { font-family: "Fraunces"; src: url(data:font/woff2;base64,${font}) format("woff2"); }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; }
  body { background: ${CARD}; font-family: "Fraunces", serif; color: ${INK};
         display: grid; place-items: center; padding: ${inset}px; }
  svg { display: block; }
</style><body>${body}${guides}</body>`;

const face = (text) =>
  shell(`<div style="font-size:64px; line-height:1.35; text-align:center; text-wrap:balance;">${text
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</div>`);

const back = shell(`<div style="display:grid; justify-items:center; gap:110px; color:${MUTED};">
  <div style="width:260px;">${svg}</div>
  <div style="font-size:40px; letter-spacing:0.22em; text-transform:uppercase; white-space:nowrap;">Grasping&nbsp;Straws?</div>
</div>`);

const title = shell(`<div style="display:grid; justify-items:center; gap:90px;">
  <div style="width:220px; color:${MUTED};">${svg}</div>
  <div style="font-size:88px; font-weight:600;">Grasping Straws?</div>
  <div style="font-size:38px; font-style:italic; color:${MUTED};">an original deck of lateral-thinking prompts</div>
</div>`);

const browser = await chromium.launch();
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
await browser.close();
console.log(
  `\n${cards.length + 2} files at ${W}x${H}px (${SPEC.dpi} DPI incl. ${SPEC.bleedIn}" bleed).` +
    `\nReminder: an instructions card is still to be written (Appendix A wants 54 total).`
);

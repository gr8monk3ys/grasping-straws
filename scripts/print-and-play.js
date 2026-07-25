/*
 * Print-and-play generator: the whole deck as a free, cut-lines PDF for
 * home printing — 48 prompts + 5 rules cards + a title card at true tarot
 * size (2.75in × 4.75in), four to a US Letter page, plus a sheet of card
 * backs for optional duplexing. Output is committed as
 * public/print-and-play.pdf and linked from the About page.
 *
 *   npm run pnp
 *
 * The free deck is the on-ramp, not the product: the manufactured deck
 * (docs/physical-deck.md) is the instrument.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RULES_CARDS } from "./rules-cards.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, "..", "public");

const cards = JSON.parse(fs.readFileSync(path.join(pub, "cards.json"), "utf8"));
const svg = fs.readFileSync(path.join(pub, "favicon.svg"), "utf8");
const font = fs.readFileSync(path.join(pub, "fonts", "EBGaramond-latin.woff2")).toString("base64");
const fontItalic = fs
  .readFileSync(path.join(pub, "fonts", "EBGaramond-Italic-latin.woff2"))
  .toString("base64");

// Keep in step with src/pages/play.astro and scripts/print-cards.js.

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

const promptFace = (text) => `<div class="cell"><div class="prompt">${esc(text)}</div></div>`;

const rulesFace = (c) =>
  `<div class="cell"><div class="rules">
     <div class="rules-title">${esc(c.title)}</div>
     <div class="rules-players">${esc(c.players)}</div>
     <div class="rules-body">${esc(c.body)}</div>
   </div></div>`;

const titleFace = `<div class="cell"><div class="titlecard">
  <div class="mark">${svg}</div>
  <div class="name">Grasping Straws?</div>
  <div class="sub">an original deck of lateral-thinking prompts</div>
</div></div>`;

const backFace = `<div class="cell back"><div class="backart">
  <div class="mark">${svg}</div>
  <div class="wordmark">Grasping&nbsp;Straws?</div>
</div></div>`;

const faces = [titleFace, ...cards.map((c) => promptFace(c.text)), ...RULES_CARDS.map(rulesFace)];
const sheets = [];
for (let i = 0; i < faces.length; i += 4) sheets.push(faces.slice(i, i + 4).join(""));

const cover = `<section class="page cover">
  <div class="mark">${svg}</div>
  <h1>Grasping Straws?</h1>
  <p class="tag">an original deck of lateral-thinking prompts — print-and-play edition</p>
  <ol>
    <li>Print pages 2–${sheets.length + 1} single-sided on the heaviest stock your printer accepts.</li>
    <li>Optional backs: put the printed sheets back in and print the last page on the reverse of each (long-edge flip).</li>
    <li>Cut along the lines. A ruler and a blade beat scissors.</li>
    <li>Shuffle. The five rules cards are ways to play; the deck doesn't negotiate.</li>
  </ol>
  <p class="fine">This free edition is for your own studio. The manufactured deck — real card
  stock, shuffled by your own hands — is the instrument; the site at grasping-straws has the
  details. Card texts &copy; the deck's author.</p>
</section>`;

const html = `<!doctype html><meta charset="utf-8"><style>
  @font-face { font-family: "EB Garamond"; src: url(data:font/woff2;base64,${font}) format("woff2"); }
  @font-face { font-family: "EB Garamond"; font-style: italic; src: url(data:font/woff2;base64,${fontItalic}) format("woff2"); }
  @page { size: letter; margin: 0; }
  * { margin: 0; box-sizing: border-box; }
  body { font-family: "EB Garamond", serif; color: #241e16; }
  .page { width: 8.5in; height: 11in; break-after: page; display: grid;
          grid-template-columns: 2.75in 2.75in; grid-auto-rows: 4.75in;
          justify-content: center; align-content: center; }
  .cell { border: 0.5pt solid #999; display: grid; place-items: center;
          padding: 0.25in; background: #fdfaf3; overflow: hidden; }
  .prompt { font-size: 15.5pt; line-height: 1.35; text-align: center; text-wrap: balance; }
  .rules { display: grid; justify-items: center; gap: 10pt; text-align: center; }
  .rules-title { font-size: 10pt; letter-spacing: 0.2em; text-transform: uppercase; }
  .rules-players { font-size: 8.5pt; font-style: italic; color: #6e6455; margin-top: -6pt; }
  .rules-body { font-size: 10.5pt; line-height: 1.45; text-wrap: balance; }
  .titlecard { display: grid; justify-items: center; gap: 16pt; text-align: center; }
  .titlecard .mark { width: 0.75in; color: #6e6455; }
  .titlecard .name { font-size: 20pt; font-weight: 600; }
  .titlecard .sub { font-size: 9.5pt; font-style: italic; color: #6e6455; }
  .mark svg { display: block; width: 100%; height: auto; }
  .backart { display: grid; justify-items: center; gap: 24pt; color: #6e6455; }
  .backart .mark { width: 0.85in; }
  .backart .wordmark { font-size: 9.5pt; letter-spacing: 0.22em; text-transform: uppercase; white-space: nowrap; }
  .cover { display: block; padding: 1.2in 1.1in; }
  .cover .mark { width: 0.6in; color: #6e6455; margin-bottom: 0.35in; }
  .cover h1 { font-size: 26pt; font-weight: 600; margin-bottom: 6pt; }
  .cover .tag { font-style: italic; color: #6e6455; margin-bottom: 0.4in; }
  .cover ol { padding-left: 1.2em; line-height: 1.7; font-size: 12pt; }
  .cover .fine { margin-top: 0.5in; font-size: 9.5pt; color: #6e6455; line-height: 1.5; }
</style><body>
${cover}
${sheets.map((cells) => `<section class="page">${cells}</section>`).join("\n")}
<section class="page">${backFace.repeat(4)}</section>
</body>`;

const browser = await chromium.launch(
  // PW_CHANNEL=chrome runs against system Chrome when the pinned download is unavailable
  process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {},
);
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: path.join(pub, "print-and-play.pdf"),
  printBackground: true,
  preferCSSPageSize: true,
});
await browser.close();

const bytes = fs.statSync(path.join(pub, "print-and-play.pdf")).size;
console.log(
  `wrote public/print-and-play.pdf — ${faces.length} faces on ${sheets.length} sheets ` +
    `+ cover + backs page (${(bytes / 1024).toFixed(0)} KB)`,
);

/*
 * Print-and-play generator: the whole deck as a free, cut-lines PDF for
 * home printing — every live prompt, the five rules cards and a title card
 * at true tarot size (2.75in x 4.75in), four to a US Letter page, plus a
 * sheet of backs for optional duplexing.
 *
 *   npm run pnp
 *
 * Output is public/print-and-play.pdf, committed and served as a static
 * asset (the site has no server and the host has no browser, so it cannot
 * be rendered on demand). scripts/check-pnp-fresh.js is what keeps a
 * committed binary from drifting away from the cards it was made from.
 *
 * Typography is deliberately the same as scripts/print-cards.js — the same
 * fonts, the same balanced sentence setting, the same mark — so the free
 * edition is the manufactured deck at a lower grade of paper, not a
 * different design. It is the on-ramp, not the product.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RULES_CARDS } from "./rules-cards.js";
import { pnpStamp, STAMP_PATH } from "./pnp-stamp.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, "..", "public");
const pdfPath = path.join(pub, "print-and-play.pdf");

const all = JSON.parse(fs.readFileSync(path.join(pub, "cards.json"), "utf8"));
// Drafts are reserved ids with no text. The manufactured run refuses to
// render while any remain; the free edition does not, because it is not
// permanent — someone printing at home today should get today's 48 cards
// rather than nothing.
const cards = all.filter((c) => !c.draft);
const svg = fs.readFileSync(path.join(pub, "favicon.svg"), "utf8");
const b64 = (f) => fs.readFileSync(path.join(pub, "fonts", f)).toString("base64");
const fraunces = b64("Fraunces-latin.woff2");
const plex = b64("PlexMono-400-latin.woff2");

const CARD = "#fdfaf3";
const INK = "#241e16";
const MUTED = "#6e6455";
const ACCENT = "#2c6e4f";

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

// favicon.svg hardcodes its ink and carries a prefers-color-scheme: dark
// branch that would print a near-white mark on cream. Same treatment as the
// manufactured run: replace both hexes so either branch says the same thing.
const tint = (color) => svg.replaceAll("#241E16", color).replaceAll("#EAE3D4", color);

// text-wrap: balance evens out line lengths and has no idea where a sentence
// ends, which strands the second sentence's first word on the previous line.
// Setting each sentence as its own balanced block breaks at the meaning.
const sentences = (text) =>
  text.match(/[^.?!]+[.?!]*\s*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];

const promptFace = (card) => `<div class="cell">
  <div class="num">${String(card.id).padStart(2, "0")}</div>
  <div class="mid"><div class="prompt">${sentences(card.text)
    .map((s, i) => `<div${i ? ' style="margin-top:0.34em;"' : ""}>${esc(s)}</div>`)
    .join("")}</div></div>
  <div class="rule"></div>
</div>`;

const rulesFace = (c) => `<div class="cell">
  <div class="num">HOW TO PLAY</div>
  <div class="mid"><div class="rules">
    <div class="rules-title">${esc(c.title)}</div>
    <div class="rules-players">${esc(c.players)}</div>
    <div class="rules-body">${esc(c.body)}</div>
  </div></div>
  <div class="rule"></div>
</div>`;

const titleFace = `<div class="cell">
  <div class="num"></div>
  <div class="mid"><div class="titlecard">
    <div class="mark">${tint(ACCENT)}</div>
    <div class="name">Grasping Straws?</div>
    <div class="sub">an original deck of<br>lateral-thinking prompts</div>
  </div></div>
  <div class="rule"></div>
</div>`;

const backFace = `<div class="cell back"><div class="backart">
  <div class="mark">${tint(MUTED)}</div>
  <div class="wordmark">Grasping&nbsp;Straws?</div>
</div></div>`;

const faces = [titleFace, ...cards.map(promptFace), ...RULES_CARDS.map(rulesFace)];
const sheets = [];
for (let i = 0; i < faces.length; i += 4) sheets.push(faces.slice(i, i + 4).join(""));

const cover = `<section class="page cover">
  <div class="mark">${tint(ACCENT)}</div>
  <h1>Grasping Straws?</h1>
  <p class="tag">an original deck of lateral-thinking prompts &mdash; print-and-play edition</p>
  <ol>
    <li>Print pages 2&ndash;${sheets.length + 1} single-sided, on the heaviest stock your printer accepts.</li>
    <li>Optional backs: put the printed sheets back in and print the last page on the reverse of each (long-edge flip).</li>
    <li>Cut along the lines. A ruler and a blade beat scissors.</li>
    <li>Shuffle. The ${RULES_CARDS.length} rules cards at the end are ways to play; the deck doesn't negotiate.</li>
  </ol>
  <p class="fine">This free edition is for your own studio. The manufactured deck &mdash; real card
  stock, shuffled by your own hands &mdash; is the instrument; straws.lscaturchio.xyz has the
  details, the whole deck to read, and a card a day. Card texts &copy; the deck's author.</p>
</section>`;

const html = `<!doctype html><meta charset="utf-8"><style>
  @font-face { font-family: "Fraunces"; src: url(data:font/woff2;base64,${fraunces}) format("woff2"); }
  @font-face { font-family: "Plex Mono"; src: url(data:font/woff2;base64,${plex}) format("woff2"); }
  @page { size: letter; margin: 0; }
  * { margin: 0; box-sizing: border-box; }
  html { color-scheme: light; }
  body { font-family: "Fraunces", serif; color: ${INK}; font-optical-sizing: none; }
  svg { display: block; width: 100%; height: auto; }
  .page { width: 8.5in; height: 11in; break-after: page; display: grid;
          grid-template-columns: 2.75in 2.75in; grid-auto-rows: 4.75in;
          justify-content: center; align-content: center; }
  /* The border IS the cut line — 0.5pt lands as a hairline on a home
     printer, thin enough that the blade takes it with the trim. */
  .cell { border: 0.5pt solid #9c9384; background: ${CARD}; overflow: hidden;
          padding: 0.26in; display: grid; grid-template-rows: auto 1fr auto; }
  .num { font-family: "Plex Mono", monospace; font-size: 7.5pt; letter-spacing: 0.16em;
         color: ${MUTED}; min-height: 1em; }
  .mid { display: grid; place-items: center; }
  .rule { justify-self: center; width: 0.4in; height: 1pt; background: ${ACCENT}; opacity: 0.65; }
  /* 15.5pt on a 2.23in text column holds the longest card (62 characters) in
     three lines, and matches the proportion the site sets the face at. */
  .prompt { font-size: 15.5pt; line-height: 1.32; text-align: center; text-wrap: balance;
            font-variation-settings: 'opsz' 16, 'wght' 400; }
  .rules { display: grid; justify-items: center; gap: 9pt; text-align: center; }
  .rules-title { font-family: "Plex Mono", monospace; font-size: 9pt; letter-spacing: 0.18em;
                 text-transform: uppercase; }
  .rules-players { font-size: 9pt; font-style: italic; color: ${MUTED}; margin-top: -6pt; }
  .rules-body { font-size: 11pt; line-height: 1.45; text-wrap: balance; }
  .titlecard { display: grid; justify-items: center; gap: 16pt; text-align: center; }
  .titlecard .mark { width: 0.7in; }
  .titlecard .name { font-size: 20pt; font-variation-settings: 'opsz' 20, 'wght' 600; }
  .titlecard .sub { font-size: 9.5pt; font-style: italic; color: ${MUTED}; line-height: 1.4; }
  /* The back has one child, not the face's three rows — without collapsing
     the template it lands in the first (auto) row and prints top-aligned. */
  .back { grid-template-rows: 1fr; place-items: center; }
  .backart { display: grid; justify-items: center; gap: 22pt; color: ${MUTED}; }
  .backart .mark { width: 0.8in; }
  .backart .wordmark { font-family: "Plex Mono", monospace; font-size: 8.5pt;
                       letter-spacing: 0.22em; text-transform: uppercase; white-space: nowrap; }
  .cover { display: block; padding: 1.2in 1.1in; }
  .cover .mark { width: 0.6in; margin-bottom: 0.35in; }
  .cover h1 { font-size: 26pt; font-variation-settings: 'opsz' 26, 'wght' 600; margin-bottom: 6pt; }
  .cover .tag { font-style: italic; color: ${MUTED}; margin-bottom: 0.4in; }
  .cover ol { padding-left: 1.2em; line-height: 1.7; font-size: 12pt; }
  .cover .fine { margin-top: 0.5in; font-size: 9.5pt; color: ${MUTED}; line-height: 1.5; }
</style><body>
${cover}
${sheets.map((cells) => `<section class="page">${cells}</section>`).join("\n")}
<section class="page">${backFace.repeat(4)}</section>
</body>`;

const browser = await chromium.launch(
  // PW_CHANNEL=chrome runs against system Chrome when the pinned download is
  // unavailable; CI installs the pinned one and passes nothing.
  process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}
);
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

// A card whose text spills past its cell is silently clipped by overflow:
// hidden, and at four-to-a-page it is easy to miss on screen. Measured, on
// every cell, before the PDF is written.
const clipped = await page.evaluate(() =>
  [...document.querySelectorAll(".cell")]
    .map((cell, i) => ({ i, over: Math.round(cell.scrollHeight - cell.clientHeight) }))
    .filter((c) => c.over > 1)
);
if (clipped.length) {
  await browser.close();
  console.error(
    `\n${clipped.length} face(s) overflow their card and would print clipped:\n` +
      clipped.map((c) => `  face index ${c.i}  +${c.over}px`).join("\n") +
      `\n\nShorten the text, or drop a type size in scripts/print-and-play.js.\n`
  );
  process.exit(1);
}

await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true });
await browser.close();

// The stamp is what makes committing a generated binary honest: it records
// what this PDF was made from, and CI fails if the inputs move on without it.
const stamp = pnpStamp();
stamp.bytes = fs.statSync(pdfPath).size;
stamp.faces = faces.length;
fs.writeFileSync(STAMP_PATH, JSON.stringify(stamp, null, 2) + "\n");

console.log(
  `wrote public/print-and-play.pdf — ${faces.length} faces ` +
    `(${cards.length} prompts + ${RULES_CARDS.length} rules + title) on ${sheets.length} sheets ` +
    `+ cover + backs page (${(stamp.bytes / 1024).toFixed(0)} KB)`
);

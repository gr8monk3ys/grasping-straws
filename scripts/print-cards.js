/*
 * Print-file generator: renders every card in public/cards.json — plus the
 * back, a title card and an instructions card — as 300 DPI PNGs into print/
 * for MakePlayingCards.
 *
 *   npm run print              # renders print/*.png + a contact sheet
 *   GUIDES=1 npm run print     # overlays bleed/safe outlines for proofing
 *
 * The numbers below are MakePlayingCards' published tarot figures, not
 * estimates. From their upload FAQ (makeplayingcards.com/faq-photo.aspx):
 *
 *   tarot upload   897 x 1497 px at 300 DPI
 *   bleed          "36 pixels each side based on a 300DPI image" is cut off
 *   safe area      a further 36 px in, marked by their red dotted line
 *
 * 36 px is 0.12", NOT the 1/8" (0.125") their prose rounds it to. Building
 * to 0.125" yields 900x1500, which MPC accepts and silently rescales — every
 * card lands ~0.3% off register. SELF_CHECK below fails the run if the
 * computed size ever drifts from what they actually want.
 *
 * If you switch printers, replace all four numbers from THEIR template and
 * update SELF_CHECK to their stated upload size. Do not average two
 * printers' specs.
 */
const SPEC = {
  dpi: 300,
  cardWidthIn: 2.75, // tarot
  cardHeightIn: 4.75,
  bleedIn: 36 / 300, // 0.12" — MPC trims this off
  safeIn: 36 / 300, // 0.12" — keep all content inside this
};
const SELF_CHECK = { w: 897, h: 1497 }; // MPC's published tarot upload size

// MPC sells tarot decks in fixed tiers; an order cannot be an arbitrary
// count. Faces = prompts + title + instructions.
const MPC_TAROT_TIERS = [18, 36, 54, 72, 90, 108];

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, "..", "public");
const out = path.join(here, "..", "print", process.env.PROOF === "1" ? "proof" : "final");
fs.mkdirSync(out, { recursive: true });

const all = JSON.parse(fs.readFileSync(path.join(pub, "cards.json"), "utf8"));
const svg = fs.readFileSync(path.join(pub, "favicon.svg"), "utf8");
const b64 = (f) => fs.readFileSync(path.join(pub, "fonts", f)).toString("base64");
const fraunces = b64("Fraunces-latin.woff2");
const plex = b64("PlexMono-400-latin.woff2");

/* ---------- gates: nothing reaches a printer half-written ---------- */

const drafts = all.filter((c) => c.draft);
const cards = all.filter((c) => !c.draft);

// PROOF=1 renders the unwritten slots as stamped placeholders so the layout,
// type and trim can be checked before the writing is done. The output goes to
// print/proof/ and every placeholder is defaced, because the one failure mode
// that matters here is a proof being mistaken for the real thing at upload
// time. Ordering still requires the real run, which refuses below.
const PROOF = process.env.PROOF === "1";

if (drafts.length && !PROOF) {
  console.error(
    `\nRefusing to render: ${drafts.length} card${drafts.length === 1 ? " is" : "s are"} still a draft.\n` +
      drafts.map((c) => `  #${c.id} (${c.suit ?? "no suit"}) — ${c.note ?? "unwritten"}`).join("\n") +
      `\n\nWrite the text in public/cards.json and delete the "draft" and "note" keys.` +
      `\nA printed deck is permanent; a placeholder that reaches it costs a reprint.` +
      `\nTo check layout and trim in the meantime: PROOF=1 npm run print\n`
  );
  process.exit(1);
}

const printable = PROOF ? all : cards;
const faces = printable.length + 2; // + title + instructions
if (!MPC_TAROT_TIERS.includes(faces)) {
  const next = MPC_TAROT_TIERS.find((n) => n > faces);
  console.error(
    `\nRefusing to render: ${faces} faces (${printable.length} prompts + title + instructions).\n` +
      `MakePlayingCards prints tarot decks in tiers of ${MPC_TAROT_TIERS.join(", ")}.\n` +
      (next
        ? `Write ${next - faces} more prompt${next - faces === 1 ? "" : "s"} to reach ${next}.\n`
        : `That is past their largest tier.\n`)
  );
  process.exit(1);
}

const px = (inches) => Math.round(inches * SPEC.dpi);
const W = px(SPEC.cardWidthIn + 2 * SPEC.bleedIn);
const H = px(SPEC.cardHeightIn + 2 * SPEC.bleedIn);
const bleed = px(SPEC.bleedIn);
const inset = px(SPEC.bleedIn + SPEC.safeIn); // content stays inside this

if (W !== SELF_CHECK.w || H !== SELF_CHECK.h) {
  console.error(
    `\nSpec drift: this renders ${W}x${H}, the printer wants ${SELF_CHECK.w}x${SELF_CHECK.h}.\n` +
      `Fix SPEC (or SELF_CHECK, if you deliberately changed printers) before ordering.\n`
  );
  process.exit(1);
}

/* ---------- the printed object ---------- */

const CARD = "#fdfaf3"; // --paper, straight off the site
const INK = "#241e16";
const MUTED = "#6e6455";
const ACCENT = "#2c6e4f"; // the site's green, safely inside CMYK

// Fraunces' optical-size axis has to be driven by PHYSICAL size, not by the
// px number. 64px at 300 DPI is 15.4pt of actual card — a text setting. Left
// on `auto`, the browser reads 64 and picks a display cut, which thins the
// strokes exactly where the physical size needs them sturdy.
const pt = (pxSize) => (pxSize / SPEC.dpi) * 72;

// Set to match the SITE's proportion, not to a point size that sounds
// reasonable. The site sets the card face at roughly 12% of the card's width
// per em; 64px on this 753px content column is 8.5%, which renders as a
// tasteful-but-timid book setting rather than the object the site builds.
// 80px restores the proportion. The longest card (62 chars) still sets in
// three lines with room to spare.
const FACE_PX = 80;
const RULE_PX = 4; // 0.34mm — 3px is a 0.25mm hair that prints weak on cream

const guides = process.env.GUIDES
  ? `<div style="position:fixed; inset:${bleed}px; outline:2px solid red;"></div>
     <div style="position:fixed; inset:${inset}px; outline:2px dashed blue;"></div>`
  : "";

const shell = (body, extra = "") => `<!doctype html><style>
  @font-face { font-family: "Fraunces"; src: url(data:font/woff2;base64,${fraunces}) format("woff2"); }
  @font-face { font-family: "Plex Mono"; src: url(data:font/woff2;base64,${plex}) format("woff2"); }
  * { margin: 0; box-sizing: border-box; }
  html { color-scheme: light; }
  html, body { width: ${W}px; height: ${H}px; }
  body { background: ${CARD}; font-family: "Fraunces", serif; color: ${INK};
         font-optical-sizing: none; }
  svg { display: block; }
  .safe { position: absolute; inset: ${inset}px; display: grid; }
  .num { font-family: "Plex Mono", monospace; font-size: 30px;
         letter-spacing: 0.16em; color: ${MUTED}; }
  ${extra}
</style><body>${body}${guides}</body>`;

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

// favicon.svg hardcodes its ink and carries a prefers-color-scheme: dark
// branch that swaps it to #EAE3D4. The site never sees that — it renders the
// glyph through a CSS mask, so the colour comes from the page. Inlined into a
// print page the SVG's own rules win, which means (a) the mark ignores the
// colour we ask for and (b) a browser that happened to report dark mode would
// print a near-white mark on cream stock. Replacing BOTH hexes settles both:
// the media query still matches, and both branches now say the same thing.
const tint = (color) =>
  svg.replaceAll("#241E16", color).replaceAll("#EAE3D4", color);

// text-wrap: balance evens out line LENGTHS; it has no idea where a sentence
// ends. On a two-sentence card that reliably strands the second sentence's
// first word on the previous line ("...cannot see it. Build" / "what you
// said."). Setting each sentence as its own balanced block breaks at the
// meaning instead. Single-sentence cards are untouched.
const sentences = (text) => text.match(/[^.?!]+[.?!]*\s*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];

// Face: the prompt, optically centred, with the card's id in the corner.
// The id is not decoration — it is the same number as the /c/<id>/ share
// page, so a card someone is holding can be looked up or sent.
const face = (card) =>
  shell(
    `<div class="safe" style="grid-template-rows: auto 1fr auto;">
       <div class="num">${String(card.id).padStart(2, "0")}</div>
       <div style="display:grid; place-items:center;">
         ${
           card.draft
             ? `<div style="text-align:center; color:#b4382f;">
                  <div style="font-family:'Plex Mono',monospace; font-size:44px; letter-spacing:0.2em;
                              transform:rotate(-8deg); border:4px solid; padding:18px 26px;">UNWRITTEN</div>
                  <div style="font-size:34px; margin-top:44px; color:${MUTED}; font-style:italic;
                              line-height:1.4;">${esc(card.note ?? "")}</div>
                </div>`
             : `<div style="font-size:${FACE_PX}px; font-variation-settings:'opsz' ${pt(FACE_PX).toFixed(0)},'wght' 400;
                     line-height:1.32; text-align:center;">${sentences(card.text)
                       .map(
                         (s, i) =>
                           `<div style="text-wrap:balance;${i ? " margin-top:0.34em;" : ""}">${esc(s)}</div>`
                       )
                       .join("")}</div>`
         }
       </div>
       <div style="justify-self:center; width:120px; height:${RULE_PX}px; background:${ACCENT}; opacity:0.65;"></div>
     </div>`
  );

const back = shell(`<div class="safe" style="place-content:center; justify-items:center; gap:110px; color:${MUTED};">
  <div style="width:260px;">${tint(MUTED)}</div>
  <div style="font-family:'Plex Mono',monospace; font-size:34px; letter-spacing:0.24em;
              text-transform:uppercase; white-space:nowrap;">Grasping&nbsp;Straws?</div>
</div>`);

const title = shell(`<div class="safe" style="place-content:center; justify-items:center; gap:90px; text-align:center;">
  <div style="width:220px;">${tint(ACCENT)}</div>
  <div style="font-size:88px; font-variation-settings:'opsz' ${pt(88).toFixed(0)},'wght' 600;">Grasping Straws?</div>
  <div style="font-size:38px; font-style:italic; color:${MUTED};">an original deck of<br>lateral-thinking prompts</div>
</div>`);

// The instructions card earns its slot by saying only what a physical deck
// cannot show you: how it wants to be used, and where it also lives.
const instructions = shell(`<div class="safe" style="align-content:center; gap:44px;">
  <div class="num">HOW TO USE</div>
  <div style="font-size:40px; font-variation-settings:'opsz' ${pt(40).toFixed(0)},'wght' 400; line-height:1.5;">
    <p style="margin-bottom:32px;">Stuck? Shuffle. Draw one card. Read it once.</p>
    <p style="margin-bottom:32px;">Apply it to the thing in front of you, however
       literally you can bear. The prompt that seems wrong is usually the one
       doing the work.</p>
    <p>Deal through the deck before reshuffling — no card twice in a cycle.</p>
  </div>
  <div style="justify-self:start; width:120px; height:${RULE_PX}px; background:${ACCENT}; opacity:0.65;"></div>
  <div class="num" style="font-size:26px;">GRASPING-STRAWS.VERCEL.APP</div>
</div>`);

/* ---------- render ---------- */

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const written = [];

async function shoot(html, file) {
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, file) });
  written.push(file);
}

await shoot(back, "back.png");
await shoot(title, "face-00-title.png");
await shoot(instructions, "face-01-instructions.png");
for (const card of printable) {
  await shoot(face(card), `face-${String(card.id).padStart(2, "0")}.png`);
}

// A contact sheet is the only practical way to catch a bad line break, a
// widow, or a card that reads wrong next to its neighbours before committing
// to print. It has to be WRITTEN to disk and navigated to: a page built with
// setContent() has an opaque origin, and Chromium refuses every file:// image
// it references — which silently yields a sheet of broken-image icons.
const sheetCols = 9;
const thumb = 200;
const sheetHtml = `<!doctype html><style>
     body { margin:24px; background:#8d8577; display:grid; gap:14px 12px;
            grid-template-columns: repeat(${sheetCols}, ${thumb}px);
            font: 11px ui-monospace, monospace; color:#f2ede2; }
     figure { margin:0; }
     img { width:${thumb}px; display:block; box-shadow:0 2px 6px rgba(0,0,0,0.35); }
     figcaption { padding-top:5px; letter-spacing:0.06em; }
   </style><body>${written
     .map((f) => `<figure><img src="./${f}"><figcaption>${f.replace(/\.png$/, "")}</figcaption></figure>`)
     .join("")}</body>`;
fs.writeFileSync(path.join(out, "contact-sheet.html"), sheetHtml);
await page.setViewportSize({ width: sheetCols * thumb + 12 * (sheetCols - 1) + 48, height: 900 });
await page.goto("file://" + path.join(out, "contact-sheet.html"), { waitUntil: "load" });
await page.evaluate(async () => {
  await Promise.all(
    [...document.images].map((i) => (i.complete ? null : new Promise((r) => (i.onload = i.onerror = r))))
  );
});
const broken = await page.evaluate(
  () => [...document.images].filter((i) => !i.naturalWidth).length
);
if (broken) throw new Error(`contact sheet: ${broken} thumbnails failed to load`);
await page.screenshot({ path: path.join(out, "contact-sheet.png"), fullPage: true });
await browser.close();

const dir = path.relative(path.join(here, ".."), out);
console.log(
  `\nwrote ${written.length + 1} files to ${dir}/\n` +
    `  back.png          the shared back\n` +
    `  face-*.png        ${faces} faces (title, instructions, ${printable.length} prompts)\n` +
    `  contact-sheet.png proof this before uploading anything\n\n` +
    `${W}x${H}px at ${SPEC.dpi} DPI — MakePlayingCards' tarot upload size exactly.\n` +
    (PROOF
      ? `\nPROOF RUN — ${drafts.length} face(s) are stamped UNWRITTEN. Do not upload this\n` +
        `directory. Write the missing cards, then run without PROOF=1.\n`
      : `Ordering steps: docs/printing.md\n`)
);

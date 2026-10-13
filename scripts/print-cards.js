/*
 * Print-file generator: renders every card of one edition — plus its back,
 * a title card and an instructions card — as 300 DPI PNGs into print/ for
 * MakePlayingCards. The editions are declared in src/deck/editions.ts.
 *
 *   npm run print                  # the Paper edition -> print/final/paper/
 *   EDITION=night npm run print    # the Night edition -> print/final/night/
 *   GUIDES=1 npm run print         # overlays bleed/safe outlines for proofing
 *
 * The size of the card, the upload MPC wants and the deck sizes they sell
 * are in scripts/card-spec.js, taken from MPC's own published figures.
 */
import { chromium } from "playwright";
import { draftSlots, liveCards } from "../src/deck/cards.ts";
import { edition } from "../src/deck/editions.ts";
import { CARD as SPEC, DECK_SIZES, UPLOAD } from "./card-spec.js";
import { mark as tint } from "./mark.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const pub = path.join(root, "public");
const ed = edition(process.env.EDITION);
const out = path.join(root, "print", process.env.PROOF === "1" ? "proof" : "final", ed.key);
fs.mkdirSync(out, { recursive: true });

const all = JSON.parse(fs.readFileSync(path.join(root, ed.file), "utf8"));
const b64 = (f) => fs.readFileSync(path.join(pub, "fonts", f)).toString("base64");
const fraunces = b64("Fraunces-latin.woff2");
const plex = b64("PlexMono-400-latin.woff2");

/* ---------- gates: nothing reaches a printer half-written ---------- */

const drafts = draftSlots(all);
const cards = liveCards(all);

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
      `\n\nWrite the text in ${ed.file} and delete the "draft" and "note" keys.` +
      `\nA printed deck is permanent; a placeholder that reaches it costs a reprint.` +
      `\nTo check layout and trim in the meantime: PROOF=1 npm run print\n`
  );
  process.exit(1);
}

const printable = PROOF ? all : cards;
const faces = printable.length + 2; // + title + instructions
// MPC sells decks of "up to" a fixed set of counts. A deck that fits none of
// them cannot be ordered; one that fits is priced at the smallest it fits in.
const deckSize = DECK_SIZES.find((n) => n >= faces);
if (!deckSize) {
  console.error(
    `\nRefusing to render: ${faces} faces (${printable.length} prompts + title + instructions).\n` +
      `MakePlayingCards' largest deck of this card is ${DECK_SIZES.at(-1)}.\n`
  );
  process.exit(1);
}

const px = (inches) => Math.round(inches * SPEC.dpi);
const W = px(SPEC.widthIn + 2 * SPEC.bleedIn);
const H = px(SPEC.heightIn + 2 * SPEC.bleedIn);
const bleed = px(SPEC.bleedIn);
const inset = px(SPEC.bleedIn + SPEC.safeIn); // content stays inside this

if (W !== UPLOAD.w || H !== UPLOAD.h) {
  console.error(
    `\nSpec drift: this renders ${W}x${H}, the printer wants ${UPLOAD.w}x${UPLOAD.h}.\n` +
      `Fix scripts/card-spec.js before ordering.\n`
  );
  process.exit(1);
}

/* ---------- the printed object ---------- */

// The edition's own stock and ink, from the one palette the site also uses.
const { card: CARD, ink: INK, muted: MUTED, accent: ACCENT, moss: RULE } = ed.palette;

// Pale type on dark stock prints lighter than it is drawn: ink spreads into
// the letters from every side. Night is set heavier so both editions land at
// the same apparent weight in the hand.
const FACE_WGHT = ed.reversed ? 440 : 400;

// Fraunces' optical-size axis has to be driven by PHYSICAL size, not by the
// px number. 64px at 300 DPI is 15.4pt of actual card — a text setting. Left
// on `auto`, the browser reads 64 and picks a display cut, which thins the
// strokes exactly where the physical size needs them sturdy.
const pt = (pxSize) => (pxSize / SPEC.dpi) * 72;

// Every size on a face is a proportion of the card's WIDTH, written as the
// pixel value it had on the 825 px wide card these layouts were drawn on. `u`
// scales it to the card being printed, so a change of card size keeps the
// face's proportions instead of its pixel counts.
const U = px(SPEC.widthIn) / 825;
const u = (n) => Math.round(n * U);

// Set to match the SITE's proportion, not to a point size that sounds
// reasonable: the prompt is 9.7% of the card's width per em. Smaller reads as
// a tasteful-but-timid book setting rather than the object the site builds.
// The longest card (62 characters) sets in five lines with room to spare.
const FACE_PX = u(80);
const RULE_PX = 4; // 0.34mm: 3px is a 0.25mm hair that prints weak on pale stock

const guides = process.env.GUIDES
  ? `<div style="position:fixed; inset:${bleed}px; outline:2px solid red;"></div>
     <div style="position:fixed; inset:${inset}px; outline:2px dashed blue;"></div>`
  : "";

const shell = (body, extra = "") => `<!doctype html><style>
  @font-face { font-family: "Fraunces"; src: url(data:font/woff2;base64,${fraunces}) format("woff2"); }
  @font-face { font-family: "Plex Mono"; src: url(data:font/woff2;base64,${plex}) format("woff2"); }
  * { margin: 0; box-sizing: border-box; }
  html { color-scheme: ${ed.reversed ? "dark" : "light"}; }
  html, body { width: ${W}px; height: ${H}px; }
  body { background: ${CARD}; font-family: "Fraunces", serif; color: ${INK};
         font-optical-sizing: none; }
  svg { display: block; }
  .safe { position: absolute; inset: ${inset}px; display: grid; }
  .num { font-family: "Plex Mono", monospace; font-size: ${u(30)}px;
         letter-spacing: 0.16em; color: ${MUTED}; }
  ${extra}
</style><body>${body}${guides}</body>`;

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

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
                  <div style="font-family:'Plex Mono',monospace; font-size:${u(44)}px; letter-spacing:0.2em;
                              transform:rotate(-8deg); border:4px solid; padding:${u(18)}px ${u(26)}px;">UNWRITTEN</div>
                  <div style="font-size:${u(34)}px; margin-top:${u(44)}px; color:${MUTED}; font-style:italic;
                              line-height:1.4;">${esc(card.note ?? "")}</div>
                </div>`
             : `<div style="font-size:${FACE_PX}px; font-variation-settings:'opsz' ${pt(FACE_PX).toFixed(0)},'wght' ${FACE_WGHT};
                     line-height:1.32; text-align:center;">${sentences(card.text)
                       .map(
                         (s, i) =>
                           `<div style="text-wrap:balance;${i ? " margin-top:0.34em;" : ""}">${esc(s)}</div>`
                       )
                       .join("")}</div>`
         }
       </div>
       <div style="justify-self:center; width:${u(120)}px; height:${RULE_PX}px; background:${RULE};"></div>
     </div>`
  );

// The two editions have different backs on purpose. They are not meant to be
// shuffled together, and a stray card should say which box it belongs to
// before it is turned over.
const back = shell(`<div class="safe" style="place-content:center; justify-items:center; gap:${u(110)}px; color:${MUTED};">
  <div style="width:${u(260)}px;">${tint(ACCENT)}</div>
  <div style="font-family:'Plex Mono',monospace; font-size:${u(34)}px; letter-spacing:0.24em;
              text-transform:uppercase; white-space:nowrap;">Grasping&nbsp;Straws?</div>
</div>`);

const title = shell(`<div class="safe" style="place-content:center; justify-items:center; gap:${u(90)}px; text-align:center;">
  <div style="width:${u(220)}px;">${tint(ACCENT)}</div>
  <div style="font-size:${u(84)}px; white-space:nowrap; font-variation-settings:'opsz' ${pt(u(84)).toFixed(0)},'wght' 600;">Grasping Straws?</div>
  <div style="font-size:${u(38)}px; font-style:italic; color:${MUTED};">${ed.subtitle.map(esc).join("<br>")}</div>
  <div class="num" style="font-size:${u(28)}px; text-transform:uppercase;">${esc(ed.name)}</div>
</div>`);

// The instructions card earns its slot by saying only what a physical deck
// cannot show you: how it wants to be used, and where it also lives.
const instructions = shell(`<div class="safe" style="align-content:center; gap:${u(44)}px;">
  <div class="num">HOW TO USE</div>
  <div style="font-size:${u(40)}px; font-variation-settings:'opsz' ${pt(u(40)).toFixed(0)},'wght' ${FACE_WGHT}; line-height:1.5;">
    ${ed.instructions
      .map((p, i, a) => `<p${i < a.length - 1 ? ` style="margin-bottom:${u(32)}px;"` : ""}>${esc(p)}</p>`)
      .join("\n    ")}
  </div>
  <div style="justify-self:start; width:${u(120)}px; height:${RULE_PX}px; background:${RULE};"></div>
  <div class="num" style="font-size:${u(28)}px;">STRAWS.LSCATURCHIO.XYZ</div>
</div>`);

/* ---------- render ---------- */

// PW_CHANNEL=chrome renders with the installed Chrome instead of Playwright's
// own build. Good enough to look at; order from the pinned build, because a
// different Chrome can break a line somewhere else.
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const written = [];

// Anything crossing the safe line can be trimmed off by the printer, and it
// is not reliably visible by eye on a downscaled proof — the guide outline
// and a full-width line of type blur into each other. Measured instead, on
// every face, with a hard stop. This is the check that a reprint costs.
const overflows = [];
const dashes = [];

async function shoot(html, file) {
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  const bad = await page.evaluate((safe) => {
    const out = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const r = document.createRange();
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.textContent.trim()) continue;
      r.selectNodeContents(n);
      for (const box of r.getClientRects()) {
        if (box.width === 0) continue;
        const over = Math.max(
          safe - box.left,
          box.right - (window.innerWidth - safe),
          safe - box.top,
          box.bottom - (window.innerHeight - safe)
        );
        // Sub-pixel layout rounding is not an overflow; 1px at 300 DPI is
        // 1/300 inch and well inside the printer's own tolerance.
        if (over > 1) out.push({ text: n.textContent.trim().slice(0, 34), over: Math.round(over) });
      }
    }
    return out;
  }, inset);
  if (bad.length) overflows.push({ file, bad });

  // House style: nothing printed carries an em dash. The validator checks
  // card text; this checks the face as rendered, which also covers the title
  // and instructions cards.
  if ((await page.evaluate(() => document.body.innerText)).includes("—")) dashes.push(file);

  await page.screenshot({ path: path.join(out, file) });
  written.push(file);
}

// Two numbers, and they are not the same number. The PREFIX is the position
// in the upload, so a plain alphabetical sort is the deck order; the suffix
// is the card's id, which is what is printed on the card and what /c/<id>/
// resolves. Numbering the instructions card "01" alongside prompt #1 left
// two different files both claiming 01, ordered correctly only by the
// accident that "-" sorts before "." in ASCII.
let seq = 0;
const seqName = (label) => `face-${String(++seq).padStart(3, "0")}-${label}.png`;

await shoot(back, "back.png");
await shoot(title, seqName("title"));
await shoot(instructions, seqName("instructions"));
for (const card of printable) {
  await shoot(face(card), seqName(`card-${String(card.id).padStart(2, "0")}`));
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

if (overflows.length) {
  console.error(
    `\n${overflows.length} face(s) put text outside the safe area — the printer can trim this off:\n` +
      overflows
        .map((o) => `  ${o.file}\n` + o.bad.map((b) => `      +${b.over}px  "${b.text}"`).join("\n"))
        .join("\n") +
      `\n\nThe files were still written so you can look at them, but do NOT upload them.` +
      `\nGUIDES=1 draws the bleed and safe outlines on the cards.\n`
  );
  process.exitCode = 1;
}

if (dashes.length) {
  console.error(
    `\n${dashes.length} face(s) carry an em dash, and the deck uses none:\n` +
      dashes.map((f) => `  ${f}`).join("\n") +
      `\n\nReword with a colon, a comma or a second sentence. Do NOT upload these.\n`
  );
  process.exitCode = 1;
}

const dir = path.relative(path.join(here, ".."), out);
console.log(
  `\n${ed.name}: wrote ${written.length + 1} files to ${dir.replaceAll("\\", "/")}/\n` +
    `  back.png          the shared back\n` +
    `  face-*.png        ${faces} faces (title, instructions, ${printable.length} prompts)\n` +
    `  contact-sheet.png proof this before uploading anything\n\n` +
    `${W}x${H}px at ${SPEC.dpi} DPI — MakePlayingCards' upload size for this card exactly.\n` +
    `Order it as a deck of "up to ${deckSize} cards"` +
    (deckSize > faces ? `; ${deckSize - faces} slot${deckSize - faces === 1 ? "" : "s"} left unused.\n` : `.\n`) +
    (PROOF
      ? `\nPROOF RUN — ${drafts.length} face(s) are stamped UNWRITTEN. Do not upload this\n` +
        `directory. Write the missing cards, then run without PROOF=1.\n`
      : `Ordering steps: docs/printing.md\n`)
);

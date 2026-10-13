/*
 * Box-file generator: lays one edition's box artwork onto MakePlayingCards'
 * rigid-box dieline and writes the files to upload.
 *
 *   npm run print:box                  # Paper -> print/final/paper/
 *   EDITION=night npm run print:box    # Night -> print/final/night/
 *
 * What is printed on each panel lives in scripts/box-art.js; where each
 * panel sits lives in scripts/box-spec.js, read out of MPC's template. This
 * script only puts one on the other.
 *
 * It writes three files:
 *
 *   box.pdf        the artwork alone, on a page the exact size of MPC's
 *                  template with nothing moved. This is the upload.
 *   box.png        the same page at 300 DPI, for uploaders that want an image
 *   box-proof.png  the artwork with the folds and the cut line drawn over
 *                  it. For checking only: never upload this one.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { edition } from "../src/deck/editions.ts";
import { FONT_CSS, panels } from "./box-art.js";
import { BASE, CUT, LID, PAGE, PT_PER_MM, SPLIT_X } from "./box-spec.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ed = edition(process.env.EDITION);
const out = path.join(root, "print", "final", ed.key);
fs.mkdirSync(out, { recursive: true });

// CSS pixels are 1/96 inch and PDF points 1/72, so the page is built at 4/3
// px per point. Chromium then prints it at physical size.
const K = 96 / 72;
const px = (pt) => pt * K;
const mm = (v) => px(v * PT_PER_MM);
const DPI = 300;
const SAFE_MM = 3; // keep lettering this far inside a fold: boards wrap by hand

const art = panels(ed, mm);

// A panel on the page. `turn` is how far the artwork is rotated so that its
// top edge meets the fold it hangs from: a wall's "up" is always toward the
// centre panel, because that is the edge at the top once the box is folded.
function place(r, turn, html, name) {
  const w = px(r.x1 - r.x0), h = px(r.y1 - r.y0);
  const sideways = turn === 90 || turn === -90;
  const aw = sideways ? h : w, ah = sideways ? w : h;
  return `<div data-panel="${name}" style="position:absolute; left:${px(r.x0)}px; bottom:${px(r.y0)}px;
      width:${w}px; height:${h}px;">
    <div style="position:absolute; left:50%; top:50%; width:${aw}px; height:${ah}px;
      margin:${-ah / 2}px 0 0 ${-aw / 2}px; transform:rotate(${turn}deg);">${html}</div>
  </div>`;
}

const poly = (pts) => pts.map(([x, y]) => `${px(x)},${px(PAGE.h - y)}`).join(" ");
const box = (r) =>
  `<rect x="${px(r.x0)}" y="${px(PAGE.h - r.y1)}" width="${px(r.x1 - r.x0)}" height="${px(r.y1 - r.y0)}"/>`;
const dieline = `<svg style="position:absolute; left:0; bottom:0; width:${px(PAGE.w)}px; height:${px(PAGE.h)}px;" fill="none" stroke-width="1">
  <g stroke="#00a0e0">${[...Object.values(LID), ...Object.values(BASE)].map(box).join("")}</g>
  <g stroke="#e0202a"><polygon points="${poly(CUT.lid)}"/><polygon points="${poly(CUT.base)}"/></g>
</svg>`;

const page = (proof) => `<!doctype html><meta charset="utf-8"><style>${FONT_CSS}
  @page { size: ${PAGE.w}pt ${PAGE.h}pt; margin: 0; }
  * { margin: 0; box-sizing: border-box; }
  /* The two grounds are painted on the canvas itself, so they run past every
     edge of the page however its fractional size is rounded: lid colour left
     of the line where the nets meet, base colour right of it. */
  html { background: linear-gradient(90deg, ${ed.box.lid} ${px(SPLIT_X)}px, ${ed.box.base} ${px(SPLIT_X)}px); }
  /* Everything is placed from the page's bottom-left corner, which is the
     template's own origin. Chromium rounds a PDF page to whole 1/300 inch
     and can come out a hair taller than asked; anchored this way the extra
     lands as spare bleed along the top and nothing moves off the dieline. */
  html, body { width: ${px(PAGE.w)}px; height: 100%; overflow: hidden; }
  body { position: relative; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  svg { display: block; }
</style>
${place(LID.cover, 0, art.lidTop, "lid top")}
${place(LID.bottom, 0, art.lidShort, "lid short side")}
${place(LID.top, 180, art.lidShort, "lid short side")}
${place(LID.left, 90, art.lidLong, "lid long side")}
${place(LID.right, -90, art.lidLong, "lid long side")}
${place(BASE.cover, 0, art.baseBottom, "base underside")}
${proof ? dieline : ""}`;

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const tab = await browser.newPage({
  viewport: { width: Math.ceil(px(PAGE.w)), height: Math.ceil(px(PAGE.h)) },
  deviceScaleFactor: DPI / 96,
});

async function load(html) {
  await tab.setContent(html, { waitUntil: "load" });
  await tab.evaluate(() => document.fonts.ready);
}

await load(page(false));

// Lettering that crosses a fold lands on the wrong face of the box. Measured
// per panel, with a margin, and a hard stop: the same check the cards get.
const overflows = await tab.evaluate((safe) => {
  const bad = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const holder = n.parentElement?.closest("[data-panel]");
    if (!n.textContent.trim() || !holder) continue;
    const p = holder.getBoundingClientRect();
    range.selectNodeContents(n);
    for (const b of range.getClientRects()) {
      if (!b.width || !b.height) continue;
      const over = Math.max(p.left + safe - b.left, b.right - (p.right - safe), p.top + safe - b.top, b.bottom - (p.bottom - safe));
      if (over > 0.5) {
        bad.push({ panel: holder.dataset.panel, text: n.textContent.trim().slice(0, 34), over: over.toFixed(1) });
        break;
      }
    }
  }
  return bad;
}, mm(SAFE_MM));

await tab.pdf({
  path: path.join(out, "box.pdf"),
  preferCSSPageSize: true,
  printBackground: true,
  pageRanges: "1",
});
await tab.screenshot({ path: path.join(out, "box.png") });
await load(page(true));
await tab.screenshot({ path: path.join(out, "box-proof.png") });
await browser.close();

// Read the page size back out of the file that was actually written. A page
// that is not the template's size means the artwork is not where MPC's
// dieline expects it, which no proof on screen would show.
const pdf = fs.readFileSync(path.join(out, "box.pdf"), "latin1");
const media = pdf.match(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/);
const pages = (pdf.match(/\/Type\s*\/Page\b/g) ?? []).length;
const got = media ? { w: media[3] - media[1], h: media[4] - media[2] } : null;
if (!got || pages !== 1 || Math.abs(got.w - PAGE.w) > 0.3 || got.h < PAGE.h - 0.3 || got.h > PAGE.h + 0.8) {
  console.error(
    `\nbox.pdf is ${got ? `${got.w.toFixed(2)} x ${got.h.toFixed(2)} pt on ${pages} page(s)` : "unreadable"}; ` +
      `MPC's template is one page of ${PAGE.w} x ${PAGE.h} pt. Do NOT upload it.\n`
  );
  process.exitCode = 1;
}

if (overflows.length) {
  console.error(
    `\n${overflows.length} piece(s) of lettering sit within ${SAFE_MM} mm of a fold or past it:\n` +
      overflows.map((o) => `  ${o.panel}: +${o.over}px  "${o.text}"`).join("\n") +
      `\n\nThe files were still written so you can look at them, but do NOT upload them.\n`
  );
  process.exitCode = 1;
}

const dir = path.relative(root, out).replaceAll("\\", "/");
console.log(
  `\n${ed.name}: wrote the box to ${dir}/\n` +
    `  box.pdf        upload this: one page, ${got ? `${got.w.toFixed(2)} x ${got.h.toFixed(2)}` : "?"} pt against the template's ` +
    `${PAGE.w} x ${PAGE.h}, artwork placed from the template's origin\n` +
    `  box.png        the same page at ${DPI} DPI\n` +
    `  box-proof.png  folds in blue, cut line in red. Check it; never upload it\n`
);

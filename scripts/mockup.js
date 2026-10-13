/*
 * Pictures of the physical object, built from the real print files.
 *
 *   npm run mockup     # -> print/mockup/
 *
 * Two views. `cards.png` is straight on: trimmed, corner-rounded cards at
 * true proportion, which is how to judge type and margins. `desk-*.png` is
 * the box and deck on a table, which is how to judge the object.
 *
 * These are previews, not print files, and they are drawn, not photographed:
 * colour on card stock will be flatter than on a screen, and the corner
 * radius and board thickness are estimates, not the printer's figures.
 * Run `npm run print` for each edition first; this reads print/final/.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EDITIONS } from "../src/deck/editions.ts";
import { FONT_CSS, panels } from "./box-art.js";
import { BOX } from "./box-spec.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "print", "mockup");
fs.mkdirSync(out, { recursive: true });

const S = 4; // px per mm
const mm = (v) => v * S;

// Card: MakePlayingCards' tarot trim. Box: the lid and base as their dieline
// gives them (scripts/box-spec.js). The lid is shallower than the base, so a
// closed box shows a band of the base below it.
const CARD = { w: 69.85, h: 120.65, corner: 4.5, upload: { w: 897, h: 1497, bleed: 36 } };
const { lid: LID, base: BASE } = BOX;
const WALL = 1.6;
const STACK_MM = 18.5; // 54 cards

const files = (ed) => {
  const dir = path.join(root, "print", "final", ed.key);
  if (!fs.existsSync(dir)) {
    console.error(`No print files for the ${ed.name}. Run: EDITION=${ed.key} npm run print`);
    process.exit(1);
  }
  const all = fs.readdirSync(dir);
  const rel = (f) => `../final/${ed.key}/${f}`;
  const card = (id) => rel(all.find((f) => f.endsWith(`-card-${String(id).padStart(2, "0")}.png`)));
  return {
    back: rel("back.png"),
    title: rel(all.find((f) => f.includes("-title"))),
    instructions: rel(all.find((f) => f.includes("-instructions"))),
    card,
  };
};

// A print file with its bleed trimmed off and its corners cut, at S px/mm.
const cardFace = (src, style = "") => {
  const { w, h, bleed } = CARD.upload;
  const k = mm(CARD.w) / (w - 2 * bleed);
  return `<div class="card" style="width:${mm(CARD.w)}px; height:${mm(CARD.h)}px; border-radius:${mm(CARD.corner)}px;
    background:url('${src}') ${-bleed * k}px ${-bleed * k}px / ${w * k}px ${h * k}px; ${style}"></div>`;
};

/* ---------- a box made of planes ---------- */

// A cuboid standing on the table at (x, y), turned `rot` degrees. `top` and
// the four sides are HTML; sides are w x h (south, north) or l x h (east,
// west) panels, drawn upright.
function cuboid({ x, y, rot = 0, w, l, h, top, south = "", north = "", east = "", west = "", open = false }) {
  const W = mm(w), L = mm(l), H = mm(h);
  const side = (css, inner, shade) =>
    `<div class="face" style="${css}">${inner}<i style="background:rgb(0 0 0 / ${shade});"></i></div>`;
  // The long sides carry l x h artwork; it is laid along the wall by turning
  // an l-wide panel a quarter turn inside the h-wide face.
  const along = (inner, flip) =>
    `<div style="position:absolute; left:0; top:0; width:${L}px; height:${H}px; transform-origin:0 0;
       transform:${flip ? `translate(${H}px, 0) rotate(90deg)` : `translate(0, ${L}px) rotate(-90deg)`};">${inner}</div>`;
  return `<div class="obj" style="transform:translate3d(${mm(x)}px, ${mm(y)}px, 0) rotateZ(${rot}deg); width:${W}px; height:${L}px;">
    <div class="shadow" style="inset:${mm(-2)}px; transform:translate3d(${mm(5)}px, ${mm(7)}px, 0);"></div>
    ${side(`left:0; top:${L - H}px; width:${W}px; height:${H}px; transform-origin:50% 100%; transform:rotateX(-90deg);`, south, 0.16)}
    ${side(`left:0; top:0; width:${W}px; height:${H}px; transform-origin:50% 0; transform:rotateX(90deg);`, north, 0.3)}
    ${side(`left:${W - H}px; top:0; width:${H}px; height:${L}px; transform-origin:100% 50%; transform:rotateY(90deg);`, along(east, false), 0.07)}
    ${side(`left:0; top:0; width:${H}px; height:${L}px; transform-origin:0 50%; transform:rotateY(-90deg);`, along(west, true), 0.26)}
    ${open ? "" : `<div class="face" style="left:0; top:0; width:${W}px; height:${L}px; transform:translateZ(${H}px);">${top}</div>`}
    ${open ? top : ""}
  </div>`;
}

const flat = (inner, x, y, rot, z = 0.4) =>
  `<div class="obj" style="transform:translate3d(${mm(x)}px, ${mm(y)}px, ${mm(z)}px) rotateZ(${rot}deg);">${inner}</div>`;

// One edition laid out on the table: the lid, the open base with the deck
// in it, three cards dealt face up and one face down.
function spread(ed, ox, oy) {
  const f = files(ed);
  const p = panels(ed, mm);
  const ids = ed.key === "paper" ? [1, 16, 39] : [122, 144, 113];
  const lining = "#efede8"; // the base is lined with plain board
  const iw = mm(BASE.w - 2 * WALL), il = mm(BASE.l - 2 * WALL), wall = mm(WALL);

  // Inside the open base: a lined well, the stack, and the top card.
  const well = `
    <div class="face" style="left:0; top:0; width:${mm(BASE.w)}px; height:${mm(BASE.l)}px; transform:translateZ(${mm(BASE.h)}px);
         box-sizing:border-box; border:${wall}px solid ${ed.box.base}; box-shadow:inset 0 0 0 1px rgb(0 0 0 / 0.12);"></div>
    <div class="face" style="left:${wall}px; top:${wall}px; width:${iw}px; height:${mm(BASE.h - STACK_MM)}px;
         transform-origin:50% 0; transform:translateZ(${mm(BASE.h)}px) rotateX(-90deg); background:${lining};">
         <i style="background:rgb(0 0 0 / 0.2);"></i></div>
    <div class="face" style="left:${wall}px; top:${wall}px; width:${mm(BASE.h - STACK_MM)}px; height:${il}px;
         transform-origin:0 50%; transform:translateZ(${mm(BASE.h)}px) rotateY(90deg); background:${lining};">
         <i style="background:rgb(0 0 0 / 0.1);"></i></div>
    <div class="face" style="left:${wall}px; top:${wall}px; width:${iw}px; height:${il}px; transform:translateZ(${mm(STACK_MM)}px);
         background:${lining}; display:grid; place-items:center;">
         ${cardFace(f.card(ids[0]), "box-shadow:0 0 0 1px rgb(0 0 0 / 0.1);")}</div>`;

  return [
    cuboid({ x: ox, y: oy, rot: -7, ...LID, top: p.lidTop, south: p.lidShort, north: p.lidShort, east: p.lidLong, west: p.lidLong }),
    cuboid({ x: ox + 98, y: oy + 12, rot: 5, ...BASE, top: well, open: true,
             south: p.baseSide, north: p.baseSide, east: p.baseSide, west: p.baseSide }),
    flat(cardFace(f.card(ids[1])), ox - 14, oy + 152, -9, 0.3),
    flat(cardFace(f.card(ids[2])), ox + 64, oy + 146, 2, 0.6),
    flat(cardFace(f.back), ox + 142, oy + 152, 12, 0.9),
  ].join("\n");
}

const CSS = `${FONT_CSS}
  * { margin:0; box-sizing:border-box; }
  html, body { height:100%; }
  body { background:#b9b4ab; overflow:hidden; }
  svg { display:block; }
  .card { background-repeat:no-repeat; box-shadow:0 1px 2px rgb(0 0 0 / 0.22), 0 10px 22px -8px rgb(0 0 0 / 0.38); }
  .stage { position:absolute; inset:0; perspective:5200px; perspective-origin:50% 0%;
           background:radial-gradient(120% 90% at 45% 30%, #c9c4bb 0%, #aaa59c 70%, #96918a 100%); }
  .plane { position:absolute; left:50%; top:50%; width:0; height:0; transform-style:preserve-3d; }
  .obj, .face { position:absolute; transform-style:preserve-3d; }
  .obj { left:0; top:0; }
  .face { overflow:hidden; }
  .face > i { position:absolute; inset:0; pointer-events:none; }
  .shadow { position:absolute; background:rgb(0 0 0 / 0.34); filter:blur(${mm(5)}px); border-radius:${mm(4)}px; }`;

const desk = (body, tilt) => `<!doctype html><meta charset="utf-8"><style>${CSS}</style>
  <div class="stage"><div class="plane" style="transform:${tilt};">${body}</div></div>`;

// Straight on: back, title, instructions and three cards per edition.
const sheet = () => {
  const row = (ed) => {
    const f = files(ed);
    const ids = ed.key === "paper" ? [1, 16, 39] : [122, 144, 113];
    return [f.back, f.title, f.instructions, ...ids.map(f.card)].map((src) => cardFace(src)).join("");
  };
  return `<!doctype html><meta charset="utf-8"><style>${CSS}
    body { background:#b9b4ab; overflow:visible; }
    .row { display:flex; gap:${mm(9)}px; padding:${mm(12)}px ${mm(14)}px ${mm(4)}px; }
    .row:last-child { padding-bottom:${mm(14)}px; }
  </style><div class="row">${row(EDITIONS.paper)}</div><div class="row">${row(EDITIONS.night)}</div>`;
};

/* ---------- render ---------- */

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const page = await browser.newPage({ deviceScaleFactor: 2 });

async function shoot(name, html, viewport, fullPage = false) {
  const file = path.join(out, `${name}.html`);
  fs.writeFileSync(file, html);
  await page.setViewportSize(viewport);
  await page.goto("file://" + file, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage });
  fs.rmSync(file);
  console.log(`  ${name}.png`);
}

const tilt = "rotateX(54deg) rotateZ(-11deg)";
console.log(`\nwrote to print/mockup/`);
await shoot("cards", sheet(), { width: Math.round(mm(6 * CARD.w + 5 * 9 + 28)), height: 800 }, true);
await shoot("desk-paper", desk(spread(EDITIONS.paper, -118, -150), tilt), { width: 1500, height: 1050 });
await shoot("desk-night", desk(spread(EDITIONS.night, -118, -150), tilt), { width: 1500, height: 1050 });
await shoot(
  "desk-both",
  desk(spread(EDITIONS.paper, -250, -165) + spread(EDITIONS.night, 40, -165), tilt),
  { width: 2300, height: 1200 }
);
await browser.close();

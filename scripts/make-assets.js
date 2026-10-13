/*
 * Regenerates the raster brand assets in public/ from the single vector
 * source (public/favicon.svg) and the site palette (src/deck/palette.ts):
 *
 *   public/og.png               1200x630 link-preview image
 *   public/icon-192.png         PWA icon
 *   public/icon-512.png         PWA icon (maskable-safe: mark inside 80%)
 *   public/apple-touch-icon.png 180x180
 *
 * Run after changing the glyph or the palette: npm run assets
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PAPER } from "../src/deck/palette.ts";
import { mark } from "./mark.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, "..", "public");

// These are link previews and home-screen icons: they are always Paper,
// whatever theme the visitor's device is in.
const { ground: BG, card: CARD, ink: INK, muted: MUTED, hairline: LINE } = PAPER;
// The card's shadow is its ink, thinned (global.css does the same by hand).
const INK_RGB = [1, 3, 5].map((i) => parseInt(INK.slice(i, i + 2), 16)).join(" ");

// The mark in the palette's ink. favicon.svg colours itself, and inlined
// into a page its own rules win over any colour set here; mark() writes the
// colour onto the shapes instead (see scripts/mark.js).
const svg = mark(INK);
const font = fs.readFileSync(path.join(pub, "fonts", "Fraunces-latin.woff2")).toString("base64");
// The wordmark on a card BACK is Plex Mono everywhere else — the masthead
// and the printed deck. The OG image is the same object and must not be the
// one place it renders in a serif.
const mono = fs.readFileSync(path.join(pub, "fonts", "PlexMono-500-latin.woff2")).toString("base64");

const baseCss = `
  @font-face {
    font-family: "Fraunces";
    src: url(data:font/woff2;base64,${font}) format("woff2");
  }
  @font-face {
    font-family: "Plex Mono";
    src: url(data:font/woff2;base64,${mono}) format("woff2");
  }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; }
  body { background: ${BG}; display: grid; place-items: center;
         font-family: "Fraunces", serif; color: ${INK}; }
  svg { display: block; }
`;

// The og image is the product shot: the face-down card on the paper ground.
const ogHtml = `<!doctype html><style>${baseCss}
  .card { width: 336px; height: 470px; background: ${CARD};
          border: 2px solid ${LINE}; border-radius: 20px;
          box-shadow: 0 2px 4px rgb(${INK_RGB} / 0.08), 0 28px 72px -28px rgb(${INK_RGB} / 0.28);
          display: grid; place-items: center; }
  .mark { display: grid; justify-items: center; gap: 34px; color: ${MUTED}; }
  .mark svg { width: 120px; height: 120px; }
  .wordmark { font-family: "Plex Mono", monospace; font-size: 19px; letter-spacing: 0.24em; text-transform: uppercase; }
</style><body>
  <div class="card"><div class="mark">${svg}<div class="wordmark">Grasping&nbsp;Straws?</div></div></div>
</body>`;

// Icons: the mark alone on the paper ground, sized for the maskable safe
// zone (inner 80% of the canvas).
const iconHtml = (size) => `<!doctype html><style>${baseCss}
  svg { width: ${Math.round(size * 0.58)}px; height: ${Math.round(size * 0.58)}px; color: ${INK}; }
</style><body>${svg}</body>`;

// PW_CHANNEL=chrome renders with the installed Chrome instead of Playwright's
// pinned download, for hosts where that download will not install.
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const shots = [
  { file: "og.png", width: 1200, height: 630, html: ogHtml },
  { file: "icon-512.png", width: 512, height: 512, html: iconHtml(512) },
  { file: "icon-192.png", width: 192, height: 192, html: iconHtml(192) },
  { file: "apple-touch-icon.png", width: 180, height: 180, html: iconHtml(180) },
];
for (const { file, width, height, html } of shots) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(pub, file) });
  await page.close();
  console.log(`wrote public/${file}`);
}
await browser.close();

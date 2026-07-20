/*
 * Regenerates the raster brand assets in public/ from the single vector
 * source (public/favicon.svg) and the site palette:
 *
 *   public/og.png               1200x630 link-preview image
 *   public/icon-192.png         PWA icon
 *   public/icon-512.png         PWA icon (maskable-safe: mark inside 80%)
 *   public/apple-touch-icon.png 180x180
 *
 * Run after changing the glyph: npm run assets
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, "..", "public");

const BG = "#f5efe3";
const CARD = "#fdfaf3";
const INK = "#241e16";
const MUTED = "#6e6455";
const LINE = "#dcd2be";

const svg = fs.readFileSync(path.join(pub, "favicon.svg"), "utf8");
const font = fs.readFileSync(path.join(pub, "fonts", "EBGaramond-latin.woff2")).toString("base64");

const baseCss = `
  @font-face {
    font-family: "EB Garamond";
    src: url(data:font/woff2;base64,${font}) format("woff2");
  }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; }
  body { background: ${BG}; display: grid; place-items: center;
         font-family: "EB Garamond", serif; color: ${INK}; }
  svg { display: block; }
`;

// The og image is the product shot: the face-down card on the paper ground.
const ogHtml = `<!doctype html><style>${baseCss}
  .card { width: 336px; height: 470px; background: ${CARD};
          border: 2px solid ${LINE}; border-radius: 20px;
          box-shadow: 0 2px 4px rgb(36 30 22 / 0.08), 0 28px 72px -28px rgb(36 30 22 / 0.28);
          display: grid; place-items: center; }
  .mark { display: grid; justify-items: center; gap: 34px; color: ${MUTED}; }
  .mark svg { width: 120px; height: 120px; }
  .wordmark { font-size: 21px; letter-spacing: 0.22em; text-transform: uppercase; }
</style><body>
  <div class="card"><div class="mark">${svg}<div class="wordmark">Grasping&nbsp;Straws?</div></div></div>
</body>`;

// Icons: the mark alone on the paper ground, sized for the maskable safe
// zone (inner 80% of the canvas).
const iconHtml = (size) => `<!doctype html><style>${baseCss}
  svg { width: ${Math.round(size * 0.58)}px; height: ${Math.round(size * 0.58)}px; color: ${INK}; }
</style><body>${svg}</body>`;

const browser = await chromium.launch(
  // PW_CHANNEL=chrome runs against system Chrome when the pinned download is unavailable
  process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}
);
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

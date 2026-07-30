/*
 * End-to-end verification of the built site. Serves nothing itself: build
 * first, then point BASE_URL at a server for dist/ (default
 * http://127.0.0.1:8317).
 *
 *   npm run build
 *   python3 -m http.server 8317 --bind 127.0.0.1 --directory dist &
 *   node scripts/verify.js
 *
 * Screenshots go to SHOTS_DIR if set, else a temp directory.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import zlib from "node:zlib";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://127.0.0.1:8317";
const SHOTS = process.env.SHOTS_DIR || fs.mkdtempSync(path.join(os.tmpdir(), "gs-shots-"));
const cards = JSON.parse(fs.readFileSync(path.join(here, "..", "public", "cards.json"), "utf8"));
const byIdText = (id) => (cards.find((c) => c.id === id) || {}).text || null;

const results = [];
const check = (name, cond, extra = "") =>
  results.push(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  [" + extra + "]" : ""}`);

// Must stay above FLIP_MS in src/scripts/app.ts (520ms) — the busy guard
// swallows input for the whole flip, so padding below it makes the
// full-cycle test flake rather than fail honestly.
const FLIP_SETTLE_MS = 620;

async function drawOnce(page, viaKey) {
  const prev = await page.evaluate(() => location.hash);
  for (let attempt = 0; attempt < 3; attempt++) {
    if (viaKey) await page.keyboard.press("Space");
    else await page.click("#card");
    try {
      await page.waitForFunction((p) => location.hash !== p, prev, { timeout: 1500 });
      break;
    } catch {
      /* press swallowed by the busy guard during the flip — retry */
    }
  }
  await page.waitForTimeout(FLIP_SETTLE_MS); // let the flip finish so the next input lands
  return Number((await page.evaluate(() => location.hash)).slice(1));
}

// The card has two face slots and the one facing the viewer alternates with
// each flip, so there is no single stable text node to read. Exactly one
// slot is aria-exposed at a time; that is the visible one.
const faceText = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('.face[aria-hidden="false"] .card-text');
    return el ? el.textContent : null;
  });

const edgeCount = (page) =>
  page.evaluate(() => Number(document.getElementById("deck").dataset.edges));

const bagLen = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("grasping-straws.v1")).bag.length);

const browser = await chromium.launch();

// ---- mobile, light, fresh visitor -----------------------------------
const ctx = await browser.newContext({ colorScheme: "light", viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const requests = [];
page.on("request", (r) => requests.push(r.url()));
await page.goto(BASE + "/", { waitUntil: "networkidle" });

check("face-down mark visible on load", await page.locator("#card-mark").isVisible());
check("PWA manifest linked", (await page.locator('link[rel="manifest"]').count()) === 1);
check("og:image is an absolute URL", /^https:\/\//.test((await page.locator('meta[property="og:image"]').getAttribute("content")) || ""));
check("glyph mask resolves to favicon.svg", await page
  .locator("#card-mark .glyph")
  .evaluate((el) => getComputedStyle(el).maskImage.includes("favicon.svg") || getComputedStyle(el).webkitMaskImage.includes("favicon.svg")));
check("hint visible pre-draw", (await page.locator("#hint").evaluate((el) => getComputedStyle(el).opacity)) === "1");
check("EB Garamond loaded", await page.evaluate(() => document.fonts.check('16px "EB Garamond"')));
await page.screenshot({ path: path.join(SHOTS, "shot-1-facedown-light.png") });

// ---- object structure: the flip must be real, not a content swap --------
check("both face slots exist in the DOM", (await page.locator(".face").count()) === 2);
check(
  "deck stack is a sibling of the card, not inside the rotating element",
  await page.evaluate(() => !document.getElementById("card-inner").contains(document.getElementById("deck-stack")))
);
check(
  "face-b is pre-rotated 180deg (text would render mirrored without it)",
  await page.evaluate(() => {
    const m = new DOMMatrix(getComputedStyle(document.getElementById("face-b")).transform);
    return Math.abs(m.m11 + 1) < 0.01 && Math.abs(m.m33 + 1) < 0.01;
  })
);
check(
  "exactly one face slot is exposed to assistive tech",
  (await page.locator('.face[aria-hidden="false"]').count()) === 1
);
check("deck shows a full stack before any draw", (await edgeCount(page)) === 3);

const id1 = await drawOnce(page, false);
check("click draws a card", byIdText(id1) === (await faceText(page)), `#${id1}`);
check("hash set on draw", /#\d+$/.test(page.url()), page.url());
check(
  "still exactly one face exposed after the flip",
  (await page.locator('.face[aria-hidden="false"]').count()) === 1
);
await page.waitForTimeout(900); // hint fade transition is 0.8s
check("hint fades after first draw", (await page.locator("#hint").evaluate((el) => getComputedStyle(el).opacity)) === "0");
await page.screenshot({ path: path.join(SHOTS, "shot-2-faceup-light.png") });

// ---- full cycle: no repeats until the bag is empty -------------------
const ids = [id1];
const wrongText = []; // parity regression: an even draw showing the mark, not a card
const wrongEdges = [];
const expectedEdges = (left) => {
  const r = left / cards.length;
  return r > 0.6 ? 3 : r > 0.3 ? 2 : 1;
};
for (let i = 1; i < cards.length; i++) {
  const id = await drawOnce(page, true);
  ids.push(id);
  if ((await faceText(page)) !== byIdText(id)) wrongText.push(id);
  const want = expectedEdges(await bagLen(page));
  const got = await edgeCount(page);
  if (want !== got) wrongEdges.push(`${i}:want${want}/got${got}`);
}
check("full cycle has no repeats", new Set(ids).size === cards.length, `${new Set(ids).size}/${cards.length} unique`);
// Rotation accumulates, so the facing slot alternates. If the slots were
// fixed roles, every even draw would turn the straw-bundle mark forward
// instead of a card. This is the check that catches that.
check("card text is readable after EVERY draw, not alternating draws", wrongText.length === 0, wrongText.join(","));
check("deck thins in step with the bag", wrongEdges.length === 0, wrongEdges.slice(0, 4).join(" "));
await page.screenshot({ path: path.join(SHOTS, "shot-10-deck-thin-light.png") });

// ---- reshuffle: the riffle fires here and only here --------------------
const riffleBefore = await page.evaluate(() => document.getElementById("deck-stack").classList.contains("riffling"));
await page.click("#card");
await page.waitForTimeout(140);
const riffleDuring = await page.evaluate(() => document.getElementById("deck-stack").classList.contains("riffling"));
await page.screenshot({ path: path.join(SHOTS, "shot-11-riffle.png") });
await page.waitForTimeout(FLIP_SETTLE_MS);
const idNext = Number((await page.evaluate(() => location.hash)).slice(1));
check("reshuffle riffles the stack", !riffleBefore && riffleDuring, `before=${riffleBefore} during=${riffleDuring}`);
check("reshuffle restores a full stack", (await edgeCount(page)) === 3);
check("reshuffle first card differs from last dealt", idNext !== ids[ids.length - 1], `last=${ids[ids.length - 1]} next=${idNext}`);

await page.click("#card");
await page.waitForTimeout(140);
check("an ordinary draw does not riffle", !(await page.evaluate(() => document.getElementById("deck-stack").classList.contains("riffling"))));
await page.waitForTimeout(FLIP_SETTLE_MS);

// ---- persistence across reload ---------------------------------------
const bagBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("grasping-straws.v1")).bag.length);
await page.reload({ waitUntil: "networkidle" });
const bagAfter = await page.evaluate(() => JSON.parse(localStorage.getItem("grasping-straws.v1")).bag.length);
check("bag persists across reload", bagBefore === bagAfter, `${bagBefore} vs ${bagAfter}`);
check("hint stays hidden for returning visitor", (await page.locator("#hint").evaluate((el) => getComputedStyle(el).opacity)) === "0");

// ---- probe: rapid-fire clicks during the flip ------------------------
const b1 = await page.evaluate(() => JSON.parse(localStorage.getItem("grasping-straws.v1")).bag.length);
await page.evaluate(() => { for (let i = 0; i < 5; i++) document.getElementById("card").click(); });
await page.waitForTimeout(850);
const b2 = await page.evaluate(() => JSON.parse(localStorage.getItem("grasping-straws.v1")).bag.length);
check("probe: 5-click burst draws exactly once (busy guard)", b1 - b2 === 1, `bag ${b1}->${b2}`);

// ---- deep link (fresh visitor: new context, empty storage) ------------
const ctx2 = await browser.newContext({ colorScheme: "light", viewport: { width: 390, height: 844 } });
const page2 = await ctx2.newPage();
await page2.goto(BASE + "/#17", { waitUntil: "networkidle" });
check("deep link #17 shows card 17 face up", (await faceText(page2)) === byIdText(17));
check("deep link does not leave the card mid-turn", await page2.evaluate(() => {
  const m = new DOMMatrix(getComputedStyle(document.getElementById("card-inner")).transform);
  return Math.abs(m.m11 - 1) < 0.01; // rotateY(0), not part-way round
}));
check("deep link keeps hint visible", (await page2.locator("#hint").evaluate((el) => getComputedStyle(el).opacity)) === "1");
check("deep link keeps share hidden until a draw", (await page2.locator("#share").evaluate((el) => getComputedStyle(el).visibility)) === "hidden");
await page2.screenshot({ path: path.join(SHOTS, "shot-3-deeplink.png") });
const afterDeep = await drawOnce(page2, false);
check("draw after deep link differs from linked card", afterDeep !== 17, `next=${afterDeep}`);

// ---- probes: invalid hash, garbage storage ----------------------------
const page3 = await ctx.newPage();
await page3.goto(BASE + "/#999", { waitUntil: "networkidle" });
check("probe: unknown id #999 leaves card face down", await page3.locator("#card-mark").isVisible());
await page3.goto(BASE + "/#abc", { waitUntil: "networkidle" });
check("probe: non-numeric hash leaves card face down", await page3.locator("#card-mark").isVisible());
await page3.evaluate(() => localStorage.setItem("grasping-straws.v1", "{not json"));
await page3.reload({ waitUntil: "networkidle" });
const gid = await drawOnce(page3, false);
check("probe: corrupted localStorage still draws", Number.isInteger(gid) && !!byIdText(gid), `#${gid}`);
check("aria-live region carries card text", (await page3.textContent("#live")) === byIdText(gid));

// ---- probe: Enter on the focused button draws exactly once ------------
const e1 = await page3.evaluate(() => JSON.parse(localStorage.getItem("grasping-straws.v1")).bag.length);
await page3.focus("#card");
await page3.keyboard.press("Enter");
await page3.waitForTimeout(850);
const e2 = await page3.evaluate(() => JSON.parse(localStorage.getItem("grasping-straws.v1")).bag.length);
check("probe: Enter on focused card draws exactly once", e1 - e2 === 1, `bag ${e1}->${e2}`);

// ---- share: hidden pre-draw, appears with a card, clipboard fallback ---
// navigator.share is stubbed out so the test exercises the clipboard path
// deterministically regardless of what the host platform supports.
const ctxShare = await browser.newContext({
  viewport: { width: 390, height: 844 },
  permissions: ["clipboard-read", "clipboard-write"],
});
await ctxShare.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined }));
const psh = await ctxShare.newPage();
await psh.goto(BASE + "/", { waitUntil: "networkidle" });
check("share control hidden pre-draw", (await psh.locator("#share").evaluate((el) => getComputedStyle(el).visibility)) === "hidden");
const shareId = await drawOnce(psh, false);
await psh.waitForTimeout(900); // share fades in alongside the hint fade-out
check("share control appears once a card is up", (await psh.locator("#share").evaluate((el) => getComputedStyle(el).visibility)) === "visible");
await psh.click("#share");
check("share fallback copies the card link", (await psh.evaluate(() => navigator.clipboard.readText())) === BASE + "/c/" + shareId + "/");
check("share label confirms the copy", (await psh.textContent("#share")) === "link copied");
await psh.waitForTimeout(2100);
check("share label reverts after the copy", (await psh.textContent("#share")) === "share this card");
await psh.screenshot({ path: path.join(SHOTS, "shot-8-share.png") });

// ---- per-card share pages ----------------------------------------------
const pcard = await ctx.newPage();
await pcard.goto(BASE + "/c/17/", { waitUntil: "networkidle" });
check("card page shows the card face up", (await pcard.textContent(".card-text")) === byIdText(17));
check("card page title carries the card text", (await pcard.title()).includes(byIdText(17)));
check("card page og:title carries the card text", ((await pcard.locator('meta[property="og:title"]').getAttribute("content")) || "").includes(byIdText(17)));
check("card page invites a draw of your own", await pcard.locator('main a[href="/"]').isVisible());
await pcard.screenshot({ path: path.join(SHOTS, "shot-9-card-page.png") });
const lastId = cards[cards.length - 1].id;
const resLast = await pcard.request.get(BASE + "/c/" + lastId + "/");
check("every card gets a page (spot-check last id)", resLast.ok(), `/c/${lastId}/ -> ${resLast.status()}`);

// ---- dark theme, desktop ----------------------------------------------
const ctxDark = await browser.newContext({ colorScheme: "dark", viewport: { width: 1280, height: 800 } });
const pd = await ctxDark.newPage();
await pd.goto(BASE + "/", { waitUntil: "networkidle" });
check("desktop hint offers space/click", await pd.locator(".hint-pointer").isVisible());
await pd.screenshot({ path: path.join(SHOTS, "shot-4-facedown-dark-desktop.png") });
await drawOnce(pd, true);
await pd.screenshot({ path: path.join(SHOTS, "shot-5-faceup-dark-desktop.png") });
check("dark theme applied", (await pd.evaluate(() => getComputedStyle(document.body).backgroundColor)) === "rgb(23, 19, 16)");

// ---- reduced motion ----------------------------------------------------
const ctxRM = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
const pr = await ctxRM.newPage();
await pr.goto(BASE + "/", { waitUntil: "networkidle" });
check("reduced-motion draw works (crossfade path)", !!byIdText(await drawOnce(pr, false)));

// ---- about page ---------------------------------------------------------
const pa = await ctx.newPage();
await pa.goto(BASE + "/about/", { waitUntil: "networkidle" });
await pa.screenshot({ path: path.join(SHOTS, "shot-6-about-light.png"), fullPage: true });
check("about headline keeps the ?", (await pa.textContent("h1")).trim() === "Grasping Straws?");
check("wikipedia lineage link present", (await pa.locator('a[href*="wikipedia.org/wiki/Oblique_Strategies"]').count()) === 1);
check("physical link degrades to coming-soon (empty config URL)", (await pa.textContent("main")).includes("coming soon"));
check("deck version shown discreetly", (await pa.textContent(".credit")).includes("Deck v"));
const pad = await ctxDark.newPage();
await pad.goto(BASE + "/about/", { waitUntil: "networkidle" });
await pad.screenshot({ path: path.join(SHOTS, "shot-7-about-dark.png"), fullPage: true });

// ---- 404 page ------------------------------------------------------------
const p404 = await ctx.newPage();
await p404.goto(BASE + "/404.html", { waitUntil: "networkidle" });
check("404 page renders on brand", (await p404.textContent("main")).includes("Back to the deck"));

// ---- entrance: fresh visitors only --------------------------------------
// The class is added synchronously and removed after ~1s, so poll for it
// from an init script rather than trying to catch it after load resolves.
const ctxEnt = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctxEnt.addInitScript(() => {
  window.__entranceSeen = false;
  const iv = setInterval(() => {
    if (document.body && document.body.classList.contains("entrance")) window.__entranceSeen = true;
  }, 10);
  setTimeout(() => clearInterval(iv), 1600);
});
const pe = await ctxEnt.newPage();
await pe.goto(BASE + "/", { waitUntil: "networkidle" });
check("entrance animation runs for a fresh visitor", await pe.evaluate(() => window.__entranceSeen));
await drawOnce(pe, false);
await pe.reload({ waitUntil: "networkidle" });
check("entrance animation skipped for a returning visitor", !(await pe.evaluate(() => window.__entranceSeen)));

// ---- tap to readable text, measured in-page ------------------------------
const ctxLat = await browser.newContext({ viewport: { width: 390, height: 844 } });
const pl = await ctxLat.newPage();
await pl.goto(BASE + "/", { waitUntil: "networkidle" });
const latency = await pl.evaluate(
  () =>
    new Promise((resolve) => {
      const t0 = performance.now();
      document.getElementById("card").click();
      const tick = () => {
        const el = document.querySelector('.face[aria-hidden="false"] .card-text');
        if (el && el.textContent && getComputedStyle(el).opacity === "1") resolve(performance.now() - t0);
        else if (performance.now() - t0 > 3000) resolve(-1);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    })
);
check("tap to readable text <= 560ms", latency > 0 && latency <= 560, `${Math.round(latency)}ms`);

// ---- payload: the zero-framework-JS claim must survive --------------------
// Budgets are measured GZIPPED, because that is what the README claims
// ("the ~2 KB draw script") and what a visitor actually downloads. Raw
// bytes would fail a script that ships at 2 KB over the wire.
const distDir = path.join(here, "..", "dist");
if (fs.existsSync(path.join(distDir, "index.html"))) {
  const html = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
  const grab = (re) => [...html.matchAll(re)].map((m) => m[1]).join("");
  const gz = (s) => zlib.gzipSync(Buffer.from(s)).length;
  const astroDir = path.join(distDir, "_astro");
  const listed = fs.existsSync(astroDir) ? fs.readdirSync(astroDir) : [];
  const read = (f) => fs.readFileSync(path.join(astroDir, f));

  const inlineJs = grab(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g);
  const jsGz = gz(inlineJs);
  const cssGz =
    gz(grab(/<style[^>]*>([\s\S]*?)<\/style>/g)) +
    listed.filter((f) => f.endsWith(".css")).reduce((n, f) => n + gz(read(f)), 0);

  check("draw script still ships at ~2 KB gzipped", jsGz <= 2560, `${jsGz} B gz`);
  check("total CSS <= 4 KB gzipped", cssGz <= 4096, `${cssGz} B gz`);
  // The draw script is the only JavaScript on the site and it is inlined, so
  // a JS file appearing in _astro means either a framework crept in or the
  // script fell back out of the page. Both are regressions.
  check(
    "no JavaScript bundles in dist — the draw script stays inlined",
    listed.filter((f) => f.endsWith(".js")).length === 0 && inlineJs.length > 0,
    listed.filter((f) => f.endsWith(".js")).join(",") || "inlined"
  );
}

// ---- no third-party requests -------------------------------------------
const offsite = requests.filter((u) => !u.startsWith(BASE));
check("no third-party requests at runtime", offsite.length === 0, offsite.join(", "));

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(`\n${results.length - fails.length}/${results.length} checks passed — screenshots in ${SHOTS}`);
await browser.close();
process.exit(fails.length ? 1 : 0);

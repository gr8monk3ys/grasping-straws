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

/*
 * The checks run as one long script, so a selector that has gone missing
 * throws and takes every later check with it. Printing from an exit
 * handler means a crash still reports how far the site got — a partial
 * pass list localises the breakage far better than a bare stack trace.
 */
let finished = false;
let reported = false;
function report() {
  if (reported) return;
  reported = true;
  const fails = results.filter((r) => r.startsWith("FAIL"));
  console.log(results.join("\n"));
  console.log(`\n${results.length - fails.length}/${results.length} checks passed — screenshots in ${SHOTS}`);
  if (!finished) {
    console.log("\n!! run aborted before the end — the list above is partial, not a clean sheet");
  }
  if (fails.length) process.exitCode = 1;
}
process.on("exit", report);

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
  await page.waitForTimeout(450); // let the flip finish so the next input lands
  return Number((await page.evaluate(() => location.hash)).slice(1));
}

const browser = await chromium.launch(
  // PW_CHANNEL=chrome runs against system Chrome when the pinned download is unavailable
  process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}
);

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

const id1 = await drawOnce(page, false);
check("click draws a card", byIdText(id1) === (await page.textContent("#card-text")), `#${id1}`);
check("hash set on draw", /#\d+$/.test(page.url()), page.url());
await page.waitForTimeout(900); // hint fade transition is 0.8s
check("hint fades after first draw", (await page.locator("#hint").evaluate((el) => getComputedStyle(el).opacity)) === "0");
await page.screenshot({ path: path.join(SHOTS, "shot-2-faceup-light.png") });

// ---- full cycle: no repeats until the bag is empty -------------------
const ids = [id1];
for (let i = 1; i < cards.length; i++) ids.push(await drawOnce(page, true));
check("full cycle has no repeats", new Set(ids).size === cards.length, `${new Set(ids).size}/${cards.length} unique`);

const idNext = await drawOnce(page, true);
check("reshuffle first card differs from last dealt", idNext !== ids[ids.length - 1], `last=${ids[ids.length - 1]} next=${idNext}`);

// ---- persistence across reload ---------------------------------------
const bagBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("grasping-straws.v1")).bag.length);
await page.reload({ waitUntil: "networkidle" });
const bagAfter = await page.evaluate(() => JSON.parse(localStorage.getItem("grasping-straws.v1")).bag.length);
check("bag persists across reload", bagBefore === bagAfter, `${bagBefore} vs ${bagAfter}`);
check("hint stays hidden for returning visitor", (await page.locator("#hint").evaluate((el) => getComputedStyle(el).opacity)) === "0");

// ---- probe: rapid-fire clicks during the flip ------------------------
const b1 = await page.evaluate(() => JSON.parse(localStorage.getItem("grasping-straws.v1")).bag.length);
await page.evaluate(() => { for (let i = 0; i < 5; i++) document.getElementById("card").click(); });
await page.waitForTimeout(700);
const b2 = await page.evaluate(() => JSON.parse(localStorage.getItem("grasping-straws.v1")).bag.length);
check("probe: 5-click burst draws exactly once (busy guard)", b1 - b2 === 1, `bag ${b1}->${b2}`);

// ---- deep link (fresh visitor: new context, empty storage) ------------
const ctx2 = await browser.newContext({ colorScheme: "light", viewport: { width: 390, height: 844 } });
const page2 = await ctx2.newPage();
await page2.goto(BASE + "/#17", { waitUntil: "networkidle" });
check("deep link #17 shows card 17 face up", (await page2.textContent("#card-text")) === byIdText(17));
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
await page3.waitForTimeout(650);
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

// ---- suit decks ----------------------------------------------------------
const ctxSuit = await browser.newContext({ colorScheme: "light", viewport: { width: 390, height: 844 } });
const psu = await ctxSuit.newPage();
await psu.goto(BASE + "/", { waitUntil: "networkidle" });
check("suit row hidden pre-draw", (await psu.locator("#suits").evaluate((el) => getComputedStyle(el).visibility)) === "hidden");
await drawOnce(psu, false);
await psu.waitForTimeout(900); // fades in with the hint fade-out
check("suit row appears after a draw", (await psu.locator("#suits").evaluate((el) => getComputedStyle(el).visibility)) === "visible");

const suitName = "sound";
const suitIds = cards.filter((c) => c.suit === suitName).map((c) => c.id);
await psu.click(`#suits [data-suit="${suitName}"]`);
check(`choosing ${suitName} rebuilds the bag from that suit`, (await psu.evaluate(() => JSON.parse(localStorage.getItem("grasping-straws.v1")).bag.length)) === suitIds.length);
check("chosen suit reads as pressed", (await psu.locator(`#suits [data-suit="${suitName}"]`).getAttribute("aria-pressed")) === "true");

// Draw by clicking the card: Space would land on the still-focused suit
// button (a native no-op click), not the global draw shortcut.
const suitDraws = [];
for (let i = 0; i < suitIds.length; i++) suitDraws.push(await drawOnce(psu, false));
check("suit cycle stays inside the suit", suitDraws.every((id) => suitIds.includes(id)));
check("suit cycle has no repeats", new Set(suitDraws).size === suitIds.length, `${new Set(suitDraws).size}/${suitIds.length} unique`);
const suitNext = await drawOnce(psu, false);
check("suit reshuffle keeps dealing from the suit", suitIds.includes(suitNext), `#${suitNext}`);

await psu.reload({ waitUntil: "networkidle" });
check("suit choice persists across reload", (await psu.locator(`#suits [data-suit="${suitName}"]`).getAttribute("aria-pressed")) === "true");
await psu.click('#suits [data-suit=""]');
check("everything restores the full bag", (await psu.evaluate(() => JSON.parse(localStorage.getItem("grasping-straws.v1")).bag.length)) === cards.length);
await psu.screenshot({ path: path.join(SHOTS, "shot-10-suits.png") });

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

// ---- ways to play ---------------------------------------------------------
const pplay = await ctx.newPage();
await pplay.goto(BASE + "/play/", { waitUntil: "networkidle" });
check("play page lists the five games", (await pplay.locator("main h2").count()) >= 5, `${await pplay.locator("main h2").count()} headings`);
check("play page links back to the deck", await pplay.locator('a[href="/"]').first().isVisible());
await pplay.screenshot({ path: path.join(SHOTS, "shot-11-play.png"), fullPage: true });
check("draw screen chrome links to ways to play", (await page.locator('.chrome a[href="/play/"]').count()) === 1);

// ---- daily card ------------------------------------------------------------
const ptoday = await ctx.newPage();
await ptoday.goto(BASE + "/today/", { waitUntil: "networkidle" });
const todayText = await ptoday.textContent("#today-text");
check("today page shows a card from the deck", cards.some((c) => c.text === todayText), `“${todayText}”`);
const todayCard = cards.find((c) => c.text === todayText);
check("today share link points at the card's page", todayCard && (await ptoday.locator("#today-share").getAttribute("href")) === `/c/${todayCard.id}/`);
const ptoday2 = await ctxSuit.newPage(); // different context, same day
await ptoday2.goto(BASE + "/today/", { waitUntil: "networkidle" });
check("today's card is the same for everyone", (await ptoday2.textContent("#today-text")) === todayText);
await ptoday.screenshot({ path: path.join(SHOTS, "shot-12-today.png") });

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
check("about links the print-and-play PDF", (await pa.locator('a[href="/print-and-play.pdf"]').count()) === 1);
const resPdf = await pa.request.get(BASE + "/print-and-play.pdf");
check("print-and-play PDF is served", resPdf.ok() && (resPdf.headers()["content-type"] || "").includes("pdf"), `status ${resPdf.status()}`);
check("about links ways to play", (await pa.locator('a[href="/play/"]').count()) >= 1);
check("about links the daily card", (await pa.locator('a[href="/today/"]').count()) >= 1);
check("deck version shown discreetly", (await pa.textContent(".credit")).includes("Deck v"));
const pad = await ctxDark.newPage();
await pad.goto(BASE + "/about/", { waitUntil: "networkidle" });
await pad.screenshot({ path: path.join(SHOTS, "shot-7-about-dark.png"), fullPage: true });

// ---- 404 page ------------------------------------------------------------
const p404 = await ctx.newPage();
await p404.goto(BASE + "/404.html", { waitUntil: "networkidle" });
check("404 page renders on brand", (await p404.textContent("main")).includes("Back to the deck"));

// ---- no third-party requests -------------------------------------------
const offsite = requests.filter((u) => !u.startsWith(BASE));
check("no third-party requests at runtime", offsite.length === 0, offsite.join(", "));

finished = true;
await browser.close();
report();

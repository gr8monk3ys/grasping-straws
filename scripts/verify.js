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
// Drafts are ids reserved so the PRINTED deck reaches one of MakePlayingCards'
// fixed tiers; they carry no text, and both the deck script and the /c/<id>/
// page builder filter them out. Reading them here instead made five checks
// fail against a deck size the site never had.
const allCards = JSON.parse(
  fs.readFileSync(path.join(here, "..", "public", "cards.json"), "utf8")
);
const cards = allCards.filter((c) => !c.draft);
const drafts = allCards.filter((c) => c.draft);
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
check("Fraunces loaded", await page.evaluate(() => document.fonts.check('16px "Fraunces"')));
check("Plex Mono loaded", await page.evaluate(() => document.fonts.check('16px "Plex Mono"')));
// The axis EB Garamond lacked. If this stops varying, the card face is being
// scaled rather than optically sized and the swap bought nothing.
check("Fraunces exposes a working optical-size axis", await page.evaluate(() => {
  const el = document.createElement("span");
  el.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:400 100px Fraunces;';
  el.textContent = "Describe it to someone who cannot see it.";
  document.body.appendChild(el);
  const w = (v) => { el.style.fontVariationSettings = v; return el.getBoundingClientRect().width; };
  const small = w("'opsz' 9"), large = w("'opsz' 144");
  el.remove();
  return Math.abs(small - large) > 20;
}));
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
// The card is a solid, not two coplanar planes: the faces are pushed apart
// by the stock thickness and the side strips fill the gap.
check("card has thickness — faces are separated in Z", await page.evaluate(() => {
  const z = (el) => new DOMMatrix(getComputedStyle(el).transform).m43;
  return Math.abs(z(document.getElementById("face-a"))) > 0.5;
}));
check("both side spines exist", (await page.locator(".spine").count()) === 2);
check("spines are edge-on at rest (invisible until the card turns)", await page.evaluate(() => {
  const w = (s) => document.querySelector(s).getBoundingClientRect().width;
  return w(".spine-l") < 1 && w(".spine-r") < 1;
}));

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
// Scroll-driven reveals fail dangerously, not visibly: a browser that parses
// the animation but not the timeline leaves `both`-filled elements at
// opacity 0 forever. Scroll to the end and confirm nothing stayed hidden.
await pa.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await pa.waitForTimeout(500);
const invisible = await pa.evaluate(() =>
  [...document.querySelectorAll(".about main > h2, .about main > p, .about main > .credit")]
    .filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.9)
    .map((el) => el.textContent.trim().slice(0, 24))
);
check("no about content stranded invisible after scrolling", invisible.length === 0, invisible.join(" | "));
await pa.evaluate(() => window.scrollTo(0, 0));
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

// The words arrive staggered, so "readable" means the LAST one has landed.
// Measuring the container's opacity would pass trivially — it is never
// animated — and would hide any stagger, however long.
const measureLatency = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const t0 = performance.now();
        document.getElementById("card").click();
        const tick = () => {
          const el = document.querySelector('.face[aria-hidden="false"] .card-text');
          const words = el ? [...el.querySelectorAll(".word")] : [];
          const landed = words.length > 0 && words.every((w) => getComputedStyle(w).opacity === "1");
          if (landed) resolve({ ms: performance.now() - t0, words: words.length });
          else if (performance.now() - t0 > 3000) resolve({ ms: -1, words: words.length });
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      })
  );

// Sampled, not measured once: the stagger scales with word count and a single
// draw lands on a random card. One lucky 3-word draw would report a latency
// the deck cannot actually hold to.
const samples = [];
for (let i = 0; i < 12; i++) {
  samples.push(await measureLatency(pl));
  await pl.waitForTimeout(FLIP_SETTLE_MS);
}
const valid = samples.filter((s) => s.ms > 0);
const worst = valid.reduce((a, b) => (b.ms > a.ms ? b : a), valid[0]);
check(
  "tap to readable text <= 560ms across 12 draws",
  valid.length === samples.length && worst.ms <= 560,
  `worst ${Math.round(worst.ms)}ms at ${worst.words} words`
);
// The budget exists FOR the longest card, so the longest card has to be
// measured — not hoped for. 13 of 48 cards run to 8+ words, which leaves a
// ~2% chance that 12 random draws sample none of them, and this check duly
// failed on a run where nothing was wrong. Deal the worst case on purpose
// instead: a hashchange runs the same flip and the same word stagger.
const longest = cards.reduce((a, c) =>
  c.text.split(" ").length > a.text.split(" ").length ? c : a
);
const longestWords = longest.text.split(" ").length;
// Park on a different card first: if the hash already names the longest one,
// setting it again fires no hashchange and nothing turns.
const parkId = cards.find((c) => c.id !== longest.id).id;
await pl.evaluate((id) => { location.hash = "#" + id; }, parkId);
await pl.waitForTimeout(FLIP_SETTLE_MS);
const worstCase = await pl.evaluate(
  ({ id, text }) =>
    new Promise((resolve) => {
      const t0 = performance.now();
      location.hash = "#" + id;
      const tick = () => {
        const el = document.querySelector('.face[aria-hidden="false"] .card-text');
        const words = el ? [...el.querySelectorAll(".word")] : [];
        // The text must be THIS card's before the words mean anything —
        // the outgoing card's words are all landed already, and checking
        // opacity alone resolves on frame one against the wrong card.
        const ready =
          el && el.textContent === text && words.length && words.every((w) => getComputedStyle(w).opacity === "1");
        if (ready) resolve({ ms: performance.now() - t0, words: words.length });
        else if (performance.now() - t0 > 3000) resolve({ ms: -1, words: words.length });
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }),
  { id: longest.id, text: longest.text }
);
check(
  `the longest card (${longestWords} words) is measured, not hoped for`,
  worstCase.words === longestWords,
  `${worstCase.words} words`
);
check(
  "worst-case card still readable within 560ms",
  worstCase.ms > 0 && worstCase.ms <= 560,
  `${Math.round(worstCase.ms)}ms at ${worstCase.words} words`
);


// ---- masthead, piles and the theme toggle --------------------------------
const ctxUi = await browser.newContext({ colorScheme: "light", viewport: { width: 1280, height: 900 } });
const pu = await ctxUi.newPage();
await pu.goto(BASE + "/", { waitUntil: "networkidle" });
await pu.waitForTimeout(500);

// The masthead is a running head now, so it must sit ABOVE the card rather
// than below it — the whole point of moving it.
check("masthead sits above the card", await pu.evaluate(() => {
  const c = document.querySelector(".chrome").getBoundingClientRect();
  const d = document.getElementById("deck").getBoundingClientRect();
  return c.bottom <= d.top;
}));
check("masthead carries the tally", (await pu.locator("#tally").count()) === 1);

// Counts are a view of `bag`, so they must agree with it exactly.
const pileState = async () =>
  pu.evaluate(() => ({
    left: Number(document.getElementById("left-count").textContent),
    drawn: Number(document.getElementById("drawn-count").textContent),
    tally: Number(document.getElementById("tally-drawn").textContent),
    discardLayers: Number(document.getElementById("discard").dataset.layers),
    deckLayers: Number(document.getElementById("deck-mini").dataset.layers),
    bag: JSON.parse(localStorage.getItem("grasping-straws.v1") || '{"bag":[]}').bag.length,
  }));
const before = await pileState();
check("counts start at a full deck", before.left === cards.length && before.drawn === 0, JSON.stringify(before));
check("discard starts empty", before.discardLayers === 0 && before.deckLayers === 6);

for (let i = 0; i < 6; i++) await drawOnce(pu, false);
const after = await pileState();
check("drawn + remaining always equals the deck", after.left + after.drawn === cards.length, JSON.stringify(after));
check("the tally agrees with the pile counts", after.tally === after.drawn);
check("remaining count tracks the bag exactly", after.left === after.bag, `${after.left} vs ${after.bag}`);
check("the discard thickens as the deck thins", after.discardLayers > 0 && after.deckLayers <= 6, JSON.stringify(after));
await pu.screenshot({ path: path.join(SHOTS, "shot-12-table-light.png") });

// --- reserved print slots never reach the site ----------------------------
check("there are reserved draft slots to test", drafts.length > 0, `${drafts.length}`);
check("drafts are excluded from the dealt deck", await pu.evaluate(
  async () => (await (await fetch("/cards.json")).json()).filter((c) => c.draft).length > 0
) && (await pileState()).left + (await pileState()).drawn === cards.length);
const draftRes = await pu.request.get(BASE + "/c/" + drafts[0].id + "/");
check("a draft gets no share page", draftRes.status() === 404, `/c/${drafts[0].id}/ -> ${draftRes.status()}`);
check("a draft id in the hash is ignored", await pu.evaluate(async (id) => {
  location.hash = "#" + id;
  await new Promise((r) => setTimeout(r, 300));
  const el = document.querySelector('.face[aria-hidden="false"] .card-text');
  return !!el.textContent.trim();
}, drafts[0].id));

// --- picking a pile up ----------------------------------------------------
// The discard is now a real pile: it knows the sequence, not just the count.
const savedOrder = await pu.evaluate(
  () => JSON.parse(localStorage.getItem("grasping-straws.v1")).order
);
check("the draw order is persisted, not just the count", Array.isArray(savedOrder) && savedOrder.length === after.drawn, JSON.stringify(savedOrder));
check("every id in the discard left the bag", await pu.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("grasping-straws.v1"));
  return s.order.every((id) => !s.bag.includes(id));
}));

check("an empty shelf cannot be picked up", await pu.locator("#aside-open").isDisabled());
check("a non-empty discard can be", !(await pu.locator("#discard-open").isDisabled()));

await pu.click("#discard-open");
await pu.waitForTimeout(450);
check("the discard opens as a modal dialog", await pu.evaluate(() => document.getElementById("spread").open));
const spreadIds = await pu.evaluate(() =>
  [...document.querySelectorAll(".spread-num")].map((n) => Number(n.textContent.slice(1)))
);
check("the spread holds every drawn card", spreadIds.length === savedOrder.length, `${spreadIds.length}/${savedOrder.length}`);
check("newest sits on top", spreadIds[0] === savedOrder[savedOrder.length - 1], `${spreadIds[0]} vs ${savedOrder.at(-1)}`);
check("the spread reads as cards, not a list", await pu.evaluate(() => {
  const el = document.querySelector(".spread-card");
  const r = el.getBoundingClientRect();
  return r.height > r.width && el.textContent.length > 8;
}));
await pu.screenshot({ path: path.join(SHOTS, "shot-13-spread.png") });

// Looking through the discard must not deal — the bag is not touched.
const bagBeforePick = await bagLen(pu);
const pickId = spreadIds[2];
await pu.evaluate((id) => {
  [...document.querySelectorAll(".spread-card")]
    .find((b) => b.querySelector(".spread-num").textContent === "#" + id)
    .click();
}, pickId);
await pu.waitForTimeout(FLIP_SETTLE_MS);
check("the dialog closes on picking a card", !(await pu.evaluate(() => document.getElementById("spread").open)));
check("picking from the discard turns that card up", (await faceText(pu)) === byIdText(pickId), `#${pickId}`);
check("looking through the discard does not deal", (await bagLen(pu)) === bagBeforePick, `${bagBeforePick} -> ${await bagLen(pu)}`);
check("the discard count is unchanged by browsing", (await pileState()).drawn === after.drawn);

// --- the shelf ------------------------------------------------------------
await pu.click("#keep");
await pu.waitForTimeout(120);
check("set aside marks the control as pressed", (await pu.getAttribute("#keep", "aria-pressed")) === "true");
check("the shelf pile appears", (await pu.evaluate(() => Number(document.getElementById("aside-count").textContent))) === 1);
check("the shelf can now be picked up", !(await pu.locator("#aside-open").isDisabled()));
check("the shelf holds the card that was up", await pu.evaluate((id) => {
  const s = JSON.parse(localStorage.getItem("grasping-straws.v1"));
  return s.aside.length === 1 && s.aside[0] === id;
}, pickId));
// A bookmark, not a removal: taking a card aside must not change what is
// left to draw, or the two counts would stop meaning one thing.
check("setting aside does not remove the card from play", (await pileState()).left === after.left);

await pu.reload({ waitUntil: "networkidle" });
await pu.waitForTimeout(400);
check("the shelf survives a reload", (await pu.evaluate(() => Number(document.getElementById("aside-count").textContent))) === 1);
await pu.click("#aside-open");
await pu.waitForTimeout(400);
check("the shelf spread shows the kept card", await pu.evaluate((id) =>
  document.querySelector(".spread-num")?.textContent === "#" + id, pickId));
await pu.keyboard.press("Escape");
await pu.waitForTimeout(200);
check("Escape closes a spread", !(await pu.evaluate(() => document.getElementById("spread").open)));

// --- a visitor arriving from the previous storage shape -------------------
// v1 stored bag/last/drawn and no sequence. The set of drawn cards is still
// recoverable (deck minus bag), so the discard must come back populated
// rather than empty — an existing visitor should not see their progress
// silently reset to zero.
const ctxMig = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const pm = await ctxMig.newPage();
await pm.goto(BASE + "/", { waitUntil: "domcontentloaded" });
const v1Bag = cards.slice(5).map((c) => c.id); // 5 cards "already drawn"
const v1Last = cards[4].id;
await pm.evaluate(
  (s) => localStorage.setItem("grasping-straws.v1", JSON.stringify(s)),
  { bag: v1Bag, last: v1Last, drawn: true }
);
await pm.reload({ waitUntil: "networkidle" });
await pm.waitForTimeout(400);
const migrated = await pm.evaluate(() => ({
  drawn: Number(document.getElementById("drawn-count").textContent),
  left: Number(document.getElementById("left-count").textContent),
  order: JSON.parse(localStorage.getItem("grasping-straws.v1")).order,
  aside: JSON.parse(localStorage.getItem("grasping-straws.v1")).aside,
}));
check("a v1 visitor keeps their place in the cycle", migrated.left === v1Bag.length, JSON.stringify(migrated.left));
check("the discard is reconstructed, not reset", migrated.drawn === cards.length - v1Bag.length, `${migrated.drawn}`);
check("the reconstructed discard holds exactly the drawn cards", await pm.evaluate((bag) => {
  const s = JSON.parse(localStorage.getItem("grasping-straws.v1"));
  return s.order.every((id) => !bag.includes(id)) && s.order.length === new Set(s.order).size;
}, v1Bag));
// The one position v1 did record is the card that was face up.
check("the last card dealt stays last in the reconstructed order", migrated.order.at(-1) === v1Last, `${migrated.order.at(-1)} vs ${v1Last}`);
check("a v1 visitor starts with an empty shelf", Array.isArray(migrated.aside) && migrated.aside.length === 0);
await ctxMig.close();

// --- throwing the card ----------------------------------------------------
// A flick past the distance threshold deals; a nudge below it springs back.
async function dragCard(page, dxPx, steps = 6) {
  const box = await page.locator("#card").boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) await page.mouse.move(cx + (dxPx * i) / steps, cy);
  await page.mouse.up();
}
const beforeThrow = await pu.evaluate(() => location.hash);
await dragCard(pu, 12);
await pu.waitForTimeout(500);
check("a nudge is not a throw — the card springs back", (await pu.evaluate(() => location.hash)) === beforeThrow, `${beforeThrow} -> ${await pu.evaluate(() => location.hash)}`);
check("a nudge leaves no residual transform", await pu.evaluate(() => {
  const t = document.getElementById("card").style.transform;
  return t === "" || t === "none";
}), await pu.evaluate(() => document.getElementById("card").style.transform));

const bagBeforeThrow = await bagLen(pu);
await dragCard(pu, 150);
await pu.waitForTimeout(FLIP_SETTLE_MS + 250);
const afterThrow = await pu.evaluate(() => location.hash);
check("throwing the card deals the next one", afterThrow !== beforeThrow, `${beforeThrow} -> ${afterThrow}`);
check("a throw deals exactly one card", (await bagLen(pu)) === bagBeforeThrow - 1, `${bagBeforeThrow} -> ${await bagLen(pu)}`);
check("the thrown card is readable where it started", (await faceText(pu)) === byIdText(Number(afterThrow.slice(1))));
check("the card returns to the table", await pu.evaluate(() => {
  const d = document.getElementById("deck").getBoundingClientRect();
  const c = document.getElementById("card").getBoundingClientRect();
  return Math.abs((c.left + c.width / 2) - (d.left + d.width / 2)) < 2;
}));

// touch-action is what decides whether the gesture reaches us at all. Left
// at `manipulation` the browser claims horizontal panning and the throw
// silently stops working on exactly the devices it is best on.
check("the card yields horizontal drags to the page, keeps vertical scroll",
  (await pu.locator("#card").evaluate((el) => getComputedStyle(el).touchAction)) === "pan-y");

// --- the paper at rest ----------------------------------------------------
// The shader used to render only mid-flip, leaving a frozen frame. Tilting
// toward the pointer is what makes it a live surface.
const restAngle = () => pu.evaluate(() => {
  const m = new DOMMatrix(getComputedStyle(document.getElementById("card-inner")).transform);
  return Math.round(Math.atan2(-m.m13, m.m11) * (180 / Math.PI) * 10) / 10;
});
const flat = await restAngle();
const cardBox = await pu.locator("#card").boundingBox();
await pu.mouse.move(cardBox.x + cardBox.width - 4, cardBox.y + cardBox.height / 2);
await pu.waitForTimeout(160);
const tilted = await restAngle();
check("the card tilts toward the pointer at rest", Math.abs(tilted - flat) > 1, `${flat} -> ${tilted}`);
await pu.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y - 120);
await pu.waitForTimeout(200);
check("it settles flat when the pointer leaves", Math.abs((await restAngle()) - flat) < 0.5, `${await restAngle()} vs ${flat}`);

// --- theme toggle ---------------------------------------------------------
const themeOf = () => pu.evaluate(() => ({
  attr: document.documentElement.dataset.theme || null,
  bg: getComputedStyle(document.body).backgroundColor,
  stored: localStorage.getItem("grasping-straws.theme"),
}));
const t0 = await themeOf();
await pu.click("#theme");
await pu.waitForTimeout(150);
const t1 = await themeOf();
check("the toggle flips the theme", t1.bg !== t0.bg, `${t0.bg} -> ${t1.bg}`);
check("the choice is stored", t1.stored === "dark" || t1.stored === "light", String(t1.stored));
await pu.reload({ waitUntil: "networkidle" });
await pu.waitForTimeout(250);
const t2 = await themeOf();
check("the choice survives a reload", t2.bg === t1.bg, `${t1.bg} -> ${t2.bg}`);
// The override has to beat the OS preference, not merely coexist with it.
check("an explicit choice overrides prefers-color-scheme", t2.attr === "dark" && t2.bg !== t0.bg, JSON.stringify(t2));
await pu.screenshot({ path: path.join(SHOTS, "shot-13-table-dark.png") });

// The dark tokens are written twice — once in the media query for no-JS, once
// on the attribute for the override. This fails if they ever drift apart.
const viaAttr = await pu.evaluate(() => {
  const names = ["--bg", "--card", "--ink", "--muted", "--accent", "--line", "--edge-face", "--spine"];
  const read = () => Object.fromEntries(names.map((n) => [n, getComputedStyle(document.documentElement).getPropertyValue(n).trim()]));
  document.documentElement.dataset.theme = "dark";
  return read();
});
const ctxDarkOs = await browser.newContext({ colorScheme: "dark", viewport: { width: 900, height: 700 } });
const pdo = await ctxDarkOs.newPage();
await pdo.goto(BASE + "/", { waitUntil: "networkidle" });
const viaMedia = await pdo.evaluate(() => {
  const names = ["--bg", "--card", "--ink", "--muted", "--accent", "--line", "--edge-face", "--spine"];
  return Object.fromEntries(names.map((n) => [n, getComputedStyle(document.documentElement).getPropertyValue(n).trim()]));
});
const drift = Object.keys(viaAttr).filter((k) => viaAttr[k] !== viaMedia[k]);
check("both dark-theme blocks stay identical", drift.length === 0, drift.join(","));

// --- accent contrast ------------------------------------------------------
const contrast = await pu.evaluate(() => {
  const lum = (css) => {
    const [r, g, b] = css.match(/[\d.]+/g).slice(0, 3).map(Number);
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const cs = getComputedStyle(document.documentElement);
  const probe = document.createElement("span");
  probe.style.color = cs.getPropertyValue("--accent").trim();
  document.body.appendChild(probe);
  const accent = getComputedStyle(probe).color;
  probe.remove();
  return { dark: ratio(accent, getComputedStyle(document.body).backgroundColor) };
});
check("accent clears AA against its ground (dark)", contrast.dark >= 4.5, contrast.dark.toFixed(2) + ":1");

// ---- the paper shader, and its fallback ----------------------------------
const ctxGl = await browser.newContext({ viewport: { width: 390, height: 844 } });
const pg = await ctxGl.newPage();
await pg.goto(BASE + "/", { waitUntil: "networkidle" });
await pg.waitForTimeout(700);
const glState = await pg.evaluate(() => ({
  mounted: document.documentElement.classList.contains("gl"),
  canvases: document.querySelectorAll("canvas.paper").length,
  cssGrain: getComputedStyle(document.getElementById("face-a"), "::before").display,
  textIsDom: !!document.querySelector('.face[aria-hidden="false"] .card-text'),
}));
check("paper shader mounts on both faces", glState.mounted && glState.canvases === 2, JSON.stringify(glState));
check("shader supersedes the CSS grain once it links", glState.cssGrain === "none");
check("card text stays real DOM, never rasterised into the canvas", glState.textIsDom);

// Progressive enhancement is a claim, so it gets tested: with WebGL refused,
// the CSS grain must come back and the deck must still deal.
const ctxNoGl = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctxNoGl.addInitScript(() => {
  const real = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
    if (String(kind).includes("webgl")) return null;
    return real.call(this, kind, ...rest);
  };
});
const png = await ctxNoGl.newPage();
await png.goto(BASE + "/", { waitUntil: "networkidle" });
await png.waitForTimeout(500);
const fallback = await png.evaluate(() => ({
  mounted: document.documentElement.classList.contains("gl"),
  canvases: document.querySelectorAll("canvas.paper").length,
  cssGrain: getComputedStyle(document.getElementById("face-a"), "::before").display,
}));
check("no gl class when WebGL is refused", !fallback.mounted && fallback.canvases === 0, JSON.stringify(fallback));
check("CSS grain returns as the fallback", fallback.cssGrain !== "none", fallback.cssGrain);
const fbId = await drawOnce(png, false);
check("the deck still deals without WebGL", (await faceText(png)) === byIdText(fbId), `#${fbId}`);
// The tilt is a CSS transform. Gating it on the shader — which is easy to do
// by accident, since it drives the specular — would deny it to every visitor
// on the CSS-grain fallback for no reason.
const fbBox = await png.locator("#card").boundingBox();
const fbFlat = await png.evaluate(() => new DOMMatrix(getComputedStyle(document.getElementById("card-inner")).transform).m13);
await png.mouse.move(fbBox.x + fbBox.width - 4, fbBox.y + fbBox.height / 2);
await png.waitForTimeout(160);
const fbTilt = await png.evaluate(() => new DOMMatrix(getComputedStyle(document.getElementById("card-inner")).transform).m13);
check("the card still tilts without WebGL", Math.abs(fbTilt - fbFlat) > 0.01, `${fbFlat} -> ${fbTilt}`);

// reduced motion never mounts it at all
const prNoGl = await ctxRM.newPage();
await prNoGl.goto(BASE + "/", { waitUntil: "networkidle" });
await prNoGl.waitForTimeout(500);
check(
  "reduced motion skips the shader entirely",
  !(await prNoGl.evaluate(() => document.documentElement.classList.contains("gl")))
);

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

  // 2560 B when the draw script was alone; the paper shader roughly doubled
  // it, the theme toggle added ~500 B, and the browsable piles, the throw
  // gesture and pointer parallax added ~1.3 KB more. Every raise here is
  // deliberate — still hand-rolled, still no framework: Three.js alone would
  // be ~25x this, and a drag/gesture library another 10 KB on top.
  check("all client JS <= 7 KB gzipped (draw + shader + theme + table)", jsGz <= 7168, `${jsGz} B gz`);
  check("total CSS <= 6 KB gzipped", cssGz <= 6144, `${cssGz} B gz`);
  // Raised with the editorial pass (masthead, piles, two type ramps).
  // The draw script is the only JavaScript on the site and it is inlined, so
  // a JS file appearing in _astro means either a framework crept in or the
  // script fell back out of the page. Both are regressions.
  check(
    "no JavaScript bundles in dist — the draw script stays inlined",
    listed.filter((f) => f.endsWith(".js")).length === 0 && inlineJs.length > 0,
    listed.filter((f) => f.endsWith(".js")).join(",") || "inlined"
  );
}

// ---- typography floor ---------------------------------------------------
// EB Garamond's x-height is 0.405em against ~0.523 for a typical sans, so a
// px size understates how big the text LOOKS by about 1.29x. Asserting on
// apparent size is the only way this floor means anything: 0.85rem sounds
// reasonable and lands at an apparent 10.5px.
const tooSmall = async (page, where) =>
  page
    .evaluate(() => {
      const c = document.createElement("canvas").getContext("2d");
      // x-height per family, not one global ratio: Fraunces is 0.436 and
      // Plex Mono 0.516, so a single factor would misjudge one of them by
      // ~20%. Measure whatever font the element actually resolves to.
      const cache = new Map();
      const xh = (font) => {
        if (!cache.has(font)) {
          c.font = "100px " + font;
          cache.set(font, (c.measureText("x").actualBoundingBoxAscent || 0) / 100);
        }
        return cache.get(font);
      };
      const sans = xh("Helvetica");
      const out = [];
      for (const el of document.querySelectorAll("body *")) {
        if (!el.textContent.trim() || el.children.length) continue;
        if (el.closest(".sr-only, noscript") || el.classList.contains("sr-only")) continue;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const own = xh(cs.fontFamily) || sans;
        const apparent = parseFloat(cs.fontSize) * (own / sans);
        if (apparent < 11.5) out.push(`${el.className || el.tagName}:${apparent.toFixed(1)}`);
      }
      return out;
    })
    .then((r) => ({ where, list: r }));

const typeFloors = [
  await tooSmall(page, "/"),
  await tooSmall(pa, "/about/"),
  await tooSmall(pcard, "/c/17/"),
];
for (const { where, list } of typeFloors) {
  check(`no text under ~11.5px apparent on ${where}`, list.length === 0, list.join(" "));
}

// Bigger type costs horizontal room. Nothing in the chrome may break
// mid-phrase ("Get the physical / deck") and nothing may overflow the page.
const wrapped = await page.evaluate(() =>
  [...document.querySelectorAll(".chrome a, .chrome .deck-name")]
    .filter((el) => el.getClientRects().length > 1)
    .map((el) => el.textContent.trim())
);
check("chrome labels sit on one line each at 390px", wrapped.length === 0, wrapped.join(" | "));
const overflows = await page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth
);
check("no horizontal overflow at 390px", !overflows);

// ---- no third-party requests -------------------------------------------
const offsite = requests.filter((u) => !u.startsWith(BASE));
check("no third-party requests at runtime", offsite.length === 0, offsite.join(", "));

console.log(results.join("\n"));
const fails = results.filter((r) => r.startsWith("FAIL"));
console.log(`\n${results.length - fails.length}/${results.length} checks passed — screenshots in ${SHOTS}`);
await browser.close();
process.exit(fails.length ? 1 : 0);

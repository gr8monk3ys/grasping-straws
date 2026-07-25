/*
 * Grasping Straws? — draw screen.
 * The bag: shuffle the whole deck, deal until empty, reshuffle so the first
 * card of the new bag never repeats the last card dealt. State persists in
 * localStorage so a returning visitor continues their deck.
 */

import { DECK_NAME } from "../config";
import { type Card, FAILURE_TEXT, loadDeck } from "./deck";

type SavedState = { bag?: unknown; last?: unknown; drawn?: unknown; suit?: unknown };

const STORAGE_KEY = "grasping-straws.v1";
const FLIP_MS = 400;

const cardBtn = document.getElementById("card") as HTMLButtonElement;
const inner = document.getElementById("card-inner") as HTMLElement;
const markEl = document.getElementById("card-mark") as HTMLElement;
const textEl = document.getElementById("card-text") as HTMLElement;
const liveEl = document.getElementById("live") as HTMLElement;
const shareBtn = document.getElementById("share") as HTMLButtonElement;
const tallyEl = document.getElementById("tally") as HTMLElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let deck: Card[] = [];
let byId = new Map<number, Card>();
let bag: number[] = []; // ids not yet dealt this cycle; the top of the pile is the end
let last: number | null = null; // id of the card currently face up
let suit: string | null = null; // active suit filter; null = the whole deck
let busy = false;

function loadState(): SavedState | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
}

function saveState(): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ bag, last, suit, drawn: document.body.classList.contains("has-drawn") }),
    );
  } catch {
    /* storage unavailable (private mode) — the deck just won't remember */
  }
}

// Returning visitors must not watch the hint fade out again, so the
// has-drawn class has to land before first paint — synchronously, not
// after the deck fetch resolves. The settled class arms the hint's fade
// transition one frame later, so the initial state never animates.
const saved = loadState();
if (saved && saved.drawn) document.body.classList.add("has-drawn");
requestAnimationFrame(() => document.body.classList.add("settled"));

function randInt(n: number): number {
  if (window.crypto && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / n) * n;
    do {
      crypto.getRandomValues(buf);
    } while (buf[0]! >= limit);
    return buf[0]! % n;
  }
  return Math.floor(Math.random() * n);
}

function shuffled(ids: number[]): number[] {
  const a = ids.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function keepTopFresh(): void {
  // The next deal must differ from the card currently face up.
  if (bag.length > 1 && bag[bag.length - 1] === last) {
    const j = randInt(bag.length - 1);
    [bag[bag.length - 1], bag[j]] = [bag[j]!, bag[bag.length - 1]!];
  }
}

function poolSize(): number {
  const pool = suit ? deck.filter((c) => c.suit === suit) : deck;
  return pool.length || deck.length;
}

function refillBag(): void {
  // A suit whose cards were all edited away falls back to the whole deck.
  const pool = suit ? deck.filter((c) => c.suit === suit) : deck;
  bag = shuffled((pool.length ? pool : deck).map((c) => c.id));
  keepTopFresh();
}

/*
 * How far into the current deck this visitor is. Counts the bag rather
 * than the draws, so it stays correct across a reload, a suit change (a
 * new deck, so the count restarts) and a reshuffle.
 */
function showTally(): void {
  const total = poolSize();
  const drawn = total - bag.length;
  tallyEl.textContent = drawn > 0 ? `${drawn} of ${total} drawn` : "";
}

function setFace(id: number): void {
  markEl.hidden = true;
  textEl.hidden = false;
  textEl.textContent = byId.get(id)!.text;
  // A card face is up, so there is something to share. The share control
  // itself waits for has-drawn too — a deep-link visitor keeps the hint.
  document.body.classList.add("has-card");
}

function show(id: number, { instant = false, keepHint = false } = {}): void {
  const card = byId.get(id);
  if (!card) return;
  if (!keepHint) document.body.classList.add("has-drawn");
  history.replaceState(null, "", "#" + id);
  liveEl.textContent = card.text;

  if (instant || !inner.animate) {
    setFace(id);
    return;
  }

  busy = true;
  const half = FLIP_MS / 2;
  const out = reducedMotion.matches
    ? inner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: "ease-in" })
    : inner.animate([{ transform: "rotateY(0deg)" }, { transform: "rotateY(90deg)" }], {
        duration: half,
        easing: "cubic-bezier(0.45, 0, 0.85, 0.6)",
      });
  out.finished
    .then(() => {
      setFace(id);
      return reducedMotion.matches
        ? inner.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: "ease-out" })
            .finished
        : inner.animate([{ transform: "rotateY(-90deg)" }, { transform: "rotateY(0deg)" }], {
            duration: half,
            easing: "cubic-bezier(0.15, 0.4, 0.35, 1)",
          }).finished;
    })
    .catch(() => setFace(id))
    .finally(() => {
      busy = false;
    });
}

function draw(): void {
  if (busy || deck.length === 0) return;
  if (bag.length === 0) refillBag();
  last = bag.pop()!;
  show(last);
  saveState();
  showTally();
}

/*
 * Share the face-up card as its /c/<id>/ page (real pages unfurl with the
 * card text; #-fragments never reach scrapers). Native share sheet where
 * the platform has one, clipboard otherwise.
 */
const shareLabel = shareBtn.textContent;
let shareLabelTimer: ReturnType<typeof setTimeout> | undefined;

async function shareCard(): Promise<void> {
  const card = last === null ? undefined : byId.get(last);
  if (!card) return;
  const url = location.origin + "/c/" + card.id + "/";
  if (navigator.share) {
    try {
      await navigator.share({ title: DECK_NAME, text: card.text, url });
      return;
    } catch (err) {
      // Closing the share sheet is not an error; anything else falls
      // through to the clipboard.
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    shareBtn.textContent = "link copied";
    clearTimeout(shareLabelTimer);
    shareLabelTimer = setTimeout(() => {
      shareBtn.textContent = shareLabel;
    }, 1800);
  } catch {
    /* no clipboard either (e.g. insecure context) — leave the label be */
  }
}

async function init(): Promise<void> {
  const loaded = await loadDeck();
  if (!loaded) {
    markEl.hidden = true;
    textEl.hidden = false;
    textEl.textContent = FAILURE_TEXT;
    return;
  }
  deck = loaded;
  byId = new Map(deck.map((c) => [c.id, c]));

  // Suit filter: restore the saved choice if that suit still exists.
  const suitsInDeck = new Set(deck.map((c) => c.suit).filter((s) => typeof s === "string"));
  if (saved && typeof saved.suit === "string" && suitsInDeck.has(saved.suit)) suit = saved.suit;

  if (saved && Array.isArray(saved.bag)) {
    // Cards removed from cards.json since the last visit simply vanish
    // from the bag; new cards join at the next reshuffle. Under a suit
    // filter, cards reassigned out of the suit vanish the same way.
    bag = saved.bag.filter(
      (id): id is number =>
        typeof id === "number" && byId.has(id) && (!suit || byId.get(id)!.suit === suit),
    );
    last = typeof saved.last === "number" && byId.has(saved.last) ? saved.last : null;
  }
  if (bag.length === 0) refillBag();
  showTally();

  // Suit buttons are rendered at build time from the same cards.json.
  const suitButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("#suits [data-suit]"),
  );
  const reflectSuit = (): void => {
    for (const b of suitButtons) {
      b.setAttribute("aria-pressed", String((b.dataset.suit || null) === suit));
    }
  };
  for (const b of suitButtons) {
    b.addEventListener("click", () => {
      const next = b.dataset.suit || null;
      if (next === suit) return;
      suit = next;
      refillBag(); // a new deck: cycle progress restarts inside the suit
      reflectSuit();
      saveState();
      showTally();
    });
  }
  reflectSuit();

  // #<id> deep link: show that card face up, then rejoin the normal bag.
  const hashId = Number(location.hash.slice(1));
  if (byId.has(hashId)) {
    last = hashId;
    keepTopFresh();
    show(hashId, { instant: true, keepHint: true });
    saveState();
  }

  window.addEventListener("hashchange", () => {
    const id = Number(location.hash.slice(1));
    if (byId.has(id) && id !== last) {
      last = id;
      keepTopFresh();
      show(id, { keepHint: true });
      saveState();
    }
  });

  cardBtn.addEventListener("click", draw);
  shareBtn.addEventListener("click", shareCard);
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented) return;
    if (e.key !== " " && e.key !== "Enter") return;
    const t = e.target;
    // Let links and the card button itself keep their native behavior.
    if (t instanceof Element && (t === cardBtn || t.closest("a, button"))) return;
    e.preventDefault();
    draw();
  });
}

init();

if (
  "serviceWorker" in navigator &&
  (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

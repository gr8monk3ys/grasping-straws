/*
 * Grasping Straws? — draw screen.
 * The bag: shuffle the whole deck, deal until empty, reshuffle so the first
 * card of the new bag never repeats the last card dealt. State persists in
 * localStorage so a returning visitor continues their deck.
 *
 * The card is a real two-faced object. .face-a sits at rotateY(0) and
 * .face-b at rotateY(180deg) — they are geometric SLOTS, not fixed roles.
 * Rotation accumulates (0 -> 180 -> 360 -> ...) and never reverses, so the
 * slot facing the viewer alternates. Each draw writes the new card into the
 * INCOMING slot before the rotation starts.
 */

import { DECK_NAME } from "../config";
import { mountPaper, type Paper } from "./paper";

type Card = { id: number; text: string; suit?: string; draft?: boolean };
type SavedState = {
  bag?: unknown;
  last?: unknown;
  drawn?: unknown;
  order?: unknown; // v2: the sequence dealt this cycle, oldest first
  aside?: unknown; // v2: ids on the shelf, kept across cycles
};

const STORAGE_KEY = "grasping-straws.v1";
// Keep in step with --flip-ms in global.css. 520ms put the words on screen at
// 553ms against a 560ms budget — inside the limit, but sluggish on a tool
// built for rapid tapping, and with no headroom on slower hardware.
const FLIP_MS = 460;
const RIFFLE_MS = 700; // keep in step with the riffle keyframes
const WORD_STAGGER_MS = 15;
const WORD_MS = 160;

const cardBtn = document.getElementById("card") as HTMLButtonElement;
const inner = document.getElementById("card-inner") as HTMLElement;
const faceA = document.getElementById("face-a") as HTMLElement;
const faceB = document.getElementById("face-b") as HTMLElement;
const markEl = document.getElementById("card-mark") as HTMLElement;
const deckEl = document.getElementById("deck") as HTMLElement;
const deckStack = document.getElementById("deck-stack") as HTMLElement;
const shadowContact = document.querySelector(".card-shadow-contact") as HTMLElement;
const shadowAmbient = document.querySelector(".card-shadow-ambient") as HTMLElement;
const liveEl = document.getElementById("live") as HTMLElement;
const shareBtn = document.getElementById("share") as HTMLButtonElement;
const discardEl = document.getElementById("discard") as HTMLElement | null;
const deckMiniEl = document.getElementById("deck-mini") as HTMLElement | null;
const asideEl = document.getElementById("aside") as HTMLElement | null;
const leftCountEl = document.getElementById("left-count") as HTMLElement | null;
const drawnCountEl = document.getElementById("drawn-count") as HTMLElement | null;
const asideCountEl = document.getElementById("aside-count") as HTMLElement | null;
const discardOpenEl = document.getElementById("discard-open") as HTMLButtonElement | null;
const asideOpenEl = document.getElementById("aside-open") as HTMLButtonElement | null;
const keepBtn = document.getElementById("keep") as HTMLButtonElement;
const spreadEl = document.getElementById("spread") as HTMLDialogElement;
const spreadListEl = document.getElementById("spread-list") as HTMLElement;
const spreadTitleEl = document.getElementById("spread-title") as HTMLElement;
const spreadCloseEl = document.getElementById("spread-close") as HTMLButtonElement;
const tallyDrawnEl = document.getElementById("tally-drawn") as HTMLElement | null;
const tallyTotalEl = document.getElementById("tally-total") as HTMLElement | null;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let deck: Card[] = [];
let byId = new Map<number, Card>();
let bag: number[] = []; // ids not yet dealt this cycle; the top of the pile is the end
let order: number[] = []; // ids dealt this cycle, oldest first — the discard
let aside: number[] = []; // ids on the shelf; a bookmark, not a removal
let last: number | null = null; // id of the card currently face up
let busy = false;
let flips = 0; // parity decides which slot faces the viewer
let paper: Paper | null = null; // WebGL stock; null when unavailable
let angle = 0; // accumulated rotation in degrees
let tiltX = 0; // pointer parallax, degrees; zero on touch and reduced motion
let tiltY = 0;

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
      JSON.stringify({
        bag,
        order,
        aside,
        last,
        drawn: document.body.classList.contains("has-drawn"),
      })
    );
  } catch {
    /* storage unavailable (private mode) — the deck just won't remember */
  }
}

// Returning visitors must not watch the hint fade out again, so the
// has-drawn class has to land before first paint — synchronously, not
// after the deck fetch resolves. The settled class arms the hint's fade
// transition one frame later, so the initial state never animates. The
// entrance animation reuses the same signal: it runs only when has-drawn
// is absent, so a returning visitor never sees the card settle in.
const saved = loadState();
if (saved && saved.drawn) {
  document.body.classList.add("has-drawn");
} else if (!reducedMotion.matches) {
  document.body.classList.add("entrance");
  setTimeout(() => document.body.classList.remove("entrance"), 1300);
}
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

function refillBag(): void {
  bag = shuffled(deck.map((c) => c.id));
  order = []; // a fresh cycle: the discard is swept back into the deck
  keepTopFresh();
}

/* ---------- the stack beneath ---------- */

// How much bag is left, read as visible card edges. Derived from `bag`,
// which already persists — no new stored state, no storage version bump.
// Layer thresholds are front-loaded: the first few discards should visibly
// register, while the difference between 30 and 40 drawn does not need its
// own layer. A linear mapping would make the first ten draws look inert.
const DISCARD_STEPS = [1, 3, 6, 12, 24, 40];

const layersFor = (n: number): string => String(DISCARD_STEPS.filter((step) => n >= step).length);

function updateDeckDepth(): void {
  const ratio = deck.length === 0 ? 0 : bag.length / deck.length;
  deckEl.dataset.edges = String(ratio > 0.6 ? 3 : ratio > 0.3 ? 2 : 1);

  // The discard is now `order`, not `deck.length - bag.length`. The two agree
  // — every id leaves the bag exactly as it joins the order — but only
  // `order` also knows the SEQUENCE, which is what makes the pile browsable.
  const drawn = order.length;
  if (leftCountEl) leftCountEl.textContent = String(bag.length);
  if (drawnCountEl) drawnCountEl.textContent = String(drawn);
  if (asideCountEl) asideCountEl.textContent = String(aside.length);
  if (tallyDrawnEl) tallyDrawnEl.textContent = String(drawn);
  if (tallyTotalEl) tallyTotalEl.textContent = String(deck.length);
  if (discardEl) discardEl.dataset.layers = layersFor(drawn);
  if (asideEl) asideEl.dataset.layers = layersFor(aside.length);
  // The deck's mini pile thins on the same thresholds, read from the other
  // end, so the two piles are always legible as halves of one deck.
  if (deckMiniEl) deckMiniEl.dataset.layers = layersFor(bag.length);

  // An empty pile is not something you can pick up.
  if (discardOpenEl) discardOpenEl.disabled = drawn === 0;
  if (asideOpenEl) asideOpenEl.disabled = aside.length === 0;
}

/* ---------- the shelf ---------- */

// Set-aside is a bookmark, not a removal: the card stays in the cycle and the
// counts are untouched. Taking it out of play instead would mean refillBag
// had to exclude it, an all-aside deck would be unshuffleable, and "how many
// are left" would stop meaning one thing.
function updateKeep(): void {
  keepBtn.setAttribute("aria-pressed", String(last !== null && aside.includes(last)));
}

function toggleAside(): void {
  if (last === null || !byId.has(last)) return;
  const at = aside.indexOf(last);
  if (at >= 0) {
    aside.splice(at, 1);
    liveEl.textContent = "Taken off the shelf.";
  } else {
    aside.push(last);
    liveEl.textContent = "Set aside.";
  }
  updateKeep();
  updateDeckDepth();
  saveState();
}

/* ---------- picking a pile up ---------- */

// Newest on top, the way a pile you set down actually reads. Clicking an
// entry turns that card face up on the table; it does NOT deal it, so the
// bag and the discard are unchanged — you are looking through cards you
// already drew, not drawing again.
function openSpread(title: string, ids: number[]): void {
  spreadTitleEl.textContent = title;
  spreadListEl.textContent = "";

  for (const [i, id] of [...ids].reverse().entries()) {
    const card = byId.get(id);
    if (!card) continue; // edited out of cards.json since it was drawn
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "spread-card";
    btn.style.setProperty("--i", String(i));
    btn.append(card.text);
    const num = document.createElement("span");
    num.className = "spread-num";
    num.textContent = "#" + id;
    btn.append(num);
    btn.addEventListener("click", () => {
      spreadEl.close();
      last = id;
      keepTopFresh();
      show(id, { keepHint: true });
      updateKeep();
      saveState();
    });
    li.append(btn);
    spreadListEl.append(li);
  }

  if (!spreadListEl.children.length) {
    const p = document.createElement("p");
    p.className = "spread-empty";
    p.textContent = "These cards are no longer in the deck.";
    spreadListEl.append(p);
  }
  spreadEl.showModal();
}

function riffle(): void {
  if (reducedMotion.matches) return;
  deckStack.classList.remove("riffling");
  void deckStack.offsetWidth; // reflow, so re-adding the class restarts it
  deckStack.classList.add("riffling");
  setTimeout(() => deckStack.classList.remove("riffling"), RIFFLE_MS + 50);
}

/* ---------- faces ---------- */

function facingSlot(): HTMLElement {
  return flips % 2 === 0 ? faceA : faceB;
}

// The card's resting transform: the accumulated flip plus whatever the
// pointer parallax is asking for. Both live on .card-inner deliberately —
// it is the element .card's perspective is applied to, so a tilt here is
// projected in 3D, and the flip animation overrides the whole property
// while it runs, which means the two can never fight over it.
function applyRest(): void {
  inner.style.transform =
    tiltX || tiltY
      ? `rotateY(${angle + tiltY}deg) rotateX(${tiltX}deg)`
      : `rotateY(${angle}deg)`;
}

// Words become separate elements so they can arrive in sequence. The
// whitespace text nodes between them are kept, so textContent still reads as
// the original sentence — the share sheet, the aria-live region and the
// tests all depend on that.
function setWords(el: HTMLElement, text: string): HTMLElement[] {
  el.textContent = "";
  const parts = text.split(" ");
  return parts.map((word, i) => {
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = word;
    el.appendChild(span);
    if (i < parts.length - 1) el.appendChild(document.createTextNode(" "));
    return span;
  });
}

// Writes a card into a slot and moves the accessibility exposure with it.
// backface-visibility is purely visual — without this, a screen reader would
// announce both faces.
function writeFace(slot: HTMLElement, text: string): HTMLElement[] {
  const textEl = slot.querySelector(".card-text") as HTMLElement;
  const words = setWords(textEl, text);
  textEl.hidden = false;
  // The mark lives in face-a and is only needed before the first draw;
  // nothing ever turns the card back over.
  if (slot === faceA) markEl.hidden = true;
  faceA.setAttribute("aria-hidden", String(slot !== faceA));
  faceB.setAttribute("aria-hidden", String(slot !== faceB));
  document.body.classList.add("has-card");
  return words;
}

function show(id: number, { instant = false, keepHint = false } = {}): void {
  const card = byId.get(id);
  if (!card) return;
  if (!keepHint) document.body.classList.add("has-drawn");
  history.replaceState(null, "", "#" + id);
  liveEl.textContent = card.text;

  // A deep link arrives already face up: write into whichever slot is
  // currently facing the viewer rather than leaving the card mid-turn.
  if (instant || !inner.animate) {
    writeFace(facingSlot(), card.text);
    return;
  }

  if (reducedMotion.matches) {
    busy = true;
    inner
      .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: "ease-in" })
      .finished.then(() => {
        writeFace(facingSlot(), card.text);
        return inner.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 140,
          easing: "ease-out",
        }).finished;
      })
      .catch(() => writeFace(facingSlot(), card.text))
      .finally(() => {
        busy = false;
      });
    return;
  }

  busy = true;
  const incoming = flips % 2 === 0 ? faceB : faceA;
  const words = writeFace(incoming, card.text);
  flips += 1;

  const from = angle;
  angle += 180;
  // Settle the resting transform up front so the element holds the new angle
  // when the animation hands back; no fill mode needed.
  applyRest();

  cardBtn.classList.add("flipping");
  paper?.follow();

  // Accelerate into the turn, decelerate out of it, overshoot a few degrees
  // and settle. Per-keyframe easing: one easing across the whole iteration
  // would smear the overshoot into the turn.
  const flip = inner.animate(
    [
      {
        transform: `rotateY(${from}deg) translateZ(0px) scale(1)`,
        easing: "cubic-bezier(0.4, 0, 0.6, 0.55)",
      },
      {
        offset: 0.5,
        transform: `rotateY(${from + 90}deg) translateZ(18px) scale(1.018)`,
        easing: "cubic-bezier(0.3, 0.62, 0.3, 1)",
      },
      {
        // A settling object, not a bounce: 2.2deg is enough to read as weight
        // coming to rest. Past ~4deg it starts to look like a spring toy.
        offset: 0.84,
        transform: `rotateY(${angle + 2.2}deg) translateZ(4px) scale(1.003)`,
        easing: "cubic-bezier(0.33, 0, 0.25, 1)",
      },
      { offset: 1, transform: `rotateY(${angle}deg) translateZ(0px) scale(1)` },
    ],
    { duration: FLIP_MS }
  );

  // Elevation moves in two parts: the contact shadow pulls in and fades as
  // the card lifts, the ambient spreads and softens. One shadow cannot do
  // this — lift and spread change at different rates.
  shadowContact.animate(
    [
      { opacity: 1, transform: "scale(1)" },
      { offset: 0.5, opacity: 0.28, transform: "scale(0.93)" },
      { offset: 0.86, opacity: 0.94, transform: "scale(1.012)" },
      { opacity: 1, transform: "scale(1)" },
    ],
    { duration: FLIP_MS, easing: "ease-in-out" }
  );
  shadowAmbient.animate(
    [
      { opacity: 1, transform: "scale(1)" },
      { offset: 0.5, opacity: 0.78, transform: "scale(1.07)" },
      { opacity: 1, transform: "scale(1)" },
    ],
    { duration: FLIP_MS, easing: "ease-in-out" }
  );

  // The words land in sequence rather than the block appearing at once.
  // Budgeted against the longest card (12 words): the last one settles at
  // 0.40 * 460 + 11 * 15 + 160 = 509ms, inside the 560ms readable-text limit.
  // Widening the stagger past ~18ms breaks that, so it is a real constraint
  // and not a taste knob.
  words.forEach((word, i) =>
    word.animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "none" },
      ],
      {
        duration: WORD_MS,
        delay: FLIP_MS * 0.4 + i * WORD_STAGGER_MS,
        easing: "cubic-bezier(0.2, 0.7, 0.3, 1)",
        fill: "backwards",
      }
    )
  );

  flip.finished
    .catch(() => {
      /* interrupted — the resting transform above is already correct */
    })
    .finally(() => {
      cardBtn.classList.remove("flipping");
      paper?.settle();
      busy = false;
    });
}

function draw(): void {
  if (busy || deck.length === 0) return;
  // init() fills the bag before the first draw, so reaching zero HERE always
  // means the whole deck has been dealt. That makes the riffle self-
  // triggering: no separate reshuffle event to detect.
  if (bag.length === 0) {
    refillBag();
    riffle();
  }
  last = bag.pop()!;
  order.push(last); // straight from the bag onto the discard, in sequence
  show(last);
  updateDeckDepth();
  updateKeep();
  saveState();
}

/* ---------- throwing the card ---------- */

// Tap turns the card over where it lies. A throw does the same turn, but the
// card lunges the way you flicked it and swings back — one gesture, one
// draw. Detaching the two (fly off, then deal a replacement) would mean the
// flip had nothing to happen to, and the card would stop being one object.
const THROW_DISTANCE = 44; // px — past this, a drag was meant as a throw
const THROW_SPEED = 0.4; // px/ms — or a flick this fast, however short
let dragging = false;
let dragId = -1;
let dragX = 0;
let dragY = 0;
let dx = 0;
let dy = 0;
let lastMoveAt = 0;
let vx = 0;
let moved = false;

function dragTransform(x: number, y: number): string {
  // Rotation from horizontal displacement only: a card pushed sideways
  // pivots, a card pushed away from you does not.
  return `translate(${x}px, ${y}px) rotate(${(x * 0.045).toFixed(2)}deg)`;
}

function endDrag(throwIt: boolean): void {
  if (!dragging) return;
  dragging = false;
  cardBtn.classList.remove("dragging");
  const from = dragTransform(dx, dy);
  cardBtn.style.transform = "";

  if (!throwIt) {
    if (!reducedMotion.matches) {
      cardBtn.animate([{ transform: from }, { transform: "none" }], {
        duration: 340,
        easing: "cubic-bezier(0.22, 0.9, 0.3, 1)",
      });
    }
    return;
  }

  if (!reducedMotion.matches && cardBtn.animate) {
    // Peak displacement scales with how hard it was thrown, capped so a
    // violent flick cannot send the card off the table.
    const reach = Math.min(Math.abs(dx) + Math.abs(vx) * 110, 150) * Math.sign(dx || 1);
    cardBtn.animate(
      [
        { transform: from, easing: "cubic-bezier(0.32, 0, 0.6, 0.5)" },
        {
          offset: 0.38,
          transform: `translate(${reach.toFixed(1)}px, ${(dy * 0.5).toFixed(1)}px) rotate(${(reach * 0.05).toFixed(2)}deg)`,
          easing: "cubic-bezier(0.25, 0.65, 0.3, 1)",
        },
        { transform: "none" },
      ],
      { duration: FLIP_MS + 140 }
    );
  }
  draw();
}

function onPointerDown(e: PointerEvent): void {
  if (busy || e.button !== 0) return;
  dragging = true;
  moved = false;
  dragId = e.pointerId;
  dragX = e.clientX;
  dragY = e.clientY;
  dx = dy = vx = 0;
  lastMoveAt = e.timeStamp;
  cardBtn.setPointerCapture(e.pointerId);
  cardBtn.classList.add("dragging");
}

function onPointerMove(e: PointerEvent): void {
  if (!dragging || e.pointerId !== dragId) return;
  const nx = e.clientX - dragX;
  const dt = e.timeStamp - lastMoveAt;
  if (dt > 0) vx = (nx - dx) / dt;
  lastMoveAt = e.timeStamp;
  dx = nx;
  dy = e.clientY - dragY;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
  cardBtn.style.transform = dragTransform(dx, dy);
}

function onPointerUp(e: PointerEvent): void {
  if (!dragging || e.pointerId !== dragId) return;
  endDrag(Math.hypot(dx, dy) > THROW_DISTANCE || Math.abs(vx) > THROW_SPEED);
}

/* ---------- the paper at rest ---------- */

// The shader only ever drew while the card turned, which left the stock a
// frozen frame the rest of the time. Tilting the card a couple of degrees
// toward the pointer moves the specular band across it, so the sheet catches
// the light as you move — the difference between a photograph of paper and
// paper. Pointer-only: there is no hover on touch, and the flip already owns
// the transform whenever the card is mid-turn.
const TILT_Y = 3.2;
const TILT_X = 2.2;
let tiltIdle: ReturnType<typeof setTimeout> | undefined;

function onStageMove(e: PointerEvent): void {
  if (busy || dragging || e.pointerType !== "mouse") return;
  const r = cardBtn.getBoundingClientRect();
  const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
  const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
  tiltY = nx * TILT_Y;
  tiltX = -ny * TILT_X;
  applyRest();
  paper?.redraw();
  clearTimeout(tiltIdle);
  tiltIdle = setTimeout(releaseTilt, 2200);
}

function releaseTilt(): void {
  if (!tiltX && !tiltY) return;
  tiltX = tiltY = 0;
  applyRest();
  paper?.redraw();
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
    shareBtn.animate(
      [
        { opacity: 0, transform: "translateY(3px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 220, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }
    );
    clearTimeout(shareLabelTimer);
    shareLabelTimer = setTimeout(() => {
      shareBtn.textContent = shareLabel;
    }, 1800);
  } catch {
    /* no clipboard either (e.g. insecure context) — leave the label be */
  }
}

async function init(): Promise<void> {
  try {
    const res = await fetch("/cards.json");
    // Drafts are ids held open so the PRINTED deck reaches one of MPC's
    // fixed tiers. They carry no text and must never be dealt.
    deck = ((await res.json()) as Card[]).filter((c) => !c.draft);
  } catch {
    writeFace(facingSlot(), "The deck failed to load. Refresh to try again.");
    return;
  }
  byId = new Map(deck.map((c) => [c.id, c]));

  // Cards removed from cards.json since the last visit simply vanish from
  // every list; new cards join at the next reshuffle.
  const live = (id: unknown): id is number => typeof id === "number" && byId.has(id);
  if (saved && Array.isArray(saved.bag)) {
    bag = saved.bag.filter(live);
    last = live(saved.last) ? saved.last : null;
    aside = Array.isArray(saved.aside) ? [...new Set(saved.aside.filter(live))] : [];

    if (Array.isArray(saved.order)) {
      order = [...new Set(saved.order.filter(live))];
    } else {
      // Saved before the discard became browsable. The sequence was never
      // stored, but the SET is recoverable: anything in the deck and not in
      // the bag was dealt this cycle. So a returning visitor's discard is
      // faithful in content and arbitrary only in the middle of its order —
      // and the one position that is actually visible, the most recent card,
      // is the one position v1 did record.
      const inBag = new Set(bag);
      order = deck.map((c) => c.id).filter((id) => !inBag.has(id) && id !== last);
      if (last !== null) order.push(last);
      // Freeze it. The reconstruction reads cards.json's order for the part
      // it cannot know, so leaving it unsaved would let the discard reshuffle
      // itself every load if the file is ever reordered.
      saveState();
    }
  }
  if (bag.length === 0) refillBag();
  updateDeckDepth();
  updateKeep();

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

  // Progressive enhancement: the CSS grain layer stays if this returns null.
  if (!reducedMotion.matches) paper = mountPaper([faceA, faceB], inner);

  // pointerup fires before click, so a throw has already dealt by the time
  // the click arrives; and a drag that sprang back was not a tap either.
  cardBtn.addEventListener("click", () => {
    if (moved) {
      moved = false;
      return;
    }
    draw();
  });
  cardBtn.addEventListener("pointerdown", onPointerDown);
  cardBtn.addEventListener("pointermove", onPointerMove);
  cardBtn.addEventListener("pointerup", onPointerUp);
  cardBtn.addEventListener("pointercancel", () => endDrag(false));

  keepBtn.addEventListener("click", toggleAside);
  discardOpenEl?.addEventListener("click", () => openSpread("the discard", order));
  asideOpenEl?.addEventListener("click", () => openSpread("set aside", aside));
  spreadCloseEl.addEventListener("click", () => spreadEl.close());
  // Clicks on a modal dialog's backdrop are reported against the dialog.
  spreadEl.addEventListener("click", (e) => {
    if (e.target === spreadEl) spreadEl.close();
  });

  // Gated on motion preference and pointer type, NOT on the shader: the tilt
  // is a CSS transform and looks right against the CSS grain fallback too.
  // paper?.redraw() no-ops when WebGL is unavailable.
  if (!reducedMotion.matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    deckEl.addEventListener("pointermove", onStageMove);
    deckEl.addEventListener("pointerleave", releaseTilt);
  }

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

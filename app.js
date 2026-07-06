/*
 * Grasping Straws? — draw screen.
 * The bag: shuffle the whole deck, deal until empty, reshuffle so the first
 * card of the new bag never repeats the last card dealt. State persists in
 * localStorage so a returning visitor continues their deck.
 */
(() => {
  "use strict";

  const STORAGE_KEY = "grasping-straws.v1";
  const FLIP_MS = 400;

  const cardBtn = document.getElementById("card");
  const inner = document.getElementById("card-inner");
  const markEl = document.getElementById("card-mark");
  const textEl = document.getElementById("card-text");
  const liveEl = document.getElementById("live");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let deck = [];
  let byId = new Map();
  let bag = []; // ids not yet dealt this cycle; the top of the pile is the end
  let last = null; // id of the card currently face up
  let busy = false;

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  // Returning visitors must not watch the hint fade out again, so the
  // has-drawn class has to land before first paint — synchronously, not
  // after the deck fetch resolves.
  const saved = loadState();
  if (saved && saved.drawn) document.body.classList.add("has-drawn");
  requestAnimationFrame(() => document.body.classList.add("settled"));

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        bag,
        last,
        drawn: document.body.classList.contains("has-drawn")
      }));
    } catch {
      /* storage unavailable (private mode) — the deck just won't remember */
    }
  }

  function randInt(n) {
    if (window.crypto && crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      const limit = Math.floor(0x100000000 / n) * n;
      do {
        crypto.getRandomValues(buf);
      } while (buf[0] >= limit);
      return buf[0] % n;
    }
    return Math.floor(Math.random() * n);
  }

  function shuffled(ids) {
    const a = ids.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function keepTopFresh() {
    // The next deal must differ from the card currently face up.
    if (bag.length > 1 && bag[bag.length - 1] === last) {
      const j = randInt(bag.length - 1);
      [bag[bag.length - 1], bag[j]] = [bag[j], bag[bag.length - 1]];
    }
  }

  function refillBag() {
    bag = shuffled(deck.map((c) => c.id));
    keepTopFresh();
  }

  function setFace(id) {
    markEl.hidden = true;
    textEl.hidden = false;
    textEl.textContent = byId.get(id).text;
  }

  function show(id, { instant = false, keepHint = false } = {}) {
    if (!byId.has(id)) return;
    if (!keepHint) document.body.classList.add("has-drawn");
    history.replaceState(null, "", "#" + id);
    liveEl.textContent = byId.get(id).text;

    if (instant || !inner.animate) {
      setFace(id);
      return;
    }

    busy = true;
    const half = FLIP_MS / 2;
    const out = reducedMotion.matches
      ? inner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: "ease-in" })
      : inner.animate(
          [{ transform: "rotateY(0deg)" }, { transform: "rotateY(90deg)" }],
          { duration: half, easing: "cubic-bezier(0.45, 0, 0.85, 0.6)" }
        );
    out.finished
      .then(() => {
        setFace(id);
        return reducedMotion.matches
          ? inner.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: "ease-out" }).finished
          : inner.animate(
              [{ transform: "rotateY(-90deg)" }, { transform: "rotateY(0deg)" }],
              { duration: half, easing: "cubic-bezier(0.15, 0.4, 0.35, 1)" }
            ).finished;
      })
      .catch(() => setFace(id))
      .finally(() => {
        busy = false;
      });
  }

  function draw() {
    if (busy || deck.length === 0) return;
    if (bag.length === 0) refillBag();
    last = bag.pop();
    show(last);
    saveState();
  }

  async function init() {
    try {
      const res = await fetch("cards.json");
      deck = await res.json();
    } catch {
      markEl.hidden = true;
      textEl.hidden = false;
      textEl.textContent = "The deck failed to load. Refresh to try again.";
      return;
    }
    byId = new Map(deck.map((c) => [c.id, c]));

    if (saved && Array.isArray(saved.bag)) {
      // Cards removed from cards.json since the last visit simply vanish
      // from the bag; new cards join at the next reshuffle.
      bag = saved.bag.filter((id) => byId.has(id));
      last = byId.has(saved.last) ? saved.last : null;
    }
    if (bag.length === 0) refillBag();

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
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();

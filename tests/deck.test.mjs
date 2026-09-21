// The deck's interface is its test surface: no DOM, no storage, no browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { openDeck, layersFor, edgesFor, PILE_STEPS } from "../src/deck/deck.ts";

const cards = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, text: `card ${i + 1}` }));

// A small deterministic generator so a test that fails can be rerun exactly.
const seeded = (seed = 1) => {
  let s = seed >>> 0;
  return (n) => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s % n;
  };
};

test("a fresh deck has everything in the bag and nothing dealt", () => {
  const deck = openDeck(cards(48), null, seeded());
  assert.deepEqual(deck.counts(), { left: 48, drawn: 0, aside: 0, total: 48 });
  assert.equal(deck.last, null);
  assert.equal(deck.edges(), 3);
});

test("a full cycle deals every card exactly once", () => {
  const deck = openDeck(cards(48), null, seeded(7));
  const seen = [];
  for (let i = 0; i < 48; i++) {
    const { card, reshuffled } = deck.draw();
    assert.equal(reshuffled, false, `draw ${i + 1} should not reshuffle`);
    seen.push(card.id);
  }
  assert.equal(new Set(seen).size, 48);
  assert.deepEqual(deck.counts(), { left: 0, drawn: 48, aside: 0, total: 48 });
  assert.deepEqual([...deck.order], seen);
});

test("the reshuffle happens on the draw after the bag empties, and never repeats the face-up card", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const deck = openDeck(cards(12), null, seeded(seed));
    let lastDealt = null;
    for (let i = 0; i < 12; i++) lastDealt = deck.draw().card.id;
    const next = deck.draw();
    assert.equal(next.reshuffled, true);
    assert.notEqual(next.card.id, lastDealt, `seed ${seed}: the new cycle opened with the card already face up`);
    assert.deepEqual(deck.counts(), { left: 11, drawn: 1, aside: 0, total: 12 });
  }
});

test("drawn plus left always equals the deck", () => {
  const deck = openDeck(cards(20), null, seeded(3));
  for (let i = 0; i < 50; i++) {
    deck.draw();
    const c = deck.counts();
    assert.equal(c.left + c.drawn, c.total);
  }
});

test("the stack thins by the ratio of the bag, front-loaded piles by fixed steps", () => {
  assert.equal(edgesFor(48, 48), 3);
  assert.equal(edgesFor(29, 48), 3);
  assert.equal(edgesFor(28, 48), 2);
  assert.equal(edgesFor(15, 48), 2);
  assert.equal(edgesFor(14, 48), 1);
  assert.equal(edgesFor(0, 0), 1);
  assert.equal(layersFor(0), 0);
  assert.equal(layersFor(1), 1);
  assert.equal(layersFor(5), 2);
  assert.equal(layersFor(6), 3);
  assert.equal(layersFor(40), PILE_STEPS.length);
});

test("turning a card up does not deal, and keeps the next deal fresh", () => {
  for (let seed = 1; seed <= 100; seed++) {
    const deck = openDeck(cards(6), null, seeded(seed));
    const before = deck.counts();
    // Turn up whatever sits on top of the bag: the worst case for freshness.
    const top = deck.serialize().bag.at(-1);
    assert.equal(deck.turnUp(top).id, top);
    assert.deepEqual(deck.counts(), before);
    assert.notEqual(deck.draw().card.id, top, `seed ${seed}`);
  }
});

test("an unknown id cannot be turned up", () => {
  const deck = openDeck(cards(4), null, seeded());
  assert.equal(deck.turnUp(999), null);
  assert.equal(deck.turnUp("2"), null);
  assert.equal(deck.turnUp(NaN), null);
  assert.equal(deck.last, null);
});

test("the shelf is a bookmark: kept cards stay in the cycle and the counts are untouched", () => {
  const deck = openDeck(cards(10), null, seeded(5));
  const { card } = deck.draw();
  const before = deck.counts();
  assert.equal(deck.toggleAside(), "kept");
  assert.ok(deck.isAside(card.id));
  assert.deepEqual(deck.counts(), { ...before, aside: 1 });
  assert.equal(deck.toggleAside(), "released");
  assert.deepEqual(deck.counts(), before);
  assert.deepEqual([...deck.aside], []);
});

test("nothing face up means nothing to shelve", () => {
  const deck = openDeck(cards(3), null, seeded());
  assert.equal(deck.toggleAside(), null);
});

test("the saved shape round-trips exactly", () => {
  const a = openDeck(cards(30), null, seeded(9));
  for (let i = 0; i < 7; i++) a.draw();
  a.toggleAside();
  const b = openDeck(cards(30), a.serialize(), seeded(1));
  assert.deepEqual(b.serialize(), a.serialize());
  assert.deepEqual(b.counts(), a.counts());
});

test("cards edited out of the deck vanish from every pile; new cards join at the next reshuffle", () => {
  const a = openDeck(cards(10), null, seeded(2));
  for (let i = 0; i < 4; i++) a.draw();
  a.toggleAside();
  const saved = a.serialize();
  const gone = saved.last; // the shelved, face-up card is removed from cards.json
  const smaller = cards(11).filter((c) => c.id !== gone); // and one new card (11) appears
  const b = openDeck(smaller, saved, seeded(2));
  const s = b.serialize();
  assert.ok(!s.bag.includes(gone) && !s.order.includes(gone) && !s.aside.includes(gone));
  assert.equal(s.last, null);
  assert.ok(!s.bag.includes(11), "a new card waits for the reshuffle");
  const drawnAll = new Set();
  let reshuffled = false;
  while (!reshuffled) {
    const d = b.draw();
    reshuffled = d.reshuffled;
    if (!reshuffled) drawnAll.add(d.card.id);
  }
  assert.equal(drawnAll.size, s.bag.length);
  assert.equal(b.counts().total, 10);
});

test("a v1 shape (bag and last only) has its discard rebuilt, face-up card last", () => {
  const all = cards(20);
  const bag = all.slice(5).map((c) => c.id); // 1..5 already dealt
  const deck = openDeck(all, { bag, last: 5, drawn: true }, seeded());
  const s = deck.serialize();
  assert.deepEqual(s.bag, bag);
  assert.equal(s.order.length, 5);
  assert.equal(s.order.at(-1), 5);
  assert.deepEqual(new Set(s.order), new Set([1, 2, 3, 4, 5]));
  assert.deepEqual(s.aside, []);
  assert.deepEqual(deck.counts(), { left: 15, drawn: 5, aside: 0, total: 20 });
});

test("garbage in storage is the same as nothing in storage", () => {
  for (const junk of [undefined, null, 42, "x", [], { bag: "nope" }, { bag: [null, "3", 9999] }]) {
    const deck = openDeck(cards(8), junk, seeded());
    assert.deepEqual(deck.counts(), { left: 8, drawn: 0, aside: 0, total: 8 });
  }
});

test("a saved empty bag refills rather than dealing nothing", () => {
  const all = cards(5);
  const deck = openDeck(all, { bag: [], order: [1, 2, 3, 4, 5], aside: [], last: 5 }, seeded(4));
  assert.equal(deck.counts().left, 5);
  assert.notEqual(deck.draw().card.id, 5);
});

test("an empty deck deals nothing", () => {
  const deck = openDeck([], null, seeded());
  assert.equal(deck.draw(), null);
  assert.equal(deck.edges(), 1);
});

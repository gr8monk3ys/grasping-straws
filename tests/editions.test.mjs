// The editions as the printer will receive them: whole tiers, ids that
// never collide, and nothing printed that the palette does not name.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { EDITIONS, edition } from "../src/deck/editions.ts";
import { NIGHT, PAPER } from "../src/deck/palette.ts";
import { DECK_SIZES } from "../scripts/card-spec.js";

const read = (ed) => JSON.parse(fs.readFileSync(new URL(`../${ed.file}`, import.meta.url), "utf8"));
const all = Object.values(EDITIONS);

test("every edition is 54 faces, which the printer sells a deck for", () => {
  assert.equal(DECK_SIZES.find((n) => n >= 54), 55, "the deck it is ordered as");
  for (const ed of all) {
    assert.equal(read(ed).length + 2, 54, ed.name); // 52 cards, a title, instructions
    assert.equal(ed.ids[1] - ed.ids[0] + 1, 52, ed.name);
  }
});

test("a card's id sits inside its edition's range", () => {
  for (const ed of all) {
    const stray = read(ed).filter((c) => c.id < ed.ids[0] || c.id > ed.ids[1]);
    assert.deepEqual(stray, [], ed.name);
  }
});

test("no id is claimed by two editions", () => {
  const ids = all.flatMap((ed) => read(ed).map((c) => c.id));
  assert.equal(new Set(ids).size, ids.length);
  const [a, b] = all.map((ed) => ed.ids);
  assert.ok(a[1] < b[0] || b[1] < a[0], "id ranges overlap");
});

test("the site's deck is the Paper edition's file", () => {
  assert.equal(EDITIONS.paper.file, "public/cards.json");
  assert.ok(!EDITIONS.night.file.startsWith("public/"), "the Night deck must not be served");
});

test("each edition is printed in its own palette", () => {
  assert.equal(EDITIONS.paper.palette, PAPER);
  assert.equal(EDITIONS.night.palette, NIGHT);
  assert.equal(EDITIONS.paper.reversed, false);
  assert.equal(EDITIONS.night.reversed, true);
});

test("edition() defaults to Paper and refuses a name it does not know", () => {
  assert.equal(edition(undefined), EDITIONS.paper);
  assert.equal(edition("night"), EDITIONS.night);
  assert.throws(() => edition("dusk"), /unknown edition/);
});

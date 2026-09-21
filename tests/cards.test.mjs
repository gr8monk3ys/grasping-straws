// One declaration of "a card", held to the deck the site actually ships.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { liveCards, draftSlots, isDraft, CARD_KEYS } from "../src/deck/cards.ts";

const entries = JSON.parse(fs.readFileSync(new URL("../public/cards.json", import.meta.url), "utf8"));

test("live cards and draft slots partition cards.json", () => {
  const live = liveCards(entries);
  const drafts = draftSlots(entries);
  assert.equal(live.length + drafts.length, entries.length);
  assert.ok(live.every((c) => typeof c.text === "string" && c.text.trim() !== ""));
  assert.ok(drafts.every((d) => d.draft === true));
  assert.ok(live.every((c) => !isDraft(c)));
});

test("only draft: true marks a draft", () => {
  assert.equal(isDraft({ id: 1, draft: true }), true);
  assert.equal(isDraft({ id: 1, draft: false }), false);
  assert.equal(isDraft({ id: 1, draft: "true" }), false);
  assert.equal(isDraft({ id: 1, text: "x" }), false);
  assert.equal(isDraft(null), false);
  assert.equal(isDraft("draft"), false);
});

test("cards.json carries no key the declaration does not know", () => {
  const unknown = entries.flatMap((e) => Object.keys(e).filter((k) => !CARD_KEYS.includes(k)));
  assert.deepEqual(unknown, []);
});

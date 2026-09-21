// The tap-to-readable budget, checked here in Node rather than only by
// driving Chromium; and the stylesheet held to the same numbers.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  FLIP_MS,
  RIFFLE_MS,
  WORD_STAGGER_MS,
  STAGGER_ENVELOPE_MS,
  READABLE_BUDGET_MS,
  staggerGap,
  wordsReadyAt,
} from "../src/deck/motion.ts";
import { liveCards } from "../src/deck/cards.ts";

const css = fs.readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");
const entries = JSON.parse(fs.readFileSync(new URL("../public/cards.json", import.meta.url), "utf8"));

test("short cards keep the full beat, long cards share one envelope", () => {
  assert.equal(staggerGap(1), 0);
  assert.equal(staggerGap(2), WORD_STAGGER_MS);
  assert.equal(staggerGap(9), WORD_STAGGER_MS);
  for (let n = 10; n <= 40; n++) {
    assert.ok(staggerGap(n) < WORD_STAGGER_MS);
    assert.ok(Math.abs(staggerGap(n) * (n - 1) - STAGGER_ENVELOPE_MS) < 1e-9, `${n} words fill the envelope`);
  }
});

test("every card in the deck lands its last word inside the budget, with headroom for frame overhead", () => {
  const longest = Math.max(...liveCards(entries).map((c) => c.text.split(" ").length));
  const worst = wordsReadyAt(longest);
  assert.ok(worst <= READABLE_BUDGET_MS - 100, `${longest} words ready at ${worst}ms nominal`);
});

test("the stylesheet's timing matches the script's", () => {
  assert.match(css, new RegExp(`--flip-ms: ${FLIP_MS}ms;`));
  assert.match(css, new RegExp(`animation: riffle ${RIFFLE_MS / 1000}s`));
});

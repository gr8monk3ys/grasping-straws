/*
 * Validates public/cards.json so a hand-editing slip (trailing comma,
 * duplicate id, empty text) is caught in CI instead of breaking the deck
 * at runtime.
 * Usage: node scripts/validate-cards.js
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(here, "..", "public", "cards.json");
const errors = [];
const warnings = [];

let deck;
try {
  deck = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (e) {
  console.error(`cards.json is not valid JSON: ${e.message}`);
  process.exit(1);
}

if (!Array.isArray(deck)) {
  console.error("cards.json must be an array of card objects.");
  process.exit(1);
}

const seen = new Set();
const drafted = [];
deck.forEach((card, i) => {
  const where = `card at index ${i}${card && card.id != null ? ` (id ${card.id})` : ""}`;
  if (typeof card !== "object" || card === null) {
    errors.push(`${where}: not an object`);
    return;
  }
  if (!Number.isInteger(card.id) || card.id < 1) {
    errors.push(`${where}: "id" must be a positive integer`);
  } else if (seen.has(card.id)) {
    errors.push(`${where}: duplicate id — share links (#${card.id}) must stay unambiguous`);
  } else {
    seen.add(card.id);
  }
  // A draft is a reserved slot: an id claimed so the printed deck reaches a
  // whole tier, with the text still to write. Drafts are filtered out of the
  // site deck and hard-block `npm run print`, so an empty text is legal here
  // and nowhere else.
  if (card.draft === true) {
    if (typeof card.text === "string" && card.text.trim() !== "") {
      errors.push(
        `${where}: has text but is still marked "draft": true — delete the "draft" and "note" keys to publish it`
      );
    }
    drafted.push(card);
  } else if (typeof card.text !== "string" || card.text.trim() === "") {
    errors.push(`${where}: "text" must be a non-empty string`);
  }
  // These get set in Fraunces at 24pt on physical card stock, where a
  // typewriter apostrophe is conspicuous. Caught here rather than fixed at
  // render time so the site and the printed deck never disagree.
  if (typeof card.text === "string" && /['"]/.test(card.text)) {
    errors.push(`${where}: use typographic quotes (’ “ ”), not ' or "`);
  }
  if ("suit" in card && typeof card.suit !== "string") {
    errors.push(`${where}: optional "suit" must be a string`);
  }
  if ("draft" in card && card.draft !== true) {
    errors.push(`${where}: "draft" may only be true — remove the key rather than setting it false`);
  }
  for (const key of Object.keys(card)) {
    if (!["id", "text", "suit", "draft", "note"].includes(key)) {
      warnings.push(`${where}: unknown key "${key}" (harmless — never rendered)`);
    }
  }
});

const live = deck.length - drafted.length;
if (live < 2) {
  errors.push("deck needs at least 2 written cards for the reshuffle guarantee to mean anything");
} else if (live < 40 || live > 64) {
  warnings.push(`deck has ${live} written cards; the PRD aims for 40-64`);
}

if (drafted.length) {
  console.log(
    `\n${drafted.length} card slot${drafted.length === 1 ? "" : "s"} reserved for the printed deck, still unwritten:\n` +
      drafted
        .map((c) => `  #${c.id}  ${c.suit ?? "—"}\n      ${c.note ?? "no brief"}`)
        .join("\n") +
      `\nThese never reach the site. Fill in "text", then delete "draft" and "note".\n`
  );
}

warnings.forEach((w) => console.warn(`warning: ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`));
  process.exit(1);
}
console.log(
  `cards.json OK — ${live} cards live on the site` +
    (drafted.length ? `, ${drafted.length} reserved for print` : "") +
    `, ids unique.`
);

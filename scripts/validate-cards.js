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
  if (typeof card.text !== "string" || card.text.trim() === "") {
    errors.push(`${where}: "text" must be a non-empty string`);
  }
  if ("suit" in card && typeof card.suit !== "string") {
    errors.push(`${where}: optional "suit" must be a string`);
  }
  for (const key of Object.keys(card)) {
    if (!["id", "text", "suit"].includes(key)) {
      warnings.push(`${where}: unknown key "${key}" (harmless — never rendered)`);
    }
  }
});

if (deck.length < 2) {
  errors.push("deck needs at least 2 cards for the reshuffle guarantee to mean anything");
} else if (deck.length < 40 || deck.length > 64) {
  warnings.push(`deck has ${deck.length} cards; the PRD aims for 40-64`);
}

warnings.forEach((w) => console.warn(`warning: ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`));
  process.exit(1);
}
console.log(`cards.json OK — ${deck.length} cards, ids unique.`);

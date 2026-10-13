/*
 * Validates every edition's card file so a hand-editing slip (trailing
 * comma, duplicate id, empty text) is caught in CI instead of breaking the
 * deck at runtime or reaching a printer.
 * Usage: node scripts/validate-cards.js
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CARD_KEYS, draftSlots, liveCards } from "../src/deck/cards.ts";
import { EDITIONS } from "../src/deck/editions.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const errors = [];
const warnings = [];
const summaries = [];

// One id names one card across every edition: the number printed on a card
// is also its share link, so two decks may never both claim it.
const seen = new Map();

function validate(ed) {
  const name = path.basename(ed.file);
  let deck;
  try {
    deck = JSON.parse(fs.readFileSync(path.join(here, "..", ed.file), "utf8"));
  } catch (e) {
    console.error(`${name} is not valid JSON: ${e.message}`);
    process.exit(1);
  }

  if (!Array.isArray(deck)) {
    console.error(`${name} must be an array of card objects.`);
    process.exit(1);
  }

  const drafted = [];
  deck.forEach((card, i) => {
    const where = `${name}: card at index ${i}${card && card.id != null ? ` (id ${card.id})` : ""}`;
    if (typeof card !== "object" || card === null) {
      errors.push(`${where}: not an object`);
      return;
    }
    if (!Number.isInteger(card.id) || card.id < 1) {
      errors.push(`${where}: "id" must be a positive integer`);
    } else if (seen.has(card.id)) {
      errors.push(
        `${where}: duplicate id, already used in ${seen.get(card.id)} — share links (#${card.id}) must stay unambiguous`
      );
    } else {
      seen.set(card.id, name);
      if (card.id < ed.ids[0] || card.id > ed.ids[1]) {
        errors.push(`${where}: outside the ${ed.name}’s id range ${ed.ids[0]}–${ed.ids[1]}`);
      }
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
    // House style for the deck: no em dashes anywhere in printed text. A card
    // that wants one wants a colon, a comma, or two sentences.
    if (typeof card.text === "string" && card.text.includes("—")) {
      errors.push(`${where}: no em dashes in the deck. Use a colon, a comma or a second sentence`);
    }
    if ("suit" in card && typeof card.suit !== "string") {
      errors.push(`${where}: optional "suit" must be a string`);
    }
    if ("draft" in card && card.draft !== true) {
      errors.push(`${where}: "draft" may only be true — remove the key rather than setting it false`);
    }
    for (const key of Object.keys(card)) {
      if (!CARD_KEYS.includes(key)) {
        warnings.push(`${where}: unknown key "${key}" (harmless — never rendered)`);
      }
    }
  });

  // Counted by the site's own rule, so what this reports is what the deck deals.
  const live = liveCards(deck).length;
  if (drafted.length !== draftSlots(deck).length) {
    errors.push(`${name}: the validator and the site disagree about which entries are drafts`);
  }
  if (live < 2) {
    errors.push(`${name}: needs at least 2 written cards for the reshuffle guarantee to mean anything`);
  } else if (live < 40 || live > 64) {
    warnings.push(`${name}: has ${live} written cards; the PRD aims for 40-64`);
  }

  if (drafted.length) {
    console.log(
      `\n${name}: ${drafted.length} card slot${drafted.length === 1 ? "" : "s"} reserved for the printed deck, still unwritten:\n` +
        drafted
          .map((c) => `  #${c.id}  ${c.suit ?? "—"}\n      ${c.note ?? "no brief"}`)
          .join("\n") +
        `\nThese never reach the site. Fill in "text", then delete "draft" and "note".\n`
    );
  }

  summaries.push(
    `${name} OK — ${live} cards written` + (drafted.length ? `, ${drafted.length} reserved for print` : "")
  );
}

Object.values(EDITIONS).forEach(validate);

warnings.forEach((w) => console.warn(`warning: ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`));
  process.exit(1);
}
summaries.forEach((line) => console.log(line));
console.log(`ids unique across ${summaries.length} editions.`);

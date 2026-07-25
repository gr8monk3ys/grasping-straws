/*
 * Guards the one duplication in the project.
 *
 * Every other text in Grasping Straws has a single source: the cards come
 * from public/cards.json, the mark from public/favicon.svg. The games are
 * the exception — full prose on /play/, condensed on the printed rules
 * cards — because a tarot card cannot hold a paragraph. Two texts of the
 * same five games will drift, and the printed set is the copy nobody
 * re-reads, so CI checks that the two at least describe the same games.
 *
 * What this enforces: the set of game titles matches, in the same order.
 * What it deliberately does not: the wording of the rules themselves. The
 * condensed text is supposed to differ; policing it would just mean
 * turning the guard off.
 *
 * Usage: node scripts/validate-rules.js
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RULES_CARDS } from "./rules-cards.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const playPage = path.join(here, "..", "src", "pages", "play.astro");

// Games on the page are <h2>Title <span class="players">…</span></h2>.
// "House rules" is the closing section, not a game, so it has no players
// span and drops out of the match.
const html = fs.readFileSync(playPage, "utf8");
const pageTitles = [...html.matchAll(/<h2>([^<]+?)\s*<span class="players">/g)].map((m) =>
  m[1].trim().replaceAll("&amp;", "&")
);

const cardTitles = RULES_CARDS.map((c) => c.title);
const errors = [];

if (pageTitles.length === 0) {
  errors.push(
    "found no games on /play/ — the <h2>Title <span class=\"players\"> shape this " +
      "parser depends on has changed, so the guard is no longer guarding anything"
  );
}

const missingFromCards = pageTitles.filter((t) => !cardTitles.includes(t));
const missingFromPage = cardTitles.filter((t) => !pageTitles.includes(t));

for (const t of missingFromCards) {
  errors.push(`"${t}" is on /play/ but has no printed rules card (add it to scripts/rules-cards.js)`);
}
for (const t of missingFromPage) {
  errors.push(`"${t}" has a printed rules card but is not on /play/ (add it to src/pages/play.astro)`);
}

if (!errors.length && pageTitles.join("|") !== cardTitles.join("|")) {
  errors.push(
    `same games, different order — page: ${pageTitles.join(", ")}; cards: ${cardTitles.join(", ")}. ` +
      "The printed deck is read in order; keep the two sequences identical."
  );
}

if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`));
  process.exit(1);
}
console.log(`rules cards OK — ${cardTitles.length} games, page and printed deck agree.`);

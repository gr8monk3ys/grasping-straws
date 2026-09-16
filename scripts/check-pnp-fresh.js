/*
 * Fails if public/print-and-play.pdf is older than the cards it prints.
 * See scripts/pnp-stamp.js for why the PDF is committed at all.
 *
 *   node scripts/check-pnp-fresh.js
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pnpStamp, STAMP_PATH } from "./pnp-stamp.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const pdf = path.join(here, "..", "public", "print-and-play.pdf");

const fail = (msg) => {
  console.error(`\n${msg}\n\nRegenerate it:  npm run pnp\n`);
  process.exit(1);
};

if (!fs.existsSync(pdf)) fail("public/print-and-play.pdf is missing.");
if (!fs.existsSync(STAMP_PATH)) fail("scripts/pnp-stamp.json is missing.");

const stamp = JSON.parse(fs.readFileSync(STAMP_PATH, "utf8"));
const now = pnpStamp();

if (stamp.sha256 !== now.sha256) {
  fail(
    "public/print-and-play.pdf is stale — the cards, the rules cards or the\n" +
      "generator changed since it was rendered, so the free deck no longer\n" +
      "matches the site."
  );
}

const bytes = fs.statSync(pdf).size;
if (bytes !== stamp.bytes) {
  fail(`public/print-and-play.pdf is ${bytes} bytes; the stamp records ${stamp.bytes}.`);
}

console.log(
  `print-and-play.pdf OK — ${stamp.faces} faces, ${(bytes / 1024).toFixed(0)} KB, in step with cards.json.`
);

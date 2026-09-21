/*
 * What public/print-and-play.pdf was made from.
 *
 * The PDF is a generated artifact that is nevertheless committed: the site
 * is static files on a host with no browser, so the free deck cannot be
 * rendered on request, and a 300 KB asset the About page links to has to
 * exist in the repo the way the fonts and og.png do.
 *
 * The cost of committing generated output is that it drifts: someone edits
 * a card, the site updates at the next build, and the PDF quietly keeps
 * handing out last month's deck. So the generator records a hash of its
 * inputs and CI checks it (scripts/check-pnp-fresh.js). PDFs are not
 * byte-reproducible — they carry ids and dates — so the inputs are hashed,
 * not the output.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

export const STAMP_PATH = path.join(here, "pnp-stamp.json");

// The card texts (drafts excluded — the PDF does not print them), the rules
// cards, and the generator itself. Anything that changes a printed face.
const INPUTS = ["public/cards.json", "scripts/rules-cards.js", "scripts/print-and-play.js"];

export function pnpStamp() {
  const h = crypto.createHash("sha256");
  for (const rel of INPUTS) {
    if (rel === "public/cards.json") {
      const live = JSON.parse(fs.readFileSync(path.join(root, rel), "utf8")).filter((c) => !c.draft);
      h.update(JSON.stringify(live.map((c) => [c.id, c.text])));
    } else {
      h.update(fs.readFileSync(path.join(root, rel)));
    }
  }
  return { inputs: INPUTS, sha256: h.digest("hex") };
}

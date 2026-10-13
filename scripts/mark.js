/*
 * The straw-bundle mark as inline SVG in a colour of the caller's choosing.
 *
 * public/favicon.svg colours itself through a <style> block with a
 * prefers-color-scheme branch. Inlined into a page that is wrong twice over:
 * the classes are document-wide, so the last mark on a page recolours every
 * other one, and a browser reporting dark mode would print a pale mark on
 * pale stock. The style block is dropped and the colour is written onto the
 * shapes themselves.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "favicon.svg");
const svg = fs.readFileSync(file, "utf8");

const bare = svg.replace(/<style>[\s\S]*?<\/style>/, "").replace(/<!--[\s\S]*?-->/g, "");
if (bare === svg || !bare.includes('class="stroke"') || !bare.includes('class="fill"')) {
  throw new Error("favicon.svg no longer has the <style>, .stroke and .fill this script recolours");
}

export const mark = (color) =>
  bare.replaceAll('class="stroke"', `stroke="${color}"`).replaceAll('class="fill"', `fill="${color}"`);

/*
 * Where public/ is. The print scripts run from scripts/, so it is one level
 * up from this file. The site build also imports the box art and the mark
 * (src/pages/get.astro), and there this module is bundled into dist/, where
 * "one level up" is somewhere else: the working directory is the repo then.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const beside = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

export const PUBLIC = fs.existsSync(path.join(beside, "favicon.svg")) ? beside : path.join(process.cwd(), "public");

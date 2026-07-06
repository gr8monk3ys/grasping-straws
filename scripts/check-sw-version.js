/*
 * Fails CI when a precached asset changed but sw.js VERSION didn't — a stale
 * VERSION means offline visitors keep old files forever. Compares HEAD
 * against the merge-base with the base branch (GITHUB_BASE_REF on PRs,
 * origin/main otherwise). Requires a full clone (fetch-depth: 0).
 * Usage: node scripts/check-sw-version.js
 */
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const git = (cmd) => execSync(`git ${cmd}`, { cwd: root, encoding: "utf8" });

const base = `origin/${process.env.GITHUB_BASE_REF || "main"}`;

let baseSw;
try {
  baseSw = git(`show ${base}:sw.js`);
} catch {
  console.log(`sw.js does not exist on ${base} — nothing to compare, OK.`);
  process.exit(0);
}

const headSw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const versionOf = (src) => (src.match(/const VERSION = "([^"]+)"/) || [])[1];
const assetsOf = (src) =>
  [...src.matchAll(/^\s*"([^"]+)",?\s*$/gm)].map((m) => (m[1] === "./" ? "index.html" : m[1]));

const changed = git(`diff --name-only ${base}...HEAD`).split("\n").filter(Boolean);
const touchedAssets = changed.filter((f) => assetsOf(headSw).includes(f));

if (touchedAssets.length === 0) {
  console.log("No precached assets changed — sw.js VERSION may stay put.");
  process.exit(0);
}
if (versionOf(baseSw) !== versionOf(headSw)) {
  console.log(`Assets changed (${touchedAssets.join(", ")}) and VERSION was bumped: ${versionOf(baseSw)} -> ${versionOf(headSw)}. OK.`);
  process.exit(0);
}
console.error(
  `error: these precached assets changed but sw.js VERSION is still "${versionOf(headSw)}":\n` +
    touchedAssets.map((f) => `  - ${f}`).join("\n") +
    "\nBump VERSION in sw.js so offline visitors pick up the new files."
);
process.exit(1);

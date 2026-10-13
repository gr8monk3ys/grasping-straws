// One palette, written out by hand in four places that cannot import it:
// the stylesheet, the manifest, the theme-color metas and the theme toggle.
// Each is held to src/deck/palette.ts here, so editing one side only fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { NIGHT, PAPER } from "../src/deck/palette.ts";

const read = (rel) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");

// Which palette role each custom property carries. A property that is not
// listed (--spine, the shadows, the grain) is derived in the stylesheet and
// is only required to be the same in both dark blocks.
const ROLES = {
  "--bg": "ground",
  "--card": "card",
  "--ink": "ink",
  "--muted": "muted",
  "--accent": "accent",
  "--accent-strong": "accent",
  "--moss": "moss",
  "--line": "hairline",
  "--rule": "hairline",
  "--edge-face": "tinted",
};

const css = read("src/styles/global.css")
  .replace(/\/\*[\s\S]*?\*\//g, "") // comments name old and foreign colours freely
  .replace(/url\([^)]*\)/g, "url()"); // a data: URL is not a declaration

// The text between the braces of the first rule whose selector matches.
function body(source, selector, label) {
  const found = selector.exec(source);
  assert.ok(found, `global.css has no ${label} block`);
  const open = source.indexOf("{", found.index);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}" && --depth === 0) return source.slice(open + 1, i);
  }
  assert.fail(`the ${label} block in global.css never closes`);
}

const props = (block) =>
  Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]));

const lightBody = body(css, /:root\s*\{/, "light :root");
const mediaBody = body(
  body(css, /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{/, "prefers-color-scheme: dark"),
  /:root:not\(\[data-theme="light"\]\)\s*\{/,
  'dark :root:not([data-theme="light"])'
);
const attrBody = body(css, /:root\[data-theme="dark"\]\s*\{/, 'dark :root[data-theme="dark"]');

const blocks = [
  ["the light block", props(lightBody), PAPER],
  ["the dark media-query block", props(mediaBody), NIGHT],
  ['the dark [data-theme="dark"] block', props(attrBody), NIGHT],
];

for (const [name, declared, palette] of blocks) {
  test(`${name} of global.css carries the palette`, () => {
    for (const [prop, role] of Object.entries(ROLES)) {
      assert.equal(
        declared[prop],
        palette[role].toLowerCase(),
        `${prop} in ${name} should be the palette's ${role}`
      );
    }
  });
}

test("the two dark blocks of global.css are identical", () => {
  // Every property, not only the mapped ones: the media query is the no-JS
  // default and the attribute is the toggle, and a visitor must not be able
  // to tell which of the two gave them their dark theme.
  assert.deepEqual(blocks[1][1], blocks[2][1]);
});

test("the dark blocks redefine every colour the light block defines", () => {
  const missing = Object.keys(ROLES).filter((p) => !(p in blocks[1][1]) || !(p in blocks[2][1]));
  assert.deepEqual(missing, []);
});

test("no rule in global.css names a colour of its own", () => {
  // Outside the three token blocks a colour is a var(). A hex written into a
  // rule is a colour the palette does not know about and no test can hold.
  const rules = [lightBody, mediaBody, attrBody].reduce((s, b) => s.replace(b, ""), css);
  assert.deepEqual(rules.match(/#[0-9a-f]{3,8}\b/gi) ?? [], []);
});

test("every shadow and scrim in global.css is thinned ink, night, black or white", () => {
  const triplet = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");
  const allowed = new Set([triplet(PAPER.ink), triplet(NIGHT.ground), "0 0 0", "255 255 255"]);
  const used = [...css.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/g)].map((m) => `${m[1]} ${m[2]} ${m[3]}`);
  assert.ok(used.length > 0, "expected the stylesheet to carry rgb() shadows");
  assert.deepEqual([...new Set(used)].filter((t) => !allowed.has(t)), []);
});

test("every text colour clears AA on the page and on card stock, in both palettes", () => {
  // Moss on Paper is the tight one (4.52:1). A palette edit that takes it
  // under 4.5 has to fail here, not in a reader's eyes.
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  for (const [name, p] of [["Paper", PAPER], ["Night", NIGHT]]) {
    for (const text of ["ink", "muted", "accent", "moss"]) {
      for (const surface of ["ground", "card"]) {
        const r = ratio(p[text], p[surface]);
        assert.ok(r >= 4.5, `${name}: ${text} on ${surface} is ${r.toFixed(2)}:1`);
      }
    }
  }
});

test("the manifest opens on Paper", () => {
  const manifest = JSON.parse(read("public/manifest.webmanifest"));
  assert.equal(manifest.background_color.toLowerCase(), PAPER.ground);
  assert.equal(manifest.theme_color.toLowerCase(), PAPER.ground);
});

test("the theme-color metas in Base.astro are the two grounds", () => {
  const html = read("src/layouts/Base.astro");
  const meta = (scheme) => {
    const tag = html.match(
      new RegExp(`<meta\\s+name="theme-color"\\s+media="\\(prefers-color-scheme:\\s*${scheme}\\)"\\s+content="([^"]+)"`)
    );
    assert.ok(tag, `Base.astro has no ${scheme} theme-color meta`);
    return tag[1].toLowerCase();
  };
  assert.equal(meta("light"), PAPER.ground);
  assert.equal(meta("dark"), NIGHT.ground);
});

test("the theme toggle paints the same two grounds", () => {
  const found = read("src/scripts/theme.ts").match(/meta\.content\s*=\s*now === "dark"\s*\?\s*"([^"]+)"\s*:\s*"([^"]+)"/);
  assert.ok(found, "theme.ts no longer sets the theme-color meta the way this test reads it");
  assert.equal(found[1].toLowerCase(), NIGHT.ground);
  assert.equal(found[2].toLowerCase(), PAPER.ground);
});

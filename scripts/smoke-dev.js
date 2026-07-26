/*
 * Boots the dev server and asks it for a few pages.
 *
 * Everything else in the gate tests the built output — `npm run build`
 * then `scripts/verify.js` against dist/ — which is right, because the
 * dev server injects the Astro toolbar and skews the request and size
 * checks. What that leaves unexercised is config the build never reads.
 *
 * Measured, rather than assumed. A broken `extends` in tsconfig.json is
 * already caught: `npm run build` fails on it too, so this adds nothing
 * there. A bad Vite `optimizeDeps.include` is not — it is dev-only
 * prebundling, and with one in place `npm run build` and `npm run check`
 * both pass green while `npm run dev` is dead. That is the class of
 * failure this exists for, and it is narrower than it first looks.
 *
 * This is a smoke test, not a second verify.js: it asserts the server
 * comes up, serves each route, and puts the expected markup on the page.
 * Behaviour is verify.js's job.
 *
 *   npm run smoke              # SMOKE_PORT to override 4399
 *
 * Astro 7 daemonises `astro dev` whenever stdout is not a TTY — which is
 * always, from a script — so there is no foreground mode to use here. It
 * also allows only one dev server per project. Rather than fight either
 * fact: if a server is already running (a developer with `npm run dev`
 * open), we test that one and leave it alone; if we started it, we stop
 * it. Nothing gets orphaned and nobody's dev server gets killed.
 */
import { execFile as execFileCb, spawn } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCb);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const PORT = Number(process.env.SMOKE_PORT || 4399);
const BOOT_TIMEOUT_MS = 60_000;
const HARD_TIMEOUT_MS = 120_000;

// Each route plus a string that proves the page actually rendered, rather
// than the server returning 200 with an error shell.
const ROUTES = [
  ["/", 'id="card"'],
  ["/deck/", 'class="deck-list"'],
  ["/about/", "<h1"],
  ["/play/", "<h1"],
  ["/today/", 'id="today-text"'],
  ["/c/1/", "card-text"],
];

let ownsServer = false;
let stopped = false;

async function stopServer() {
  if (!ownsServer || stopped) return;
  stopped = true;
  try {
    await execFile("npx", ["astro", "dev", "stop"], { cwd: root });
  } catch {
    /* already gone */
  }
}

function fail(message, detail = "") {
  console.error(`smoke: ${message}`);
  if (detail) console.error("\n--- dev server output ---\n" + detail.trim());
  // Synchronous best-effort stop: an async one would not finish before exit.
  if (ownsServer && !stopped) {
    stopped = true;
    try {
      spawn("npx", ["astro", "dev", "stop"], {
        cwd: root,
        stdio: "ignore",
        detached: true,
      }).unref();
    } catch {
      /* nothing more to do */
    }
  }
  process.exit(1);
}

const hardStop = setTimeout(
  () => fail(`did not finish within ${HARD_TIMEOUT_MS}ms`),
  HARD_TIMEOUT_MS,
);
hardStop.unref();

async function serverLogs() {
  try {
    const { stdout } = await execFile("npx", ["astro", "dev", "logs"], { cwd: root });
    return stdout;
  } catch {
    return "";
  }
}

// `astro dev --background` prints either "Dev server running at <url>" or
// "Dev server already running at <url>" — the difference decides whether
// we are allowed to stop it afterwards.
let startOutput = "";
try {
  const { stdout, stderr } = await execFile(
    "npx",
    ["astro", "dev", "--background", "--port", String(PORT)],
    { cwd: root, env: { ...process.env, FORCE_COLOR: "0" } },
  );
  startOutput = stdout + stderr;
} catch (err) {
  fail("could not start the dev server", (err.stdout || "") + (err.stderr || "") + err.message);
}

const already = /already running/.test(startOutput);
ownsServer = !already;
const urlMatch = startOutput.match(/https?:\/\/[^\s"\\]+/);
const BASE = (urlMatch ? urlMatch[0] : `http://localhost:${PORT}`).replace(/\/$/, "");
if (already) console.log(`smoke: reusing the dev server already running at ${BASE}`);

async function waitForBoot() {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  let lastErr = "never answered";
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE + "/", { signal: AbortSignal.timeout(2000) });
      if (res.ok) return;
      lastErr = `answered ${res.status}`;
    } catch (err) {
      lastErr = err.message;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  fail(`dev server never came up on ${BASE} (${lastErr})`, startOutput + (await serverLogs()));
}

await waitForBoot();

const served = [];
for (const [route, marker] of ROUTES) {
  let res, body;
  try {
    res = await fetch(BASE + route, { signal: AbortSignal.timeout(20_000) });
    body = await res.text();
  } catch (err) {
    fail(`${route} threw: ${err.message}`, await serverLogs());
  }
  if (!res.ok) fail(`${route} returned ${res.status}`, await serverLogs());
  if (!body.includes(marker)) {
    fail(`${route} returned 200 but the page is missing ${marker}`, await serverLogs());
  }
  served.push(route);
}

/*
 * A broken config does not necessarily stop Astro from answering — it
 * renders its error overlay and logs the failure — so the log is the
 * signal that matters. Matched narrowly on how Vite and Astro actually
 * report resolution failures, because a blanket /error/i also matches
 * ordinary words in page content and log labels.
 */
const logs = await serverLogs();
const complaints = (logs.match(/^.*$/gm) || []).filter((line) =>
  /\b(Cannot find|not found|Failed to (load|resolve)|ENOENT|Pre-transform error|Internal server error)\b/i.test(
    line,
  ),
);
if (complaints.length) {
  fail(`dev server logged ${complaints.length} error(s)`, complaints.join("\n"));
}

clearTimeout(hardStop);
await stopServer();
console.log(
  `dev server OK — ${served.length} routes served from ${BASE} (${served.join(", ")})` +
    (ownsServer ? "." : "; left running, it was not ours."),
);

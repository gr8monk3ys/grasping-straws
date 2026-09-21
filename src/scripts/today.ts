/*
 * Grasping Straws? — the daily card. One deterministic card per calendar
 * day, the same for every visitor sharing a date: a hash of the local
 * YYYY-MM-DD picks from the deck sorted by id (stable against reordering
 * in cards.json). No backend, no state — the date is the seed.
 */

type Entry = [id: number, text: string];

// The deck, baked into the page by today.astro (already live cards only,
// sorted by id). Read here rather than fetched, so the pick is ready as soon
// as the script runs and the script shares no module with the draw screen.
function readDeck(): Entry[] {
  try {
    const parsed = JSON.parse(document.getElementById("today-deck")?.textContent ?? "null") as unknown;
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as Entry[]) : [];
  } catch {
    return [];
  }
}

const markEl = document.getElementById("today-mark") as HTMLElement;
const textEl = document.getElementById("today-text") as HTMLElement;
const numEl = document.getElementById("today-num") as HTMLElement;
const dateEl = document.getElementById("today-date") as HTMLElement;
const shareEl = document.getElementById("today-share") as HTMLAnchorElement;

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/*
 * FNV-1a alone is not enough here. Its last step is a multiply, so bumping
 * the final character of the date moves the hash by a fixed 0x01000193 —
 * which lands on a fixed stride once reduced (13 of every 48, measured),
 * and is too small to disturb the high bits at all. Consecutive dates then
 * walk the deck in lockstep: tomorrow's card is computable from today's.
 * Murmur3's finalizer avalanches every input bit across all 32 output bits
 * before the reduction, which is what makes consecutive days independent.
 */
function fmix32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function init(): void {
  const deck = readDeck();
  if (deck.length === 0) {
    markEl.hidden = true;
    textEl.hidden = false;
    textEl.textContent = "The deck failed to load. Refresh to try again.";
    return;
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const key = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const [id, text] = deck[fmix32(fnv1a(key)) % deck.length]!;

  markEl.hidden = true;
  textEl.hidden = false;
  textEl.textContent = text;
  numEl.textContent = "#" + id; // the corner number, as on every face-up card
  dateEl.textContent = now.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  shareEl.href = "/c/" + id + "/";
}

init();
